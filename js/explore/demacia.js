// The Great City of Demacia, built from simple shapes: our own design in Demacia's white, blue and gold.
// Layout (metres): city centre at 0,0; walls at radius 92; gate faces south; river at z = 130; you arrive from the south.

const WALL_R = 92, RIVER_Z = 130, RIVER_HALF = 10, ROAD = 8;
const C = {
  stone: 0xece6da, stone2: 0xdcd4c4, slate: 0x3f5e8c, slate2: 0x2f4a73, gold: 0xc89b3c, blue: 0x1f4f9a,
  grass: 0x6f9a4c, road: 0xcfc4ae, plaza: 0xddd5c4, water: 0x3a74ad, wood: 0x7a5a3a, leaf: 0x3f6f35,
};

export function buildDemacia(THREE, scene, { seeded, people: lines = [] }) {
  const rnd = seeded(2921);
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });
  const M = {
    stone: mat(C.stone), stone2: mat(C.stone2), slate: mat(C.slate, { roughness: 0.7 }), gold: mat(C.gold, { metalness: 0.7, roughness: 0.35 }),
    road: mat(C.road), plaza: mat(C.plaza), wood: mat(C.wood), leaf: mat(C.leaf), water: mat(C.water, { roughness: 0.25, metalness: 0.1 }),
  };
  const add = (geo, m, x, y, z, { shadow = true, ry = 0 } = {}) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry;
    o.castShadow = shadow; o.receiveShadow = true; scene.add(o); return o;
  };
  const colliders = [];                                    // circles {x,z,r} and boxes {x0,x1,z0,z1}
  const box = (x, z, w, d) => colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const circle = (x, z, r) => colliders.push({ x, z, r });

  /* ---- Land, river, roads ---- */
  const ground = add(new THREE.PlaneGeometry(1400, 1400), mat(C.grass), 0, 0, 0, { shadow: false });
  ground.rotation.x = -Math.PI / 2;
  const flat = (w, d, m, x, z, y = 0.03, ry = 0) => { const p = add(new THREE.PlaneGeometry(w, d), m, x, y, z, { shadow: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = ry; return p; };
  flat(1400, RIVER_HALF * 2, M.water, 0, RIVER_Z, 0.06);
  flat(1400, 3, mat(0xb9ad86), 0, RIVER_Z - RIVER_HALF - 1.2, 0.05);
  flat(1400, 3, mat(0xb9ad86), 0, RIVER_Z + RIVER_HALF + 1.2, 0.05);
  const cityFloor = add(new THREE.CircleGeometry(WALL_R + 2, 64), M.plaza, 0, 0.04, 0, { shadow: false }); cityFloor.rotation.x = -Math.PI / 2;
  flat(ROAD * 2, WALL_R * 2, M.road, 0, 0, 0.07);
  flat(WALL_R * 2, ROAD * 2, M.road, 0, 0, 0.07);
  flat(ROAD * 2, 330, M.road, 0, WALL_R + 165, 0.05);
  const plaza = add(new THREE.CircleGeometry(22, 48), mat(0xe8e1d2), 0, 0.08, 0, { shadow: false }); plaza.rotation.x = -Math.PI / 2;

  /* Farmland patches outside the walls */
  const fieldColors = [0xc9b46a, 0x9cc069, 0xb8a35a, 0x8fb35e, 0xd6c37a];
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 150 + rnd() * 260, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(z - RIVER_Z) < 30 || (Math.abs(x) < 20 && z > 0)) continue;
    flat(24 + rnd() * 30, 16 + rnd() * 22, mat(fieldColors[i % 5]), x, z, 0.02, rnd() * Math.PI);
  }

  /* ---- Bridge and docks ---- */
  add(new THREE.BoxGeometry(10, 1.2, RIVER_HALF * 2 + 12), M.stone2, 0, 0.7, RIVER_Z);
  [-5.2, 5.2].forEach(x => add(new THREE.BoxGeometry(0.6, 1.4, RIVER_HALF * 2 + 12), M.stone, x, 1.9, RIVER_Z));
  for (let i = 0; i < 6; i++) {
    const x = 22 + i * 9;
    add(new THREE.BoxGeometry(6, 0.6, 9), M.wood, x, 0.5, RIVER_Z - RIVER_HALF + 2);
    if (i % 2 === 0) { const barge = add(new THREE.BoxGeometry(5, 1.4, 12), M.wood, x + 2, 0.6, RIVER_Z + 1, { ry: 0.05 }); barge.userData.bob = rnd() * 6; }
  }
  box(0, RIVER_Z, 0.1, 0); // the bridge itself is walkable; the river is blocked in blocked() below

  /* ---- Walls and towers ---- */
  const SEG = 44, segLen = (2 * Math.PI * WALL_R) / SEG, gateGap = 0.13;
  const wallGeo = new THREE.BoxGeometry(segLen + 0.6, 12, 3);
  const merlon = new THREE.BoxGeometry(1.4, 1.4, 3.2);
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;                      // a = 0 points south (+z), toward the gate
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < gateGap) continue;
    const x = Math.sin(a) * WALL_R, z = Math.cos(a) * WALL_R;
    add(wallGeo, M.stone, x, 6, z, { ry: a });
    for (let k = -1; k <= 1; k++) add(merlon, M.stone2, x + Math.cos(a) * k * 4, 12.7, z - Math.sin(a) * k * 4, { ry: a });
    if (i % 4 === 2) tower(x, z, 4.6, 19);
  }
  function tower(x, z, r, h, roof = 'cone') {
    add(new THREE.CylinderGeometry(r, r * 1.08, h, 20), M.stone, x, h / 2, z);
    add(new THREE.TorusGeometry(r * 1.02, 0.35, 8, 24), M.gold, x, h - 0.4, z).rotation.x = Math.PI / 2;
    if (roof === 'cone') add(new THREE.ConeGeometry(r * 1.2, r * 1.8, 20), M.slate, x, h + r * 0.9, z);
    else add(new THREE.SphereGeometry(r * 1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.gold, x, h, z);
    add(new THREE.ConeGeometry(0.4, 3, 8), M.gold, x, h + (roof === 'cone' ? r * 1.8 + 1.4 : r + 1.4), z);
    circle(x, z, r + 0.6);
  }

  /* ---- The gate: twin towers, arch and winged guardians ---- */
  [-10, 10].forEach(x => tower(x, WALL_R, 6, 24, 'dome'));
  add(new THREE.BoxGeometry(14, 6, 4), M.stone, 0, 17, WALL_R);
  add(new THREE.BoxGeometry(14.4, 0.6, 4.4), M.gold, 0, 14.2, WALL_R);
  [-17, 17].forEach(x => guardian(x, WALL_R + 8));
  function guardian(x, z) {
    const g = new THREE.Group();
    const part = (geo, m, px, py, pz, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.set(rx, ry, rz); o.castShadow = true; g.add(o); return o; };
    part(new THREE.BoxGeometry(5, 4, 5), M.stone2, 0, 2, 0);
    part(new THREE.CylinderGeometry(1.1, 1.6, 7, 12), M.stone, 0, 7.5, 0);
    part(new THREE.SphereGeometry(0.9, 16, 12), M.stone, 0, 11.7, 0);
    part(new THREE.CylinderGeometry(0.25, 0.25, 9, 8), M.gold, 1.6, 8.5, 0.6);            // a raised spear
    [-1, 1].forEach(side => {
      for (let f = 0; f < 5; f++) part(new THREE.BoxGeometry(0.5, 5 - f * 0.7, 1.4), M.stone, side * (1.6 + f * 0.9), 10.4 - f * 0.5, -0.4, 0, 0, side * (0.5 + f * 0.18));
    });
    g.position.set(x, 0, z); g.rotation.y = Math.PI; scene.add(g);
    circle(x, z, 3.6);
  }

  /* Banners: blue cloth, gold border, a simple gold wing emblem (drawn on a canvas) */
  const bannerTex = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 320; const g = c.getContext('2d');
    g.fillStyle = '#1f4f9a'; g.fillRect(0, 0, 128, 320);
    g.strokeStyle = '#d9b25a'; g.lineWidth = 8; g.strokeRect(6, 6, 116, 290);
    g.fillStyle = '#d9b25a'; g.beginPath(); g.moveTo(64, 120);
    g.quadraticCurveTo(20, 90, 14, 140); g.quadraticCurveTo(40, 130, 64, 150); g.quadraticCurveTo(88, 130, 114, 140); g.quadraticCurveTo(108, 90, 64, 120); g.fill();
    g.beginPath(); g.moveTo(64, 150); g.lineTo(54, 190); g.lineTo(64, 210); g.lineTo(74, 190); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, 296); g.lineTo(64, 320); g.lineTo(128, 296); g.fillStyle = '#1f4f9a'; g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, side: THREE.DoubleSide, roughness: 0.9 });
  const banner = (x, y, z, ry, h = 9) => add(new THREE.PlaneGeometry(h * 0.4, h), bannerMat, x, y, z, { ry, shadow: false });
  [-6, 6].forEach(x => banner(x, 8, WALL_R + 2.2, 0));
  [-30, -50, 30, 50].forEach(x => { const a = Math.asin(x / WALL_R); banner(x, 7, Math.cos(a) * WALL_R + 1.8, a); });

  /* ---- Houses: white walls, slate-blue roofs (instanced for speed) ---- */
  const spots = [];
  const keepClear = [[0, -58, 34], [44, -16, 18], [-44, 14, 12], [-70, 14, 12], [0, 0, 26]];   // palace, barracks, tower, almshouse, plaza
  for (let tries = 0; tries < 2600 && spots.length < 190; tries++) {
    const a = rnd() * Math.PI * 2, r = 26 + rnd() * (WALL_R - 34), x = Math.sin(a) * r, z = Math.cos(a) * r;
    const w = 6 + rnd() * 5, d = 6 + rnd() * 5, h = 5 + rnd() * 7, half = Math.max(w, d) / 2;
    if (Math.abs(x) < ROAD + half + 1 || Math.abs(z) < ROAD + half + 1) continue;
    if (Math.hypot(x, z) + half > WALL_R - 5) continue;
    if (keepClear.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + half)) continue;
    if (spots.some(s => Math.hypot(s.x - x, s.z - z) < s.half + half + 2)) continue;
    spots.push({ x, z, w, d, h, half, ry: Math.round(rnd() * 3) * (Math.PI / 2) + (rnd() - 0.5) * 0.1 });
  }
  const houseGeo = new THREE.BoxGeometry(1, 1, 1), roofGeo = new THREE.ConeGeometry(0.75, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const houses = new THREE.InstancedMesh(houseGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), spots.length);
  const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), spots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), col = new THREE.Color();
  spots.forEach((s, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.ry);
    houses.setMatrixAt(i, m4.compose(p3.set(s.x, s.h / 2, s.z), q, s3.set(s.w, s.h, s.d)));
    houses.setColorAt(i, col.setHex(rnd() < 0.5 ? C.stone : C.stone2).offsetHSL(0, 0, (rnd() - 0.5) * 0.04));
    roofs.setMatrixAt(i, m4.compose(p3.set(s.x, s.h + 2.2, s.z), q, s3.set(s.w * 1.02, 4.4, s.d * 1.02)));
    roofs.setColorAt(i, col.setHex(rnd() < 0.6 ? C.slate : C.slate2));
    box(s.x, s.z, (s.ry % Math.PI < 0.8 ? s.w : s.d) + 1, (s.ry % Math.PI < 0.8 ? s.d : s.w) + 1);
  });
  [houses, roofs].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });

  /* ---- Landmark buildings ---- */
  // Royal palace (north)
  add(new THREE.BoxGeometry(44, 14, 26), M.stone, 0, 7, -60); box(0, -60, 46, 28);
  add(new THREE.BoxGeometry(20, 26, 18), M.stone, 0, 13, -62);
  add(new THREE.BoxGeometry(44.6, 0.8, 26.6), M.gold, 0, 14.2, -60);
  [[-20, -48], [20, -48], [-20, -72], [20, -72]].forEach(([x, z]) => tower(x, z, 4, 30));
  tower(0, -62, 3.4, 42, 'dome');
  [-8, 8].forEach(x => banner(x, 8, -46.8, 0, 10));
  // Fountain in the plaza
  add(new THREE.CylinderGeometry(6, 6.4, 1.2, 32), M.stone2, 0, 0.6, 0); circle(0, 0, 6.6);
  add(new THREE.CylinderGeometry(5.4, 5.4, 0.3, 32), M.water, 0, 1.1, 0, { shadow: false });
  add(new THREE.CylinderGeometry(0.7, 0.9, 5, 12), M.stone, 0, 3, 0);
  add(new THREE.CylinderGeometry(2.4, 1.2, 0.8, 20), M.gold, 0, 5.6, 0);
  // Dauntless Vanguard barracks (east road) and training yard
  add(new THREE.BoxGeometry(28, 9, 12), M.stone2, 44, 4.5, -18); box(44, -18, 29, 13);
  add(new THREE.BoxGeometry(28.6, 3, 12.6), M.slate, 44, 10, -18);
  flat(26, 12, mat(0xcbb48a), 44, -4, 0.09);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.4, 3, 0.4), M.wood, 34 + i * 5, 1.5, -6);
  banner(44, 6, -11.7, 0, 7);
  // Mageseeker watchtower (west road): tall, plain and watchful
  tower(-44, 14, 5.2, 32);
  add(new THREE.BoxGeometry(12, 6, 10), M.stone2, -44, 3, 22); box(-44, 22, 13, 11);
  // House of the Illuminators (far west road): a warm lamp on the roof
  add(new THREE.BoxGeometry(16, 8, 12), M.stone, -70, 4, 16); box(-70, 16, 17, 13);
  add(new THREE.ConeGeometry(11, 5, 4), M.slate, -70, 10.5, 16).rotation.y = Math.PI / 4;
  const glow = new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffc35a, emissiveIntensity: 0 });
  add(new THREE.SphereGeometry(1.2, 16, 12), glow, -70, 14.5, 16);

  /* ---- Street lamps (they light up at sunset and night) ---- */
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff1c4, emissive: 0xffb84a, emissiveIntensity: 0 });
  const post = new THREE.CylinderGeometry(0.15, 0.2, 4, 6), bulb = new THREE.SphereGeometry(0.45, 10, 8);
  const lampAt = (x, z) => { add(post, mat(0x2b2b2b), x, 2, z, { shadow: false }); add(bulb, lampMat, x, 4.2, z, { shadow: false }); };
  for (let t = 24; t < WALL_R - 4; t += 14) [[t, 9.5], [-t, -9.5], [9.5, -t], [-9.5, t]].forEach(([x, z]) => lampAt(x, z));
  for (let z = WALL_R + 10; z < 200; z += 16) lampAt(9.5, z);

  /* ---- Trees outside the walls ---- */
  const trunk = new THREE.CylinderGeometry(0.4, 0.6, 3, 6), crown = new THREE.ConeGeometry(3, 8, 8);
  const trunks = new THREE.InstancedMesh(trunk, M.wood, 260), crowns = new THREE.InstancedMesh(crown, M.leaf, 260);
  let n = 0;
  for (let i = 0; i < 900 && n < 260; i++) {
    const a = rnd() * Math.PI * 2, r = WALL_R + 14 + rnd() * 320, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(z - RIVER_Z) < RIVER_HALF + 6 || (Math.abs(x) < 16 && z > 0)) continue;
    const k = 0.8 + rnd() * 0.7;
    trunks.setMatrixAt(n, m4.compose(p3.set(x, 1.5 * k, z), q.identity(), s3.set(k, k, k)));
    crowns.setMatrixAt(n, m4.compose(p3.set(x, 6.5 * k, z), q, s3.set(k, k, k)));
    crowns.setColorAt(n, col.setHex(C.leaf).offsetHSL((rnd() - 0.5) * 0.04, 0, (rnd() - 0.5) * 0.08));
    if (r < 200) circle(x, z, 1);
    n++;
  }
  trunks.count = crowns.count = n;
  [trunks, crowns].forEach(m => { m.castShadow = true; scene.add(m); });

  /* ---- Townsfolk (original characters) ---- */
  const tunics = [0x3d6fb6, 0x8c4a3a, 0x5b7d3a, 0xc7a34d, 0x6b5a8c, 0xe8e2d4, 0x2f6f73];
  const skins = [0xf1c9a5, 0xd9a47c, 0xa8724f, 0x7a4e33, 0xe7b893];
  function person(info, path, opts = {}) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.5, 10), mat(opts.armor ? 0xdedad0 : tunics[Math.floor(rnd() * tunics.length)]));
    body.position.y = 1.05; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), mat(skins[Math.floor(rnd() * skins.length)]));
    head.position.y = 2.1; head.castShadow = true;
    g.add(body, head);
    if (opts.armor) {
      const helm = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.55, 10), M.gold); helm.position.y = 2.45; g.add(helm);
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), M.wood); spear.position.set(0.6, 1.8, 0); g.add(spear);
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), new THREE.MeshStandardMaterial({ color: C.blue, side: THREE.DoubleSide })); cape.position.set(0, 1.3, 0.46); g.add(cape);
    }
    g.userData.person = info;
    g.position.set(path[0][0], 0, path[0][1]);
    scene.add(g);
    const pt = { mesh: g, t: rnd(), speed: path.length > 1 ? 0.03 + rnd() * 0.03 : 0 };
    pt.update = (dt, now) => {
      if (!pt.speed) { g.rotation.y = opts.face || 0; return; }
      pt.t = (pt.t + dt * pt.speed) % 2;
      const u = pt.t < 1 ? pt.t : 2 - pt.t, [ax, az] = path[0], [bx, bz] = path[1];
      const x = ax + (bx - ax) * u, z = az + (bz - az) * u;
      g.rotation.y = Math.atan2(x - g.position.x, z - g.position.z) || g.rotation.y;
      g.position.set(x, Math.abs(Math.sin(now / 180)) * 0.06, z);
    };
    return pt;
  }
  return finish();

  function finish() {
    return {
      regionName: 'Demacia',
      spawn: { x: 0, z: 196, yaw: 0 },
      mapRadius: 210,
      river: { z: RIVER_Z },
      lamps: [lampMat, glow],
      people: placePeople(),
      tour: [
        { x: 0, z: 196 }, { x: 0, z: 136, stop: 1 }, { x: 0, z: 104, stop: 1 }, { x: 0, z: 20, stop: 1 },
        { x: 0, z: 9 }, { x: 40, z: 9 }, { x: 44, z: 6, stop: 1 }, { x: 78, z: 6, stop: 1 }, { x: 60, z: 6 },
        { x: 9, z: 6 }, { x: 9, z: -6 }, { x: -40, z: -6 }, { x: -44, z: -4, stop: 1 }, { x: -66, z: -4, stop: 1 },
        { x: -12, z: -6 }, { x: -6, z: -10 }, { x: -6, z: -30, stop: 1 },
      ],
      blocked,
      drawMinimap,
    };
  }

  function placePeople() {
    const pick = i => lines[i % Math.max(1, lines.length)] || { role: 'Townsperson', line: 'Good day to you.' };
    const list = [
      person(pick(0), [[-6, WALL_R + 6]], { armor: true, face: Math.PI }),
      person(pick(0), [[6, WALL_R + 6]], { armor: true, face: Math.PI }),
      person(pick(1), [[-4, 60], [-4, 26]]),
      person(pick(2), [[30, -3], [70, -3]]),
      person(pick(3), [[-24, 4], [-60, 4]]),
      person(pick(4), [[24, RIVER_Z - RIVER_HALF - 3], [60, RIVER_Z - RIVER_HALF - 3]]),
      person(pick(5), [[4, 150], [4, 186]]),
      person(pick(6), [[18, 18], [18, 18]]),
      person(pick(7), [[-14, -14], [-14, -14]]),
      person(pick(2), [[4, -16], [4, -40]]),
      person(pick(1), [[-30, -4], [-80, -4]]),
    ];
    return list;
  }

  /* Can the walker stand here? */
  function blocked(x, z) {
    if (Math.hypot(x, z) > 400) return true;
    if (Math.abs(z - RIVER_Z) < RIVER_HALF + 0.8 && Math.abs(x) > 4.4) return true;   // only the bridge crosses the river
    const d = Math.hypot(x, z);
    if (Math.abs(d - WALL_R) < 2.6 && Math.abs(Math.atan2(x, z)) > gateGap * 0.62) return true;
    for (const c of colliders) {
      if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + 0.5) return true; }
      else if (x > c.x0 - 0.5 && x < c.x1 + 0.5 && z > c.z0 - 0.5 && z < c.z1 + 0.5) return true;
    }
    return false;
  }

  function drawMinimap(g, toMini) {
    g.fillStyle = '#2f4a2a'; g.fillRect(0, 0, 180, 180);
    const [, ry] = toMini(0, RIVER_Z); g.fillStyle = '#3a74ad'; g.fillRect(0, ry - 3, 180, 6);
    const [cx, cy] = toMini(0, 0), [ex] = toMini(WALL_R, 0);
    g.fillStyle = '#ddd5c4'; g.beginPath(); g.arc(cx, cy, ex - cx, 0, 7); g.fill();
    g.strokeStyle = '#f0e6d2'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#cfc4ae'; g.fillRect(cx - 2, cy - (ex - cx), 4, 180); g.fillRect(cx - (ex - cx), cy - 2, (ex - cx) * 2, 4);
    const [px, pz] = toMini(-22, -73), [px2, pz2] = toMini(22, -47); g.fillStyle = '#3f5e8c'; g.fillRect(px, pz, px2 - px, pz2 - pz);
  }
}
