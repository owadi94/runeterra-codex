// Procedural textures painted on canvases: no image files to download, and every texture is our own.
// Each function returns { map, bump } (bump is a greyscale height map for surface relief).

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function noise(g, w, h, amount, alpha = 0.08) {
  for (let i = 0; i < amount; i++) {
    g.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${alpha * Math.random()})` : `rgba(255,255,255,${alpha * Math.random()})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
}
function tex(THREE, c, repeat = [1, 1], color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cut stone blocks with mortar lines (walls, towers). */
export function stoneBlocks(THREE, base = [236, 230, 218], repeat = [1, 1]) {
  const W = 512, H = 512, [c, g] = canvas(W, H), [b, bg] = canvas(W, H);
  g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, W, H);
  bg.fillStyle = '#fff'; bg.fillRect(0, 0, W, H);
  const rows = 8, rh = H / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -40 : 0;
    while (x < W) {
      const bw = 70 + Math.random() * 60, v = (Math.random() - 0.5) * 18;
      g.fillStyle = `rgb(${base.map(ch => Math.max(0, Math.min(255, ch + v)))})`;
      g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
      bg.fillStyle = `rgb(${200 + Math.random() * 40},${200 + Math.random() * 40},${200 + Math.random() * 40})`; bg.fillRect(x + 3, r * rh + 3, bw - 6, rh - 6);
      x += bw;
    }
    g.fillStyle = 'rgba(90,80,70,.35)'; g.fillRect(0, r * rh, W, 2);
    bg.fillStyle = '#222'; bg.fillRect(0, r * rh, W, 3);
  }
  noise(g, W, H, 9000, 0.06);
  return { map: tex(THREE, c, repeat), bump: tex(THREE, b, repeat, false) };
}

/** Overlapping roof tiles, scalloped, in slate blue. */
export function roofTiles(THREE, base = [58, 92, 140], repeat = [1, 1]) {
  const W = 256, H = 256, [c, g] = canvas(W, H), [b, bg] = canvas(W, H);
  g.fillStyle = `rgb(${base.map(v => v - 20)})`; g.fillRect(0, 0, W, H);
  bg.fillStyle = '#000'; bg.fillRect(0, 0, W, H);
  const rows = 8, rh = H / rows, tw = 32;
  for (let r = 0; r < rows; r++) for (let i = -1; i < W / tw + 1; i++) {
    const x = i * tw + (r % 2) * (tw / 2), y = r * rh, v = (Math.random() - 0.5) * 22;
    const grad = g.createLinearGradient(0, y, 0, y + rh);
    grad.addColorStop(0, `rgb(${base.map(ch => ch + v + 18)})`); grad.addColorStop(1, `rgb(${base.map(ch => ch + v - 18)})`);
    g.fillStyle = grad; g.beginPath(); g.moveTo(x, y); g.lineTo(x + tw, y); g.lineTo(x + tw, y + rh * 0.7); g.quadraticCurveTo(x + tw / 2, y + rh * 1.15, x, y + rh * 0.7); g.closePath(); g.fill();
    const bgr = bg.createLinearGradient(0, y, 0, y + rh); bgr.addColorStop(0, '#333'); bgr.addColorStop(1, '#fff');
    bg.fillStyle = bgr; bg.beginPath(); bg.moveTo(x, y); bg.lineTo(x + tw, y); bg.lineTo(x + tw, y + rh * 0.7); bg.quadraticCurveTo(x + tw / 2, y + rh * 1.15, x, y + rh * 0.7); bg.closePath(); bg.fill();
  }
  noise(g, W, H, 2500, 0.07);
  return { map: tex(THREE, c, repeat), bump: tex(THREE, b, repeat, false) };
}

/** Rounded cobblestones for streets and the plaza. */
export function cobbles(THREE, base = [214, 205, 188], repeat = [1, 1]) {
  const W = 512, H = 512, [c, g] = canvas(W, H), [b, bg] = canvas(W, H);
  g.fillStyle = `rgb(${base.map(ch => ch - 34)})`; g.fillRect(0, 0, W, H);
  bg.fillStyle = '#000'; bg.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 7 + Math.random() * 7, v = (Math.random() - 0.5) * 18;
    g.fillStyle = `rgb(${base.map(ch => ch + v)})`; g.beginPath(); g.ellipse(x, y, r, r * (0.7 + Math.random() * 0.3), Math.random() * 3, 0, 7); g.fill();
    const gr = bg.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#222');
    bg.fillStyle = gr; bg.beginPath(); bg.arc(x, y, r, 0, 7); bg.fill();
  }
  noise(g, W, H, 6000, 0.06);
  return { map: tex(THREE, c, repeat), bump: tex(THREE, b, repeat, false) };
}

/** Grass with blades of colour variation. */
export function grass(THREE, repeat = [1, 1]) {
  const W = 256, H = 256, [c, g] = canvas(W, H);
  g.fillStyle = '#6b9447'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    const v = Math.random();
    g.strokeStyle = v < 0.33 ? 'rgba(92,135,58,.7)' : v < 0.66 ? 'rgba(130,170,80,.6)' : 'rgba(70,110,45,.6)';
    const x = Math.random() * W, y = Math.random() * H;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y - 3 - Math.random() * 4); g.stroke();
  }
  return { map: tex(THREE, c, repeat), bump: null };
}

/** Wood planks (doors, stalls, crates, docks). */
export function planks(THREE, base = [122, 88, 56], repeat = [1, 1]) {
  const W = 256, H = 256, [c, g] = canvas(W, H);
  const n = 6, pw = W / n;
  for (let i = 0; i < n; i++) {
    const v = (Math.random() - 0.5) * 24;
    g.fillStyle = `rgb(${base.map(ch => ch + v)})`; g.fillRect(i * pw, 0, pw, H);
    g.strokeStyle = 'rgba(40,25,10,.35)'; g.lineWidth = 2; g.strokeRect(i * pw + 1, 0, pw - 2, H);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(60,40,20,${0.08 + Math.random() * 0.1})`; g.beginPath(); const x = i * pw + Math.random() * pw; g.moveTo(x, 0); g.bezierCurveTo(x + 6, H / 3, x - 6, (2 * H) / 3, x, H); g.stroke(); }
  }
  return { map: tex(THREE, c, repeat), bump: null };
}

/** Striped awning cloth for market stalls. */
export function stripes(THREE, a, b) {
  const [c, g] = canvas(128, 128);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 16, 0, 16, 128); }
  noise(g, 128, 128, 600, 0.05);
  return { map: tex(THREE, c), bump: null };
}

/** Demacian banner: blue cloth, gold border and a simple winged emblem (our own design). */
export function banner(THREE) {
  const [c, g] = canvas(128, 320);
  g.fillStyle = '#1f4f9a'; g.fillRect(0, 0, 128, 320);
  g.strokeStyle = '#d9b25a'; g.lineWidth = 8; g.strokeRect(6, 6, 116, 290);
  g.fillStyle = '#d9b25a'; g.beginPath(); g.moveTo(64, 120);
  g.quadraticCurveTo(20, 90, 14, 140); g.quadraticCurveTo(40, 130, 64, 150); g.quadraticCurveTo(88, 130, 114, 140); g.quadraticCurveTo(108, 90, 64, 120); g.fill();
  g.beginPath(); g.moveTo(64, 150); g.lineTo(54, 190); g.lineTo(64, 210); g.lineTo(74, 190); g.closePath(); g.fill();
  noise(g, 128, 320, 1500, 0.05);
  const t = tex(THREE, c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
