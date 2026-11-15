// Townsfolk who walk, idle, wave and talk.
// Women: Quaternius's animated characters (CC0, poly.pizza), re-dressed by us in Demacian colours by role, toon shaded.
// Men: our own townsman (concept art -> 3D, rigged and animated with Mixamo), one shared model; each man gets his own
// height, hair colour, skin tone and tunic colour, painted in the shader so they don't look like clones.
// Behaviour: walk their route; when you come close they stop, turn to you and wave; click them and they gesture as they talk.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BLUE = 0x2a4f9e, ROYAL = 0x22408a, CREAM = 0xece4d2, WHITE = 0xf2efe8, GOLD = 0xd9b25a, LEATHER = 0x6b4426,
  WINE = 0x7a2f3a, FOREST = 0x3d5e45, SLATE = 0x4b5a72, BROWN = 0x5a3b22, LINEN = 0xd8cdb4;

/* Women: which body each role wears, and how its parts (by material name) are dyed. A list means one is picked per person.
   Men: the townsman, with his blue tunic re-dyed to the colour listed for the role. */
const LOOKS = {
  baker:      { f: ['woman2', { White: CREAM, Orange: [BROWN, SLATE], Grey: LINEN, Brown: LEATHER }], m: [LINEN, CREAM] },
  washer:     { f: ['woman1', { LimeGreen: [BLUE, WINE, FOREST, SLATE], Red: BROWN, Brown: LEATHER }] },
  noble:      { f: ['woman1', { LimeGreen: [ROYAL, WINE], Red: GOLD, Brown: GOLD, Gold: GOLD }], m: [ROYAL, WINE] },
  merchant:   { f: ['woman2', { White: CREAM, Orange: [WINE, FOREST], Grey: GOLD, Brown: LEATHER }], m: [WINE, FOREST, BLUE] },
  musician:   { m: [WINE] },
  recruit:    { m: [BLUE] },
  stonemason: { m: [BROWN, SLATE] },
  pilgrim:    { f: ['hood', { Black: LINEN, DarkBrown: BROWN, LightBrown: CREAM, Brown: LEATHER, Metal: LINEN }, { hide: ['Sword'] }] },
  adventurer: { f: ['hood', { Black: WINE, DarkBrown: BROWN, LightBrown: LEATHER, Metal: 0xc9ced6, Gold: GOLD }] },
  citizen:    { f: [['woman1', 'woman1', 'woman2'], { LimeGreen: [BLUE, WINE, FOREST, SLATE], White: CREAM, Orange: [SLATE, BROWN, WINE], Red: BROWN, Grey: LINEN }],
                m: [BLUE, BLUE, WINE, FOREST, SLATE, BROWN] },
};
const SKINS = [1, 0.92, 0.8, 0.66, 0.52].map(v => [v, v * 0.97, v * 0.94]);
const HAIRS = [0x2a1d14, 0x4a2f1c, 0x8c3a1c, 0xd8b56a, 0x161616, 0xa4502a, 0xb8b8bc];
/* The townsman's hair is re-coloured by brightness, so these are mid tones: black, dark brown, brown, auburn, blond, grey */
const MAN_HAIRS = [0x1c1612, 0x3b2617, 0x6a4325, 0x8a3c1e, 0xb0905a, 0x9a9a9e];
const MAN_HEIGHT = 1.8;   // the file's height in metres

export function makeTownsfolk(THREE, scene, rnd) {
  const pick = v => Array.isArray(v) ? v[Math.floor(rnd() * v.length)] : v;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const models = new Map();
  const load = name => models.get(name) || models.set(name, loader.loadAsync(new URL(`../../models/townsfolk/${name}.glb`, import.meta.url).href)).get(name);

  /* Painted look: four light bands and a warm rim, like the rest of the city */
  const ramp = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 160, 160, 160, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 4, 1);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = color => {
    const m = new THREE.MeshToonMaterial({ color, gradientMap: ramp });
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>',
        '#include <dithering_fragment>\n float rim = pow(1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0), 2.6);\n gl_FragColor.rgb += rim * 0.28 * vec3(1.0, 0.92, 0.78);');
    };
    return m;
  };

  /* The townsman's body zones, measured once on the shared mesh in its T-pose: x = head (hair, beard, face), y = hands */
  const zoned = new WeakSet();
  const zoneMesh = geo => {
    if (zoned.has(geo)) return; zoned.add(geo);
    const P = geo.attributes.position, n = P.count; geo.computeBoundingBox();
    const b = geo.boundingBox, H = b.max.y - b.min.y, cx = (b.max.x + b.min.x) / 2, z = new Float32Array(n * 2);
    const ss = (a, c, v) => { const t = Math.min(1, Math.max(0, (v - a) / (c - a))); return t * t * (3 - 2 * t); };
    for (let i = 0; i < n; i++) {
      z[i * 2] = ss(0.835, 0.85, (P.getY(i) - b.min.y) / H);
      z[i * 2 + 1] = ss(0.27, 0.285, Math.abs(P.getX(i) - cx) / H);
    }
    geo.setAttribute('zone', new THREE.BufferAttribute(z, 2));
  };
  /* One material per man: the texture's navy tunic, brown hair and skin are re-coloured by brightness, so folds,
     strands and stitching stay. Colours are compared in sRGB, where the thresholds were measured. */
  const manMaterial = (src, { tunic, hair, skin }) => {
    const m = src.clone();
    m.envMapIntensity = scene.userData.env ?? 1;
    const u = { uTunic: { value: new THREE.Color(tunic).convertLinearToSRGB() }, uHair: { value: new THREE.Color(hair).convertLinearToSRGB() },
      uSkin: { value: new THREE.Vector3(...skin) } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 zone;\nvarying vec2 vZone;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvZone = zone;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vZone;\nuniform vec3 uTunic;\nuniform vec3 uHair;\nuniform vec3 uSkin;')
        .replace('#include <map_fragment>', `
          vec4 texel = texture2D(map, vMapUv);
          vec3 s = pow(max(texel.rgb, 0.0), vec3(1.0 / 2.2));
          float lum = dot(s, vec3(0.299, 0.587, 0.114));
          float blue = smoothstep(0.04, 0.12, s.b - max(s.r, s.g));
          float brown = smoothstep(0.03, 0.1, s.r - s.b);
          // hair, brows and beard: a mask painted into the texture's alpha (255 = none, 55 = full)
          float hairW = clamp((1.0 - texel.a) / 0.784, 0.0, 1.0);
          float skinW = max(vZone.x, vZone.y) * brown * smoothstep(0.28, 0.36, lum) * (1.0 - hairW);
          s = mix(s, uTunic * (lum / 0.24), blue);
          s = mix(s, uHair * mix(1.0, lum / 0.21, 0.75), hairW);
          s = mix(s, s * uSkin, skinW);
          diffuseColor.rgb *= pow(clamp(s, 0.0, 1.0), vec3(2.2));`);
    };
    m.customProgramCacheKey = () => 'townsman-dye-1';
    return m;
  };

  /* Mixamo gave no idle, so the file's Idle is one still pose. Build a looping 8-second idle from it: the chest breathes
     (two breaths) and the head looks slowly left and right. It has to live inside the clip: rotating bones after the
     mixer piles up frame on frame, because the mixer does not rewrite a bone whose animated value has not changed. */
  const idles = new WeakMap();
  const livelyIdle = gltf => {
    if (idles.has(gltf)) return idles.get(gltf);
    const still = gltf.animations.find(a => a.name === 'Idle'), D = 8, N = 49;
    const times = Array.from({ length: N }, (_, i) => i * D / (N - 1));
    const MOVES = { Spine1: ['x', 0.025, 2], Neck: ['y', 0.08, 1], Head: ['y', 0.16, 1] };
    const q0 = new THREE.Quaternion(), dq = new THREE.Quaternion(), e = new THREE.Euler();
    const tracks = still.tracks.map(tr => {
      const [bone, prop] = tr.name.split('.'), mv = MOVES[bone.replace(/^mixamorig:?/, '')];
      if (!mv || prop !== 'quaternion') return tr;
      q0.fromArray(tr.values, 0); const v = [];
      for (const t of times) {
        const a = Math.sin((t / D) * Math.PI * 2 * mv[2]) * mv[1];
        e.set(mv[0] === 'x' ? a : 0, mv[0] === 'y' ? a : 0, 0); dq.setFromEuler(e);
        const q = q0.clone().multiply(dq); v.push(q.x, q.y, q.z, q.w);
      }
      return new THREE.QuaternionKeyframeTrack(tr.name, times, v);
    });
    const clip = new THREE.AnimationClip('Idle', D, tracks); idles.set(gltf, clip); return clip;
  };

  function person(info, path, { role = 'citizen', face = 0, female } = {}) {
    const looks = LOOKS[role] || LOOKS.citizen;
    const isFemale = looks.f && looks.m ? (female ?? rnd() < 0.5) : !!looks.f;
    const isMan = !isFemale;
    const [modelPick, dyes, extra = {}] = isFemale ? looks.f : ['townsman', {}];
    const modelName = pick(modelPick);
    const colours = Object.fromEntries(Object.entries(dyes).map(([k, v]) => [k, pick(v)]));
    const skin = pick(SKINS), hair = pick(isMan ? MAN_HAIRS : HAIRS), tunic = isMan ? pick(looks.m) : 0;
    const height = isMan ? 1.68 + rnd() * 0.22 : 1.64 * (0.95 + rnd() * 0.1);

    const root = new THREE.Group(); root.position.set(path[0][0], 0, path[0][1]); root.rotation.y = face;
    root.userData.person = info; scene.add(root);
    const walker = { mesh: root, speed: path.length > 1 ? 1.05 + rnd() * 0.3 : 0, t: rnd(), state: 'start', greeted: 0 };
    const segLen = path.length > 1 ? Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]) : 1;

    load(modelName).then(gltf => {
      const body = SkeletonUtils.clone(gltf.scene);
      body.traverse(o => {
        if (!o.isMesh) return;
        if (isMan) {
          zoneMesh(o.geometry);
          o.material = manMaterial(o.material, { tunic, hair, skin });
          o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
          return;
        }
        const src = o.material, name = src.name;
        if ((extra.hide || []).some(h => name === h || o.name.startsWith(h) || o.parent?.name?.startsWith(h))) { o.visible = false; return; }
        let c = src.color.clone();
        if (colours[name] !== undefined) c = new THREE.Color(colours[name]);
        if (name === 'Skin') c.multiply(new THREE.Color(...skin));
        if (/^Hair/.test(name)) c = new THREE.Color(hair);
        o.material = toon(c);
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      });
      root.add(body);
      // Size: measured in the idle pose
      const mixer = new THREE.AnimationMixer(body), clips = {};
      for (const a of gltf.animations) clips[a.name.replace(/^.*\|/, '')] = a;
      if (isMan) { clips.Interact = clips.Talk; clips.Idle = livelyIdle(gltf); }
      const act = name => mixer.clipAction(clips[name]);
      if (isMan) {
        // The file is 1.80 m tall with its feet at 0, so no measuring: scale to this man's height
        body.scale.multiplyScalar(height / MAN_HEIGHT);
      } else {
        act('Idle').play(); mixer.update(0); body.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(body, true);
        body.scale.multiplyScalar(height / (box.max.y - box.min.y));
        body.updateMatrixWorld(true);
        const b2 = new THREE.Box3().setFromObject(body, true); body.position.y -= b2.min.y - root.position.y;
        act('Idle').stop();
      }
      // Walk cycle speed: Mixamo's walk covers about 1.1 m a second at 1.80 m, so taller men take longer strides
      const strideSpeed = isMan ? 1.1 * height / MAN_HEIGHT : 1.2;
      walker.anim = { mixer, act, current: null };
      walker.play = (name, { once = false, reps = 1, fade = 0.25 } = {}) => {
        const a = act(name); if (walker.anim.current === a && !once) return;
        a.reset(); a.setLoop(once ? (reps > 1 ? THREE.LoopRepeat : THREE.LoopOnce) : THREE.LoopRepeat, once ? reps : Infinity); a.clampWhenFinished = once;
        a.timeScale = name === 'Walk' ? walker.speed / strideSpeed : 1;
        if (walker.anim.current) a.crossFadeFrom(walker.anim.current, fade, false);
        a.play(); walker.anim.current = a; walker.anim.until = once ? performance.now() + a.getClip().duration * reps * 1000 - fade * 1000 : 0;
      };
      walker.play(walker.speed ? 'Walk' : 'Idle', { fade: 0 });
      mixer.update(rnd() * 3);
    });

    /* Talk: stop, face the visitor, gesture while speaking */
    root.userData.onTalk = player => { walker.talking = performance.now() + 4500; walker.face = Math.atan2(player.x - root.position.x, player.z - root.position.z); walker.play?.('Interact', { once: true }); };

    walker.update = (dt, now, player) => {
      if (!walker.anim) return;
      walker.anim.mixer.update(dt);
      const near = player && Math.hypot(player.x - root.position.x, player.z - root.position.z) < 3.5;
      // Greet a visitor who walks up (once every 20 seconds)
      if (near && now - walker.greeted > 20000) {
        walker.greeted = now; walker.face = Math.atan2(player.x - root.position.x, player.z - root.position.z);
        walker.play('Wave', { once: true, reps: isMan ? 4 : 1 });
      }
      // Checked after the greeting, so a wave that starts this frame is not cut off by 'Idle' below
      const busy = walker.anim.until && now < walker.anim.until;
      const stopped = near || busy || (walker.talking && now < walker.talking);
      if (stopped) {
        if (walker.face !== undefined) {
          let d = walker.face - root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
          root.rotation.y += d * Math.min(1, dt * 6);
        }
        if (!busy) walker.play('Idle');
        return;
      }
      walker.face = undefined;
      if (!walker.speed) {
        let d = face - root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); root.rotation.y += d * Math.min(1, dt * 2);
        walker.play('Idle'); return;
      }
      walker.play('Walk');
      walker.t = (walker.t + (dt * walker.speed) / segLen) % 2;
      const u = walker.t < 1 ? walker.t : 2 - walker.t, [ax, az] = path[0], [bx, bz] = path[1];
      const x = ax + (bx - ax) * u, z = az + (bz - az) * u, dx = x - root.position.x, dz = z - root.position.z;
      if (Math.abs(dx) + Math.abs(dz) > 1e-5) {
        const want = Math.atan2(dx, dz); let d = want - root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
        root.rotation.y += d * Math.min(1, dt * 8);
      }
      root.position.set(x, 0, z);
    };
    return walker;
  }

  return { person };
}
