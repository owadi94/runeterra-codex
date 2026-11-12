// Demacian knights. Model: "Medieval Knight | Sculpture | Game ready" by by__Rx
// (https://sketchfab.com/3d-models/6cdd055b4afa41eb9360dbbfe75c7f10), licensed CC BY 4.0.
// Our changes: compressed for the web, recoloured from black steel to Demacian silver, gold and blue, and given a spear.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const HEIGHT = 1.95;                                          // metres, helmet crest to boot

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
 * posts: [{ x, z, face, info }]
 */
export function makeKnights(THREE, scene, posts, { spearWood, spearSteel }) {
  const people = posts.map(({ x, z, face, info }) => {
    const mesh = new THREE.Group(); mesh.position.set(x, 0, z); mesh.rotation.y = face; mesh.userData.person = info;
    scene.add(mesh);
    return { mesh, mixer: null, update(dt) { this.mixer?.update(dt); } };
  });

  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(new URL('../../models/demacian-knight.glb', import.meta.url).href, gltf => {
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
      knight.scale.setScalar(HEIGHT / h);
      knight.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(knight, true);
      knight.position.y -= box2.min.y - p.mesh.position.y;
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

  return people;
}
