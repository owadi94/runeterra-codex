// The Web of Runeterra: every champion on a canvas, grouped by region, joined by their bonds.
// Uses d3 (loaded as a classic script) for the force layout and zoom.
import { $, $$, esc, norm, pick, reduceMotion } from '../ui.js';
import { iconFor } from '../riot.js';
import { BOND, GROUPS, WANDERERS, STORIES } from '../data/lore.js';
import { getGraph, bondText } from '../graph.js';
import { to, go } from '../router.js';

let web = null;   // canvas state, created on first visit

const nodeRadius = n => (n.story ? 15 : 11) + Math.min(n.deg, 8) * 0.7;
const hueOf = faction => (GROUPS.find(g => g.u === faction) || WANDERERS).hue;
function anchorOf(faction) {
  if (faction === 'unaffiliated') return { x: 0, y: 0 };
  const i = Math.max(0, GROUPS.findIndex(g => g.u === faction)), a = (i / (GROUPS.length - 1)) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(a) * 620, y: Math.sin(a) * 400 };
}
const labelPos = g => (g.u === 'unaffiliated' ? { x: 0, y: -170 } : { x: anchorOf(g.u).x * 1.32, y: anchorOf(g.u).y * 1.36 });

export function enterWeb({ slug } = {}) {
  if (!window.d3) { $('#webSide').innerHTML = `<p class="banner-msg">The map needs a drawing library that didn't load. Check your connection, then reload the page.</p>`; return; }
  if (!web) setup();
  web.sel = slug && web.G.by[slug] ? slug : null;
  drawSide();                       // the list shows at once; the canvas waits for layout below
  requestAnimationFrame(() => {
    resize();
    if (web.sel) focus(web.sel, false);
    else if (!web.fitted) { fit(false); web.fitted = true; }
    paint();
  });
}

/** Load champion icons, again once Riot's real ids are known. */
export function refreshWeb() {
  if (!web) return;
  web.G.nodes.forEach(n => {
    const src = iconFor(n), old = web.imgs[n.slug];
    if (!src || (old && old.src === src && old.naturalWidth)) return;
    const im = new Image(); im.decoding = 'async'; im.onload = draw; im.src = src;
    web.imgs[n.slug] = im;
  });
}

function setup() {
  const G = getGraph(), cv = $('#webCanvas');
  G.nodes.forEach(n => { const a = anchorOf(n.faction); n.x = a.x + (Math.random() - 0.5) * 120; n.y = a.y + (Math.random() - 0.5) * 120; });
  const links = G.edges.map(e => ({ source: e.a, target: e.b, e }));
  const sim = d3.forceSimulation(G.nodes)
    .force('link', d3.forceLink(links).id(d => d.slug).distance(l => (l.e.t === 'linked' ? 110 : 80)).strength(0.035))
    .force('charge', d3.forceManyBody().strength(-70))
    .force('x', d3.forceX(d => anchorOf(d.faction).x).strength(0.14))
    .force('y', d3.forceY(d => anchorOf(d.faction).y).strength(0.14))
    .force('collide', d3.forceCollide(d => nodeRadius(d) + 5)).stop();
  for (let i = 0; i < 320; i++) sim.tick();   // settle once, so the map never jitters

  web = { G, links, cv, ctx: cv.getContext('2d'), t: d3.zoomIdentity, sel: null, hover: null, types: new Set(Object.keys(BOND)), imgs: {}, W: 0, H: 0, dpr: 1, fitted: false };
  refreshWeb();
  web.zoom = d3.zoom().scaleExtent([0.25, 4]).on('zoom', e => { web.t = e.transform; draw(); });
  d3.select(cv).call(web.zoom).on('dblclick.zoom', null);

  const hit = ev => {
    const r = cv.getBoundingClientRect(), [x, y] = web.t.invert([ev.clientX - r.left, ev.clientY - r.top]);
    let best = null, bd = Infinity;
    for (const n of G.nodes) { const d = Math.hypot(n.x - x, n.y - y); if (d < nodeRadius(n) + 3 && d < bd) { bd = d; best = n; } }
    return best;
  };
  cv.addEventListener('pointermove', ev => {
    const n = hit(ev), tip = $('#webTip');
    web.hover = n ? n.slug : null; cv.classList.toggle('over', !!n);
    if (n) { const [sx, sy] = web.t.apply([n.x, n.y]); tip.textContent = n.name; tip.style.left = sx + 'px'; tip.style.top = (sy - nodeRadius(n) * web.t.k) + 'px'; tip.hidden = false; }
    else tip.hidden = true;
    draw();
  });
  cv.addEventListener('pointerleave', () => { web.hover = null; $('#webTip').hidden = true; draw(); });
  cv.addEventListener('click', ev => { const n = hit(ev); n ? select(n.slug) : clearSelection(false); });
  cv.addEventListener('dblclick', ev => { const n = hit(ev); if (n) go(to.champion(n.slug)); });

  $('#zIn').onclick = () => d3.select(cv).transition().duration(250).call(web.zoom.scaleBy, 1.4);
  $('#zOut').onclick = () => d3.select(cv).transition().duration(250).call(web.zoom.scaleBy, 1 / 1.4);
  $('#zFit').onclick = () => clearSelection(true);
  $('#webRandom').onclick = () => select(pick(STORIES)[0]);
  $('#webSearch').onkeydown = e => {
    if (e.key !== 'Enter') return;
    const q = norm(e.target.value); if (!q) return;
    const n = G.nodes.find(x => norm(x.name).startsWith(q)) || G.nodes.find(x => norm(x.name).includes(q));
    if (n) { select(n.slug); e.target.value = ''; }
  };
  $('#legend').innerHTML = Object.entries(BOND).map(([k, v]) => `<button class="chip" data-t="${k}" aria-pressed="true"><i style="background:${v.c}"></i>${v.label}</button>`).join('');
  $$('#legend .chip').forEach(b => { b.onclick = () => {
    const t = b.dataset.t;
    web.types.has(t) ? web.types.delete(t) : web.types.add(t);
    b.setAttribute('aria-pressed', web.types.has(t));
    draw(); drawSide();
  }; });
  new ResizeObserver(() => { if (!$('[data-view="web"]').hidden) { resize(); draw(); } }).observe($('#webBox'));
}

/* Selecting a champion updates the address (#/web/ahri) so the view can be shared. */
function select(slug) {
  if (location.hash !== to.webFocus(slug)) history.replaceState(null, '', to.webFocus(slug));
  focus(slug, true);
}
function clearSelection(refit) {
  web.sel = null;
  if (location.hash !== to.web) history.replaceState(null, '', to.web);
  if (refit) fit(true);
  draw(); drawSide();
}

function resize() {
  const r = web.cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  if (!r.width) return;
  Object.assign(web, { W: r.width, H: r.height, dpr: d });
  web.cv.width = r.width * d; web.cv.height = r.height * d;
}
function animate(sel) { return reduceMotion ? sel : sel.transition().duration(600); }
function fit(anim) {
  const pts = [...web.G.nodes, ...GROUPS.map(labelPos)], xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs) - 90, x1 = Math.max(...xs) + 90, y0 = Math.min(...ys) - 40, y1 = Math.max(...ys) + 40;
  const k = Math.min(web.W / (x1 - x0), web.H / (y1 - y0));
  const t = d3.zoomIdentity.translate(web.W / 2 - (k * (x0 + x1)) / 2, web.H / 2 - (k * (y0 + y1)) / 2).scale(k);
  const s = d3.select(web.cv); (anim ? animate(s) : s).call(web.zoom.transform, t);
}
function focus(slug, anim) {
  const n = web.G.by[slug]; if (!n) return;
  web.sel = slug; drawSide();
  const k = Math.max(web.t.k, 1.25), t = d3.zoomIdentity.translate(web.W / 2 - k * n.x, web.H / 2 - k * n.y).scale(k);
  const s = d3.select(web.cv); (anim ? animate(s) : s).call(web.zoom.transform, t);
  draw();
}

let queued = false;
function draw() { if (!web || queued) return; queued = true; requestAnimationFrame(paint); }
function paint() {
  queued = false;
  const { ctx, t, G, W, H, dpr } = web; if (!W) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  ctx.save(); ctx.translate(t.x, t.y); ctx.scale(t.k, t.k);
  const sel = web.sel, near = sel ? new Set([sel, ...G.adj[sel].map(x => x.o)]) : null;

  ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.font = `${Math.max(13, 15 / t.k)}px Marcellus, Georgia, serif`;
  GROUPS.forEach(g => {
    const p = labelPos(g), txt = g.name.toUpperCase();
    ctx.globalAlpha = sel ? 0.15 : 0.8; ctx.lineWidth = 5 / t.k; ctx.strokeStyle = '#010a13'; ctx.strokeText(txt, p.x, p.y);
    ctx.fillStyle = g.hue; ctx.fillText(txt, p.x, p.y);
  });
  for (const l of web.links) {
    const e = l.e; if (!web.types.has(e.t)) continue;
    const on = sel && (e.a === sel || e.b === sel), s = l.source, tg = l.target;
    ctx.globalAlpha = sel ? (on ? 0.95 : 0.035) : (e.t === 'linked' ? 0.2 : 0.6);
    ctx.strokeStyle = BOND[e.t].c; ctx.lineWidth = ((e.t === 'linked' ? 0.8 : 1.8) * (on ? 1.8 : 1)) / Math.sqrt(t.k);
    const mx = (s.x + tg.x) / 2, my = (s.y + tg.y) / 2, dx = tg.x - s.x, dy = tg.y - s.y;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(mx - dy * 0.12, my + dx * 0.12, tg.x, tg.y); ctx.stroke();
  }
  for (const n of G.nodes) {
    const r = nodeRadius(n), dim = sel && !near.has(n.slug), lit = n.slug === sel || n.slug === web.hover;
    ctx.globalAlpha = dim ? 0.16 : 1;
    if (lit) { ctx.beginPath(); ctx.arc(n.x, n.y, r + 7, 0, 6.283); ctx.fillStyle = 'rgba(200,155,60,.28)'; ctx.fill(); }
    ctx.beginPath(); ctx.arc(n.x, n.y, r + 2, 0, 6.283); ctx.fillStyle = lit ? '#f0e6d2' : hueOf(n.faction); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.clip();
    const im = web.imgs[n.slug];
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, n.x - r, n.y - r, r * 2, r * 2); else { ctx.fillStyle = '#091428'; ctx.fill(); }
    ctx.restore();
  }
  ctx.font = `${11 / Math.max(t.k, 0.8) + 2}px "Source Sans 3", sans-serif`; ctx.fillStyle = '#f0e6d2'; ctx.globalAlpha = 1;
  for (const n of G.nodes) if (near ? near.has(n.slug) : t.k > 1.6) ctx.fillText(n.name, n.x, n.y + nodeRadius(n) + 14);
  ctx.restore();
}

const row = (other, e) => {
  const n = web.G.by[other], b = BOND[e.t];
  return `<button class="conn" data-o="${esc(other)}"><img loading="lazy" alt="" src="${esc(iconFor(n))}"><span><span class="who"><b>${esc(n.name)}</b><span class="ttype" style="color:${b.c}">${b.label}</span></span><p>${esc(bondText(e))}</p></span></button>`;
};
function drawSide() {
  const G = web.G, side = $('#webSide');
  if (!web.sel) {
    const shown = STORIES.filter(s => web.types.has(s[2]) && G.by[s[0]] && G.by[s[1]]);
    side.innerHTML = `<div class="stack" style="gap:var(--s2)"><h3 class="t-2">Story threads</h3><p class="t-sm">${STORIES.length} bonds explained. Pick one to see it on the map, or click any champion.</p></div>
      <div class="conns">${shown.map(([a, b, t, txt]) => `<button class="conn" data-o="${a}"><img loading="lazy" alt="" src="${esc(iconFor(G.by[a]))}"><span><span class="who"><b>${esc(G.by[a].name)} & ${esc(G.by[b].name)}</b><span class="ttype" style="color:${BOND[t].c}">${BOND[t].label}</span></span><p>${esc(txt)}</p></span></button>`).join('') || '<p class="t-sm">Turn on a bond type above to see its stories.</p>'}</div>`;
  } else {
    const n = G.by[web.sel], g = GROUPS.find(x => x.u === n.faction) || WANDERERS;
    const list = G.adj[web.sel].filter(x => web.types.has(x.e.t)).sort((x, y) => (x.e.t === 'linked') - (y.e.t === 'linked'));
    side.innerHTML = `<div class="side-head"><img alt="" src="${esc(iconFor(n))}"><div class="stack" style="gap:var(--s1)"><h3 class="t-2">${esc(n.name)}</h3><span class="t-sm"><i class="swatch" style="background:${g.hue}"></i> ${esc(g.name)} · ${list.length} connections</span></div></div>
      <div class="row"><a class="btn" href="${to.champion(esc(n.slug))}">Open profile</a><button class="btn secondary" id="clearSel">Show all</button></div>
      <div class="conns">${list.map(x => row(x.o, x.e)).join('') || '<p class="t-sm">No connections of the types you have turned on.</p>'}</div>`;
    $('#clearSel').onclick = () => clearSelection(true);
  }
  $$('.conn', side).forEach(b => { b.onclick = () => select(b.dataset.o); });
  side.scrollTop = 0;
}
