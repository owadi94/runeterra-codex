// Demacian warrior women. Model: "Valkyrie" by jonas-art (https://sketchfab.com/3d-models/fca01409374441619292c5c397f3ca16),
// licensed CC BY 4.0. Our changes: compressed for the web; armour, skirt, shield and cloak recoloured to Demacian silver and
// blue; every warrior gets her own hair colour, skin tone, height and build (a gentle reshaping of the whole figure, so
// the armour follows the body).
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { demacian } from './knights.js';

/* How the sculpted hairstyles sit on her head, as fractions of her height (tuned by eye) */
const HAIR_FIT = { size: 0.13, dx: 0, dy: 0, dz: -0.005, rx: 0, ry: 0 };
const SKIN = /body|Head|feets/i, EYES = /Eyes/i, HAIR = /Hair/i, CLOAK = /cloak/i;

/* Looks, chosen per warrior. Chest is kept at or below the model's own (which is exaggerated). */
const HAIR_COLORS = [0x2a1d14, 0xd8b56a, 0x8c3a1c, 0x4a2f1c, 0xc9c9cc, 0x161616, 0xa4502a];
const SKIN_TINTS = [[1, 1, 1], [0.93, 0.82, 0.72], [0.78, 0.6, 0.48], [0.6, 0.44, 0.34], [1, 0.95, 0.9]];

function toFloat(THREE, geo) {
  for (const name of ['position', 'normal']) {
    const a = geo.attributes[name]; if (!a) continue;
    const f = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); }
    geo.setAttribute(name, new THREE.BufferAttribute(f, 3));
  }
  return geo;
}

/** Reshape a figure: chest, waist and hips. Landmarks measured on this model (its own units, figure about 3.4 tall):
    the chest peaks at y 2.45 and stands about 0.2 in front of the ribcage (z 0.22); waist at y 2.0, hips at y 1.65. */
function reshape(geo, u, { chest, waist, hips }) {
  const p = geo.attributes.position;
  const bell = (v, c, w) => Math.exp(-(((v - c) / w) ** 2));
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) / u, y = p.getY(i) / u, z = p.getZ(i) / u;
    for (const cx of [-0.1, 0.13]) {                              // each side shrinks towards a point inside the chest
      const cy = 2.43, cz = 0.16, d = Math.hypot((x - cx) / 0.24, (y - cy) / 0.26, Math.max(0, cz - z) / 0.1);
      if (z > cz - 0.05 && d < 1) { const w = (1 - d * d) ** 2, f = 1 + (chest - 1) * w; x = cx + (x - cx) * f; y = cy + (y - cy) * f; z = cz + (z - cz) * f; }
    }
    const k = 1 + (waist - 1) * bell(y, 2.0, 0.14) + (hips - 1) * bell(y, 1.65, 0.2);
    x *= k; z = z * (1 + (k - 1) * 0.6);
    p.setXYZ(i, x * u, y * u, z * u);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
}

/** Grey copy of a texture, so a colour can be multiplied over it (hair). */
function greyed(THREE, tex) {
  const img = tex.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let k = 0; k < p.length; k += 4) { const v = Math.min(255, (p[k] + p[k + 1] + p[k + 2]) / 3 * 1.6); p[k] = p[k + 1] = p[k + 2] = v; }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.flipY = tex.flipY; t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * Warriors standing at their posts: [{ x, z, face, info }]. Returns people for the city right away; they appear when the model arrives.
 */
export function makeValkyries(THREE, scene, posts, rnd) {
  const people = posts.map(({ x, z, face, info }) => {
    const mesh = new THREE.Group(); mesh.position.set(x, 0, z); mesh.rotation.y = face; mesh.userData.person = info; scene.add(mesh);
    return { mesh, update() {} };
  });
  const looks = posts.map((_, i) => ({
    hair: HAIR_COLORS[(i * 3 + Math.floor(rnd() * 2)) % HAIR_COLORS.length], skin: SKIN_TINTS[(i * 2 + Math.floor(rnd() * 2)) % SKIN_TINTS.length],
    height: 1.68 + rnd() * 0.16, girth: 0.94 + rnd() * 0.14,
    chest: 0.45 + rnd() * 0.4, waist: 0.94 + rnd() * 0.14, hips: 0.95 + rnd() * 0.14,
    style: i % 4,                                                  // 0: her own long hair, 1-3: the sculpted hairstyles
  }));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const hairstyles = loader.loadAsync(new URL('../../models/townswoman-heads.glb', import.meta.url).href).catch(() => null);

  Promise.all([loader.loadAsync(new URL('../../models/valkyrie.glb', import.meta.url).href), hairstyles]).then(([gltf, heads]) => {
    gltf.scene.updateMatrixWorld(true);
    /* Bake every part into the figure's own space, and dress the shared materials once */
    const parts = [], dressed = new Map(), env = scene.userData.env ?? 1;
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const geo = toFloat(THREE, o.geometry.clone()); geo.applyMatrix4(o.matrixWorld);
      const m = o.material, name = o.name;
      if (!dressed.has(m)) {
        if (!SKIN.test(name) && !EYES.test(name) && !HAIR.test(name) && m.map) m.map = demacian(THREE, m.map);
        if (CLOAK.test(name)) m.color.set(0x2a4f9e);                                // a royal blue cloak
        if (HAIR.test(name) && m.map) m.map = greyed(THREE, m.map);
        m.envMapIntensity = env; dressed.set(m, true);
      }
      parts.push({ name, geo, mat: m });
    });
    const box = new THREE.Box3(); parts.forEach(p => { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); });
    const H = box.max.y - box.min.y;
    // Where her skull sits, for fitting the other hairstyles (they are 1 unit tall, centred on the skull)
    const headPart = parts.find(p => /Head/.test(p.name)), hb = headPart.geo.boundingBox;
    const skull = new THREE.Vector3((hb.min.x + hb.max.x) / 2 + HAIR_FIT.dx * H, hb.max.y - HAIR_FIT.size * H / 2 + HAIR_FIT.dy * H, (hb.min.z + hb.max.z) / 2 + HAIR_FIT.dz * H);

    people.forEach((person, i) => {
      const look = looks[i], fig = new THREE.Group();
      const skinM = new Map(), hairM = new Map();
      parts.forEach(({ name, geo, mat }) => {
        const g = geo.clone(); reshape(g, H / 3.35, look);
        let m = mat;
        if (SKIN.test(name)) { if (!skinM.has(mat)) { const c = mat.clone(); c.color.setRGB(...look.skin); skinM.set(mat, c); } m = skinM.get(mat); }
        if (HAIR.test(name) && look.style && heads) return;                        // wears one of the other hairstyles
        if (HAIR.test(name)) { if (!hairM.has(mat)) { const c = mat.clone(); c.color.set(look.hair).multiplyScalar(1.4); hairM.set(mat, c); } m = hairM.get(mat); }
        const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; fig.add(mesh);
      });
      if (look.style && heads) {
        const src = heads.scene.getObjectByName(['hair07', 'hair15', 'hair17'][look.style - 1]);
        const hair = src.clone(); hair.material = src.material.clone(); hair.material.color.set(look.hair).multiplyScalar(2.6);
        hair.material.alphaTest = 0.35; hair.material.side = THREE.DoubleSide; hair.castShadow = true;
        const holder = new THREE.Group(); holder.position.copy(skull); holder.scale.setScalar(HAIR_FIT.size * H); holder.rotation.set(HAIR_FIT.rx, HAIR_FIT.ry, 0);
        holder.add(hair); fig.add(holder);
      }
      const s = look.height / H;
      fig.scale.set(s * look.girth, s, s * look.girth); fig.position.y = -box.min.y * s;
      person.mesh.add(fig); person.look = look;
    });
  }).catch(err => console.warn('Warrior model did not load', err));

  return people;
}
