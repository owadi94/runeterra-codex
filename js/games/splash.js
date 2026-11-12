// Splash Zoom: name the champion from a close-up of their splash art. Every miss zooms out.
import { $, esc } from '../ui.js';
import { splash } from '../riot.js';
import { mountPicker } from '../components.js';
import { register, render, board, hud, nextButton, onNext, finish, waitForChampions, freshChampion } from './engine.js';

const ZOOM = [3.6, 2.8, 2.1, 1.5, 1];
const ROUNDS = 5;

function newRound(st) {
  Object.assign(st, { c: freshChampion(st), z: 0, px: 30 + Math.random() * 40, py: 15 + Math.random() * 40, misses: [], done: false, won: false, got: 0 });
}

register({
  id: 'splash',
  init: () => ({ round: 0, score: 0 }),
  render(st) {
    if (waitForChampions()) return;
    if (st.round >= ROUNDS) return finish(st.score, ROUNDS * 5, 'You score 5 points for a first-look answer, down to 1 at full view.');
    if (!st.c) newRound(st);

    const zoom = st.done ? 1 : ZOOM[st.z];
    board().innerHTML = hud([['Round', `${st.round + 1}/${ROUNDS}`], ['Score', st.score], ['Worth', st.done ? '—' : `${5 - st.z} pts`]]) +
      `<div class="zoom" style="background-image:url('${splash(st.c.id)}');background-size:${zoom * 100}% auto;background-position:${st.done ? 'center 20%' : `${st.px}% ${st.py}%`}" role="img" aria-label="Close-up of a champion's splash art"></div>
      <div class="zoomsteps">${ZOOM.map((_, k) => `<i class="${k <= st.z ? 'on' : ''}"></i>`).join('')}</div>
      ${st.misses.length ? `<div class="row">${st.misses.map(m => `<span class="tag bad">${esc(m)}</span>`).join('')}</div>` : ''}
      <div id="area"></div>`;

    if (st.done) {
      const who = `<b style="color:var(--gold-1)">${esc(st.c.name)}</b>, ${esc(st.c.title)}`;
      $('#area').innerHTML = `<div class="between"><p class="note">${st.won ? `Correct. It's ${who}. +${st.got} points.` : `It was ${who}.`}</p>${nextButton(st.round + 1 >= ROUNDS, 'Next splash')}</div>`;
      onNext(() => { st.round++; st.c = null; render(); });
      return;
    }
    const miss = label => {
      st.misses.push(label);
      if (st.z >= ZOOM.length - 1) { st.done = true; st.won = false; } else st.z++;
      render();
    };
    $('#area').innerHTML = `<div class="row" style="align-items:flex-start"><div id="pkRoot" style="flex:1;min-width:240px"></div><button class="btn secondary" id="zo">Zoom out</button></div>`;
    $('#zo').onclick = () => miss('Skipped');
    mountPicker($('#pkRoot'), (c, msg) => {
      if (c.id === st.c.id) { st.got = 5 - st.z; st.score += st.got; st.done = true; st.won = true; render(); return; }
      if (st.misses.includes(c.name)) { msg.textContent = 'You already tried that one.'; return; }
      miss(c.name);
    }, 'Who is this?');
  },
});
