// Lore Trial: eight questions on the history of Runeterra, each with the story behind it.
import { $, esc, shuffle } from '../ui.js';
import { QUIZ } from '../data/lore.js';
import { register, render, board, hud, textOptions, nextButton, onNext, lockAnswers, finish } from './engine.js';

const ROUNDS = 8;

register({
  id: 'trial',
  init: () => ({ list: shuffle(QUIZ).slice(0, ROUNDS), i: 0, score: 0 }),
  render(st) {
    if (st.i >= st.list.length) return finish(st.score, st.list.length);
    const it = st.list[st.i];
    board().innerHTML = hud([['Question', `${st.i + 1}/${st.list.length}`], ['Score', st.score]]) +
      `<p class="prompt">${esc(it.q)}</p>${textOptions(shuffle(it.o))}<div id="area"></div>`;
    board().querySelectorAll('.option').forEach(b => { b.onclick = () => {
      const ok = lockAnswers(it.a, b); if (ok) st.score++;
      $('#area').innerHTML = `<div class="between"><p class="note">${ok ? 'Correct. ' : 'Not quite. '}${esc(it.e)}</p>${nextButton(st.i + 1 >= st.list.length, 'Next question')}</div>`;
      onNext(() => { st.i++; render(); });
    }; });
  },
});
