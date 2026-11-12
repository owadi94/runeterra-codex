// The Great City of Demacia: our own design in Demacia's white stone, slate blue and gold.
// Layout (metres): centre 0,0; walls at radius 92 with the gate facing south; river at z = 130; you arrive from the south.
import { makeKit } from './kit.js';
import * as T from './textures.js';

const WALL_R = 92, RIVER_Z = 130, RIVER_HALF = 10, ROAD = 8;

export function buildDemacia(THREE, scene, { seeded, people: lines = [] }) {
  const rnd = seeded(2921);
  const K = makeKit(THREE, rnd), M = K.M;
  const add = (geo, m, x, y, z, { ry = 0, shadow = true } = {}) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry;
    o.castShadow = shadow; o.receiveShadow = true; scene.add(o); return o;
  };
  const flat = (geo, m, x, z, y = 0.02) => { const o = add(geo, m, x, y, z, { shadow: false }); o.rotation.x = -Math.PI / 2; return o; };
  const colliders = [];
  const box = (x, z, w, d) => colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const circle = (x, z, r) => colliders.push({ x, z, r });

  /* ---- Ground: rolling grass outside, cobbles inside, dirt road ---- */
  const grassT = T.grass(THREE, [120, 120]);
  /* Gentle hills, flat near the city, the road and the river. */
  const height = (x, z) => {
    const h = (Math.sin(x * 0.012) + Math.cos(-z * 0.015) + Math.sin((x - z) * 0.007)) * 4;
    return h * Math.min(1, Math.max(0, (Math.hypot(x, z) - 150) / 160)) * Math.min(1, Math.abs(z - RIVER_Z) / 60) * Math.min(1, Math.max(0, (Math.abs(x) - 14) / 30) + (z < 0 ? 1 : 0));
  };
  const groundGeo = new THREE.PlaneGeometry(1400, 1400, 120, 120);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, height(pos.getX(i), -pos.getY(i)));   // the plane is rotated: its y is world -z
  groundGeo.computeVertexNormals();
  flat(groundGeo, K.std({ map: grassT.map }), 0, 0, 0);
  const cobT = T.cobbles(THREE, [214, 205, 188], [64, 64]);
  flat(new THREE.CircleGeometry(WALL_R + 2, 72), K.std({ map: cobT.map, bumpMap: cobT.bump, bumpScale: 1.5 }), 0, 0, 0.05);
  const roadT = T.cobbles(THREE, [196, 186, 166], [5, 60]);
  const roadMat = K.std({ map: roadT.map, bumpMap: roadT.bump, bumpScale: 1.5 });
  flat(new THREE.PlaneGeometry(ROAD * 2, WALL_R * 2), roadMat, 0, 0, 0.08);
  flat(new THREE.PlaneGeometry(ROAD * 2, WALL_R * 2), roadMat, 0, 0, 0.08).rotation.z = Math.PI / 2;
  const dirt = K.std({ color: 0xa48d68, roughness: 1 });
  flat(new THREE.PlaneGeometry(ROAD * 1.6, 320), dirt, 0, WALL_R + 160, 0.06);
  const plazaT = T.cobbles(THREE, [232, 225, 210], [16, 16]);
  flat(new THREE.CircleGeometry(22, 48), K.std({ map: plazaT.map, bumpMap: plazaT.bump, bumpScale: 1.2 }), 0, 0, 0.1);

  /* Farm fields with crop rows */
  const fieldColors = [0xc9b46a, 0x9cc069, 0xb8a35a, 0x8fb35e, 0xd6c37a];
  for (let i = 0; i < 60; i++) {
    const a = rnd() * Math.PI * 2, r = 170 + rnd() * 230, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(z - RIVER_Z) < 34 || (Math.abs(x) < 24 && z > 0)) continue;
    const f = flat(new THREE.PlaneGeometry(22 + rnd() * 20, 14 + rnd() * 14), K.std({ color: fieldColors[i % 5], roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }), x, z);
    f.position.y = Math.max(height(x, z), 0) + 0.25; f.rotation.z = rnd() * Math.PI;
  }

  /* ---- River: rippling water, reed banks, bridge, docks and barges ---- */
  const water = K.std({ color: 0x2f6aa6, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.92 });
  new THREE.TextureLoader().load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures/waternormals.jpg', t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 1.5); water.normalMap = t; water.normalScale.set(0.6, 0.6); water.needsUpdate = true;
  });
  flat(new THREE.PlaneGeometry(1400, RIVER_HALF * 2), water, 0, RIVER_Z, 0.15);
  const bank = K.std({ color: 0x9b8c66, roughness: 1 });
  flat(new THREE.PlaneGeometry(1400, 4), bank, 0, RIVER_Z - RIVER_HALF - 1.5, 0.12);
  flat(new THREE.PlaneGeometry(1400, 4), bank, 0, RIVER_Z + RIVER_HALF + 1.5, 0.12);
  // Arched stone bridge
  add(new THREE.BoxGeometry(10, 1.2, RIVER_HALF * 2 + 14), M.stone2, 0, 1.1, RIVER_Z);
  [-5.3, 5.3].forEach(x => {
    add(new THREE.BoxGeometry(0.7, 1.3, RIVER_HALF * 2 + 14), M.stone, x, 2.3, RIVER_Z);
    for (let k = -2; k <= 2; k++) add(new THREE.BoxGeometry(0.9, 1.8, 0.9), M.stone2, x, 2.5, RIVER_Z + k * 7.5);
  });
  const arch = add(new THREE.TorusGeometry(5, 1.1, 8, 24, Math.PI), M.stone2, 0, 0.1, RIVER_Z); arch.rotation.y = Math.PI / 2;
  // Docks and barges
  for (let i = 0; i < 6; i++) {
    const x = 24 + i * 10;
    add(new THREE.BoxGeometry(6, 0.5, 10), M.wood, x, 0.55, RIVER_Z - RIVER_HALF + 3);
    [-2.6, 2.6].forEach(px => add(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 6), M.wood, x + px, 0.6, RIVER_Z - RIVER_HALF + 7.6));
    if (i % 2 === 0) { const b = add(new THREE.BoxGeometry(4.5, 1.2, 11), M.wood, x + 2, 0.75, RIVER_Z + 2); b.userData.bob = i; }
  }
  for (let i = 0; i < 5; i++) { K.barrel(scene, 26 + i * 7, RIVER_Z - RIVER_HALF - 4); K.crate(scene, 29 + i * 7, RIVER_Z - RIVER_HALF - 4.5, 0.9); }

  /* ---- City walls with crenellations, wall towers ---- */
  const SEG = 48, segLen = (2 * Math.PI * WALL_R) / SEG, gateGap = 0.13;
  const wallMat = M.stone.clone(); wallMat.map = M.stone.map.clone(); wallMat.map.repeat.set(3, 2.5); wallMat.map.needsUpdate = true;
  wallMat.bumpMap = M.stone.bumpMap.clone(); wallMat.bumpMap.repeat.set(3, 2.5); wallMat.bumpMap.needsUpdate = true;
  const wallGeo = new THREE.BoxGeometry(segLen + 0.5, 13, 3.4), merlon = new THREE.BoxGeometry(1.5, 1.6, 3.6), walk = new THREE.BoxGeometry(segLen + 0.5, 0.6, 4.6);
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;                       // 0 points south (+z), where the gate is
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < gateGap) continue;
    const x = Math.sin(a) * WALL_R, z = Math.cos(a) * WALL_R;
    add(wallGeo, wallMat, x, 6.5, z, { ry: a });
    add(walk, M.stone2, x, 13.1, z, { ry: a });
    for (let k = -1; k <= 1; k++) add(merlon, M.stone2, x + Math.cos(a) * k * 4 + Math.sin(a) * 1.4, 14.2, z - Math.sin(a) * k * 4 + Math.cos(a) * 1.4, { ry: a });
    if (i % 4 === 2) { K.tower(scene, x, z, 4.8, 20); circle(x, z, 5.4); }
  }

  /* ---- The gate: twin domed towers, arch, portcullis and winged guardians ---- */
  [-10, 10].forEach(x => { K.tower(scene, x, WALL_R, 6.2, 26, 'dome'); circle(x, WALL_R, 6.8); });
  add(new THREE.BoxGeometry(14, 7, 4.4), wallMat, 0, 17.5, WALL_R);
  add(new THREE.BoxGeometry(14.6, 0.7, 4.8), M.gold, 0, 14.1, WALL_R);
  const gateArch = add(new THREE.TorusGeometry(4.6, 0.7, 10, 28, Math.PI), M.stone2, 0, 9.4, WALL_R + 2.3);
  for (let i = -3; i <= 3; i++) add(new THREE.BoxGeometry(0.18, 4, 0.18), M.iron, i * 1.3, 12, WALL_R - 1.4);
  void gateArch;
  [-17, 17].forEach(x => guardian(x, WALL_R + 9));
  function guardian(x, z) {                                   // an original winged guardian statue
    const g = new THREE.Group(), stoneM = M.stone2;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.6, 5.2), M.stone); plinth.position.y = 1.8; g.add(plinth);
    const robe = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(1.9, 0), new THREE.Vector2(1.6, 1.5), new THREE.Vector2(1.2, 4.2), new THREE.Vector2(1.35, 6.2), new THREE.Vector2(0.6, 6.9), new THREE.Vector2(0, 7)], 20), stoneM);
    robe.position.y = 3.6; g.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 14), stoneM); head.position.y = 11.4; g.add(head);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.92, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.gold); helm.position.y = 11.5; g.add(helm);
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.12), M.gold); sword.position.set(0, 8, 1.5); g.add(sword);
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.25), M.gold); hilt.position.set(0, 10.3, 1.5); g.add(hilt);
    [-1, 1].forEach(side => {
      const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.bezierCurveTo(1.5, 2.5, 4, 4, 6.5, 4.5); wing.bezierCurveTo(5, 2.4, 4.6, 0.6, 4.4, -1.2);
      wing.bezierCurveTo(3.6, -0.6, 2.8, -1.8, 2.2, -2.6); wing.bezierCurveTo(1.6, -1.6, 0.8, -1.4, 0, -0.6); wing.closePath();
      const w = new THREE.Mesh(new THREE.ExtrudeGeometry(wing, { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }), stoneM);
      w.scale.set(side, 1, 1); w.position.set(side * 0.9, 9.4, -0.8); w.rotation.y = side * 0.35; g.add(w);
    });
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(x, 0, z); g.rotation.y = Math.PI; scene.add(g);
    circle(x, z, 3.8);
  }
  K.bannerCloth(scene, -6, 8.5, WALL_R + 2.4, 0); K.bannerCloth(scene, 6, 8.5, WALL_R + 2.4, 0);
  [-30, -52, 30, 52].forEach(x => { const a = Math.asin(x / WALL_R); K.bannerCloth(scene, x, 7.5, Math.cos(a) * WALL_R + 1.9, a, 7); });

  /* ---- Houses ---- */
  const spots = [];
  const keepClear = [[0, -60, 36], [44, -18, 19], [-44, 16, 13], [-70, 16, 13], [0, 0, 27]];
  for (let tries = 0; tries < 3000 && spots.length < 170; tries++) {
    const a = rnd() * Math.PI * 2, r = 27 + rnd() * (WALL_R - 34), x = Math.sin(a) * r, z = Math.cos(a) * r;
    const variant = Math.floor(rnd() * 6), scale = 0.92 + rnd() * 0.18, half = 6.2 * scale;
    if (Math.abs(x) < ROAD + half + 1 || Math.abs(z) < ROAD + half + 1) continue;
    if (Math.hypot(x, z) + half > WALL_R - 6) continue;
    if (keepClear.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + half)) continue;
    if (spots.some(s => Math.hypot(s.x - x, s.z - z) < s.half + half + 1.5)) continue;
    const ry = Math.round(Math.atan2(x, z) / (Math.PI / 2)) * (Math.PI / 2) + (Math.abs(x) > Math.abs(z) ? 0 : Math.PI / 2);   // face the nearest main road
    spots.push({ x, z, variant, scale, half, ry });
    circle(x, z, half * 0.82);
  }
  K.houseInstances(scene, spots);

  /* ---- The royal palace (north) ---- */
  const P = { x: 0, z: -62 };
  add(new THREE.BoxGeometry(46, 1.2, 30), M.stone2, P.x, 0.6, P.z);
  for (let s = 0; s < 4; s++) add(new THREE.BoxGeometry(16 - s, 0.4, 2), M.stone2, P.x, 0.2 + s * 0.4, P.z + 16 + s * -0.8);   // steps
  add(new THREE.BoxGeometry(44, 15, 26), wallMat, P.x, 8.7, P.z); box(P.x, P.z, 46, 30);
  add(new THREE.BoxGeometry(44.8, 0.8, 26.8), M.gold, P.x, 16.2, P.z);
  add(new THREE.BoxGeometry(22, 28, 18), wallMat, P.x, 15, P.z - 2);
  add(new THREE.BoxGeometry(22.8, 0.8, 18.8), M.gold, P.x, 29, P.z - 2);
  for (let i = -4; i <= 4; i++) {                                // colonnade and windows on the facade
    if (i === 0) continue;
    add(new THREE.CylinderGeometry(0.6, 0.7, 12, 12), M.stone, P.x + i * 4.6, 7.2, P.z + 13.6);
    add(new THREE.BoxGeometry(1.4, 3, 0.3), M.glass, P.x + i * 4.6 + 2.3, 11, P.z + 13.1);
  }
  add(new THREE.BoxGeometry(5, 8, 0.5), M.trim, P.x, 5.2, P.z + 13.2);
  add(new THREE.TorusGeometry(2.5, 0.35, 8, 20, Math.PI), M.gold, P.x, 9.2, P.z + 13.5);
  [[-20, -50], [20, -50], [-20, -74], [20, -74]].forEach(([x, z]) => K.tower(scene, x, z, 4.2, 32));
  K.tower(scene, P.x, P.z - 2, 3.6, 44, 'dome');
  [-9, 9].forEach(x => K.bannerCloth(scene, x, 9, P.z + 13.4, 0, 10));
  K.hedge(scene, -14, -40, 16); K.hedge(scene, 14, -40, 16);
  for (let i = 0; i < 6; i++) { const t = add(new THREE.ConeGeometry(1.1, 4.2, 8), M.leaf2, i < 3 ? -22 + i * 3.6 : 15 + (i - 3) * 3.6, 2.1, -38); t.material = M.leaf2; }

  /* ---- Plaza: tiered fountain and a small market ---- */
  add(new THREE.CylinderGeometry(6.4, 6.8, 1.1, 40), M.stone2, 0, 0.55, 0); circle(0, 0, 7);
  const pool = add(new THREE.CylinderGeometry(5.8, 5.8, 0.2, 40), water, 0, 1.05, 0, { shadow: false }); void pool;
  add(new THREE.CylinderGeometry(0.8, 1.1, 3.6, 16), M.stone, 0, 2.8, 0);
  add(new THREE.CylinderGeometry(2.8, 1.4, 0.7, 28), M.stone2, 0, 4.6, 0);
  add(new THREE.CylinderGeometry(0.45, 0.6, 2.2, 12), M.stone, 0, 6, 0);
  add(new THREE.SphereGeometry(0.9, 18, 12), M.gold, 0, 7.6, 0);
  const stallColors = [['#1f4f9a', '#e9e2cf'], ['#9a2f2f', '#f0d48a'], ['#2f6f45', '#e9e2cf'], ['#c89b3c', '#1f4f9a']];
  [0.6, 1.3, 2.1, 3.9, 4.6, 5.4].forEach((a, i) => K.stall(scene, Math.sin(a) * 16, Math.cos(a) * 16, a + Math.PI, stallColors[i % 4]));
  [0.6, 1.3, 2.1, 3.9, 4.6, 5.4].forEach(a => circle(Math.sin(a) * 16, Math.cos(a) * 16, 2.3));
  [[11, 11, 0.8], [-11, 11, -0.8], [11, -11, 2.3], [-11, -11, -2.3]].forEach(([x, z, r]) => K.bench(scene, x, z, r));

  /* ---- Dauntless Vanguard barracks and training yard (east) ---- */
  add(new THREE.BoxGeometry(28, 10, 12), wallMat, 44, 5, -20); box(44, -20, 29, 13);
  const bRoof = add(new THREE.BoxGeometry(29, 0.5, 14), M.roof, 44, 10.4, -20); void bRoof;
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(1.4, 2, 0.3), M.glass, 33 + i * 4.4, 6, -13.9);
  flat(new THREE.PlaneGeometry(26, 11), K.std({ color: 0xcbb48a, roughness: 1 }), 44, -6.5, 0.11);
  K.bannerCloth(scene, 44, 6.5, -13.6, 0, 7);
  // The Vanguard's training yard: racks, armour stands, shields and an equipment chest
  K.weaponRack(scene, 36, -12.4, 0); K.weaponRack(scene, 52, -12.4, 0);
  K.armorStand(scene, 41, -12.2, 0); K.armorStand(scene, 47, -12.2, 0);
  [33, 55, 58].forEach((x, i) => K.shieldPost(scene, x, -5 + i * 0.4, -Math.PI / 2 * (i ? 1 : -1)));
  K.chest(scene, 44, -9.5, 0.1);
  for (let i = 0; i < 3; i++) K.barrel(scene, 59, -10 - i * 1.3);
  [[36, -12.4, 3.4], [52, -12.4, 3.4], [41, -12.2, 1], [47, -12.2, 1], [44, -9.5, 1.2]].forEach(([x, z, r]) => circle(x, z, r));

  /* ---- Mageseeker watchtower (west) and House of the Illuminators (far west) ---- */
  K.tower(scene, -44, 16, 5.4, 34); circle(-44, 16, 6);
  add(new THREE.BoxGeometry(12, 6.5, 9), wallMat, -44, 3.25, 26); box(-44, 26, 13, 10);
  add(new THREE.BoxGeometry(17, 9, 12), M.plaster, -70, 4.5, 16); box(-70, 16, 18, 13);
  const iRoof = add(new THREE.ConeGeometry(11.5, 5.5, 4), M.roof, -70, 11.7, 16); iRoof.rotation.y = Math.PI / 4;
  const glowM = K.std({ color: 0xffe2a0, emissive: 0xffc35a, emissiveIntensity: 0 });
  add(new THREE.SphereGeometry(1.1, 18, 12), glowM, -70, 15.4, 16);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(1.4, 2.2, 0.3), M.glass, -76 + i * 4, 4.5, 9.9);
  K.cart(scene, -60, -4.5, 0.1); K.crate(scene, -63, -5.2); K.crate(scene, -63.6, -4.1, 0.8);

  /* ---- Street lamps, carts and barrels along the roads ---- */
  for (let t = 26; t < WALL_R - 6; t += 13) [[t, 9.4], [-t, -9.4], [9.4, -t], [-9.4, t]].forEach(([x, z]) => K.lampPost(scene, x, z));
  for (let z = WALL_R + 12; z < 200; z += 15) K.lampPost(scene, 8.6, z);
  K.cart(scene, 12, 60, 1.6); K.cart(scene, -12, -26, -1.5);
  [[13, 30], [-13, 46], [30, 12], [-28, -12]].forEach(([x, z]) => { K.barrel(scene, x, z); K.crate(scene, x + 1.1, z + 0.4, 0.8); });

  /* ---- Trees outside the walls, hedges by the gate ---- */
  const tspots = [];
  for (let i = 0; i < 1400 && tspots.length < 340; i++) {
    const a = rnd() * Math.PI * 2, r = WALL_R + 16 + rnd() * 330, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(z - RIVER_Z) < RIVER_HALF + 8 || (Math.abs(x) < 18 && z > 0)) continue;
    tspots.push({ x, z, y: height(x, z) - 0.2, ry: rnd() * 6, scale: 0.8 + rnd() * 0.7 });
    if (r < 220) circle(x, z, 1.2);
  }
  K.trees(scene, tspots);
  K.hedge(scene, -14, WALL_R + 20, 10); K.hedge(scene, 14, WALL_R + 20, 10);

  /* ---- Painted props around the city ---- */
  [-7.5, 7.5].forEach(x => { K.bannerStand(scene, x, WALL_R + 14, 0); circle(x, WALL_R + 14, 0.8); });          // the road into the gate
  [-7.5, 7.5].forEach(x => { K.bannerStand(scene, x, P.z + 22, 0); circle(x, P.z + 22, 0.8); });                // palace steps
  [-12, 12].forEach(x => { K.chest(scene, x, P.z + 18, 0); circle(x, P.z + 18, 1.2); });
  [[-20, 6, 0.3], [20, -6, -2.8], [6, -20, 1.4]].forEach(([x, z, r]) => { K.table(scene, x, z, r); circle(x, z, 1.5); });   // market tables
  K.weaponRack(scene, -52, 26, Math.PI / 2); circle(-52, 26, 2);                                                   // by the Mageseeker post

  /* ---- Townsfolk ---- */
  const say = i => lines[i % Math.max(1, lines.length)] || { role: 'Townsperson', line: 'Good day to you.' };
  const people = [
    K.villager(scene, say(0), [[-5, WALL_R + 7]], { guard: true, face: 0 }),
    K.villager(scene, say(0), [[5, WALL_R + 7]], { guard: true, face: 0 }),
    K.villager(scene, say(1), [[16 * Math.sin(1.3) - 1.2, 16 * Math.cos(1.3) + 1.5]], { face: 1.3 + Math.PI }),
    K.villager(scene, say(4), [[16 * Math.sin(4.6) + 1.2, 16 * Math.cos(4.6)]], { face: 4.6 + Math.PI }),
    K.villager(scene, say(2), [[30, -3], [70, -3]]),
    K.villager(scene, say(3), [[-24, 4], [-60, 4]]),
    K.villager(scene, say(4), [[24, RIVER_Z - RIVER_HALF - 6], [62, RIVER_Z - RIVER_HALF - 6]]),
    K.villager(scene, say(5), [[4, 150], [4, 190]]),
    K.villager(scene, say(6), [[-4, 64], [-4, 26]]),
    K.villager(scene, say(7), [[9, 9]], { face: -0.8 }),
    K.villager(scene, say(2), [[4, -14], [4, -40]]),
    K.villager(scene, say(1), [[-30, -4], [-80, -4]]),
    K.villager(scene, say(5), [[-4, 20], [-4, 60]]),
    K.villager(scene, say(6), [[20, 4], [60, 4]]),
  ];

  const barges = []; scene.traverse(o => { if (o.userData.bob !== undefined) barges.push(o); });

  return {
    regionName: 'Demacia',
    spawn: { x: 0, z: 196, yaw: 0 },
    mapRadius: 210,
    river: { z: RIVER_Z },
    lamps: [...K.lamps, glowM],
    people,
    update(dt, now) {
      K.waveFlags(now);
      if (water.normalMap) { water.normalMap.offset.x += dt * 0.02; water.normalMap.offset.y += dt * 0.01; }
      barges.forEach(b => { b.position.y = 0.75 + Math.sin(now / 900 + b.userData.bob) * 0.08; b.rotation.z = Math.sin(now / 1300 + b.userData.bob) * 0.02; });
    },
    tour: [
      { x: 0, z: 196 }, { x: 0, z: 136, stop: 1 }, { x: 0, z: 104, stop: 1 }, { x: 0, z: 22, stop: 1 },
      { x: 0, z: 12 }, { x: 10, z: 10 }, { x: 40, z: 8 }, { x: 44, z: 4, stop: 1 }, { x: 80, z: 5, stop: 1 }, { x: 60, z: 6 },
      { x: 10, z: 8 }, { x: 10, z: -8 }, { x: -40, z: -7 }, { x: -44, z: -4, stop: 1 }, { x: -66, z: -4, stop: 1 },
      { x: -12, z: -9 }, { x: -6, z: -14 }, { x: -6, z: -30, stop: 1 },
    ],
    blocked(x, z) {
      if (Math.hypot(x, z) > 400) return true;
      if (Math.abs(z - RIVER_Z) < RIVER_HALF + 0.8 && Math.abs(x) > 4.4) return true;   // only the bridge crosses the river
      const d = Math.hypot(x, z);
      if (Math.abs(d - WALL_R) < 2.8 && Math.abs(Math.atan2(x, z)) > gateGap * 0.6) return true;
      for (const c of colliders) {
        if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + 0.5) return true; }
        else if (x > c.x0 - 0.5 && x < c.x1 + 0.5 && z > c.z0 - 0.5 && z < c.z1 + 0.5) return true;
      }
      return false;
    },
    drawMinimap(g, toMini) {
      g.fillStyle = '#3d5a2c'; g.fillRect(0, 0, 180, 180);
      const [, ry] = toMini(0, RIVER_Z); g.fillStyle = '#3a74ad'; g.fillRect(0, ry - 3, 180, 6);
      const [cx, cy] = toMini(0, 0), [ex] = toMini(WALL_R, 0), r = ex - cx;
      g.fillStyle = '#ddd5c4'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.strokeStyle = '#f0e6d2'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#bfb39a'; g.fillRect(cx - 2, cy - r, 4, 180); g.fillRect(cx - r, cy - 2, r * 2, 4);
      g.fillStyle = '#9fb0c8'; spots.forEach(s => { const [hx, hy] = toMini(s.x, s.z); g.fillRect(hx - 1.5, hy - 1.5, 3, 3); });
      const [px, pz] = toMini(-23, -77), [px2, pz2] = toMini(23, -47); g.fillStyle = '#3f5e8c'; g.fillRect(px, pz, px2 - px, pz2 - pz);
    },
  };
}
