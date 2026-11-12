// Explore: choose a city, then walk through it in 3D.
import { $, esc, bg } from '../ui.js';
import { idOf, splash } from '../riot.js';
import { REGIONS } from '../data/lore.js';
import { CITIES } from '../data/cities.js';
import { progress } from '../state.js';
import { to } from '../router.js';

const BUILDERS = { 'demacia-capital': () => import('../explore/demacia.js').then(m => m.buildDemacia) };
let close = null;

/** Called when leaving any page, so a city never keeps running in the background. */
export function leaveCity() { if (close) { close(); close = null; } }

export function enterExplore() {
  leaveCity();
  $('#exploreList').innerHTML = CITIES.map(c => {
    const r = REGIONS.find(x => x.id === c.region), seen = progress.explore && progress.explore[c.id] ? Object.keys(progress.explore[c.id]).length : 0;
    const total = c.landmarks ? c.landmarks.length : 0;
    const inner = `<div class="pic art" style="${bg(splash(idOf(r.key)))}"><span class="tag gold">${esc(r.name)}</span></div>
      <div class="body"><h3 class="t-3">${esc(c.name)}</h3><p>${esc(c.blurb)}</p>
      <div class="foot"><span>${c.ready ? `${total} landmarks` : 'Coming next'}</span><span>${c.ready ? (seen ? `<b>${seen}</b> found` : 'Not visited') : ''}</span></div></div>`;
    return c.ready ? `<a class="card" href="${to.city(c.id)}">${inner}</a>` : `<div class="card soon" aria-disabled="true">${inner}</div>`;
  }).join('');
}

export async function enterCity({ id }) {
  leaveCity();
  const city = CITIES.find(c => c.id === id && c.ready);
  const host = $('#cityHost');
  if (!city) { location.hash = to.explore; return; }
  try {
    const build = await BUILDERS[id]();
    if (location.hash !== to.city(id)) return;          // the player left while it loaded
    const { openCity } = await import('../explore/engine.js');
    close = await openCity(host, city, build);
    if (location.hash !== to.city(id)) leaveCity();
  } catch (e) {
    host.innerHTML = `<div class="x-loading"><p class="banner-msg">This city needs 3D graphics (WebGL), and it couldn't start in this browser. Try a recent Chrome, Edge, Firefox or Safari.</p><a class="btn secondary" href="${to.explore}">Back to cities</a></div>`;
    console.error(e);
  }
}

export const cityName = id => (CITIES.find(c => c.id === id) || {}).name || 'Explore';
