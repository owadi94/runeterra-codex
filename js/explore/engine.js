// Explore engine: walk through a city in 3D. Each city supplies a builder (see demacia.js).
// three.js is loaded only when a city is opened, so the rest of the site stays light.
import { esc, reduceMotion, toast } from '../ui.js';
import { progress, save, addXP } from '../state.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const EYE = 1.7, WALK = 9, RUN = 17, NEAR = 9;

const TIMES = {
  day:    { label: 'Day',    top: 0x4f93d8, bottom: 0xd6ebf7, sun: 0xfff3dd, sunI: 3.2, hemi: 1.1, pos: [120, 220, 80], lamps: 0 },
  sunset: { label: 'Sunset', top: 0x33467e, bottom: 0xf3a35b, sun: 0xffb36b, sunI: 2.4, hemi: 0.7, pos: [-220, 60, -60], lamps: 0.6 },
  night:  { label: 'Night',  top: 0x030916, bottom: 0x15233f, sun: 0x9fb4ff, sunI: 0.45, hemi: 0.22, pos: [80, 160, -120], lamps: 1 },
};
const ORDER = ['day', 'sunset', 'night'];

/**
 * Open a city inside `host`. Returns a function that closes it and frees everything.
 * @param {HTMLElement} host
 * @param {object} city   entry from data/cities.js
 * @param {(THREE, scene, tools) => object} build  the city's builder
 */
export async function openCity(host, city, build) {
  host.innerHTML = `<div class="x-loading"><p class="t-body">Building ${esc(city.name)}…</p></div>`;
  const THREE = await import(THREE_URL);
  let alive = true;

  /* ---- Renderer, scene, camera ---- */
  host.innerHTML = '';
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.className = 'x-canvas';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 1600);
  camera.rotation.order = 'YXZ';

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, h),1.0); }',
  }));
  scene.add(sky);
  scene.fog = new THREE.Fog(0xd6ebf7, 140, 620);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x5d6b3c, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 700 });
  sun.shadow.bias = -0.0004;
  scene.add(hemi, sun, sun.target);

  /* ---- The city ---- */
  const world = build(THREE, scene, { seeded, people: city.people });
  const player = { x: world.spawn.x, z: world.spawn.z, yaw: world.spawn.yaw, pitch: -0.04 };
  if (new URLSearchParams(location.search).has('debug')) window.codexCity = { player, world, frames: 0 };

  /* Gold beams mark landmarks; they fade once discovered. */
  const found = (progress.explore ||= {})[city.id] ||= {};
  const beams = city.landmarks.map(l => {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 26, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xf0d48a, transparent: true, opacity: 0.35, depthWrite: false }));
    beam.position.y = 13;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshStandardMaterial({ color: 0xc89b3c, emissive: 0xc89b3c, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.3 }));
    gem.position.y = 3.2;
    g.add(beam, gem); g.position.set(l.x, 0, l.z);
    scene.add(g);
    return { l, g, beam, gem };
  });
  const paintBeams = () => beams.forEach(b => { b.beam.material.opacity = found[b.l.id] ? 0.08 : 0.35; });
  paintBeams();

  /* ---- Interface ---- */
  const ui = document.createElement('div');
  ui.className = 'x-ui';
  ui.innerHTML = `
    <div class="x-top">
      <div class="x-title panel"><span class="t-label">${esc(world.regionName)}</span><b>${esc(city.name)}</b><span class="t-sm" id="xFound"></span></div>
      <div class="x-btns">
        <button class="btn secondary" id="xTour">Guided tour</button>
        <button class="btn secondary" id="xTime">Day</button>
        <button class="btn secondary" id="xSound" aria-pressed="false">Sound off</button>
        <a class="btn secondary" href="#/explore">Leave</a>
      </div>
    </div>
    <canvas class="x-mini panel" width="180" height="180" aria-label="Minimap"></canvas>
    <div class="x-card panel" id="xCard" hidden></div>
    <div class="x-say panel" id="xSay" hidden></div>
    <p class="x-hint t-sm" id="xHint">W A S D or arrows to walk · drag to look · Shift to run · click people to talk</p>
    <div class="x-joy" id="xJoy" aria-hidden="true"><i></i></div>
    <div class="x-start" id="xStart"><div class="panel">
      <span class="t-label">${esc(world.regionName)}</span><h2 class="t-1">${esc(city.name)}</h2>
      <p class="t-body">${esc(city.blurb)}</p>
      <p class="t-sm">Find all ${city.landmarks.length} landmarks (the gold lights) to learn the city's story. Walk with W A S D or the arrow keys and drag to look around. On a phone, use the stick in the corner.</p>
      <div class="row"><button class="btn" id="xGo">Enter the city</button><button class="btn secondary" id="xGoTour">Take the guided tour</button></div>
    </div></div>`;
  host.appendChild(ui);
  const $ = sel => ui.querySelector(sel);
  const updateFound = () => { $('#xFound').textContent = `${Object.keys(found).length} of ${city.landmarks.length} landmarks found`; };
  updateFound();

  let cardTimer, sayTimer;
  function showCard(l) {
    const card = $('#xCard');
    card.innerHTML = `<span class="t-label">${l.kind === 'lore' ? 'Lore' : 'Life in the city'}</span><h3 class="t-2">${esc(l.name)}</h3><p class="t-body">${esc(l.text)}</p>`;
    card.hidden = false;
    clearTimeout(cardTimer); cardTimer = setTimeout(() => { card.hidden = true; }, 9000);
  }
  function say(person) {
    const box = $('#xSay');
    box.innerHTML = `<span class="t-label">${esc(person.role)}</span><p>“${esc(person.line)}”</p>`;
    box.hidden = false;
    clearTimeout(sayTimer); sayTimer = setTimeout(() => { box.hidden = true; }, 6000);
  }

  /* ---- Time of day ---- */
  let timeIdx = 0;
  function setTime(key) {
    const t = TIMES[key];
    sky.material.uniforms.top.value.setHex(t.top);
    sky.material.uniforms.bottom.value.setHex(t.bottom);
    scene.fog.color.setHex(t.bottom);
    sun.color.setHex(t.sun); sun.intensity = t.sunI; hemi.intensity = t.hemi;
    sun.position.set(...t.pos);
    (world.lamps || []).forEach(m => { m.emissiveIntensity = t.lamps * 2.2; });
    renderer.toneMappingExposure = key === 'night' ? 1.25 : 1;
    $('#xTime').textContent = t.label;
  }
  setTime('day');
  $('#xTime').onclick = () => { timeIdx = (timeIdx + 1) % ORDER.length; setTime(ORDER[timeIdx]); };

  /* ---- Sound: river and wind made from filtered noise (no audio files) ---- */
  let audio = null;
  function toggleSound() {
    const btn = $('#xSound');
    if (audio) { audio.ctx.close(); audio = null; btn.textContent = 'Sound off'; btn.setAttribute('aria-pressed', 'false'); return; }
    const ctx = new AudioContext(), len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const voice = (type, freq, q) => { const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; src.connect(f).connect(g).connect(ctx.destination); src.start(); return g; };
    audio = { ctx, river: voice('lowpass', 520, 0.7), wind: voice('bandpass', 380, 0.4) };
    btn.textContent = 'Sound on'; btn.setAttribute('aria-pressed', 'true');
  }
  $('#xSound').onclick = toggleSound;

  /* ---- Controls ---- */
  const keys = new Set();
  const stopTour = () => { if (tour) { tour = null; $('#xTour').textContent = 'Guided tour'; } };
  const onKey = e => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
      if (e.type === 'keydown') { keys.add(k); if (k !== 'shift') stopTour(); } else keys.delete(k);
      if (k.startsWith('arrow')) e.preventDefault();
    }
  };
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);
  const clearKeys = () => keys.clear();
  addEventListener('blur', clearKeys);

  const canvas = renderer.domElement;
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
    player.yaw -= dx * 0.0042; player.pitch = Math.max(-0.9, Math.min(0.6, player.pitch - dy * 0.0035));
    if (drag.moved > 6) stopTour();
  });
  canvas.addEventListener('pointerup', e => {
    if (drag && drag.moved < 6) talkAt(e);
    drag = null;
  });

  /* Touch stick */
  const joy = $('#xJoy'), stick = { x: 0, y: 0, id: null };
  joy.addEventListener('pointerdown', e => { stick.id = e.pointerId; joy.setPointerCapture(e.pointerId); moveStick(e); stopTour(); });
  joy.addEventListener('pointermove', e => { if (stick.id === e.pointerId) moveStick(e); });
  const endStick = () => { stick.id = null; stick.x = stick.y = 0; joy.firstElementChild.style.transform = ''; };
  joy.addEventListener('pointerup', endStick); joy.addEventListener('pointercancel', endStick);
  function moveStick(e) {
    const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let x = (e.clientX - cx) / (r.width / 2), y = (e.clientY - cy) / (r.height / 2); const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    stick.x = x; stick.y = y; joy.firstElementChild.style.transform = `translate(${x * 30}px,${y * 30}px)`;
  }

  /* Click a person to hear them */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function talkAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(world.people.map(p => p.mesh), true)[0];
    if (!hit || hit.distance > 40) return;
    let o = hit.object; while (o && !o.userData.person) o = o.parent;
    if (o) say(o.userData.person);
  }

  /* ---- Guided tour: glide along the city's route, pausing at each landmark ---- */
  let tour = null;
  function startTour() {
    tour = { i: 0, wait: 0 };
    player.x = world.tour[0].x; player.z = world.tour[0].z;
    $('#xTour').textContent = 'Stop tour';
  }
  $('#xTour').onclick = () => (tour ? stopTour() : startTour());

  /* ---- Start screen ---- */
  const begin = withTour => { $('#xStart').hidden = true; if (withTour) startTour(); canvas.focus?.(); };
  $('#xGo').onclick = () => begin(false);
  $('#xGoTour').onclick = () => begin(true);

  /* ---- Minimap ---- */
  const mini = ui.querySelector('.x-mini'), mctx = mini.getContext('2d');
  const MAP_R = world.mapRadius, toMini = (x, z) => [90 + (x / MAP_R) * 86, 90 + (z / MAP_R) * 86];
  function drawMini() {
    mctx.clearRect(0, 0, 180, 180);
    world.drawMinimap(mctx, toMini);
    beams.forEach(b => { const [x, y] = toMini(b.l.x, b.l.z); mctx.fillStyle = found[b.l.id] ? '#5b5a56' : '#f0d48a'; mctx.beginPath(); mctx.arc(x, y, 3.2, 0, 7); mctx.fill(); });
    const [px, py] = toMini(player.x, player.z);
    mctx.save(); mctx.translate(px, py); mctx.rotate(-player.yaw);
    mctx.fillStyle = '#0ac8b9'; mctx.beginPath(); mctx.moveTo(0, -7); mctx.lineTo(5, 5); mctx.lineTo(0, 2); mctx.lineTo(-5, 5); mctx.closePath(); mctx.fill(); mctx.restore();
  }

  /* ---- Resize ---- */
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  /* ---- Main loop ---- */
  let last = performance.now(), raf = 0, nearId = null;
  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;   // capped so a stalled tab doesn't jump
    if (window.codexCity) window.codexCity.frames++;

    if (tour) runTour(dt); else walk(dt);

    camera.position.set(player.x, EYE + Math.sin(now / 260) * (moving ? 0.05 : 0), player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    sun.target.position.set(player.x, 0, player.z);
    sun.position.set(player.x + TIMES[ORDER[timeIdx]].pos[0], TIMES[ORDER[timeIdx]].pos[1], player.z + TIMES[ORDER[timeIdx]].pos[2]);
    sky.position.copy(camera.position);

    world.people.forEach(p => p.update(dt, now));
    beams.forEach(b => { b.gem.rotation.y += dt * 1.4; b.gem.position.y = 3.2 + Math.sin(now / 500 + b.l.x) * 0.3; });
    checkLandmarks();
    if (audio) {
      const d = Math.abs(player.z - world.river.z);
      audio.river.gain.setTargetAtTime(Math.max(0, 0.5 - d / 120), audio.ctx.currentTime, 0.3);
      audio.wind.gain.setTargetAtTime(0.06 + (Math.hypot(player.x, player.z) > world.mapRadius * 0.25 ? 0.06 : 0), audio.ctx.currentTime, 0.5);
    }
    drawMini();
    renderer.render(scene, camera);
  }
  let moving = false;
  function walk(dt) {
    let f = 0, s = 0;
    if (keys.has('w') || keys.has('arrowup')) f += 1;
    if (keys.has('s') || keys.has('arrowdown')) f -= 1;
    if (keys.has('a')) s -= 1;
    if (keys.has('d')) s += 1;
    if (keys.has('arrowleft')) player.yaw += dt * 1.9;
    if (keys.has('arrowright')) player.yaw -= dt * 1.9;
    f += -stick.y; player.yaw -= stick.x * dt * 1.6;
    const len = Math.hypot(f, s); moving = len > 0.05;
    if (!moving) return;
    const speed = (keys.has('shift') ? RUN : WALK) * dt / Math.max(1, len);
    const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
    const dx = (-sin * f + cos * s) * speed, dz = (-cos * f - sin * s) * speed;
    if (!world.blocked(player.x + dx, player.z)) player.x += dx;
    if (!world.blocked(player.x, player.z + dz)) player.z += dz;
  }
  function runTour(dt) {
    const p = world.tour[tour.i];
    if (!p) { stopTour(); return; }
    const dx = p.x - player.x, dz = p.z - player.z, dist = Math.hypot(dx, dz);
    moving = dist > 0.5;
    const wantYaw = Math.atan2(-dx, -dz);
    let diff = wantYaw - player.yaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.yaw += diff * Math.min(1, dt * 2.5);
    player.pitch += (-0.05 - player.pitch) * Math.min(1, dt * 2);
    if (tour.wait > 0) { tour.wait -= dt; if (tour.wait <= 0) tour.i++; return; }
    if (dist < 0.6) { if (p.stop) tour.wait = reduceMotion ? 7 : 6; else tour.i++; return; }
    const step = Math.min(dist, 7.5 * dt);
    player.x += (dx / dist) * step; player.z += (dz / dist) * step;
  }
  function checkLandmarks() {
    let near = null;
    for (const b of beams) if (Math.hypot(b.l.x - player.x, b.l.z - player.z) < NEAR) { near = b.l; break; }
    if (near && near.id !== nearId) {
      showCard(near);
      if (!found[near.id]) {
        found[near.id] = true; save(); addXP(10); paintBeams(); updateFound();
        if (Object.keys(found).length === city.landmarks.length) { addXP(50); toast(`You explored all of ${city.name}`); }
      }
    }
    nearId = near ? near.id : null;
  }
  raf = requestAnimationFrame(frame);

  /* ---- Close: stop everything and free the GPU ---- */
  return function close() {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('blur', clearKeys);
    ro.disconnect();
    clearTimeout(cardTimer); clearTimeout(sayTimer);
    if (audio) audio.ctx.close();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); });
    renderer.dispose();
    host.innerHTML = '';
  };
}

/** Repeatable random numbers, so a city looks the same on every visit. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
