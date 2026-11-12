// Regions: Riot's official world map with our clickable region spots, then the chosen region and all its champions.
import { $, $$, esc, bg, reduceMotion } from '../ui.js';
import { UNIV, uFailed, U_SITE, idOf, splash } from '../riot.js';
import { GROUPS } from '../data/lore.js';
import { MAP_IMAGE, MAP_VIEW, SPOTS } from '../data/map.js';
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
function drawMap() {
  const svg = $('#mapSvg');
  if (svg.dataset.drawn) return;
  svg.dataset.drawn = '1';
  const { x, y, w, h } = MAP_VIEW;
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  let html = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0b1c2c"/>
    <image href="${MAP_IMAGE}" x="0" y="0" width="2048" height="2048" preserveAspectRatio="xMidYMid slice"/>`;
  GROUPS.forEach(g => {
    const s = SPOTS[g.id]; if (!s) return;
    const [cx, cy, r] = s, portal = g.id === 'bandle';
    html += `<g class="land${portal ? ' portal' : ''}" data-r="${g.id}" style="--h:${g.hue}" tabindex="0" role="button" aria-label="${esc(g.name)}">
      <circle class="shape" cx="${cx}" cy="${cy}" r="${r}"/>
      <text class="lbl" x="${cx}" y="${cy + 12}">${esc(g.name.toUpperCase())}</text>
      <text class="cnt" x="${cx}" y="${cy + 48}" data-cnt="${g.id}"></text>
      ${portal ? `<text class="hint" x="${cx}" y="${cy + 80}">somewhere in the spirit realm</text>` : ''}</g>`;
  });
  /* Wanderers have no homeland: a button in the corner of the map. */
  html += `<g class="land" data-r="wanderers" style="--h:#c8aa6e" tabindex="0" role="button" aria-label="Wanderers">
    <rect class="shape" x="40" y="${y + h - 150}" width="400" height="110"/><text class="lbl" x="240" y="${y + h - 92}">WANDERERS</text><text class="cnt" x="240" y="${y + h - 56}" data-cnt="wanderers"></text></g>`;
  svg.innerHTML = html;
  $$('.land', svg).forEach(el => {
    const open = () => go(to.region(el.dataset.r));
    el.onclick = open;
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  });
}
