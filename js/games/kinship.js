// Kinship: a memory game. Flip cards to match siblings, rivals and old partners.
import { esc, bg, shuffle } from '../ui.js';
import { idOf, loading } from '../riot.js';
import { PAIRS } from '../data/lore.js';
import { register, render, board, hud, later, finish } from './engine.js';

const PAIR_COUNT = 6;

function deal() {
  const pairs = shuffle(PAIRS).slice(0, PAIR_COUNT);
  return { pairs, cards: shuffle(pairs.flatMap((p, pi) => [{ n: p[0], pi }, { n: p[1], pi }])), open: [], matched: [], moves: 0, locked: false };
}
/* Six moves is perfect; every two extra moves costs a point. */
const scoreFor = moves => Math.max(0, Math.min(PAIR_COUNT, PAIR_COUNT - Math.floor((moves - PAIR_COUNT) / 2)));

function flip(st, i) {
  const c = st.cards[i];
  if (st.locked || st.open.includes(i) || st.matched.includes(c.pi)) return;
  st.open.push(i);
  if (st.open.length < 2) return render();
  st.moves++;
  const [a, b] = st.open.map(k => st.cards[k]);
  if (a.pi === b.pi) {
    st.matched.push(a.pi); st.open = []; render();
    if (st.matched.length === PAIR_COUNT) later(() => finish(scoreFor(st.moves), PAIR_COUNT, `All six pairs in ${st.moves} moves. Six is perfect.`), 1000);
    return;
  }
  st.locked = true; render();
  later(() => { st.open = []; st.locked = false; render(); }, 1000);
}

register({
  id: 'kinship',
  init: deal,
  render(st) {
    board().innerHTML = hud([['Pairs', `${st.matched.length}/${PAIR_COUNT}`], ['Moves', st.moves]]) +
      `<div class="kgrid">${st.cards.map((c, i) => {
        const up = st.open.includes(i) || st.matched.includes(c.pi);
        return `<button class="kcard${up ? ' up' : ''}${st.matched.includes(c.pi) ? ' done' : ''}" data-i="${i}" aria-label="${up ? esc(c.n) : 'Hidden card'}"><span class="in"><span class="b"><svg width="34" height="34" style="color:var(--gold-4)"><use href="#mark"/></svg></span><span class="f art" style="${bg(loading(idOf(c.n)))}"><span>${esc(c.n)}</span></span></span></button>`;
      }).join('')}</div>
      <ul class="klog">${st.matched.slice().reverse().map(pi => { const p = st.pairs[pi]; return `<li><b>${esc(p[0])} & ${esc(p[1])}</b> · ${esc(p[2])}</li>`; }).join('') || '<li>Find the two champions who belong together.</li>'}</ul>`;
    board().querySelectorAll('.kcard').forEach(b => { b.onclick = () => flip(st, +b.dataset.i); });
  },
});
