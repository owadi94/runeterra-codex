// Sculpted props in Demacian dress (credited on the About page, all CC BY 4.0):
//   models/demacian-tent.glb  "Medieval Market / Tent_Prop_02" by neslihancakmak: royal-blue roof, cream walls, gold finials,
//                             blue table cloth (recoloured by us), slimmed from 869,000 to about 52,000 triangles.
//   models/demacian-flag.glb  "Medieval Flag" by sousinho: its cloth wears our own winged banner.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const url = file => new URL(`../../models/${file}`, import.meta.url).href;

/** Load a model once, then place a copy at each spot: [x, z, facing]. size: target height in metres. */
function place(THREE, scene, file, spots, size, dress = () => {}) {
  if (!spots.length) return;
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(url(file), g => {
    const model = g.scene;
    model.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.envMapIntensity = scene.userData.env ?? 1; });
      dress(o);
    });
    const box = new THREE.Box3().setFromObject(model), s = size / (box.max.y - box.min.y);
    const centre = box.getCenter(new THREE.Vector3());
    spots.forEach(([x, z, ry]) => {
      const holder = new THREE.Group(), copy = model.clone();
      copy.scale.setScalar(s); copy.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
      holder.add(copy); holder.position.set(x, 0, z); holder.rotation.y = ry; scene.add(holder);
    });
  }, undefined, err => console.warn(`${file} did not load`, err));
}

export function demacianProps(THREE, scene, { tents = [], flags = [], banner }) {
  const cloth = banner.clone(); cloth.center.set(0.5, 0.5); cloth.rotation = Math.PI / 2; cloth.needsUpdate = true;   // the flag's cloth is mapped sideways
  place(THREE, scene, 'demacian-tent.glb', tents, 4.4);
  place(THREE, scene, 'demacian-flag.glb', flags, 6.2, o => {
    const m = o.material;
    if (/flag/i.test(m.name)) { o.material = m.clone(); o.material.map = cloth; o.material.color.set(0xffffff); o.material.side = THREE.DoubleSide; o.material.metalness = 0; o.material.roughness = 0.85; }
    else { o.material.metalness = 0.5; o.material.roughness = 0.4; }
  });
}
