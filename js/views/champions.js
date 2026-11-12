// Champions list: every champion, with search and a region filter.
import { $, $$, esc, norm } from '../ui.js';
import { UNIV, uFailed } from '../riot.js';
import { GROUPS } from '../data/lore.js';
import { champTile } from '../components.js';

let filter = 'all';
const membersOf = g => (UNIV ? UNIV.filter(c => c.faction === g.u) : []);

export function enterChampions() {
  const box = $('#rosterFilters');
  if (!box.children.length) {
    box.innerHTML = [{ id: 'all', name: 'All', hue: 'var(--gold-2)' }, ...GROUPS].map(g =>
      `<button class="chip" data-f="${g.id}" aria-pressed="false"><i class="swatch" style="background:${g.hue}"></i>${esc(g.name)}<span class="n num"></span></button>`).join('');
    $$('.chip', box).forEach(b => { b.onclick = () => { filter = b.dataset.f; draw(); }; });
    $('#rosterSearch').oninput = draw;
  }
  draw();
}
export const refreshChampions = draw;

function draw() {
  /* Buttons update in place, so keyboard focus stays where it was. */
  $$('#rosterFilters .chip').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.f === filter);
    const g = GROUPS.find(x => x.id === b.dataset.f);
    $('.n', b).textContent = UNIV ? ` ${g ? membersOf(g).length : UNIV.length}` : '';
  });
  const roster = $('#roster'), count = $('#rosterCount');
  if (!UNIV) {
    roster.innerHTML = `<p class="empty" style="grid-column:1/-1">${uFailed ? "We couldn't reach Riot's champion list. Check your connection, then reload the page." : 'Loading every champion from Riot…'}</p>`;
    count.textContent = '';
    return;
  }
  const raw = $('#rosterSearch').value.trim(), q = norm(raw), g = GROUPS.find(x => x.id === filter);
  const list = UNIV.filter(u => (!g || u.faction === g.u) && (!q || norm(u.name).includes(q)));
  count.textContent = `${list.length} of ${UNIV.length} champions`;
  if (list.length) { roster.innerHTML = list.map(u => champTile(u)).join(''); return; }

  const elsewhere = g && q ? UNIV.filter(u => norm(u.name).includes(q)).length : 0;
  roster.innerHTML = `<div class="empty" style="grid-column:1/-1;display:flex;flex-direction:column;gap:12px;align-items:center">
    <p>No ${g ? esc(g.name) + ' ' : ''}champion matches “${esc(raw)}”.${elsewhere ? ` ${elsewhere} ${elsewhere === 1 ? 'champion matches' : 'champions match'} in other regions.` : ''}</p>
    <div class="row" style="justify-content:center">${elsewhere ? '<button class="btn secondary" id="rAll">Search all regions</button>' : ''}<button class="btn secondary" id="rClear">Clear search</button></div></div>`;
  if (elsewhere) $('#rAll').onclick = () => { filter = 'all'; draw(); };
  $('#rClear').onclick = () => { $('#rosterSearch').value = ''; draw(); $('#rosterSearch').focus(); };
}
