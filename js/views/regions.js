// Regions: our own drawn map of Runeterra, then the chosen region with all its champions.
import { $, $$, esc, bg, reduceMotion } from '../ui.js';
import { UNIV, uFailed, U_SITE, idOf, splash } from '../riot.js';
import { REGIONS, GROUPS } from '../data/lore.js';
import { LAND } from '../data/map.js';
import { markRegionRead, progress } from '../state.js';
import { champTile, gallery } from '../components.js';
import { to, go } from '../router.js';

let current = 'demacia';
const members = g => (UNIV ? UNIV.filter(c => c.faction === g.u) : g.champs.map(n => ({ slug: n.toLowerCase().replace(/[^a-z]/g, ''), name: n, faction: g.u })));

export function enterRegions({ id } = {}) {
  current = GROUPS.some(g => g.id === id) ? id : 'demacia';
  drawMap();
  draw();
  if (id && innerWidth < 860) $('#atlasDetail').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
export const refreshRegions = () => draw();
export const regionName = id => (GROUPS.find(g => g.id === id) || {}).name || 'Regions';

function draw() {
  const r = GROUPS.find(g => g.id === current), list = members(r);
  $$('#mapSvg .land').forEach(el => { const on = el.dataset.r === current; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); });
  $$('#mapSvg [data-cnt]').forEach(t => { const g = GROUPS.find(x => x.id === t.dataset.cnt); t.textContent = UNIV ? `${members(g).length} champions` : ''; });

  $('#rlist').innerHTML = GROUPS.map(g => `<a href="${to.region(g.id)}" aria-current="${g.id === current ? 'true' : 'false'}"><i class="swatch" style="background:${g.hue}"></i>${esc(g.name)}${progress.visited.includes(g.id) ? '<span class="seen">Read</span>' : ''}</a>`).join('');
  $('#rpanel').innerHTML = `<div class="banner art" style="${bg(splash(idOf(r.key)))}"></div><div class="body">
    <div class="stack" style="gap:var(--s2)"><span class="t-label" style="color:${r.hue}">${esc(r.tag)}</span><h2 class="t-1">${esc(r.name)}</h2></div>
    <p class="t-body">${esc(r.text)}</p><div class="fact"><span class="t-label">Did you know</span><p>${esc(r.fact)}</p></div>${gallery(r.id)}
    <div class="between"><h3 class="t-3">Champions of ${esc(r.name)}</h3><span class="t-sm num">${UNIV ? `${list.length} champions` : uFailed ? "Showing a few. Riot's full list could not load." : 'Loading the full list…'}</span></div>
    <div class="roster tall">${list.map(u => champTile(u, true)).join('')}</div>
    ${r.u !== 'unaffiliated' ? `<a class="link" href="${U_SITE}region/${r.u}/" target="_blank" rel="noopener">Read about ${esc(r.name)} on Riot's Universe site ↗</a>` : ''}</div>`;
  markRegionRead(current);
  $('#visited').textContent = `${progress.visited.length} of 13 regions read`;
}

/* ---- The map (drawn once) ---- */
/** Seeded wobble so coastlines look hand-drawn but stay the same on every visit. */
function coast(points, seed) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out = [];
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    out.push(p);
    for (let k = 1; k < 3; k++) {
      const t = k / 3, nx = -(q[1] - p[1]), ny = q[0] - p[0], len = Math.hypot(nx, ny) || 1, j = (rnd() - 0.5) * 14;
      out.push([p[0] + (q[0] - p[0]) * t + (nx / len) * j, p[1] + (q[1] - p[1]) * t + (ny / len) * j]);
    }
  });
  const n = out.length, P = i => out[(i + n) % n], f = v => v.toFixed(1);
  let d = `M${f(P(0)[0])},${f(P(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}

function drawMap() {
  const svg = $('#mapSvg');
  if (svg.dataset.drawn) return;
  svg.dataset.drawn = '1';
  const grid = [...Array(9)].map((_, i) => `<line x1="${i * 125}" y1="0" x2="${i * 125}" y2="640"/>`).join('') + [...Array(6)].map((_, i) => `<line x1="0" y1="${i * 128}" x2="1000" y2="${i * 128}"/>`).join('');
  let html = `<defs><radialGradient id="seaG" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#0d2238"/><stop offset="1" stop-color="#030b16"/></radialGradient>
      <radialGradient id="mist" r=".5"><stop offset="0" stop-color="#6fd6bf" stop-opacity=".35"/><stop offset="1" stop-color="#6fd6bf" stop-opacity="0"/></radialGradient>
      <radialGradient id="rift" r=".5"><stop offset="0" stop-color="#a874e0" stop-opacity=".55"/><stop offset="1" stop-color="#a874e0" stop-opacity="0"/></radialGradient></defs>
    <rect width="1000" height="640" fill="url(#seaG)"/><g stroke="#16304a" stroke-width=".6" opacity=".7">${grid}</g>
    <text class="sea" x="660" y="300">CONQUEROR'S SEA</text><text class="sea" x="250" y="392">GUARDIAN'S SEA</text>
    <circle cx="912" cy="515" r="95" fill="url(#mist)"/><circle cx="668" cy="606" r="60" fill="url(#rift)"/>`;
  let seed = 7;
  REGIONS.forEach(r => {
    const L = LAND[r.id]; if (!L) return;
    html += `<g class="land" data-r="${r.id}" style="--h:${r.hue}" tabindex="0" role="button" aria-label="${esc(r.name)}">${L.p.map(poly => `<path class="shape" d="${coast(poly, (seed += 13))}"/>`).join('')}
      <text class="lbl" x="${L.l[0]}" y="${L.l[1]}">${esc(r.name.toUpperCase())}</text><text class="cnt" x="${L.l[0]}" y="${L.l[1] + 17}" data-cnt="${r.id}"></text></g>`;
    L.places.forEach(([name, x, y]) => { html += `<g class="place"><path d="M${x},${y - 4}l4,4l-4,4l-4,-4Z"/><text x="${x + 7}" y="${y + 4}">${esc(name)}</text></g>`; });
  });
  /* Bandle City has no fixed place: a portal into the spirit realm. */
  html += `<g class="land" data-r="bandle" style="--h:#b9d46e" tabindex="0" role="button" aria-label="Bandle City"><circle class="shape" cx="470" cy="368" r="30" style="stroke-dasharray:4 4"/><text class="lbl" x="470" y="372" style="font-size:14px">BANDLE CITY</text><text class="cnt" x="470" y="414" data-cnt="bandle"></text><text x="470" y="428" style="font-family:var(--ui);font-style:italic;font-size:11px;fill:#a09b8c;text-anchor:middle">somewhere in the spirit realm</text></g>`;
  /* Wanderers have no homeland. */
  html += `<g class="land" data-r="wanderers" style="--h:#c8aa6e" tabindex="0" role="button" aria-label="Wanderers"><rect class="shape" x="24" y="560" width="200" height="56"/><text class="lbl" x="124" y="586" style="font-size:15px">WANDERERS</text><text class="cnt" x="124" y="604" data-cnt="wanderers"></text></g>`;
  svg.innerHTML = html;
  $$('.land', svg).forEach(el => {
    const open = () => go(to.region(el.dataset.r));
    el.onclick = open;
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  });
}
