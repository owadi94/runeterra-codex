// Reusable models for explorable cities, built from shapes and our procedural textures.
// Everything here is an original design: generic medieval-fantasy buildings, props and townsfolk.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from './textures.js';

export function makeKit(THREE, rnd) {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });

  /* ---- Shared materials ---- */
  const stoneT = T.stoneBlocks(THREE, [236, 230, 218], [2, 2]);
  const stone2T = T.stoneBlocks(THREE, [214, 206, 192], [2, 2]);
  const roofT = T.roofTiles(THREE, [58, 92, 140], [3, 2]);
  const roof2T = T.roofTiles(THREE, [46, 74, 116], [3, 2]);
  const woodT = T.planks(THREE);
  const M = {
    stone: std({ map: stoneT.map, bumpMap: stoneT.bump, bumpScale: 1.4 }),
    stone2: std({ map: stone2T.map, bumpMap: stone2T.bump, bumpScale: 1.4 }),
    plaster: std({ color: 0xf2ece0, roughness: 0.95 }),
    roof: std({ map: roofT.map, bumpMap: roofT.bump, bumpScale: 2, roughness: 0.7 }),
    roof2: std({ map: roof2T.map, bumpMap: roof2T.bump, bumpScale: 2, roughness: 0.7 }),
    trim: std({ color: 0x8a6a45, map: woodT.map }),
    dark: std({ color: 0x2a2622, roughness: 0.7 }),
    glass: std({ color: 0x1d2a3a, emissive: 0xffb85c, emissiveIntensity: 0, roughness: 0.3, metalness: 0.2 }),
    gold: std({ color: 0xc89b3c, metalness: 0.85, roughness: 0.3 }),
    iron: std({ color: 0x24262b, metalness: 0.6, roughness: 0.5 }),
    wood: std({ map: woodT.map }),
    leaf: std({ color: 0x4f7f3a, flatShading: true, roughness: 0.9 }),
    leaf2: std({ color: 0x3f6b30, flatShading: true, roughness: 0.9 }),
    flowers: std({ color: 0xd65a7a, flatShading: true }),
    lamp: std({ color: 0xfff1c4, emissive: 0xffb84a, emissiveIntensity: 0 }),
  };
  const lamps = [M.glass, M.lamp];   // these glow at night

  /* ---- Geometry helpers ---- */
  const at = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { geo.rotateX(rx); geo.rotateY(ry); geo.rotateZ(rz); geo.translate(x, y, z); return geo; };
  const boxG = (w, h, d, x, y, z, ry = 0) => at(new THREE.BoxGeometry(w, h, d), x, y, z, 0, ry);
  const cleaned = g => { const n = g.index ? g.toNonIndexed() : g; ['uv1', 'uv2'].forEach(a => n.deleteAttribute(a)); return n; };
  /** Merge parts per material, then into one geometry with one group per material. */
  function prefab(parts, materials) {
    const byMat = materials.map(() => []);
    parts.forEach(([geo, mi]) => byMat[mi].push(cleaned(geo)));
    const merged = byMat.map(list => (list.length ? mergeGeometries(list) : cleaned(new THREE.BoxGeometry(0.001, 0.001, 0.001))));
    return { geometry: mergeGeometries(merged, true), materials };
  }
  const gableEnd = (w, h, z) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ShapeGeometry(s); g.translate(0, 0, z); return g; };

  /* ---- House: walls, gable roof with overhang, framed windows, door, chimney, flower boxes ---- */
  function house(w, d, floors, wallMat) {
    const H = floors * 3.6, roofH = Math.min(w, d) * 0.55, parts = [];
    parts.push([boxG(w, H, d, 0, H / 2, 0), 0]);                                   // walls
    parts.push([boxG(w + 0.3, 0.5, d + 0.3, 0, 0.25, 0), 2]);                      // plinth
    parts.push([boxG(w + 0.2, 0.25, d + 0.2, 0, H, 0), 2]);                        // eave band
    const slope = Math.atan2(roofH, w / 2), len = Math.hypot(w / 2, roofH) + 0.7;
    [-1, 1].forEach(side => parts.push([at(new THREE.BoxGeometry(len, 0.35, d + 1.2), side * (w / 4 + 0.05), H + roofH / 2, 0, 0, 0, -side * slope), 1]));
    parts.push([gableEnd(w, roofH, d / 2).translate(0, H, 0), 0]);
    parts.push([gableEnd(w, roofH, -d / 2).rotateY(Math.PI).translate(0, H, 0), 0]);
    parts.push([boxG(0.3, roofH * 0.2, d + 1.3, 0, H + roofH + 0.05, 0), 2]);      // ridge
    if (rnd() < 0.7) parts.push([boxG(1, 2.4, 1, w / 4, H + roofH * 0.7, -d / 4), 0]); // chimney
    for (let f = 0; f < floors; f++) {
      const y = f * 3.6 + (f === 0 ? 2 : 2.1), n = Math.max(1, Math.floor(d / 3.2));
      for (let i = 0; i < n; i++) {
        const z = -d / 2 + (i + 0.5) * (d / n);
        if (f === 0 && i === Math.floor(n / 2)) continue;
        [-1, 1].forEach(side => {
          parts.push([boxG(0.12, 1.5, 1.0, side * (w / 2 + 0.06), y, z), 3]);       // glass
          parts.push([boxG(0.16, 1.75, 0.16, side * (w / 2 + 0.08), y, z - 0.58), 2]);
          parts.push([boxG(0.16, 1.75, 0.16, side * (w / 2 + 0.08), y, z + 0.58), 2]);
          parts.push([boxG(0.22, 0.16, 1.3, side * (w / 2 + 0.1), y + 0.85, z), 2]);
          parts.push([boxG(0.3, 0.16, 1.3, side * (w / 2 + 0.12), y - 0.82, z), 2]);
          if (f > 0 && rnd() < 0.4) parts.push([boxG(0.5, 0.35, 1.2, side * (w / 2 + 0.3), y - 1.05, z), 4]);   // flower box
        });
      }
      [-1, 1].forEach(side => { if (f > 0 || side < 0) parts.push([boxG(1.0, 1.5, 0.12, 0, y, side * (d / 2 + 0.06)), 3]); });
    }
    parts.push([boxG(1.5, 2.6, 0.2, 0, 1.3, d / 2 + 0.08), 2]);                    // door
    return prefab(parts, [wallMat, rnd() < 0.5 ? M.roof : M.roof2, M.trim, M.glass, M.flowers]);
  }

  /** A set of house prefabs placed with instancing (fast even with hundreds of houses). */
  function houseInstances(scene, spots) {
    const variants = [house(8, 7, 2, M.stone), house(7, 9, 2, M.plaster), house(9, 8, 3, M.stone), house(6, 6, 1, M.plaster), house(10, 7, 2, M.stone2), house(7, 7, 3, M.plaster)];
    const buckets = variants.map(() => []);
    spots.forEach(s => buckets[s.variant % variants.length].push(s));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3();
    variants.forEach((v, i) => {
      if (!buckets[i].length) return;
      const mesh = new THREE.InstancedMesh(v.geometry, v.materials, buckets[i].length);
      buckets[i].forEach((s, k) => mesh.setMatrixAt(k, m4.compose(p.set(s.x, 0, s.z), q.setFromAxisAngle(up, s.ry), sc.setScalar(s.scale))));
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
    });
    return variants.map(v => ({ w: v.geometry.boundingBox }));
  }

  /* ---- Towers ---- */
  function tower(scene, x, z, r, h, roof = 'cone') {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 28, 1), M.stone); body.position.y = h / 2;
    body.material = M.stone.clone(); body.material.map = M.stone.map.clone(); body.material.map.repeat.set(Math.round(r * 1.2), Math.round(h / 4)); body.material.map.needsUpdate = true;
    body.material.bumpMap = M.stone.bumpMap.clone(); body.material.bumpMap.repeat.copy(body.material.map.repeat); body.material.bumpMap.needsUpdate = true;
    const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, 0.32, 8, 32), M.gold); band.rotation.x = Math.PI / 2; band.position.y = h - 0.5;
    const ledge = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.6, 28), M.stone2); ledge.position.y = h;
    g.add(body, band, ledge);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3, win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.3), M.glass);
      win.position.set(Math.sin(a) * r, h * 0.62, Math.cos(a) * r); win.rotation.y = a; g.add(win);
    }
    if (roof === 'cone') { const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, r * 2.1, 28), M.roof); c.position.y = h + r * 1.05 + 0.3; g.add(c); }
    else { const d = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.gold); d.position.y = h + 0.3; g.add(d); }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3, 10), M.gold); tip.position.y = h + (roof === 'cone' ? r * 2.1 + 1.6 : r + 1.6); g.add(tip);
    g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    g.position.set(x, 0, z); scene.add(g);
    return g;
  }

  /* ---- Trees and hedges (low-poly, flat shaded) ---- */
  function trees(scene, spots) {
    const trunk = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 7); trunk.translate(0, 1.6, 0);
    const crown = mergeGeometries([at(new THREE.IcosahedronGeometry(2.6, 0), 0, 5, 0), at(new THREE.IcosahedronGeometry(2.0, 0), 1.3, 4.2, 0.6), at(new THREE.IcosahedronGeometry(1.9, 0), -1.1, 4.4, -0.7), at(new THREE.IcosahedronGeometry(1.6, 0), 0.2, 6.6, 0.2)].map(cleaned));
    const tm = new THREE.InstancedMesh(trunk, M.wood, spots.length), cm = new THREE.InstancedMesh(crown, M.leaf, spots.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
    spots.forEach((t, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.ry);
      m4.compose(p.set(t.x, t.y || 0, t.z), q, s.setScalar(t.scale)); tm.setMatrixAt(i, m4); cm.setMatrixAt(i, m4);
      cm.setColorAt(i, col.setHSL(0.26 + (rnd() - 0.5) * 0.05, 0.45, 0.32 + (rnd() - 0.5) * 0.08));
    });
    [tm, cm].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  }
  function hedge(scene, x, z, len, ry = 0) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(len, 1.2, 1.2, Math.ceil(len), 1, 1), M.leaf2);
    g.position.set(x, 0.6, z); g.rotation.y = ry; g.castShadow = g.receiveShadow = true; scene.add(g);
  }

  /* ---- Props ---- */
  function barrel(scene, x, z) {
    const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 1.2, 14), M.wood); b.position.y = 0.6;
    [0.25, 0.95].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 16), M.iron); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); });
    g.add(b); g.position.set(x, 0, z); g.traverse(o => { o.castShadow = true; }); scene.add(g);
  }
  function crate(scene, x, z, s = 1) { const c = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), M.wood); c.position.set(x, s / 2, z); c.rotation.y = rnd(); c.castShadow = c.receiveShadow = true; scene.add(c); }
  function stall(scene, x, z, ry, colors) {
    const g = new THREE.Group(), cloth = new THREE.MeshStandardMaterial({ map: T.stripes(THREE, ...colors).map, side: THREE.DoubleSide, roughness: 0.9 });
    [[-1.6, -1], [1.6, -1], [-1.6, 1], [1.6, 1]].forEach(([px, pz]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6), M.wood); p.position.set(px, 1.4, pz); g.add(p); });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1, 1.2), M.wood); counter.position.set(0, 0.5, 1); g.add(counter);
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.8), cloth); awning.position.set(0, 2.9, 0.2); awning.rotation.x = -Math.PI / 2 + 0.25; g.add(awning);
    const goods = [0xd9a441, 0xb5452e, 0x6f9a3a, 0xe8d6a0];
    for (let i = 0; i < 6; i++) { const it = new THREE.Mesh(i % 2 ? new THREE.SphereGeometry(0.17, 8, 6) : new THREE.BoxGeometry(0.3, 0.25, 0.3), std({ color: goods[i % 4] })); it.position.set(-1.2 + i * 0.48, 1.12, 1); g.add(it); }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  }
  function cart(scene, x, z, ry) {
    const g = new THREE.Group(), bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 1.4), M.wood); bed.position.y = 0.95; g.add(bed);
    [-0.75, 0.75].forEach(side => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 6, 14), M.wood); w.position.set(0.2, 0.55, side); g.add(w); });
    const hay = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), std({ color: 0xd8bf62, flatShading: true })); hay.scale.set(1.3, 0.6, 0.9); hay.position.y = 1.4; g.add(hay);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), M.wood); shaft.position.set(-1.8, 0.9, 0); g.add(shaft);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  }
  function bench(scene, x, z, ry) {
    const g = new THREE.Group(), seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.5), M.wood); seat.position.y = 0.5; g.add(seat);
    [-0.8, 0.8].forEach(px => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.45), M.stone2); l.position.set(px, 0.25, 0); g.add(l); });
    g.position.set(x, 0, z); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
  }
  function lampPost(scene, x, z) {
    const g = new THREE.Group(), post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 4.2, 8), M.iron); post.position.y = 2.1;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.07), M.iron); arm.position.set(0.3, 4.1, 0);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.5, 6), M.lamp); cage.position.set(0.62, 3.8, 0);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 6), M.iron); cap.position.set(0.62, 4.15, 0);
    g.add(post, arm, cage, cap); g.position.set(x, 0, z); g.rotation.y = rnd() * 0.2; post.castShadow = true; scene.add(g);
  }

  /* ---- Waving banners: cloth vertices move each frame ---- */
  const flags = [], bannerMap = T.banner(THREE);
  function bannerCloth(scene, x, y, z, ry, h = 8) {
    const geo = new THREE.PlaneGeometry(h * 0.4, h, 6, 12), mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: bannerMap, side: THREE.DoubleSide, roughness: 0.9 }));
    mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.castShadow = true; scene.add(mesh);
    flags.push({ geo, base: geo.attributes.position.array.slice(), h, phase: rnd() * 6 });
  }
  function waveFlags(now) {
    for (const f of flags) {
      const p = f.geo.attributes.position, a = p.array;
      for (let i = 0; i < p.count; i++) {
        const y = f.base[i * 3 + 1], t = (f.h / 2 - y) / f.h;           // 0 at the top, 1 at the bottom
        a[i * 3 + 2] = Math.sin(now / 520 + f.phase + y * 0.5) * 0.35 * t;
      }
      p.needsUpdate = true; f.geo.computeVertexNormals();
    }
  }

  /* ---- Townsfolk: original villagers with a walk cycle ---- */
  const tunics = [0x3d6fb6, 0x8c4a3a, 0x5b7d3a, 0xc7a34d, 0x6b5a8c, 0xe8e2d4, 0x2f6f73, 0x9a3d52];
  const skins = [0xf1c9a5, 0xd9a47c, 0xa8724f, 0x7a4e33, 0xe7b893];
  const hairs = [0x2b1d14, 0x5a3a22, 0xb08a4a, 0x8c8c8c, 0x1a1a1a, 0xa0522d];
  function villager(scene, info, path, opts = {}) {
    const g = new THREE.Group(), cloth = std({ color: opts.guard ? 0xd9d6cc : tunics[Math.floor(rnd() * tunics.length)], metalness: opts.guard ? 0.5 : 0, roughness: opts.guard ? 0.4 : 0.9 });
    const skin = std({ color: skins[Math.floor(rnd() * skins.length)] }), pants = std({ color: opts.guard ? 0x3a3f4a : 0x4a3b2c });
    const limb = (len, r, m) => { const geo = new THREE.CylinderGeometry(r, r * 0.85, len, 8); geo.translate(0, -len / 2, 0); return new THREE.Mesh(geo, m); };
    const hipL = new THREE.Group(), hipR = new THREE.Group(); hipL.position.set(-0.16, 0.95, 0); hipR.position.set(0.16, 0.95, 0);
    hipL.add(limb(0.95, 0.11, pants)); hipR.add(limb(0.95, 0.11, pants));
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.85, 12), cloth); torso.position.y = 1.38;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.35, 12), cloth); skirt.position.y = 0.88;
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 6, 16), opts.guard ? M.gold : M.trim); belt.rotation.x = Math.PI / 2; belt.position.y = 1.0;
    const shL = new THREE.Group(), shR = new THREE.Group(); shL.position.set(-0.4, 1.72, 0); shR.position.set(0.4, 1.72, 0);
    shL.add(limb(0.75, 0.085, cloth)); shR.add(limb(0.75, 0.085, cloth));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), skin); head.position.y = 2.05;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.255, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), std({ color: hairs[Math.floor(rnd() * hairs.length)] })); hair.position.y = 2.07; hair.rotation.x = -0.25;
    g.add(hipL, hipR, torso, skirt, belt, shL, shR, head, hair);
    if (opts.guard) {
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.gold); helm.position.y = 2.1; g.add(helm);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.4), std({ color: 0x1f4f9a })); crest.position.y = 2.4; g.add(crest);
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 6), M.wood); spear.position.set(0.55, 1.6, 0.1); g.add(spear);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), M.gold); tip.position.set(0.55, 3.45, 0.1); g.add(tip);
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 18), std({ color: 0x1f4f9a, metalness: 0.3, roughness: 0.5 })); shield.rotation.z = Math.PI / 2; shield.position.set(-0.52, 1.35, 0.05); g.add(shield);
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), M.gold); boss.position.set(-0.58, 1.35, 0.05); g.add(boss);
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.3), new THREE.MeshStandardMaterial({ color: 0x1f4f9a, side: THREE.DoubleSide })); cape.position.set(0, 1.25, -0.33); g.add(cape);
    } else if (rnd() < 0.4) {
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 0.25, 12), std({ color: 0x6b4f2e })); hat.position.y = 2.28; g.add(hat);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.userData.person = info; g.position.set(path[0][0], 0, path[0][1]); scene.add(g);
    const walker = { mesh: g, t: rnd(), speed: path.length > 1 ? 0.02 + rnd() * 0.02 : 0 };
    const segLen = path.length > 1 ? Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]) : 1;
    walker.update = (dt, now) => {
      if (!walker.speed) {                                     // standing: breathe and glance around
        g.rotation.y = (opts.face || 0) + Math.sin(now / 2400 + walker.t * 9) * 0.25;
        shL.rotation.x = shR.rotation.x = Math.sin(now / 900) * 0.04; return;
      }
      walker.t = (walker.t + dt * walker.speed * (14 / segLen)) % 2;
      const u = walker.t < 1 ? walker.t : 2 - walker.t, [ax, az] = path[0], [bx, bz] = path[1];
      const x = ax + (bx - ax) * u, z = az + (bz - az) * u, dx = x - g.position.x, dz = z - g.position.z;
      if (Math.abs(dx) + Math.abs(dz) > 1e-4) g.rotation.y = Math.atan2(dx, dz);
      const swing = Math.sin(now / 140) * 0.55;
      hipL.rotation.x = swing; hipR.rotation.x = -swing; shL.rotation.x = -swing * 0.8; shR.rotation.x = swing * 0.8;
      g.position.set(x, Math.abs(Math.sin(now / 140)) * 0.05, z);
    };
    return walker;
  }

  return { M, lamps, std, tower, houseInstances, trees, hedge, barrel, crate, stall, cart, bench, lampPost, bannerCloth, waveFlags, villager };
}
