// Homelands: name the region each champion comes from.
import { $, esc, bg, shuffle } from '../ui.js';
import { UNIV, idOf, loading, portraitFor } from '../riot.js';
import { REGIONS } from '../data/lore.js';
import { groupOf } from '../components.js';
import { register, render, board, hud, textOptions, nextButton, onNext, lockAnswers, finish } from './engine.js';

const ROUNDS = 10;

/* Riot's full list when it has loaded, otherwise the champions named in our own region data. Wanderers are left out. */
function pool() {
  return UNIV
    ? UNIV.filter(u => u.faction !== 'unaffiliated').map(u => ({ name: u.name, region: groupOf(u).name, art: portraitFor(u) }))
    : REGIONS.flatMap(r => r.champs.map(name => ({ name, region: r.name, art: loading(idOf(name)) })));
}

register({
  id: 'origins',
  init: () => ({ list: shuffle(pool()).slice(0, ROUNDS), i: 0, score: 0 }),
  render(st) {
    if (st.i >= st.list.length) return finish(st.score, st.list.length);
    const it = st.list[st.i];
    const opts = shuffle([it.region, ...shuffle(REGIONS.filter(r => r.name !== it.region)).slice(0, 3).map(r => r.name)]);
    board().innerHTML = hud([['Champion', `${st.i + 1}/${st.list.length}`], ['Score', st.score]]) +
      `<div class="split"><div class="portrait art" style="${bg(it.art)}" role="img" aria-label="${esc(it.name)}"></div>
       <div class="stack" style="gap:var(--s5);min-width:0"><p class="prompt">Where does ${esc(it.name)} come from?</p>${textOptions(opts)}<div id="area"></div></div></div>`;
    board().querySelectorAll('.option').forEach(b => { b.onclick = () => {
      const ok = lockAnswers(it.region, b); if (ok) st.score++;
      const r = REGIONS.find(x => x.name === it.region);
      $('#area').innerHTML = `<div class="between"><p class="note">${ok ? 'Correct. ' : ''}${esc(it.name)} comes from ${esc(it.region)}: ${esc(r.tag.toLowerCase())}.</p>${nextButton(st.i + 1 >= st.list.length, 'Next champion')}</div>`;
      onNext(() => { st.i++; render(); });
    }; });
  },
});
