// Blitz: titles, homelands and lore. As many as you can in sixty seconds.
import { $, esc, cap, shuffle } from '../ui.js';
import { CHAMPS, ddReady } from '../riot.js';
import { QUIZ, REGIONS } from '../data/lore.js';
import { register, render, board, hud, textOptions, lockAnswers, later, every, finish, lookalikes } from './engine.js';

const SECONDS = 60;

function questions() {
  const lore = QUIZ.map(q => ({ q: q.q, a: q.a, o: q.o }));
  const homes = REGIONS.flatMap(r => r.champs.map(c => ({ q: `Where does ${c} come from?`, a: r.name, o: [r.name, ...shuffle(REGIONS.filter(x => x !== r)).slice(0, 3).map(x => x.name)] })));
  const titles = ddReady ? shuffle(CHAMPS).slice(0, 40).map(c => ({ q: `Who is “${cap(c.title)}”?`, a: c.name, o: [c.name, ...lookalikes(c, 3).map(x => x.name)] })) : [];
  return shuffle([...lore, ...homes, ...titles]);
}

const secondsLeft = st => Math.max(0, Math.ceil((st.end - Date.now()) / 1000));
const barWidth = st => Math.max(0, (st.end - Date.now()) / (SECONDS * 10));

function tick(st) {
  if (st.phase !== 'run') return;
  const s = $('#secs'), bar = $('#tbar');
  if (s) s.textContent = secondsLeft(st);
  if (bar) bar.style.width = barWidth(st) + '%';
  if (Date.now() >= st.end) {
    st.phase = 'over';
    finish(st.score, Math.max(st.answered, 1), `${st.score} right out of ${st.answered} in sixty seconds.`);
  }
}

register({
  id: 'blitz',
  init: () => ({ phase: 'ready' }),
  render(st) {
    if (st.phase === 'ready') {
      board().innerHTML = `<div class="result"><p class="prompt">Sixty seconds. Titles, homelands and lore, one after another.</p><p class="t-body">A right answer scores a point. A wrong one only costs you time.</p><div class="row"><button class="btn" id="go">Start the clock</button></div></div>`;
      $('#go').onclick = () => {
        Object.assign(st, { phase: 'run', score: 0, answered: 0, end: Date.now() + SECONDS * 1000, pool: questions(), i: 0 });
        render(); every(() => tick(st), 200);
      };
      $('#go').focus();
      return;
    }
    if (st.phase !== 'run') return;
    const it = st.pool[st.i % st.pool.length];
    board().innerHTML = hud([['Score', st.score], ['Answered', st.answered], ['Time', `<span id="secs">${secondsLeft(st)}</span>s`]]) +
      `<div class="timer"><i id="tbar" style="width:${barWidth(st)}%"></i></div><p class="prompt">${esc(it.q)}</p>${textOptions(shuffle(it.o))}`;
    board().querySelectorAll('.option').forEach(b => { b.onclick = () => {
      if (st.phase !== 'run') return;
      const ok = lockAnswers(it.a, b); st.answered++; if (ok) st.score++;
      later(() => { if (st.phase === 'run') { st.i++; render(); } }, ok ? 300 : 700);
    }; });
  },
});
