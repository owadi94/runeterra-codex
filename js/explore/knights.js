// Demacian knights. Model: "Medieval Knight | Sculpture | Game ready" by by__Rx
// (https://sketchfab.com/3d-models/6cdd055b4afa41eb9360dbbfe75c7f10), licensed CC BY 4.0.
// Our changes: compressed for the web, recoloured from black steel to Demacian silver, gold and blue, and given a spear.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const HEIGHT = 1.95;                                          // metres, helmet crest to boot
/* Women of the Vanguard wear the same plate without the helmet: a sculpted head and hair from townswoman-heads.glb
   (Pocolov Hair, CC BY 4.0) take its place. */
const HELMET = new Set(['Object_24', 'Object_26', 'Object_28', 'Object_30', 'Object_32', 'Object_34', 'Object_36']);
const HAIRS = ['hair07', 'hair15', 'hair17'], HAIR_COLORS = [0x2a1d14, 0x4a2f1c, 0x8c3a1c, 0xd8b56a, 0x161616, 0xa4502a, 0xc9c9cc];
const SKINS = [0xf1c9a5, 0xe2b08a, 0xc68b62, 0x9a6440, 0x6e432a];
const HEAD_FIT = { scale: 0.86, dy: -0.02, dz: 0.03 };    // the head inside where the helmet was
const EYES = [[-0.135, 0.02, 0.291], [0.135, 0.02, 0.291]];

/** Dark steel -> polished silver, bronze trim -> gold, leather -> Demacian blue. Works on the colour texture's pixels. */
export function demacian(THREE, tex) {
  const img = tex.image, W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, W, H), p = id.data;
  for (let k = 0; k < p.length; k += 4) {
    const R = p[k], G = p[k + 1], B = p[k + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B), L = (R + G + B) / 3, sat = mx ? (mx - mn) / mx : 0;
    const warm = R > B + 6 && R >= G - 4;
    if (warm && sat > 0.3 && L >= 70) {                      // bronze trim
      const v = Math.min(1, L / 140); p[k] = 255 * Math.min(1, 0.6 + v * 0.45); p[k + 1] = 200 * Math.min(1, 0.5 + v * 0.55); p[k + 2] = 80 * v;
    } else if (warm && sat > 0.16) {                          // leather and cloth
      const v = Math.min(1, L / 120); p[k] = 26 + 40 * v; p[k + 1] = 52 + 70 * v; p[k + 2] = 120 + 115 * v;
    } else {                                                   // steel, keeping its light and dark
      const v = Math.min(255, L * 1.45 + 52); p[k] = v * 0.94; p[k + 1] = v * 0.97; p[k + 2] = v;
    }
  }
  g.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(c); t.flipY = tex.flipY; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/**
 * Knights standing at their posts. Returns people for the city right away; each fills in when the model arrives.
 * posts: [{ x, z, face, info, female }]
 */
export function makeKnights(THREE, scene, posts, { spearWood, spearSteel }) {
  const people = posts.map(({ x, z, face, info }) => {
    const mesh = new THREE.Group(); mesh.position.set(x, 0, z); mesh.rotation.y = face; mesh.userData.person = info;
    scene.add(mesh);
    return { mesh, mixer: null, update(dt) { this.mixer?.update(dt); } };
  });

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const heads = posts.some(p => p.female) ? loader.loadAsync(new URL('../../models/townswoman-heads.glb', import.meta.url).href).catch(() => null) : null;
  loader.load(new URL('../../models/demacian-knight.glb', import.meta.url).href, gltf => {
    const recoloured = new Map();
    gltf.scene.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m.map && !recoloured.has(m.map)) recoloured.set(m.map, demacian(THREE, m.map));
      if (m.map) m.map = recoloured.get(m.map);
      m.metalness = Math.max(m.metalness, 0.75); m.envMapIntensity = scene.userData.env ?? 1; m.needsUpdate = true;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;   // skinned: its bounds move with the pose
    });
    const clip = gltf.animations[0];

    people.forEach((p, i) => {
      const knight = SkeletonUtils.clone(gltf.scene);
      p.mesh.add(knight);
      p.mixer = new THREE.AnimationMixer(knight);
      if (clip) { const a = p.mixer.clipAction(clip); a.time = i * 0.7; a.play(); }
      p.mixer.update(0);
      // Size and stand on the ground
      knight.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(knight, true), h = box.max.y - box.min.y;
      const female = posts[i].female;
      knight.scale.setScalar((female ? 1.84 : HEIGHT) / h);
      if (female) knight.scale.x *= 0.93;                         // a little narrower in the shoulders
      knight.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(knight, true);
      knight.position.y -= box2.min.y - p.mesh.position.y;
      if (female && heads) unhelm(knight, i);
      // A spear, upright in the right hand; attach() keeps it where it is placed while the hand moves with the pose
      knight.updateMatrixWorld(true);
      const hand = knight.getObjectByName('mixamorigRightHand_030') || knight.getObjectByName('mixamorig:RightHand_030');
      if (hand) {
        const at = hand.getWorldPosition(new THREE.Vector3());
        const spear = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.5, 8), spearWood); shaft.position.y = 1.25;
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 8), spearSteel); head.position.y = 2.65;
        spear.add(shaft, head); spear.traverse(o => { o.castShadow = true; });
        spear.position.set(at.x, p.mesh.position.y, at.z); scene.add(spear); hand.attach(spear);
      }
    });
  }, undefined, err => console.warn('Knight model did not load', err));

  /** Take off the helmet and fit a woman's head and hair, held by the head bone so it moves with the pose. */
  function unhelm(knight, i) {
    knight.updateMatrixWorld(true);
    const helm = new THREE.Box3();
    knight.traverse(o => { if (o.isMesh && HELMET.has(o.name)) { helm.union(new THREE.Box3().setFromObject(o, true)); o.visible = false; } });
    const bone = knight.getObjectByName('mixamorigHead_06') || knight.getObjectByName('mixamorig:Head_06');
    heads.then(g => {
      if (!g || !bone) return;
      const size = helm.max.y - helm.min.y, centre = helm.getCenter(new THREE.Vector3());
      const head = new THREE.Group();
      const skin = new THREE.MeshStandardMaterial({ color: SKINS[(i * 2) % SKINS.length], roughness: 0.6 });
      const h = g.scene.getObjectByName('head').clone(); h.material = skin; head.add(h);
      const src = g.scene.getObjectByName(HAIRS[i % HAIRS.length]), hair = src.clone();
      hair.material = src.material.clone(); hair.material.color.set(HAIR_COLORS[(i * 3) % HAIR_COLORS.length]).multiplyScalar(2.4);
      hair.material.alphaTest = 0.35; hair.material.side = THREE.DoubleSide; head.add(hair);
      const white = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.4 }), iris = new THREE.MeshStandardMaterial({ color: [0x4a6fa5, 0x5a3b1e, 0x3f6b3a][i % 3], roughness: 0.3 });
      EYES.forEach(([x, y, z]) => {
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), white); w.position.set(x, y, z - 0.03); w.scale.set(1, 0.7, 0.5); head.add(w);
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), iris); c.position.set(x, y + 0.002, z - 0.004); c.scale.set(1, 1, 0.45); head.add(c);
      });
      head.traverse(o => { if (o.isMesh) o.castShadow = true; });
      head.scale.setScalar(size * HEAD_FIT.scale);
      head.position.set(centre.x, centre.y + size * HEAD_FIT.dy, centre.z + size * HEAD_FIT.dz);
      head.quaternion.copy(knight.getWorldQuaternion(new THREE.Quaternion()));
      scene.add(head); bone.attach(head);
    });
  }

  return people;
}
