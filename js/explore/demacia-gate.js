// The Gate of the Winged Guardians: built in code with our own textures. Its layout follows a model made from our
// concept art (pillars with blue inlays and gold diamonds, a tall arch with small side arches, a central tower,
// banners between the pillars). Only the statue's shape comes from that model (models/winged-guardian.glb).
// The gate is centred on x = 0; its outer face looks south (+z).
import * as T from './textures.js';

const HALF = 24, H = 17, DEPTH = 4;                       // the wall body: 48 m wide, 17 m high, 4 m deep
const DOOR = { half: 2.4, spring: 7.6 };                  // the passage: 4.8 m wide, arch top at 10 m
const PILLARS = [-22.6, -14.9, -6.4, 6.4, 14.9, 22.6];
const BAYS = [[-18.75, 3.4], [-10.65, 3.6], [10.65, 3.6], [18.75, 3.4]];   // [x, banner width] between the pillars

export function buildGate(THREE, scene, { K, add, z: Z }) {
  const M = K.M;
  const tiled = (base, rx, ry = rx) => {
    const m = base.clone();
    m.map = base.map.clone(); m.map.repeat.set(rx, ry); m.map.needsUpdate = true;
    m.bumpMap = base.bumpMap.clone(); m.bumpMap.repeat.set(rx, ry); m.bumpMap.needsUpdate = true;
    return m;
  };
  const wallStone = tiled(M.stone, 0.22);                 // extruded shapes have UVs in metres
  const pillarStone = tiled(M.stone, 0.7, 5);
  const runes = new THREE.MeshStandardMaterial({ map: T.runeInlay(THREE), roughness: 0.55 });
  const banner = new THREE.MeshStandardMaterial({ map: T.grandBanner(THREE), roughness: 0.85 });

  /* Wall body: a front skin with every arch cut through, and a core with only the passage */
  const arch = (path, cx, half, spring) => {
    path.moveTo(cx - half, 0); path.lineTo(cx - half, spring);
    path.absarc(cx, spring, half, Math.PI, 0, true); path.lineTo(cx + half, 0); path.closePath();
    return path;
  };
  const outline = () => { const s = new THREE.Shape(); s.moveTo(-HALF, 0); s.lineTo(HALF, 0); s.lineTo(HALF, H); s.lineTo(-HALF, H); s.closePath(); return s; };
  const skin = outline(), core = outline();
  skin.holes.push(arch(new THREE.Path(), 0, DOOR.half, DOOR.spring));
  core.holes.push(arch(new THREE.Path(), 0, DOOR.half, DOOR.spring));
  BAYS.forEach(([x]) => skin.holes.push(arch(new THREE.Path(), x, 1.3, 2.6)));
  add(new THREE.ExtrudeGeometry(skin, { depth: 0.8, bevelEnabled: false }), wallStone, 0, 0, Z + DEPTH / 2 - 0.8);
  add(new THREE.ExtrudeGeometry(core, { depth: DEPTH - 0.8, bevelEnabled: false }), wallStone, 0, 0, Z - DEPTH / 2);
  BAYS.forEach(([x]) => add(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 1.3, 2.6)), M.dark, x, 0, Z + DEPTH / 2 - 0.79, { shadow: false }));

  /* Cornice, gold band and a crenellated parapet along the top */
  add(new THREE.BoxGeometry(HALF * 2 + 0.6, 0.8, DEPTH + 0.8), M.stone2, 0, H + 0.4, Z);
  add(new THREE.BoxGeometry(HALF * 2 + 0.2, 0.35, DEPTH + 0.3), M.gold, 0, H - 0.6, Z);
  add(new THREE.BoxGeometry(HALF * 2, 1.6, 0.8), M.stone2, 0, H + 1.6, Z + DEPTH / 2 - 0.2);
  for (let x = -HALF + 1.2; x < HALF; x += 2.4) add(new THREE.BoxGeometry(1.2, 1, 0.8), M.stone2, x, H + 2.9, Z + DEPTH / 2 - 0.2);

  /* Pillars: plinth, shaft, inlays front and back, gold diamonds, cap and a pedestal for the statue */
  const plinth = new THREE.BoxGeometry(3.4, 1.6, 6), shaft = new THREE.BoxGeometry(2.8, 22, 5.4), cap = new THREE.BoxGeometry(3.4, 0.7, 6);
  const pedestal = new THREE.BoxGeometry(1.8, 1.2, 1.8), strip = new THREE.BoxGeometry(1, 11, 0.12), plate = new THREE.BoxGeometry(1.4, 0.8, 0.2);
  const gem = new THREE.OctahedronGeometry(0.6);
  const statues = [];
  PILLARS.forEach(x => {
    add(plinth, M.stone2, x, 0.8, Z); add(shaft, pillarStone, x, 11, Z); add(cap, M.stone2, x, 22.35, Z); add(pedestal, M.stone2, x, 23.3, Z);
    [1, -1].forEach(side => {
      const f = Z + side * 2.7;
      add(strip, runes, x, 12.5, f + side * 0.06, { shadow: false });
      add(plate, M.gold, x, 18.4, f + side * 0.1);
      add(gem, M.gold, x, 6.2, f + side * 0.2).scale.set(1, 1.4, 0.4);
    });
    statues.push([x, 23.9, Z, 0]);
  });

  /* Central tower above the passage */
  add(new THREE.BoxGeometry(5, 15, 5.4), pillarStone, 0, H + 7.5, Z);
  add(new THREE.BoxGeometry(5.6, 0.8, 6), M.stone2, 0, H + 15.2, Z);
  add(new THREE.BoxGeometry(2.6, 1.6, 2.6), M.stone2, 0, H + 16.4, Z);
  add(new THREE.ConeGeometry(0.5, 3, 10), M.gold, 0, H + 18.7, Z);
  [1, -1].forEach(side => {
    add(new THREE.BoxGeometry(1.3, 10, 0.12), runes, 0, H + 7, Z + side * 2.76, { shadow: false });
    add(new THREE.BoxGeometry(1.8, 0.9, 0.2), M.gold, 0, H + 12.6, Z + side * 2.8);
  });

  /* Around the door: a gold keystone and diamond, open oak doors, a raised portcullis and two lanterns */
  add(new THREE.BoxGeometry(1, 1.3, 0.5), M.gold, 0, DOOR.spring + DOOR.half + 0.3, Z + DEPTH / 2);
  add(gem, M.gold, 0, 13.4, Z + DEPTH / 2 + 0.2).scale.set(1.4, 2, 0.4);
  [-1, 1].forEach(side => {
    add(new THREE.BoxGeometry(2.3, 7.4, 0.25), M.wood, side * (DOOR.half - 0.15), 3.7, Z - 0.3, { ry: Math.PI / 2 });   // swung open against the passage wall
    for (const y of [1.2, 3.7, 6.2]) add(new THREE.BoxGeometry(0.06, 0.25, 2.35), M.iron, side * (DOOR.half - 0.3), y, Z - 0.3);
    add(new THREE.BoxGeometry(0.5, 0.8, 0.5), M.lamp, side * 3.6, 6.4, Z + DEPTH / 2 + 0.35, { shadow: false });
    add(new THREE.BoxGeometry(0.7, 0.15, 0.7), M.iron, side * 3.6, 6.9, Z + DEPTH / 2 + 0.35);
  });
  for (let x = -1.8; x <= 1.8; x += 0.6) add(new THREE.BoxGeometry(0.12, 1.6, 0.12), M.iron, x, 9.3, Z + 0.6);
  add(new THREE.BoxGeometry(4.8, 0.14, 0.14), M.iron, 0, 8.6, Z + 0.6);

  /* Banners in the bays, outside and on the city side */
  const shape = new THREE.Shape([[0, 0.14], [0.5, 0], [1, 0.14], [1, 1], [0, 1]].map(([x, y]) => new THREE.Vector2(x, y)));
  const bannerGeo = new THREE.ShapeGeometry(shape).translate(-0.5, -0.5, 0);
  BAYS.forEach(([x, w]) => [1, -1].forEach(side => {
    const b = add(bannerGeo, banner, x, 10.6, Z + side * (DEPTH / 2 + 0.06), { shadow: false, ry: side > 0 ? 0 : Math.PI });
    b.scale.set(w, 10.5, 1);
  }));

  return {
    statues,                                                // [x, y, z, facing] for the winged guardians
    colliders: [[-(HALF + DOOR.half) / 2, Z, HALF - DOOR.half, 6], [(HALF + DOOR.half) / 2, Z, HALF - DOOR.half, 6]],
  };
}
