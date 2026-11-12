// Townsfolk who walk, idle, wave and talk. Bodies and animations: Quaternius's animated characters (CC0, poly.pizza),
// re-dressed by us in Demacian colours by role, with painted toon shading so they sit in the same art style as the city.
// Behaviour: walk their route; when you come close they stop, turn to you and wave; click them and they gesture as they talk.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BLUE = 0x2a4f9e, ROYAL = 0x22408a, CREAM = 0xece4d2, WHITE = 0xf2efe8, GOLD = 0xd9b25a, LEATHER = 0x6b4426,
  WINE = 0x7a2f3a, FOREST = 0x3d5e45, SLATE = 0x4b5a72, BROWN = 0x5a3b22, LINEN = 0xd8cdb4;

/* Which body each role wears, and how its parts (by material name) are dyed. A list means one is picked per person. */
const LOOKS = {
  baker:      { f: ['woman2', { White: CREAM, Orange: [BROWN, SLATE], Grey: LINEN, Brown: LEATHER }],
                m: ['adv2', { Green: CREAM, LightGreen: WHITE, Black: BROWN, Grey: LINEN, Brown: LEATHER, Brown2: LEATHER }] },
  washer:     { f: ['woman1', { LimeGreen: [BLUE, WINE, FOREST, SLATE], Red: BROWN, Brown: LEATHER }] },
  noble:      { f: ['woman1', { LimeGreen: [ROYAL, WINE], Red: GOLD, Brown: GOLD, Gold: GOLD }],
                m: ['king2', { Blue: [ROYAL, WINE], Beige: CREAM, DarkBrown: BROWN, Gold: GOLD }, { hide: ['Gold'] }] },
  merchant:   { f: ['woman2', { White: CREAM, Orange: [WINE, FOREST], Grey: GOLD, Brown: LEATHER }],
                m: ['adv2', { Green: [WINE, BLUE, FOREST], LightGreen: CREAM, Black: BROWN, Grey: SLATE, Brown: LEATHER }] },
  musician:   { m: ['adv2', { Green: WINE, LightGreen: GOLD, Black: BROWN, Grey: CREAM }] },
  recruit:    { m: ['adv1', { Green: BLUE, LightGreen: WHITE, Brown2: LEATHER, Brown_02: LEATHER, White: WHITE, Gold: GOLD }] },
  stonemason: { m: ['farmer', { LightBlue: BROWN, Beige: LINEN, Red: WINE, Brown: LEATHER }] },
  pilgrim:    { f: ['hood', { Black: LINEN, DarkBrown: BROWN, LightBrown: CREAM, Brown: LEATHER, Metal: LINEN }, { hide: ['Sword'] }] },
  adventurer: { f: ['hood', { Black: WINE, DarkBrown: BROWN, LightBrown: LEATHER, Metal: 0xc9ced6, Gold: GOLD }] },
  citizen:    { f: [['woman1', 'woman1', 'woman2'], { LimeGreen: [BLUE, WINE, FOREST, SLATE], White: CREAM, Orange: [SLATE, BROWN, WINE], Red: BROWN, Grey: LINEN }],
                m: [['adv2', 'adv1'], { Green: [BLUE, WINE, FOREST, SLATE, BROWN], LightGreen: [CREAM, LINEN], Black: BROWN, Grey: SLATE, White: CREAM }] },
};
const SKINS = [1, 0.92, 0.8, 0.66, 0.52].map(v => [v, v * 0.97, v * 0.94]);
const HAIRS = [0x2a1d14, 0x4a2f1c, 0x8c3a1c, 0xd8b56a, 0x161616, 0xa4502a, 0xb8b8bc];

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

  function person(info, path, { role = 'citizen', face = 0, female } = {}) {
    const looks = LOOKS[role] || LOOKS.citizen;
    const isFemale = looks.f && looks.m ? (female ?? rnd() < 0.5) : !!looks.f;
    const [modelPick, dyes, extra = {}] = isFemale ? looks.f : looks.m;
    const modelName = pick(modelPick);
    const colours = Object.fromEntries(Object.entries(dyes).map(([k, v]) => [k, pick(v)]));
    const skin = pick(SKINS), hair = pick(HAIRS);
    const height = (isFemale ? 1.64 : 1.76) * (0.95 + rnd() * 0.1);

    const root = new THREE.Group(); root.position.set(path[0][0], 0, path[0][1]); root.rotation.y = face;
    root.userData.person = info; scene.add(root);
    const walker = { mesh: root, speed: path.length > 1 ? 1.05 + rnd() * 0.3 : 0, t: rnd(), state: 'start', greeted: 0 };
    const segLen = path.length > 1 ? Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]) : 1;

    load(modelName).then(gltf => {
      const body = SkeletonUtils.clone(gltf.scene);
      body.traverse(o => {
        if (!o.isMesh) return;
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
      const act = name => mixer.clipAction(clips[name]);
      act('Idle').play(); mixer.update(0); body.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(body, true);
      body.scale.multiplyScalar(height / (box.max.y - box.min.y));
      body.updateMatrixWorld(true);
      const b2 = new THREE.Box3().setFromObject(body, true); body.position.y -= b2.min.y - root.position.y;
      act('Idle').stop();
      walker.anim = { mixer, act, current: null };
      walker.play = (name, { once = false, fade = 0.25 } = {}) => {
        const a = act(name); if (walker.anim.current === a && !once) return;
        a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once;
        if (name === 'Walk') a.timeScale = walker.speed / 1.2;
        if (walker.anim.current) a.crossFadeFrom(walker.anim.current, fade, false);
        a.play(); walker.anim.current = a; walker.anim.until = once ? performance.now() + a.getClip().duration * 1000 - fade * 1000 : 0;
      };
      walker.play(walker.speed ? 'Walk' : 'Idle', { fade: 0 });
      mixer.update(rnd() * 3);
    });

    /* Talk: stop, face the visitor, gesture while speaking */
    root.userData.onTalk = player => { walker.talking = performance.now() + 4500; walker.face = Math.atan2(player.x - root.position.x, player.z - root.position.z); walker.play?.('Interact', { once: true }); };

    walker.update = (dt, now, player) => {
      if (!walker.anim) return;
      walker.anim.mixer.update(dt);
      const busy = walker.anim.until && now < walker.anim.until;
      const near = player && Math.hypot(player.x - root.position.x, player.z - root.position.z) < 3.5;
      // Greet a visitor who walks up (once every 20 seconds)
      if (near && now - walker.greeted > 20000) {
        walker.greeted = now; walker.face = Math.atan2(player.x - root.position.x, player.z - root.position.z);
        walker.play('Wave', { once: true });
      }
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
