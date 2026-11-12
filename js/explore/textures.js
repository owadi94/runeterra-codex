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

/* ---------- Hand-painted style ----------
   Light from above baked into the colour, darker edges, a bright top edge and visible brush strokes.
   Used for props and trims so they read as painted game art rather than photos. */
function strokes(g, w, h, colors, count, len, width) {
  g.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w, y = Math.random() * h, a = (Math.random() - 0.5) * 0.6;
    g.strokeStyle = colors[Math.floor(Math.random() * colors.length)]; g.lineWidth = width * (0.5 + Math.random());
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len * (0.5 + Math.random()), y + Math.sin(a) * len * 0.3); g.stroke();
  }
}
function paintedBase(g, w, h, top, bottom) {
  const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, top); grad.addColorStop(1, bottom);
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
}
function edges(g, w, h, dark = 'rgba(40,25,10,.45)', light = 'rgba(255,250,230,.55)') {
  const e = g.createLinearGradient(0, 0, w * 0.12, 0); e.addColorStop(0, dark); e.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = e; g.fillRect(0, 0, w * 0.12, h);
  const e2 = g.createLinearGradient(w, 0, w * 0.88, 0); e2.addColorStop(0, dark); e2.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = e2; g.fillRect(w * 0.88, 0, w * 0.12, h);
  const b = g.createLinearGradient(0, h, 0, h * 0.8); b.addColorStop(0, dark); b.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = b; g.fillRect(0, h * 0.8, w, h * 0.2);
  g.fillStyle = light; g.fillRect(0, 0, w, Math.max(3, h * 0.03));
}

/** Painted wood: warm planks with grain strokes and darker seams. */
export function paintedWood(THREE, repeat = [1, 1]) {
  const W = 256, H = 256, [c, g] = canvas(W, H), n = 4, pw = W / n;
  for (let i = 0; i < n; i++) {
    const base = [[156, 104, 60], [140, 92, 52], [166, 114, 66], [132, 86, 48]][i % 4];
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgb(${base.map(v => v + 26)})`); gr.addColorStop(1, `rgb(${base.map(v => v - 30)})`);
    g.fillStyle = gr; g.fillRect(i * pw, 0, pw, H);
    g.save(); g.beginPath(); g.rect(i * pw, 0, pw, H); g.clip();
    strokes(g, W, H, ['rgba(90,55,28,.35)', 'rgba(205,160,110,.25)'], 40, 120, 2.5);
    g.restore();
    g.fillStyle = 'rgba(50,28,12,.6)'; g.fillRect(i * pw, 0, 3, H);
    g.fillStyle = 'rgba(230,190,140,.35)'; g.fillRect(i * pw + 3, 0, 2, H);
  }
  edges(g, W, H);
  return { map: tex(THREE, c, repeat), bump: null };
}

/** Painted gold trim: bright highlights, warm mid tones, dark worn edges. */
export function paintedGold(THREE, repeat = [1, 1]) {
  const W = 128, H = 128, [c, g] = canvas(W, H);
  paintedBase(g, W, H, '#ffe9a3', '#9a6a1c');
  strokes(g, W, H, ['rgba(255,245,200,.55)', 'rgba(150,100,30,.4)', 'rgba(255,215,120,.5)'], 70, 50, 3);
  edges(g, W, H, 'rgba(80,45,5,.55)', 'rgba(255,252,220,.9)');
  return { map: tex(THREE, c, repeat), bump: null };
}

/** Painted white stone (Demacian marble): soft cool shadows, warm light, chips at the edges. */
export function paintedStone(THREE, repeat = [1, 1]) {
  const W = 256, H = 256, [c, g] = canvas(W, H);
  paintedBase(g, W, H, '#fbf7ee', '#c9c2b5');
  strokes(g, W, H, ['rgba(255,255,255,.4)', 'rgba(160,165,180,.22)', 'rgba(230,220,200,.35)'], 90, 70, 6);
  for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(120,110,100,.25)'; g.lineWidth = 1.2; g.beginPath(); const x = Math.random() * W, y = Math.random() * H; g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 22, y + Math.random() * 18); g.stroke(); }
  edges(g, W, H, 'rgba(90,85,95,.35)', 'rgba(255,255,255,.8)');
  return { map: tex(THREE, c, repeat), bump: null };
}

/** Painted stone blocks for walls and towers: each block lit from above with a soft outline and a bright top edge. */
export function paintedBlocks(THREE, light = [250, 246, 236], dark = [196, 188, 176], repeat = [1, 1]) {
  const W = 512, H = 512, [c, g] = canvas(W, H), [b, bg] = canvas(W, H);
  g.fillStyle = `rgb(${dark.map(v => v - 40)})`; g.fillRect(0, 0, W, H);
  bg.fillStyle = '#111'; bg.fillRect(0, 0, W, H);
  const rows = 6, rh = H / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -50 : 0;
    while (x < W) {
      const bw = 90 + Math.random() * 70, v = (Math.random() - 0.5) * 14, y = r * rh;
      const gr = g.createLinearGradient(0, y, 0, y + rh);
      gr.addColorStop(0, `rgb(${light.map(ch => ch + v)})`); gr.addColorStop(1, `rgb(${dark.map(ch => ch + v)})`);
      g.fillStyle = gr; g.beginPath(); g.roundRect(x + 3, y + 3, bw - 6, rh - 6, 7); g.fill();
      g.save(); g.beginPath(); g.roundRect(x + 3, y + 3, bw - 6, rh - 6, 7); g.clip();
      strokes(g, W, H, ['rgba(255,255,255,.35)', 'rgba(150,145,160,.18)'], 30, 60, 5);
      g.fillStyle = 'rgba(255,255,250,.7)'; g.fillRect(x + 6, y + 4, bw - 12, 3);
      g.fillStyle = 'rgba(90,80,75,.25)'; g.fillRect(x + 3, y + rh - 10, bw - 6, 7);
      g.restore();
      bg.fillStyle = '#eee'; bg.beginPath(); bg.roundRect(x + 4, y + 4, bw - 8, rh - 8, 7); bg.fill();
      x += bw;
    }
  }
  return { map: tex(THREE, c, repeat), bump: tex(THREE, b, repeat, false) };
}

/** Painted roof tiles: saturated colour, a light top edge on each tile and a dark lip underneath. */
export function paintedRoof(THREE, base = [70, 112, 178], repeat = [1, 1]) {
  const W = 256, H = 256, [c, g] = canvas(W, H), [b, bg] = canvas(W, H);
  g.fillStyle = `rgb(${base.map(v => v - 45)})`; g.fillRect(0, 0, W, H);
  bg.fillStyle = '#000'; bg.fillRect(0, 0, W, H);
  const rows = 7, rh = H / rows, tw = 36;
  for (let r = 0; r < rows; r++) for (let i = -1; i < W / tw + 1; i++) {
    const x = i * tw + (r % 2) * (tw / 2), y = r * rh, v = (Math.random() - 0.5) * 16;
    const shape = ctx => { ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + tw - 1, y); ctx.lineTo(x + tw - 1, y + rh * 0.75); ctx.quadraticCurveTo(x + tw / 2, y + rh * 1.2, x + 1, y + rh * 0.75); ctx.closePath(); };
    const gr = g.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, `rgb(${base.map(ch => ch + v + 40)})`); gr.addColorStop(0.6, `rgb(${base.map(ch => ch + v)})`); gr.addColorStop(1, `rgb(${base.map(ch => ch + v - 35)})`);
    g.fillStyle = gr; shape(g); g.fill();
    g.strokeStyle = 'rgba(15,25,50,.55)'; g.lineWidth = 2; shape(g); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 4, y + 2, tw - 8, 2);
    const bgr = bg.createLinearGradient(0, y, 0, y + rh); bgr.addColorStop(0, '#444'); bgr.addColorStop(1, '#fff'); bg.fillStyle = bgr; shape(bg); bg.fill();
  }
  strokes(g, W, H, ['rgba(255,255,255,.12)', 'rgba(0,0,30,.15)'], 60, 40, 3);
  return { map: tex(THREE, c, repeat), bump: tex(THREE, b, repeat, false) };
}

/** Painted plaster for house walls: warm cream, soft shading and a few weathering strokes. */
export function paintedPlaster(THREE, repeat = [1, 1]) {
  const W = 256, H = 256, [c, g] = canvas(W, H);
  paintedBase(g, W, H, '#fdf6e6', '#e2d6bd');
  strokes(g, W, H, ['rgba(255,255,255,.35)', 'rgba(190,170,140,.18)'], 80, 70, 8);
  const grime = g.createLinearGradient(0, H, 0, H * 0.75); grime.addColorStop(0, 'rgba(120,95,70,.35)'); grime.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grime; g.fillRect(0, H * 0.75, W, H * 0.25);
  return { map: tex(THREE, c, repeat), bump: null };
}

/** Painted steel for blades and helmets. */
export function paintedSteel(THREE) {
  const W = 128, H = 128, [c, g] = canvas(W, H);
  paintedBase(g, W, H, '#f2f5f8', '#7d8794');
  strokes(g, W, H, ['rgba(255,255,255,.6)', 'rgba(90,100,115,.35)'], 50, 60, 2.5);
  edges(g, W, H, 'rgba(40,45,55,.5)', 'rgba(255,255,255,.95)');
  return { map: tex(THREE, c), bump: null };
}

/** Painted royal-blue cloth with a gold border. */
export function paintedCloth(THREE) {
  const W = 128, H = 256, [c, g] = canvas(W, H);
  paintedBase(g, W, H, '#3d6fc4', '#173a78');
  strokes(g, W, H, ['rgba(120,160,230,.3)', 'rgba(10,30,70,.35)'], 60, 80, 4);
  g.strokeStyle = '#e2b95e'; g.lineWidth = 9; g.strokeRect(5, 5, W - 10, H - 10);
  g.strokeStyle = 'rgba(120,80,20,.6)'; g.lineWidth = 2; g.strokeRect(10, 10, W - 20, H - 20);
  g.fillStyle = '#e2b95e'; g.beginPath(); g.moveTo(64, 96); g.quadraticCurveTo(24, 70, 18, 112); g.quadraticCurveTo(42, 104, 64, 120); g.quadraticCurveTo(86, 104, 110, 112); g.quadraticCurveTo(104, 70, 64, 96); g.fill();
  g.beginPath(); g.moveTo(64, 120); g.lineTo(56, 150); g.lineTo(64, 166); g.lineTo(72, 150); g.closePath(); g.fill();
  const t = tex(THREE, c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

/** A tall, sharp gate banner (512 x 1536): deep blue cloth, gold border, our winged emblem. Its bottom is pointed. */
export function grandBanner(THREE) {
  const W = 512, H = 1536, [c, g] = canvas(W, H);
  paintedBase(g, W, H, '#2f62c0', '#0f2c66');
  strokes(g, W, H, ['rgba(130,170,240,.22)', 'rgba(5,20,60,.3)'], 260, 260, 10);
  const path = inset => { g.beginPath(); g.moveTo(inset, inset); g.lineTo(W - inset, inset); g.lineTo(W - inset, H * 0.86 - inset * 0.4); g.lineTo(W / 2, H - inset * 1.6); g.lineTo(inset, H * 0.86 - inset * 0.4); g.closePath(); };
  g.lineJoin = 'round';
  g.strokeStyle = '#e8c06a'; g.lineWidth = 26; path(24); g.stroke();
  g.strokeStyle = 'rgba(110,70,20,.7)'; g.lineWidth = 4; path(46); g.stroke();
  g.fillStyle = '#e8c06a'; g.fillRect(0, 0, W, 70);                                     // the top bar
  g.fillStyle = 'rgba(120,80,25,.55)'; g.fillRect(0, 62, W, 8);
  // Winged emblem: a sword point down between two spread wings
  const gold = g.createLinearGradient(0, 380, 0, 980); gold.addColorStop(0, '#ffe39a'); gold.addColorStop(1, '#c08a32');
  g.fillStyle = gold; g.strokeStyle = 'rgba(90,55,15,.8)'; g.lineWidth = 5;
  [-1, 1].forEach(s => {
    g.beginPath(); g.moveTo(W / 2, 560);
    g.bezierCurveTo(W / 2 + s * 60, 440, W / 2 + s * 170, 380, W / 2 + s * 230, 400);
    for (let f = 0; f < 5; f++) { g.lineTo(W / 2 + s * (215 - f * 34), 470 + f * 46); g.lineTo(W / 2 + s * (200 - f * 34), 440 + f * 46); }
    g.quadraticCurveTo(W / 2 + s * 60, 640, W / 2, 640); g.closePath(); g.fill(); g.stroke();
  });
  g.beginPath(); g.moveTo(W / 2 - 22, 420); g.lineTo(W / 2 + 22, 420); g.lineTo(W / 2 + 22, 860); g.lineTo(W / 2, 960); g.lineTo(W / 2 - 22, 860); g.closePath(); g.fill(); g.stroke();
  g.fillRect(W / 2 - 80, 400, 160, 26); g.strokeRect(W / 2 - 80, 400, 160, 26);
  g.beginPath(); g.arc(W / 2, 370, 26, 0, Math.PI * 2); g.fill(); g.stroke();
  // A gold ring and diamond near the point
  g.strokeStyle = '#e8c06a'; g.lineWidth = 10; g.beginPath(); g.arc(W / 2, 1140, 70, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#e8c06a'; g.beginPath(); g.moveTo(W / 2, 1090); g.lineTo(W / 2 + 34, 1140); g.lineTo(W / 2, 1190); g.lineTo(W / 2 - 34, 1140); g.closePath(); g.fill();
  const t = tex(THREE, c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

/** A deep blue inlay strip for pillars (128 x 1024) with a column of gold marks: our own simple shapes, not any real script. */
export function runeInlay(THREE) {
  const W = 128, H = 1024, [c, g] = canvas(W, H);
  paintedBase(g, W, H, '#244a9e', '#0d2257');
  strokes(g, W, H, ['rgba(120,160,240,.2)', 'rgba(0,10,40,.3)'], 80, 120, 6);
  g.strokeStyle = '#d9b25a'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
  g.strokeStyle = '#e8c06a'; g.fillStyle = '#e8c06a'; g.lineWidth = 6; g.lineCap = 'round';
  const marks = [
    y => { g.beginPath(); g.arc(64, y, 16, 0, Math.PI * 2); g.stroke(); },
    y => { g.beginPath(); g.moveTo(40, y - 14); g.lineTo(64, y + 14); g.lineTo(88, y - 14); g.stroke(); },
    y => { g.beginPath(); g.moveTo(64, y - 18); g.lineTo(64, y + 18); g.moveTo(46, y - 4); g.lineTo(82, y - 4); g.stroke(); },
    y => { g.beginPath(); g.moveTo(64, y - 16); g.lineTo(82, y); g.lineTo(64, y + 16); g.lineTo(46, y); g.closePath(); g.fill(); },
    y => { g.beginPath(); g.moveTo(44, y + 14); g.lineTo(64, y - 16); g.lineTo(84, y + 14); g.moveTo(52, y + 2); g.lineTo(76, y + 2); g.stroke(); },
  ];
  for (let i = 0, y = 70; y < H - 60; i++, y += 78) marks[(i * 3) % marks.length](y);
  const t = tex(THREE, c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
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
