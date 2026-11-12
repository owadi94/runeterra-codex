// Townsfolk: original characters with a jointed body, a painted face, clothes and gear by role.
// Stylized shading: banded (toon) light with a warm rim light, for a painted game-art look.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/* Women's heads: a sculpted head and three hairstyles from "Pocolov Hair 07, 15, 17" by pocolov (Sketchfab, CC BY 4.0),
   cut at the neck, scaled so the head is 1 unit tall and centred on the skull. Skin and hair colours are ours, per person. */
const HEADS_URL = new URL('../../models/townswoman-heads.glb', import.meta.url).href;
const EYES = [[-0.135, 0.02, 0.291], [0.135, 0.02, 0.291]];   // eye centres in the head's units
const HAIRS = ['hair07', 'hair15', 'hair17'];

/* Roles: what each kind of person wears and carries. Colours are picked per person for variety. */
export const ROLES = {
  guard:      { armor: 'full', helm: 'great', tabard: true, shield: true, spear: true, cloak: 0x1f4f9a },
  recruit:    { armor: 'half', helm: 'cap', tabard: true, sword: true },
  baker:      { apron: 0xf3eee2, hat: 'cap', carry: 'bread' },
  merchant:   { robe: true, hat: 'wide', satchel: true },
  stonemason: { apron: 0x6b4426, carry: 'hammer', hat: 'none' },
  pilgrim:    { robe: true, hood: true, carry: 'staff', cloak: 0x7b6a52 },
  washer:     { dress: true, hat: 'scarf', carry: 'basket' },
  musician:   { hat: 'cap', lute: true, cloak: 0x7a2f3a },
  noble:      { coat: true, gold: true, hat: 'none', cloak: 0x2a3f78 },
  citizen:    {},
  adventurer: { adventurer: true, hood: 'deep', sabre: true },                 // a travelling blade: hood, braid, corset, coat
};

export function makePeople(THREE, rnd, painted) {
  /* Banded light: 4 tones, the core of the painted look. */
  const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 140, 140, 140, 255, 205, 205, 205, 255, 255, 255, 255, 255]), 4, 1);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const cache = new Map();
  /** A toon material with a warm rim light, shared between people of the same colour. */
  function toon(color, map = null, extra = {}) {
    const key = `${color}|${map ? map.uuid : ''}|${JSON.stringify(extra)}`;
    if (cache.has(key)) return cache.get(key);
    const m = new THREE.MeshToonMaterial({ color, map, gradientMap: ramp, ...extra });
    m.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>',
        '#include <dithering_fragment>\n float rim = pow(1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0), 2.6);\n gl_FragColor.rgb += rim * 0.32 * vec3(1.0, 0.92, 0.78);');
    };
    cache.set(key, m); return m;
  }

  /* ---- Shapes ---- */
  const clean = g => { const n = g.index ? g.toNonIndexed() : g; ['uv1', 'uv2'].forEach(a => n.deleteAttribute(a)); if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); return n; };
  const tf = (g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { g.scale(sx, sy, sz); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return g; };
  const cyl = (r1, r2, h, y, seg = 10) => tf(new THREE.CylinderGeometry(r1, r2, h, seg), 0, y);
  const lathe = (pts, seg = 14) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  /** Merge parts that share one bone into one mesh, one material group each. */
  function bake(parts) {
    const byMat = new Map();
    parts.forEach(([g, m]) => { if (!byMat.has(m)) byMat.set(m, []); byMat.get(m).push(clean(g)); });
    const mats = [...byMat.keys()], geos = mats.map(m => mergeGeometries(byMat.get(m)));
    const mesh = new THREE.Mesh(mergeGeometries(geos, true), mats);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  /* ---- Faces: painted on a canvas, front of the head ---- */
  const faceCache = new Map();
  function face(skin, eyes, brows, female) {
    const key = [skin, eyes, brows, female].join('|');
    if (faceCache.has(key)) return faceCache.get(key);
    const W = 256, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const s = new THREE.Color(skin);
    g.fillStyle = `#${s.getHexString()}`; g.fillRect(0, 0, W, H);
    const cx = W * 0.25;                                      // the front of a sphere sits at u = 0.25
    g.fillStyle = 'rgba(200,90,80,.18)'; [cx - 15, cx + 15].forEach(x => { g.beginPath(); g.ellipse(x, 76, 7, 4, 0, 0, 7); g.fill(); });   // cheeks
    [cx - 9, cx + 9].forEach(x => {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, 62, 5.2, 3.6, 0, 0, 7); g.fill();
      g.fillStyle = eyes; g.beginPath(); g.arc(x, 62.3, 2.9, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(x, 62.3, 1.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x + 0.6, 60.6, 1.2, 1.2);
      g.strokeStyle = '#2a1a12'; g.lineWidth = female ? 1.8 : 1.3; g.beginPath(); g.ellipse(x, 62, 5.4, 3.8, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.strokeStyle = brows; g.lineWidth = female ? 1.6 : 2.4; g.beginPath(); g.moveTo(x - 5, 55.5); g.quadraticCurveTo(x, 53 + (x < cx ? 0 : 0), x + 5, 55.5); g.stroke();
    });
    g.strokeStyle = 'rgba(90,50,35,.45)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx + 1, 64); g.quadraticCurveTo(cx + 3, 72, cx - 1, 74); g.stroke();   // nose
    g.strokeStyle = female ? '#a8484a' : '#7a3a30'; g.lineWidth = female ? 2.2 : 1.6; g.beginPath(); g.moveTo(cx - 6, 83); g.quadraticCurveTo(cx, 86, cx + 6, 83); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    faceCache.set(key, t); return t;
  }

  /* ---- Chainmail: rings painted on a small tile ---- */
  const mailMap = (() => {
    const W = 64, c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d');
    g.fillStyle = '#5d636c'; g.fillRect(0, 0, W, W);
    for (let r = 0; r < 8; r++) for (let k = -1; k < 9; k++) {
      const x = k * 8 + (r % 2) * 4 + 4, y = r * 8 + 4;
      g.strokeStyle = '#2d3138'; g.lineWidth = 2.6; g.beginPath(); g.arc(x, y + 0.8, 3.4, 0, 7); g.stroke();
      g.strokeStyle = '#c9ced6'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, 3.4, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 4); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  /* ---- Palettes ---- */
  const SKIN = [0xf3cfb0, 0xe2b08a, 0xc68b62, 0x9a6440, 0x6e432a, 0xf0c39c];
  const HAIR = [0x2a1d14, 0x4a2f1c, 0x7a5230, 0xc49a5a, 0xe1c58a, 0x8f8f8f, 0x161616, 0xa4502a];
  const EYES = ['#4a6fa5', '#5a3b1e', '#3f6b3a', '#6b6b6b', '#2e2a26'];
  const CLOTH = [0x3d6fb6, 0x8c4a3a, 0x5b7d3a, 0xc7a34d, 0x6b5a8c, 0xe8e2d4, 0x2f6f73, 0x9a3d52, 0x7d5a3c, 0x4b5a72];
  const pickOf = list => list[Math.floor(rnd() * list.length)];

  /* Sculpted heads load once and are shared; each woman gets her own skin and hair colour */
  let heads = null;
  const sculpted = () => heads || (heads = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(HEADS_URL).catch(err => { console.warn('Heads did not load', err); return null; }));
  const hairCache = new Map();
  function hairMaterial(src, color) {
    const key = src.uuid + color;
    if (!hairCache.has(key)) {
      const m = new THREE.MeshToonMaterial({ map: src.map, gradientMap: ramp, alphaTest: 0.35, side: THREE.DoubleSide, color: new THREE.Color(color).multiplyScalar(2.6) });
      hairCache.set(key, m);
    }
    return hairCache.get(key);
  }
  const irisM = new THREE.MeshToonMaterial({ color: 0x3a2618, gradientMap: ramp }), whiteM = new THREE.MeshToonMaterial({ color: 0xf4f1ea, gradientMap: ramp });
  /** Swap the painted head for the sculpted one. withHair: false under hoods, scarves and helmets. */
  function sculptHead(head, oldFace, skin, hairColor, eyeColor, withHair) {
    sculpted().then(g => {
      if (!g) return;
      const s = new THREE.Group(); s.scale.setScalar(0.32);
      const h = g.scene.getObjectByName('head').clone(); h.material = skin; s.add(h);
      if (withHair) { const src = g.scene.getObjectByName(pickOf(HAIRS)), hair = src.clone(); hair.material = hairMaterial(src.material, hairColor); s.add(hair); }
      const iris = new THREE.MeshToonMaterial({ color: eyeColor, gradientMap: ramp });
      EYES.forEach(([x, y, z]) => {
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), whiteM); w.position.set(x, y, z - 0.03); w.scale.set(1, 0.7, 0.5); s.add(w);
        const i = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), iris); i.position.set(x, y + 0.002, z - 0.004); i.scale.set(1, 1, 0.45); s.add(i);
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), irisM); p.position.set(x, y + 0.002, z + 0.004); p.scale.set(1, 1, 0.4); p.material = irisM; s.add(p);
      });
      s.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
      oldFace.visible = false; head.add(s);
    });
  }

  /** Build a person. Returns { mesh, update(dt, now) }. Faces +z in its own space. */
  function person(scene, info, path, opts = {}) {
    const roleName = opts.role || 'citizen', role = ROLES[roleName], adv = !!role.adventurer;
    const female = opts.female ?? (adv || rnd() < 0.45);
    const skin = toon(pickOf(SKIN)), hairM = toon(adv ? 0xc3c4c8 : pickOf(HAIR));
    /* Blouse and corset (after the blueprint traveller): the traveller and most townswomen */
    const corset = adv || (roleName === 'citizen' && female && rnd() < 0.75);
    const shirt = toon(corset ? 0xece6da : opts.color || pickOf(CLOTH));
    const corsetM = toon(adv ? 0x6a1820 : pickOf([0x6a1820, 0x2f4f3a, 0x2a3f78, 0x5a3b22, 0x7a2f3a]));
    const pantsM = toon(adv ? 0xe4ddd0 : pickOf([0x3b3227, 0x4a3b2c, 0x2f3540, 0x5a4a38]));
    const mail = toon(0xffffff, mailMap), dark = toon(0x15130f);
    const boots = toon(0x3a2617), steel = painted.steel, gold = painted.gold, leather = toon(0x6b4426), wood = painted.wood;
    const tabardM = new THREE.MeshToonMaterial({ map: painted.cloth.map, gradientMap: ramp, side: THREE.DoubleSide });
    const armored = role.armor === 'full', half = role.armor === 'half', robe = role.robe || role.dress || role.coat;
    const scale = (female ? 0.94 : 1) * (0.96 + rnd() * 0.08);

    const root = new THREE.Group(), pelvis = new THREE.Group(); pelvis.position.y = 0.95; root.add(pelvis);
    /* Torso, neck, clothing layers */
    const torso = [];
    const torsoShape = female ? [[0.15, -0.02], [0.135, 0.15], [0.16, 0.34], [0.165, 0.44], [0.07, 0.52]] : [[0.16, -0.02], [0.15, 0.15], [0.18, 0.34], [0.19, 0.46], [0.08, 0.52]];
    torso.push([tf(lathe(torsoShape), 0, 0, 0, 0, 0, 0, 1, 1, 0.72), armored || half ? steel : shirt]);
    torso.push([tf(cyl(0.055, 0.06, 0.12, 0.56), 0, 0, 0), skin]);
    if (armored) {
      /* Plate after the blueprint knight: ridged breastplate, chest trim, gorget, layered pauldrons, faulds over a mail skirt */
      torso.push([tf(new THREE.BoxGeometry(0.014, 0.34, 0.03), 0, 0.25, 0.128), steel]);
      torso.push([tf(new THREE.TorusGeometry(0.182, 0.012, 6, 20), 0, 0.37, 0, Math.PI / 2, 0, 0, 1, 0.74, 1), gold]);
      torso.push([tf(new THREE.TorusGeometry(0.17, 0.016, 6, 18), 0, 0.02, 0, Math.PI / 2, 0, 0, 1, 0.72, 1), gold]);
      torso.push([cyl(0.09, 0.12, 0.1, 0.53, 14), steel]);
      torso.push([tf(new THREE.TorusGeometry(0.092, 0.012, 6, 16), 0, 0.58, 0, Math.PI / 2), gold]);
      [-1, 1].forEach(s => [[0.142, 0.468, gold], [0.132, 0.475, steel], [0.117, 0.412, steel], [0.1, 0.358, steel]].forEach(([r, y, m]) =>
        torso.push([tf(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), s * 0.21, y, 0, 0, 0, s * -0.55, 1, 0.75, 1.1), m])));
      torso.push([tf(lathe([[0.168, 0.0], [0.19, -0.07]], 16), 0, 0, 0, 0, 0, 0, 1, 1, 0.76), steel]);
      torso.push([tf(lathe([[0.19, -0.07], [0.205, -0.14]], 16), 0, 0, 0, 0, 0, 0, 1, 1, 0.78), steel]);
      torso.push([tf(new THREE.TorusGeometry(0.205, 0.01, 6, 20), 0, -0.14, 0, Math.PI / 2, 0, 0, 1, 0.78, 1), gold]);
      torso.push([tf(lathe([[0.205, -0.13], [0.228, -0.43]], 18), 0, 0, 0, 0, 0, 0, 1, 1, 0.8), mail]);
    }
    if (half) {
      torso.push([tf(new THREE.TorusGeometry(0.17, 0.022, 6, 18), 0, 0.02, 0, Math.PI / 2, 0, 0, 1, 0.72, 1), gold]);
      torso.push([tf(new THREE.TorusGeometry(0.1, 0.02, 6, 16), 0, 0.5, 0, Math.PI / 2, 0, 0, 1, 0.8, 1), gold]);
      [-1, 1].forEach(s => torso.push([tf(new THREE.SphereGeometry(0.115, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.9), s * 0.21, 0.45, 0, 0, 0, s * -0.5, 1, 0.8, 1.1), steel]));
      torso.push([tf(lathe([[0.205, -0.1], [0.222, -0.36]], 18), 0, 0, 0, 0, 0, 0, 1, 1, 0.8), mail]);
    }
    if (corset) {
      torso.push([tf(lathe([[0.168, 0.0], [0.153, 0.14], [0.172, 0.3], [0.152, 0.37]], 16), 0, 0, 0, 0, 0, 0, 1.04, 1, 0.77), corsetM]);
      [0.0, 0.37].forEach(y => torso.push([tf(new THREE.TorusGeometry(y ? 0.152 : 0.168, 0.009, 6, 18), 0, y, 0, Math.PI / 2, 0, 0, 1.04, 0.77, 1), gold]));
      for (let k = 0; k < 4; k++) [-0.55, 0.55].forEach(a => torso.push([tf(new THREE.BoxGeometry(0.06, 0.007, 0.006), 0, 0.07 + k * 0.075, 0.127, 0, 0, a), dark]));
    }
    if (adv) {
      /* Open coat with tails, gold edges at the opening, a slung belt with pouches, a sabre and a hooked knife */
      const coat = toon(0x6a1820, null, { side: THREE.DoubleSide });
      torso.push([tf(new THREE.CylinderGeometry(0.19, 0.27, 0.62, 16, 1, true, 0.55, Math.PI * 2 - 1.1), 0, -0.3, 0, 0, 0, 0, 1, 1, 0.8), coat]);
      [0.55, -0.55].forEach(a => torso.push([tf(new THREE.BoxGeometry(0.02, 0.62, 0.02), Math.sin(a) * 0.235, -0.3, Math.cos(a) * 0.235 * 0.8), gold]));
      torso.push([tf(new THREE.TorusGeometry(0.19, 0.02, 6, 18), 0, -0.03, 0, Math.PI / 2 + 0.12, 0, 0, 1, 0.76, 1), leather]);
      [-1, 1].forEach(s => torso.push([tf(new THREE.BoxGeometry(0.08, 0.1, 0.06), s * 0.18, -0.06, 0.05, 0, s * 0.8), leather]));
      torso.push([tf(new THREE.CylinderGeometry(0.02, 0.014, 0.72, 6), -0.21, -0.36, -0.06, -0.35, 0, 0.32), dark]);              // scabbard
      torso.push([tf(new THREE.BoxGeometry(0.11, 0.02, 0.03), -0.17, -0.02, 0.04, -0.35, 0, 0.32), gold]);                        // guard
      torso.push([tf(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), -0.15, 0.04, 0.06, -0.35, 0, 0.32), leather]);           // grip
      torso.push([tf(new THREE.BoxGeometry(0.03, 0.26, 0.008), 0.21, -0.2, 0.04, 0, 0, -0.2), steel]);                             // hooked knife
      torso.push([tf(new THREE.TorusGeometry(0.04, 0.008, 4, 10, Math.PI), 0.2, -0.05, 0.04, 0, 0, 1.2), steel]);
    }
    if (robe) torso.push([lathe([[0.17, -0.55], [0.165, -0.3], [0.165, 0], [0.17, 0.1]]), shirt]);                  // long robe or dress skirt
    else if (!armored && !half && !adv) torso.push([lathe([[0.2, -0.22], [0.175, -0.05], [0.165, 0.06]]), corset ? corsetM : shirt]); // tunic hem
    if (role.coat) { torso.push([tf(new THREE.TorusGeometry(0.17, 0.018, 6, 18), 0, -0.55, 0, Math.PI / 2), gold]); torso.push([tf(new THREE.BoxGeometry(0.02, 0.52, 0.01), 0, 0.22, 0.125), gold]); }
    torso.push([tf(new THREE.TorusGeometry(0.168, 0.025, 6, 18), 0, 0.06, 0, Math.PI / 2, 0, 0, 1, 0.74, 1), leather]);   // belt
    if (role.satchel || rnd() < 0.4) torso.push([tf(new THREE.BoxGeometry(0.11, 0.12, 0.06), 0.15, 0.0, 0.08, 0, 0.6), leather]);
    if (role.apron) torso.push([tf(new THREE.PlaneGeometry(0.28, 0.6), 0, 0.02, 0.125), toon(role.apron, null, { side: THREE.DoubleSide })]);
    if (role.tabard) torso.push([tf(new THREE.PlaneGeometry(armored ? 0.22 : 0.24, armored ? 0.86 : 0.72), 0, armored ? -0.02 : 0.06, armored ? 0.15 : 0.135), tabardM]);
    if (role.cloak) torso.push([tf(new THREE.CylinderGeometry(0.22, 0.3, 1.0, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), 0, 0.05, -0.02, 0, 0, 0, 1, 1, 0.85), toon(role.cloak, null, { side: THREE.DoubleSide })]);
    if (role.lute) { torso.push([tf(new THREE.SphereGeometry(0.15, 12, 10), 0.02, 0.15, -0.17, 0, 0, 0, 1, 1.25, 0.45), wood]); torso.push([tf(new THREE.BoxGeometry(0.04, 0.42, 0.03), 0.02, 0.48, -0.17, 0, 0, 0.12), wood]); }
    if (role.sword) torso.push([tf(new THREE.BoxGeometry(0.035, 0.7, 0.02), -0.2, -0.25, 0.05, 0, 0, 0.12), steel], [tf(new THREE.BoxGeometry(0.16, 0.03, 0.04), -0.17, 0.1, 0.05, 0, 0, 0.12), gold]);
    const torsoMesh = bake(torso); pelvis.add(torsoMesh);

    /* Head: face, hair, beard, hats and helmets */
    const head = new THREE.Group(); head.position.y = 0.72; pelvis.add(head);
    const hp = [];
    const faceM = new THREE.MeshToonMaterial({ map: face(skin.color.getHex(), pickOf(EYES), `#${hairM.color.getHexString()}`, female), gradientMap: ramp });
    hp.push([tf(new THREE.SphereGeometry(0.115, 20, 16), 0, 0, 0, 0, 0, 0, 0.95, 1.12, 1), faceM]);
    hp.push([tf(new THREE.SphereGeometry(0.022, 8, 6), 0, -0.01, 0.112), skin]);                               // nose tip
    [-1, 1].forEach(s => hp.push([tf(new THREE.SphereGeometry(0.025, 8, 6), s * 0.108, 0, 0, 0, 0, 0, 0.6, 1, 1), skin]));   // ears
    const hairStyle = role.helm || role.hood || role.hat === 'scarf' ? 'none' : female ? pickOf(['long', 'bun', 'braid']) : pickOf(['short', 'short', 'swept', 'bald']);
    const cap = (s = 1) => tf(new THREE.SphereGeometry(0.122 * s, 18, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), 0, 0.02, -0.008, -0.2);
    if (hairStyle === 'short' || hairStyle === 'swept') hp.push([cap(), hairM]);
    if (hairStyle === 'swept') hp.push([tf(new THREE.SphereGeometry(0.07, 10, 8), 0.03, 0.1, 0.06, 0, 0, 0, 1.4, 0.6, 1), hairM]);
    if (hairStyle === 'long') { hp.push([cap(1.03), hairM]); hp.push([tf(new THREE.CylinderGeometry(0.11, 0.09, 0.32, 12, 1, true, Math.PI * 0.55, Math.PI * 0.9), 0, -0.12, -0.02, 0, 0, 0), hairM]); }
    if (hairStyle === 'bun') { hp.push([cap(), hairM]); hp.push([tf(new THREE.SphereGeometry(0.055, 10, 8), 0, 0.08, -0.11), hairM]); }
    if (hairStyle === 'braid') { hp.push([cap(), hairM]); hp.push([tf(new THREE.CylinderGeometry(0.03, 0.02, 0.38, 8), 0, -0.2, -0.1, 0.2), hairM]); }
    if (!female && rnd() < 0.35 && !role.helm) hp.push([tf(new THREE.SphereGeometry(0.085, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0, -0.035, 0.035, 0, 0, 0, 1, 1.1, 0.9), hairM]);   // beard
    if (role.helm === 'cap') { hp.push([cap(1.1), steel]); hp.push([tf(new THREE.TorusGeometry(0.126, 0.012, 6, 18), 0, 0.01, 0, Math.PI / 2), gold]); }
    const faceParts = hp.length;                              // everything after this is headgear
    if (role.helm === 'great') {                               // closed great helm after the blueprint knight, with our blue plume
      hp.push([tf(new THREE.SphereGeometry(0.13, 20, 14), 0, 0.02, 0, 0, 0, 0, 0.98, 1.22, 1.05), steel]);
      hp.push([tf(new THREE.BoxGeometry(0.15, 0.016, 0.04), 0, 0.035, 0.122), dark]);                          // visor slit
      for (let k = -2; k <= 2; k++) hp.push([tf(new THREE.BoxGeometry(0.008, 0.045, 0.03), k * 0.02, -0.05, 0.125), dark]);   // breaths
      hp.push([tf(new THREE.TorusGeometry(0.14, 0.012, 6, 22, Math.PI), 0, 0.02, 0, 0, Math.PI / 2, 0, 1, 1.2, 1), gold]);   // crest
      [-1, 1].forEach(s => hp.push([tf(new THREE.TorusGeometry(0.06, 0.009, 6, 12, Math.PI * 1.2), s * 0.127, 0.02, 0.02, 0, Math.PI / 2, 0.4), gold]));
      hp.push([tf(new THREE.BoxGeometry(0.03, 0.09, 0.22), 0, 0.2, -0.04), toon(0x1f4f9a)]);                  // plume
    }
    if (role.hood === 'deep') {                               // deep hood with a drape, silver braid over the shoulder
      const hoodM = toon(0xd9d4c8, null, { side: THREE.DoubleSide });
      hp.push([cap(1.0), hairM]);
      hp.push([tf(new THREE.SphereGeometry(0.152, 18, 12, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.6), 0, 0.012, -0.02, -0.3), hoodM]);   // open at the face
      hp.push([tf(new THREE.CylinderGeometry(0.13, 0.21, 0.3, 14, 1, true, Math.PI * 0.55, Math.PI * 0.9), 0, -0.17, -0.02), hoodM]);
      for (let k = 0; k < 9; k++) { const t = k / 8; hp.push([tf(new THREE.SphereGeometry(0.03 - t * 0.008, 8, 6), -0.07 - t * 0.06 + (k % 2) * 0.012, -0.06 - t * 0.4, 0.07 + t * 0.07), hairM]); }
      hp.push([tf(new THREE.CylinderGeometry(0.008, 0.016, 0.05, 6), -0.13, -0.5, 0.14), hairM]);
    } else if (role.hood) hp.push([tf(new THREE.SphereGeometry(0.145, 16, 10, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.62), 0, 0.01, -0.015, -0.3), toon(role.cloak, null, { side: THREE.DoubleSide })]);
    if (role.hat === 'cap') hp.push([tf(new THREE.CylinderGeometry(0.11, 0.125, 0.09, 14), 0, 0.1, -0.01, -0.15), toon(0xf3eee2)]);
    if (role.hat === 'wide') { hp.push([tf(new THREE.CylinderGeometry(0.09, 0.11, 0.12, 14), 0, 0.12, 0), toon(0x5a3b22)]); hp.push([tf(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 18), 0, 0.07, 0), toon(0x5a3b22)]); }
    if (role.hat === 'scarf') hp.push([tf(new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), 0, 0.01, -0.01, -0.3), toon(pickOf([0xb5452e, 0x2f6f73, 0xc7a34d]))]);
    const faceMesh = bake(hp.slice(0, faceParts)); faceMesh.scale.setScalar(1.08); head.add(faceMesh);
    if (hp.length > faceParts) { const gear = bake(hp.slice(faceParts)); gear.scale.setScalar(1.08); head.add(gear); }
    if (female && !role.helm) sculptHead(head, faceMesh, skin, hairM.color.getHex(), pickOf(['#4a6fa5', '#5a3b1e', '#3f6b3a', '#6b6b6b']), hairStyle !== 'none' && !role.hat);

    /* Arms: shoulder -> elbow -> hand, with held items on the hands */
    const arm = side => {
      const sh = new THREE.Group(); sh.position.set(side * 0.215, 0.45, 0); pelvis.add(sh);
      const upper = [[corset ? lathe([[0.046, 0], [0.064, -0.12], [0.058, -0.25], [0.044, -0.3]], 12) : cyl(0.048, 0.042, 0.3, -0.15), armored ? mail : shirt]];
      if (armored) { upper.push([tf(new THREE.SphereGeometry(0.058, 10, 8), 0, -0.3, 0), steel]); upper.push([tf(new THREE.TorusGeometry(0.057, 0.009, 6, 12), 0, -0.3, 0, Math.PI / 2), gold]); }
      sh.add(bake(upper));
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      const lower = [[corset ? lathe([[0.044, 0], [0.058, -0.12], [0.05, -0.2], [0.034, -0.245]], 12) : cyl(0.04, 0.034, 0.27, -0.135), armored || half ? steel : role.coat || corset ? shirt : skin], [tf(new THREE.SphereGeometry(0.042, 10, 8), 0, -0.3, 0.01, 0, 0, 0, 0.8, 1.1, 0.7), armored ? steel : skin]];
      if (armored) { lower.push([tf(new THREE.CylinderGeometry(0.064, 0.045, 0.09, 12), 0, -0.225, 0), steel]); lower.push([tf(new THREE.TorusGeometry(0.063, 0.008, 6, 14), 0, -0.18, 0, Math.PI / 2), gold]); }   // flared gauntlet
      if (corset) lower.push([tf(new THREE.TorusGeometry(0.036, 0.008, 6, 12), 0, -0.25, 0, Math.PI / 2), gold]);   // cuff
      if (side > 0 && role.spear) {                                   // held upright: the forearm points forward, so the shaft runs along its z axis
        lower.push([tf(new THREE.CylinderGeometry(0.016, 0.016, 2.3, 6), 0, -0.29, 0.45, Math.PI / 2), wood]);
        lower.push([tf(new THREE.ConeGeometry(0.04, 0.22, 6), 0, -0.29, 1.68, Math.PI / 2), steel]);
      }
      if (side < 0 && role.shield) {
        const s = new THREE.Shape(); s.moveTo(0, 0.32); s.quadraticCurveTo(0.24, 0.3, 0.22, 0.02); s.quadraticCurveTo(0.18, -0.25, 0, -0.42); s.quadraticCurveTo(-0.18, -0.25, -0.22, 0.02); s.quadraticCurveTo(-0.24, 0.3, 0, 0.32);
        lower.push([tf(new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 }), -0.06, -0.16, 0.02, 0, -Math.PI / 2), toon(0x1f4f9a)]);
        lower.push([tf(new THREE.SphereGeometry(0.05, 10, 8), -0.1, -0.16, 0.02), gold]);
      }
      if (side > 0 && role.carry === 'hammer') { lower.push([tf(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6), 0, -0.36, 0.06, Math.PI / 2), wood]); lower.push([tf(new THREE.BoxGeometry(0.06, 0.08, 0.14), 0, -0.36, 0.26), steel]); }
      if (side > 0 && role.carry === 'staff') lower.push([tf(new THREE.CylinderGeometry(0.02, 0.022, 1.7, 6), 0, -0.05, 0.05), wood]);
      if (side < 0 && role.carry === 'basket') { lower.push([tf(new THREE.CylinderGeometry(0.14, 0.11, 0.14, 12), 0, -0.4, 0.08), wood]); lower.push([tf(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0, -0.34, 0.08, 0, 0, 0, 1, 0.4, 1), toon(0xf3eee2)]); }
      if (side < 0 && role.carry === 'bread') lower.push([tf(new THREE.CapsuleGeometry(0.045, 0.22, 4, 8), 0, -0.34, 0.09, Math.PI / 2), toon(0xc98a3e)]);
      el.add(bake(lower));
      return { sh, el };
    };
    const L = arm(-1), R = arm(1);

    /* Legs: hip -> knee -> boot */
    const leg = side => {
      const hip = new THREE.Group(); hip.position.set(side * 0.09, 0, 0); pelvis.add(hip);
      hip.add(bake([[adv ? cyl(0.088, 0.072, 0.45, -0.225) : cyl(0.072, 0.058, 0.45, -0.225), armored ? steel : pantsM]]));
      const knee = new THREE.Group(); knee.position.y = -0.45; hip.add(knee);
      const shin = armored ? [   // knee cop, greave and a pointed steel boot
        [cyl(0.055, 0.045, 0.44, -0.22), steel], [tf(new THREE.SphereGeometry(0.066, 10, 8), 0, 0, 0.02, 0, 0, 0, 1, 1, 0.9), steel],
        [tf(new THREE.TorusGeometry(0.064, 0.008, 6, 14), 0, -0.02, 0.01, Math.PI / 2), gold],
        [tf(new THREE.BoxGeometry(0.1, 0.07, 0.2), 0, -0.45, 0.03), steel], [tf(new THREE.ConeGeometry(0.045, 0.08, 8), 0, -0.45, 0.17, Math.PI / 2), steel],
      ] : adv ? [   // wide trousers into tall boots with a folded top
        [cyl(0.072, 0.062, 0.16, -0.08), pantsM], [cyl(0.064, 0.05, 0.3, -0.29), toon(0x5a1d1c)],
        [tf(new THREE.TorusGeometry(0.066, 0.016, 6, 14), 0, -0.145, 0, Math.PI / 2), toon(0x5a1d1c)], [tf(new THREE.BoxGeometry(0.1, 0.07, 0.22), 0, -0.45, 0.04), boots],
      ] : [[cyl(0.055, 0.045, 0.44, -0.22), half ? steel : boots], [tf(new THREE.BoxGeometry(0.1, 0.07, 0.22), 0, -0.45, 0.04), boots]];
      knee.add(bake(shin));
      return { hip, knee };
    };
    const LL = leg(-1), RL = leg(1);

    root.scale.setScalar(scale);
    root.userData.person = info;
    root.position.set(path[0][0], 0, path[0][1]);
    scene.add(root);

    /* Walking and idling */
    const walker = { mesh: root, t: rnd(), phase: rnd() * 6, speed: path.length > 1 ? 1.1 + rnd() * 0.4 : 0 };
    const segLen = path.length > 1 ? Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]) : 1;
    walker.update = (dt, now) => {
      if (!walker.speed) {
        const b = Math.sin(now / 900 + walker.phase);
        root.rotation.y = (opts.face || 0) + Math.sin(now / 3100 + walker.phase) * 0.15;
        head.rotation.y = Math.sin(now / 2300 + walker.phase) * 0.35;
        pelvis.position.y = 0.95 + b * 0.004;
        L.sh.rotation.x = R.sh.rotation.x = 0.05 + b * 0.02; L.el.rotation.x = R.el.rotation.x = role.spear || role.carry ? -0.5 : -0.15;
        if (role.spear) { R.sh.rotation.x = 0.1; R.el.rotation.x = -1.45; }
        return;
      }
      walker.t = (walker.t + (dt * walker.speed) / segLen) % 2;
      const u = walker.t < 1 ? walker.t : 2 - walker.t, [ax, az] = path[0], [bx, bz] = path[1];
      const x = ax + (bx - ax) * u, z = az + (bz - az) * u, dx = x - root.position.x, dz = z - root.position.z;
      if (Math.abs(dx) + Math.abs(dz) > 1e-5) root.rotation.y = Math.atan2(dx, dz);
      root.position.set(x, 0, z);
      const w = now / 1000 * walker.speed * 5.2 + walker.phase, s = Math.sin(w);
      LL.hip.rotation.x = -s * 0.5; RL.hip.rotation.x = s * 0.5;
      LL.knee.rotation.x = Math.max(0, Math.sin(w + 1.3)) * 0.9; RL.knee.rotation.x = Math.max(0, Math.sin(w + 1.3 + Math.PI)) * 0.9;
      L.sh.rotation.x = s * 0.42; R.sh.rotation.x = -s * 0.42;
      L.el.rotation.x = -0.25 - Math.max(0, -s) * 0.35; R.el.rotation.x = -0.25 - Math.max(0, s) * 0.35;
      if (role.spear) { R.sh.rotation.x = 0.1; R.el.rotation.x = -1.45; }
      pelvis.position.y = 0.95 + Math.abs(Math.cos(w)) * 0.03; pelvis.rotation.y = s * 0.08; head.rotation.y = -s * 0.06;
    };
    return walker;
  }

  return { person, toon, ramp };
}
