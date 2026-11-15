// Real stone surfaces for the city: scanned textures from Poly Haven (CC0, by Rob Tuytel) and marble_100 (added by the owner, source to be credited), with colour, relief (normal)
// and roughness maps. They are mapped by world position (triplanar), so long walls, slanted beams and sculptures all get
// stone at a true, even scale with no stretching, and pieces that touch share one continuous surface.
// Colours are pulled toward Demacia's pale stone: mostly desaturated, then lifted.

const KINDS = {
  marble: { file: 'marble_01', tile: 4.5, sat: 0.3, gain: 0.95, lift: 0.2, normal: 0.9 },          // smooth cut panels
  blocks: { file: 'medieval_blocks_03', tile: 3.2, sat: 0.25, gain: 0.85, lift: 0.3, normal: 1.0 }, // walls of cut blocks
  smooth: { file: 'beige_wall_001', tile: 6, sat: 0.2, gain: 0.9, lift: 0.22, normal: 0.6 },        // plain smooth stone
  polished: { file: 'marble_100', tile: 7, sat: 0.6, gain: 1.0, lift: 0.04, normal: 0.5 },          // white veined marble: statues (owner's 4K texture)
};
const cache = new Map();

function maps(THREE, file) {
  if (cache.has(file)) return cache.get(file);
  const tl = new THREE.TextureLoader(), url = t => new URL(`../../models/textures/${file}_${t}.jpg`, import.meta.url).href;
  const m = { diff: tl.load(url('diff')), nor: tl.load(url('nor')), rough: tl.load(url('rough')) };
  m.diff.colorSpace = THREE.SRGBColorSpace;
  for (const t of Object.values(m)) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  cache.set(file, m); return m;
}

/** A stone material. kind: 'marble' | 'blocks' | 'smooth'; color tints it (1 = the stone's own pale tone). */
export function stoneMaterial(THREE, kind = 'marble', { color = 0xffffff, env = 1, tile } = {}) {
  const k = KINDS[kind], tx = maps(THREE, k.file);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, envMapIntensity: env });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, {
      sDiff: { value: tx.diff }, sNor: { value: tx.nor }, sRough: { value: tx.rough },
      sTile: { value: tile ?? k.tile }, sSat: { value: k.sat }, sGain: { value: k.gain }, sLift: { value: k.lift }, sNormal: { value: k.normal },
    });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSPos;\nvarying vec3 vSN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvSN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D sDiff, sNor, sRough; uniform float sTile, sSat, sGain, sLift, sNormal;
        varying vec3 vSPos; varying vec3 vSN;
        vec3 sW() { vec3 w = pow(abs(normalize(vSN)), vec3(6.0)); return w / (w.x + w.y + w.z); }
        vec4 tri(sampler2D t, vec3 p, vec3 w) { return texture2D(t, p.zy) * w.x + texture2D(t, p.xz) * w.y + texture2D(t, p.xy) * w.z; }`)
      .replace('#include <map_fragment>', `
        vec3 sp = vSPos / sTile, sw = sW();
        vec3 sc = tri(sDiff, sp, sw).rgb;
        float sL = dot(sc, vec3(0.3, 0.59, 0.11));
        sc = mix(vec3(sL), sc, sSat) * sGain + sLift;
        diffuseColor.rgb *= sc;`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * clamp(tri(sRough, sp, sw).g * 1.1, 0.35, 1.0);')
      .replace('#include <normal_fragment_maps>', `{
        // whiteout-blended triplanar normal map, in world space, then into view space
        vec3 n = normalize(vSN);
        vec3 tx = texture2D(sNor, sp.zy).xyz * 2.0 - 1.0, ty = texture2D(sNor, sp.xz).xyz * 2.0 - 1.0, tz = texture2D(sNor, sp.xy).xyz * 2.0 - 1.0;
        tx.xy *= sNormal; ty.xy *= sNormal; tz.xy *= sNormal;
        vec3 nx = vec3(tx.xy + n.zy, abs(tx.z) * n.x).zyx;
        vec3 ny = vec3(ty.xy + n.xz, abs(ty.z) * n.y).xzy;
        vec3 nz = vec3(tz.xy + n.xy, abs(tz.z) * n.z);
        vec3 nw = normalize(nx * sw.x + ny * sw.y + nz * sw.z);
        normal = normalize((viewMatrix * vec4(nw, 0.0)).xyz);
      }`);
  };
  m.customProgramCacheKey = () => 'codex-stone-' + kind;
  return m;
}

/** Real grass for open ground: Poliigon's "Grass Patchy Ground" scan (added by the owner; colour, relief and roughness,
 *  resized to 1K). Projected from above by world position like the stone, at two scales blended together, with a slow
 *  light/dark drift across the field, so a big ground has no visible repeating tile. tile = metres per repeat. */
export function grassMaterial(THREE, { env = 1, tile = 5 } = {}) {
  const tx = maps(THREE, 'grass_patchy');
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, envMapIntensity: env });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { gDiff: { value: tx.diff }, gNor: { value: tx.nor }, gRough: { value: tx.rough }, gTile: { value: tile } });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvGPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D gDiff, gNor, gRough; uniform float gTile; varying vec3 vGPos;`)
      .replace('#include <map_fragment>', `
        vec2 gp = vGPos.xz / gTile, gq = vGPos.xz / (gTile * 6.7) + vec2(0.37, 0.71);
        vec3 gc = mix(texture2D(gDiff, gp).rgb, texture2D(gDiff, gq).rgb, 0.4);
        float drift = 0.88 + 0.12 * sin(vGPos.x * 0.021 + sin(vGPos.z * 0.017) * 2.0) * cos(vGPos.z * 0.013);
        diffuseColor.rgb *= gc * drift * 1.08;`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * clamp(texture2D(gRough, gp).g * 1.05, 0.6, 1.0);')
      .replace('#include <normal_fragment_maps>', `{
        vec3 tn = texture2D(gNor, gp).xyz * 2.0 - 1.0;
        vec3 nw = normalize(vec3(tn.x * 0.8, 1.0, -tn.y * 0.8));   // projected from above: ground faces +y
        normal = normalize(mix(normal, (viewMatrix * vec4(nw, 0.0)).xyz, 0.85));
      }`);
  };
  m.customProgramCacheKey = () => 'codex-grass';
  return m;
}
