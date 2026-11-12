// Title Match: match a champion's official title to the right champion.
import { $, esc, cap, shuffle } from '../ui.js';
import { register, render, board, hud, champChoices, nextButton, onNext, lockAnswers, finish, waitForChampions, freshChampion, lookalikes } from './engine.js';

const ROUNDS = 10;

register({
  id: 'titles',
  init: () => ({ round: 0, score: 0, c: null }),
  render(st) {
    if (waitForChampions()) return;
    if (st.round >= ROUNDS) return finish(st.score, ROUNDS);
    if (!st.c) { st.c = freshChampion(st); st.opts = shuffle([st.c, ...lookalikes(st.c, 3)]); }

    board().innerHTML = hud([['Title', `${st.round + 1}/${ROUNDS}`], ['Score', st.score]]) +
      `<p class="t-label">Who carries this title?</p><p class="prompt">“${esc(cap(st.c.title))}”</p>${champChoices(st.opts)}<div id="area"></div>`;
    board().querySelectorAll('.choice').forEach(b => { b.onclick = () => {
      const ok = lockAnswers(st.c.id, b); if (ok) st.score++;
      $('#area').innerHTML = `<div class="between"><p class="note">${ok ? 'Correct. ' : ''}${esc(st.c.name)} is ${esc(st.c.title)}.</p>${nextButton(st.round + 1 >= ROUNDS, 'Next title')}</div>`;
      onNext(() => { st.round++; st.c = null; render(); });
    }; });
  },
});
