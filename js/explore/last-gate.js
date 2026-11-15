// The Last Gate: the main entrance of the Great City (marker 1 on the city map in Realms of Runeterra).
// The book shows no picture of the gate, so it is our own design in the city's architectural language as Riot's art
// shows it at the Grand Plaza: two leaning white-stone pylons forming a tall pointed passage under a tracery arch; two
// raised walkways that leave the pylons and run on long slanted pillars in a half "C" (out, round, and back in) to a
// round tower each, as on the book's city map (p. 71), framing the entry square; a paved road with lawns either side;
// and two colossal stone guardians standing before the pylons on the causeway side, hands resting on a sword, heads
// bowed toward everyone who enters. A paved road runs through the gate, from the causeway into the city.
// Built in code; stone and grass surfaces from stone.js (scans); the guardians are the licensed knight model (credit
// in knights.js) posed and carved in stone.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { stoneMaterial, grassMaterial } from './stone.js';

const PYLON = { outer: 14, inner: 4.2, depth: 9, height: 28, topOuter: 10.5, topInner: 2.6 };   // metres; passage 8.4 m wide at the ground
const WALK = { width: 5, top: 23.5, low: 9, end: 16, spacing: 2.3 };   // walkways: deck height at the gate and after the fall; z of their end towers
const TOWER = { r: 4.5, h: 24 };                                     // the round towers where the walkways end
const GUARD = { height: 24, plinth: 3.2 };
const KNIGHT_H = 1.95;                                               // the knight model's own standing height, metres

/** A two-sided copy of a stone material (for cloth). clone() drops the shader hooks stone.js adds, so carry them over. */
const twoSided = (THREE, m) => Object.assign(m.clone(), { side: THREE.DoubleSide, onBeforeCompile: m.onBeforeCompile, customProgramCacheKey: m.customProgramCacheKey });

/** The Demacian great-helm from the concept art, sized by its radius r: a tall rounded shell with a crest ridge over the top,
 *  and a cross-shaped visor (eye slit across, a slit down the middle, a short bar across that). Faces +z, base at y = 0. */
export function knightHelm(THREE, stone, dark, r) {
  const g = new THREE.Group();
  const put = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const prof = [[0.86, 0], [0.98, 0.2], [1.02, 0.7], [0.99, 1.2], [0.88, 1.65], [0.66, 2.0], [0.36, 2.25], [0.08, 2.38], [0, 2.4]]
    .map(([x, y]) => new THREE.Vector2(x * r, y * r));
  put(new THREE.LatheGeometry(prof, 32), stone, 0, 0, 0).scale.set(1, 1, 1.1);
  // the crest: a raised ridge from the brow over the crown to the nape
  const crest = put(new THREE.TorusGeometry(r * 0.98, r * 0.09, 8, 28, Math.PI), stone, 0, r * 1.42, 0);
  crest.rotation.y = Math.PI / 2; crest.scale.set(1, 1.02, 1.1);
  // the visor: slits cut dark into the face. The eye slit is a strip of cylinder so it follows the helmet's curve.
  const slitMat = dark.clone(); slitMat.side = THREE.DoubleSide;
  put(new THREE.CylinderGeometry(r * 1.005, r * 1.005, r * 0.15, 24, 1, true, -0.62, 1.24), slitMat, 0, r * 1.2, 0).scale.set(1, 1, 1.1);
  put(new THREE.BoxGeometry(r * 0.13, r * 0.9, r * 0.12), dark, 0, r * 0.72, r * 1.06);
  put(new THREE.BoxGeometry(r * 0.55, r * 0.1, r * 0.12), dark, 0, r * 0.5, r * 1.06);
  return g;
}

/** Pose the knight as a guardian: both hands on the pommel of a sword planted before him, head bowed. Returns the sword. */
export function poseGuardian(THREE, knight, mixerClip, material) {
  if (mixerClip) { const mx = new THREE.AnimationMixer(knight); mx.clipAction(mixerClip).play(); mx.update(0); }
  knight.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(knight, true), k = KNIGHT_H / (box.max.y - box.min.y);
  knight.scale.multiplyScalar(k); knight.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(knight, true); knight.position.y -= b2.min.y; knight.updateMatrixWorld(true);
  const bone = n => knight.getObjectByName(n);
  const head = bone('mixamorigHead_06'), neck = bone('mixamorigNeck_05');
  // Bow the head: the neck and head tip forward
  neck?.rotateX(0.22); head?.rotateX(0.3); knight.updateMatrixWorld(true);
  // (called while the knight's parent is still at the origin, unscaled: metres at human size, ground at 0, facing +z)
  // The sword stands point-down on the plinth before him; its pommel at chest height
  const P = { x: 0, y: 1.3, z: 0.34 };
  /** Two-bone IK: turn the upper arm and forearm so the wrist lands on the target, the elbow bending toward the pole. */
  const V = () => new THREE.Vector3(), Q = () => new THREE.Quaternion();
  const turnBone = (b, from, to) => {                     // rotate bone b (in world terms) so direction 'from' becomes 'to'
    const q = Q().setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
    const wq = b.getWorldQuaternion(Q()), pq = b.parent.getWorldQuaternion(Q());
    b.quaternion.copy(pq.invert().multiply(q.multiply(wq))); knight.updateMatrixWorld(true);
  };
  const solve = (arm, fore, hand, target, pole) => {
    knight.updateMatrixWorld(true);
    const S = arm.getWorldPosition(V()), E = fore.getWorldPosition(V()), H = hand.getWorldPosition(V());
    const la = S.distanceTo(E), lb = E.distanceTo(H), d = Math.min(S.distanceTo(target), (la + lb) * 0.999);
    const dir = target.clone().sub(S).normalize();
    const x = (la * la - lb * lb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, la * la - x * x));
    const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const E2 = S.clone().addScaledVector(dir, x).addScaledVector(perp, h);
    turnBone(arm, E.clone().sub(S), E2.clone().sub(S));
    const E3 = fore.getWorldPosition(V()), H3 = hand.getWorldPosition(V());
    turnBone(fore, H3.clone().sub(E3), target.clone().sub(E3));
  };
  for (const [s, idx, tx, ty, tz] of [['Right', ['028', '029', '030'], -0.03, P.y - 0.1, P.z - 0.1], ['Left', ['09', '010', '011'], 0.03, P.y + 0.0, P.z - 0.1]]) {
    const arm = bone(`mixamorig${s}Arm_${idx[0]}`), fore = bone(`mixamorig${s}ForeArm_${idx[1]}`), hand = bone(`mixamorig${s}Hand_${idx[2]}`);
    const out = s === 'Right' ? -1 : 1;                   // the knight's right is −x when he faces +z
    if (arm && fore && hand) solve(arm, fore, hand, new THREE.Vector3(tx, ty, tz), new THREE.Vector3(out * 0.8, -0.35, -0.45));
  }
  // Stand tall: chest up a touch, shoulders square
  bone('mixamorigSpine2_04')?.rotateX(-0.05); knight.updateMatrixWorld(true);
  // The sword: blade point on the ground, crossguard, grip, and a round pommel under the hands
  const out = new THREE.Group(), sword = new THREE.Group(); out.add(sword);
  const part = (g, geo, x, y, z) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const BL = P.y - 0.3;                                                                 // blade length to the crossguard
  const blade = new THREE.Shape([[0, 0], [0.08, 0.16], [0.07, BL], [-0.07, BL], [-0.08, 0.16]].map(([x, y]) => new THREE.Vector2(x, y)));
  part(sword, new THREE.ExtrudeGeometry(blade, { depth: 0.026, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 1 }), 0, 0, -0.013);
  part(sword, new THREE.BoxGeometry(0.06, BL - 0.2, 0.05), 0, (BL + 0.16) / 2, 0);     // the fuller ridge down the blade
  const guard = new THREE.Shape([[-0.26, 0.04], [-0.06, 0], [0.06, 0], [0.26, 0.04], [0.28, 0.09], [0.06, 0.05], [-0.06, 0.05], [-0.28, 0.09]].map(([x, y]) => new THREE.Vector2(x, y)));
  part(sword, new THREE.ExtrudeGeometry(guard, { depth: 0.07, bevelEnabled: false }), 0, BL, -0.035);   // wing-swept crossguard
  part(sword, new THREE.CylinderGeometry(0.03, 0.034, 0.2, 10), 0, BL + 0.15, 0);       // grip
  part(sword, new THREE.OctahedronGeometry(0.06), 0, P.y, 0).scale.set(1, 1.3, 0.7);   // pommel
  // fit the sword to the fists: the grip runs through the centre of both hands, the pommel just above the upper one
  knight.updateMatrixWorld(true);
  const fist = (h, m) => { const a = bone(h)?.getWorldPosition(V()), b = bone(m)?.getWorldPosition(V()); return a && b ? a.add(b).multiplyScalar(0.5) : null; };
  const fr = fist('mixamorigRightHand_030', 'mixamorigRightHandMiddle1_039'), fl = fist('mixamorigLeftHand_011', 'mixamorigLeftHandMiddle1_020');
  if (fr && fl) {
    const cxz = fr.clone().add(fl).multiplyScalar(0.5), top = Math.max(fr.y, fl.y) + 0.05;
    sword.position.set(cxz.x, 0, cxz.z); sword.scale.y = top / P.y;                    // stretch so the pommel sits on top of the hands
  } else sword.position.set(P.x, 0, P.z);

  // A Demacian helm over the model's own head: tall and smooth, rising to a crown point, one narrow vertical slit,
  // and swept-back stone wings at the sides. It hides the open visor and crest the original model has.
  const hb = new THREE.Box3();
  const HELMET = ['Object_24', 'Object_26', 'Object_28', 'Object_30', 'Object_32', 'Object_34', 'Object_36'];   // the model's helmet parts (see knights.js)
  knight.traverse(o => { if (HELMET.includes(o.name)) hb.expandByObject(o, true); });
  if (hb.isEmpty()) hb.setFromCenterAndSize(new THREE.Vector3(0, 1.75, 0.02), new THREE.Vector3(0.3, 0.36, 0.32));
  const hs = hb.getSize(V()), hc = hb.getCenter(V());
  // the Demacian great-helm from the concept art (knightHelm), at a man's size
  const helm = knightHelm(THREE, material, new THREE.MeshStandardMaterial({ color: 0x1c1d22, roughness: 0.9 }), 0.172); out.add(helm);   // a little over the model's own helmet, which it hides
  // seated on the head bone and turned with it, so it bows as the head does
  const hq = head.getWorldQuaternion(Q());
  helm.position.copy(head.getWorldPosition(V())).add(new THREE.Vector3(0, -0.08, 0.0).applyQuaternion(hq)); helm.quaternion.copy(hq);

  // A mantle over the shoulders and a long cloak to the ground, open at the front
  const lathe = (pts, a0, a1, seg, folds) => {
    const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg, a0, a1 - a0), p = g.attributes.position, v = V();
    for (let i = 0; i < p.count; i++) {                                                  // soft vertical folds, deeper toward the hem
      v.fromBufferAttribute(p, i); const ph = Math.atan2(v.x, v.z), rr = Math.hypot(v.x, v.z), depth = folds * (1 - v.y / 1.7);
      const k = 1 + depth * Math.sin(ph * 9); p.setXYZ(i, v.x * k, v.y, v.z * k);
    }
    g.computeVertexNormals(); return g;
  };
  const cloth = twoSided(THREE, material);
  const cx = (hb.min.x + hb.max.x) / 2;
  const cloak = new THREE.Mesh(lathe([[0.22, 1.6], [0.38, 1.53], [0.42, 1.3], [0.47, 0.7], [0.53, 0.2], [0.56, 0.0]], 1.05, Math.PI * 2 - 1.05, 44, 0.07), cloth);
  cloak.position.set(cx, 0, -0.06); cloak.castShadow = cloak.receiveShadow = true; out.add(cloak);
  const mantle = new THREE.Mesh(lathe([[0.13, 1.68], [0.3, 1.63], [0.43, 1.5], [0.48, 1.36]], 0.75, Math.PI * 2 - 0.75, 36, 0.025), cloth);
  mantle.position.set(cx, 0, -0.03); mantle.castShadow = true; out.add(mantle);
  return out;
}

export function placeLastGate(THREE, scene, { wallR, circle, box }) {
  const W = wallR, env = scene.userData.env ?? 1;
  const stone = stoneMaterial(THREE, 'marble', { env }), stone2 = stoneMaterial(THREE, 'marble', { env, color: 0xe2ded6 });
  const beamStone = stoneMaterial(THREE, 'marble', { env, color: 0xd2cec6, tile: 3 });
  const walls = stoneMaterial(THREE, 'blocks', { env });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b25c, metalness: 0.85, roughness: 0.35, envMapIntensity: env });
  const glow = new THREE.MeshStandardMaterial({ color: 0x3fd0d4, emissive: 0x23b8c4, emissiveIntensity: 1.4, roughness: 0.3 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x1b8ea0, roughness: 0.85, side: THREE.DoubleSide });
  const add = (geo, mat, x, y, z, { ry = 0, rx = 0, rz = 0, shadow = true } = {}) => {
    const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
    o.castShadow = shadow; o.receiveShadow = true; scene.add(o); return o;
  };
  /** A beam between two points: a box whose long axis runs from a to b. */
  const beam = (a, b, w, d, mat, along) => {                         // along: optional direction for the beam's width (x)
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, len, d), mat);
    o.position.copy(A).add(B).multiplyScalar(0.5);
    const Y = B.clone().sub(A).normalize();
    if (along) {
      const Z = new THREE.Vector3(...along).cross(Y).normalize(), X = Y.clone().cross(Z);
      o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    } else o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Y);
    o.castShadow = o.receiveShadow = true; scene.add(o); return o;
  };
  /** A slab from a to b (centres), its width across the run, kept level sideways. */
  const slab = (a, b, w, h, mat) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B) + 0.12;
    const o = new THREE.Mesh(new THREE.BoxGeometry(len, h, w), mat);
    o.position.copy(A).add(B).multiplyScalar(0.5);
    o.rotation.order = 'YZX';
    o.rotation.y = -Math.atan2(B.z - A.z, B.x - A.x);
    o.rotation.z = Math.atan2(B.y - A.y, Math.hypot(B.x - A.x, B.z - A.z));
    o.castShadow = o.receiveShadow = true; scene.add(o); return o;
  };

  /* ---- The two pylons: tall slabs whose inner faces lean in to form a tall pointed passage; a tracery arch springs
     between their crowns ---- */
  const { outer: O, inner: I, depth: D, height: HT, topOuter: TO, topInner: TI } = PYLON;
  for (const s of [-1, 1]) {
    const pts = [[O, 0], [I, 0], [I, 14], [TI, HT], [TO, HT]];
    const shape = new THREE.Shape((s > 0 ? pts : [...pts].reverse()).map(([x, y]) => new THREE.Vector2(s * x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 1 });
    add(geo, stone, 0, 0, W - D / 2);
    // slanted ribs on both faces, parallel to the outer edge
    for (const face of [1, -1]) for (let k = 0; k < 3; k++) {
      const xb = O - 1.6 - k * 2.6, xt = xb - (O - TO) * (HT - 1.5) / HT, z = W + face * (D / 2 + 0.45);
      beam([s * xb, 0, z], [s * xt, HT - 1.5, z], 0.7, 0.6, stone2);
    }
    add(new THREE.BoxGeometry(O - I + 1.2, 1.6, D + 1.4), stone2, s * (O + I) / 2, 0.8, W);
    box(s * (O + I) / 2, W, O - I + 1, D + 1.6);
    // a stepped cornice crowns the pylon; the arch springs from it
    add(new THREE.BoxGeometry(TO - TI + 0.9, 0.9, D + 0.9), stone2, s * (TO + TI) / 2, HT + 0.45, W);
    add(new THREE.BoxGeometry(TO - TI - 0.6, 0.7, D - 0.6), stone2, s * (TO + TI) / 2, HT + 1.25, W);
    // turquoise banners on the city face, below the walkway
    const z = W - (D / 2 + 0.95);
    add(new THREE.PlaneGeometry(2.4, 11), cloth, s * 9.6, 11.5, z, { ry: Math.PI, shadow: false });
    add(new THREE.BoxGeometry(2.8, 0.25, 0.25), gold, s * 9.6, 17.1, z);
    add(new THREE.BoxGeometry(2.4, 0.3, 0.06), gold, s * 9.6, 6.1, z - 0.02);
  }
  // The pointed arch from one pylon top to the other, with a rose of tracery under its point
  {
    const a = 5.4, t = 1.1, c = 4.2, R = Math.hypot(a + c, 0), rise = 3.2, zA = W + 2.6;   // half-span, band, centre offset
    const side = (r, sgn) => { const th = Math.acos(c / r), out = []; for (let i = 0; i <= 16; i++) { const q = th * i / 16; out.push([sgn * (-c + r * Math.cos(q)), rise + r * Math.sin(q)]); } return out; };
    const outer = side(R, 1), outerL = side(R, -1).reverse(), inner = side(R - t, -1), innerR = side(R - t, 1).reverse();
    const pts = [[a, 0], ...outer, ...outerL, [-a, 0], [-(a - t), 0], ...inner, ...innerR, [a - t, 0]];
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: 1.2, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 1 });
    add(geo, stone2, 0, HT, zA - 0.6);
    const apex = HT + rise + Math.sqrt(R * R - c * c);
    add(new THREE.TorusGeometry(1.5, 0.22, 8, 32), stone2, 0, apex - 3.6, zA);
    for (const e of [-1, 1]) add(new THREE.TorusGeometry(0.85, 0.18, 8, 24), stone2, e * 1.25, apex - 6.0, zA);   // the heart below the rose
    add(new THREE.OctahedronGeometry(0.8), gold, 0, apex + 0.9, zA).scale.set(1, 1.7, 0.5);
    add(new THREE.BoxGeometry(0.4, 1.4, 0.5), stone2, 0, apex - 1.6, zA);   // the rose hangs from the point
  }

  /* ---- The walkways: out from the pylons on slanted pillars, round two curves, each ending at a round tower ---- */
  const paths = [];
  for (const s of [-1, 1]) {
    // The centre line in plan, a half "C" as in the concept art: a straight run out and down from the pylon, a first
    // curve bulging out round the widest point of the square, a second curve turning back in toward the middle, then
    // into a round tower (the city map in Realms of Runeterra, p. 71, shows a tower where each pillared walkway ends).
    // A smooth spline through these points (x for the right side, z as distance in from the wall), sampled every
    // ~1.2 m. The deck falls along the straight run and is level after it.
    const CTRL = [[6, 7.1], [18, 10.6], [29, 14.5], [36, 20.5], [38, 28], [35.5, 37], [29.5, 45], [24, 52], [22, 60], [21.5, 68], [21.5, W - WALK.end]];
    const spline = new THREE.CatmullRomCurve3(CTRL.map(([x, dz]) => new THREE.Vector3(s * x, 0, W - dz)), false, 'centripetal');
    const pts = spline.getSpacedPoints(Math.ceil(spline.getLength() / 1.2));
    const fall = Math.hypot(33 - 6, 15 - 7.1) + 4;                     // the deck reaches its low height just into the first curve
    const path = []; let run = 0;
    pts.forEach((p, i) => {
      if (i) run += p.distanceTo(pts[i - 1]);
      const y = WALK.low + (WALK.top - WALK.low) * Math.pow(1 - Math.min(1, run / fall), 1.4);
      path.push({ x: p.x, z: p.z, y, open: p.z > WALK.end + TOWER.r });  // pillars all the way to the tower
    });
    paths.push(path);

    // deck and parapets along the path
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], ang = Math.atan2(b.z - a.z, b.x - a.x), nx = -Math.sin(ang), nz = Math.cos(ang);
      slab([a.x, a.y, a.z], [b.x, b.y, b.z], WALK.width, 1.1, stone);
      for (const e of [1, -1]) {
        const o = (WALK.width / 2 - 0.3) * e;
        slab([a.x + nx * o, a.y + 1.0, a.z + nz * o], [b.x + nx * o, b.y + 1.0, b.z + nz * o], 0.55, 1.0, stone2);
      }
    }
    // open part: one row of slanted pillars under the deck, evenly spaced along it, round the curve too. Each top sits
    // under the deck; each foot steps inward into the square, square to the walkway. The lean grows smoothly from steep
    // by the gate to wider on the curve, and the reach is lean × height, so the feet trace one smooth line that follows
    // the walkway's curve instead of jumping.
    const open = path.filter(p => p.open), cum = [0];
    for (let i = 1; i < open.length; i++) cum.push(cum[i - 1] + Math.hypot(open[i].x - open[i - 1].x, open[i].z - open[i - 1].z));
    const L = cum[cum.length - 1];
    const sstep = (e0, e1, v) => { const q = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return q * q * (3 - 2 * q); };
    for (let d = 1.6, i = 0; d < L - 0.3; d += WALK.spacing) {
      while (cum[i + 1] < d) i++;
      const a = open[i], b = open[i + 1], seg = cum[i + 1] - cum[i], t = (d - cum[i]) / seg;
      const ux = (b.x - a.x) / seg, uz = (b.z - a.z) / seg;
      const px = a.x + (b.x - a.x) * t, pz = a.z + (b.z - a.z) * t, py = a.y + (b.y - a.y) * t - 0.55;
      const nx = s * uz, nz = -s * ux;                                             // the side facing the square
      const lean = 0.24 + 0.3 * sstep(0, 0.55, d / L), off = py * Math.tan(lean);
      const fx = px + nx * off, fz = pz + nz * off;
      if (Math.abs(fx) < 5.5) continue;                                            // keep the passage clear
      beam([fx, 0, fz], [px, py, pz], 0.75, 0.95, beamStone, [ux, 0, uz]);
      add(new THREE.BoxGeometry(1.5, 0.5, 1.7), stone2, fx, 0.25, fz, { ry: -Math.atan2(nz, nx) });
      circle(fx, fz, 0.9);
    }
    // the tower at the walkway's end: a round keep of cut stone, a string course where the deck meets it, a doorway
    // onto the deck, a crenellated crown and a turquoise banner
    const { r: TR, h: TH } = TOWER, tx = s * 21.5, tz = WALK.end;
    add(new THREE.CylinderGeometry(TR + 0.6, TR + 0.9, 1.2, 32), stone2, tx, 0.6, tz);                 // plinth
    add(new THREE.CylinderGeometry(TR, TR + 0.15, TH, 32), walls, tx, TH / 2, tz);                     // shaft
    for (const y of [WALK.low + 1.6, TH - 4]) add(new THREE.TorusGeometry(TR + 0.08, 0.22, 6, 40), stone2, tx, y, tz, { rx: Math.PI / 2 });
    add(new THREE.CylinderGeometry(TR + 0.7, TR, 1.2, 32), stone2, tx, TH + 0.6, tz);                  // corbelled crown
    for (let k = 0; k < 10; k++) {                                                                     // merlons
      const a = k / 10 * Math.PI * 2;
      add(new THREE.BoxGeometry(1.3, 1.5, 0.8), stone2, tx + Math.sin(a) * (TR + 0.35), TH + 1.95, tz + Math.cos(a) * (TR + 0.35), { ry: a });
    }
    add(new THREE.BoxGeometry(1.8, 2.8, 0.6), new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1 }), tx, WALK.low + 1.6 + 1.4, tz + TR - 0.2);   // the door onto the deck
    add(new THREE.CylinderGeometry(0.12, 0.12, 5, 8), gold, tx, TH + 4.5, tz);
    add(new THREE.PlaneGeometry(2.2, 1.4), cloth, tx + s * 1.15, TH + 6.2, tz, { shadow: false });
    add(new THREE.PlaneGeometry(1.8, 7), cloth, tx - s * (TR + 0.05), TH - 7, tz, { ry: -s * Math.PI / 2, shadow: false });
    circle(tx, tz, TR + 1);
  }

  /* ---- The square's ground: a paved road from the gate into the city, lawns either side up to the walkways ---- */
  {
    // inside 14 m wide; through the passage as wide as it is; outside 11 m, between the causeway's pillars, out to its end
    const ROAD_HALF = 7, OUT_HALF = 5.5, z0 = W - D / 2 - 0.4, z1 = WALK.end - TOWER.r - 2, zo = W + D / 2 + 0.4, z2 = W + 52;
    const flat = (shape, mat, y) => { const o = add(new THREE.ShapeGeometry(shape, 24), mat, 0, y, 0, { shadow: false }); o.rotation.x = -Math.PI / 2; return o; };
    const R0 = ROAD_HALF, R1 = I, R2 = OUT_HALF;
    const road = new THREE.Shape([[-R0, z1], [R0, z1], [R0, z0], [R1, z0], [R1, zo], [R2, zo], [R2, z2], [-R2, z2], [-R2, zo], [-R1, zo], [-R1, z0], [-R0, z0]]
      .map(([x, z]) => new THREE.Vector2(x, -z)));
    flat(road, stoneMaterial(THREE, 'blocks', { env, color: 0xf0ece4, tile: 2.4 }), 0.11);
    const lawn = grassMaterial(THREE, { env });
    paths.forEach(path => {
      const s = Math.sign(path[path.length - 1].x), edge = path.filter(p => Math.abs(p.x) > ROAD_HALF + 0.5);
      const pts = [[s * (ROAD_HALF + 0.4), z0], ...edge.map(p => [p.x, p.z]), [s * (ROAD_HALF + 0.4), WALK.end]];
      flat(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))), lawn, 0.1);
      // a kerb of pale stone along the road's edge
      add(new THREE.BoxGeometry(0.5, 0.22, z0 - z1), stone2, s * (ROAD_HALF + 0.15), 0.12, (z0 + z1) / 2, { shadow: false });
      add(new THREE.BoxGeometry(0.5, 0.22, z2 - zo), stone2, s * (OUT_HALF + 0.15), 0.12, (zo + z2) / 2, { shadow: false });
    });
  }

  /* ---- Two glowing markers at the road's edge inside the gate ---- */
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.7, 0.9, 1.2, 8), stone2, s * 6.5, 0.6, W - 22);
    add(new THREE.OctahedronGeometry(0.55), glow, s * 6.5, 1.9, W - 22, { shadow: false }).scale.set(1, 1.8, 1);
    circle(s * 6.5, W - 22, 1.1);
  }

  /* ---- The causeway outside: slender pillars with gold points and turquoise pennants ---- */
  for (let z = W + 19; z < W + 46; z += 6) for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(1.4, 0.8, 1.4), stone2, s * 6.8, 0.4, z);
    add(new THREE.BoxGeometry(0.85, 7, 0.85), stone, s * 6.8, 4.3, z);
    add(new THREE.ConeGeometry(0.42, 1.6, 4), gold, s * 6.8, 8.6, z, { ry: Math.PI / 4 });
    add(new THREE.PlaneGeometry(0.7, 2.6), cloth, s * 6.8 - s * 0.44, 5.2, z, { ry: Math.PI / 2, shadow: false });
    circle(s * 6.8, z, 0.9);
  }

  /* ---- The two guardians before the pylons, facing the causeway, heads bowed to those who enter ---- */
  const gz = W + D / 2 + 4.6;
  const plinthMat = stone2;
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(10, GUARD.plinth, 11), plinthMat, s * 9.2, GUARD.plinth / 2, gz + 0.6); box(s * 9.2, gz + 0.6, 10.2, 11.2); }
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(new URL('../../models/demacian-knight.glb', import.meta.url).href, gltf => {
    const statueMat = stoneMaterial(THREE, 'marble', { env, tile: 3 });   // the same stone as the gate
    for (const s of [-1, 1]) {
      const holder = new THREE.Group(), knight = SkeletonUtils.clone(gltf.scene); holder.add(knight);
      knight.traverse(o => { if (o.isMesh) { o.material = statueMat; o.castShadow = o.receiveShadow = true; o.frustumCulled = false; } });
      holder.add(poseGuardian(THREE, knight, gltf.animations[0], statueMat));          // posed at human size first
      holder.position.set(s * 9.2, GUARD.plinth, gz); holder.rotation.y = -s * 0.12;   // turned a little toward the road
      holder.scale.setScalar(GUARD.height / KNIGHT_H); scene.add(holder);
    }
  }, undefined, err => console.warn('Gate guardians did not load', err));
}
