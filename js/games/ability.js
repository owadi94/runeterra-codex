// Ability Check: see an ability icon, pick its champion, then name its key.
import { $, esc, bg, shuffle } from '../ui.js';
import { championDetail, spellIcon, passiveIcon } from '../riot.js';
import { icon } from '../components.js';
import { register, render, run, isCurrent, board, hud, champChoices, textOptions, nextButton, onNext, lockAnswers, later, finish, waitForChampions, freshChampion, lookalikes } from './engine.js';

const ROUNDS = 8;
const KEYS = ['Q', 'W', 'E', 'R'];

async function loadQuestion(st) {
  const token = run.token;
  st.loading = true;
  board().innerHTML = hud([['Round', `${st.round + 1}/${ROUNDS}`], ['Score', st.score]]) + `<p class="t-body">Loading an ability…</p>`;
  const c = freshChampion(st);
  try {
    const full = await championDetail(c.id);
    if (!isCurrent(token)) return;           // the player left or restarted while this was loading
    const k = Math.floor(Math.random() * 5);
    st.q = k < 4
      ? { c, key: KEYS[k], name: full.spells[k].name, img: spellIcon(full.spells[k].image.full) }
      : { c, key: 'Passive', name: full.passive.name, img: passiveIcon(full.passive.image.full) };
    st.opts = shuffle([c, ...lookalikes(c, 3)]);
    st.phase = 'champ';
  } catch {
    if (!isCurrent(token)) return;
    board().innerHTML = `<p class="banner-msg">We couldn't load this ability from Riot's servers.</p><div class="row"><button class="btn" id="go">Try another</button></div>`;
    onNext(() => render());
    st.loading = false;
    return;
  }
  st.loading = false;
  render();
}

register({
  id: 'ability',
  init: () => ({ round: 0, score: 0, q: null }),
  render(st) {
    if (waitForChampions()) return;
    if (st.round >= ROUNDS) return finish(st.score, ROUNDS * 2, 'One point for the right champion, one more for the right key.');
    if (!st.q) { if (!st.loading) loadQuestion(st); return; }

    const q = st.q;
    const label = st.phase === 'champ' ? 'Whose ability is this?' : st.phase === 'key' ? 'Which key is it on?' : `${esc(q.c.name)} · ${q.key}`;
    board().innerHTML = hud([['Round', `${st.round + 1}/${ROUNDS}`], ['Score', st.score]]) +
      `<div class="ability"><span class="icon lg art" style="${bg(q.img)}" role="img" aria-label="Ability icon"></span><div class="stack" style="gap:var(--s1)"><span class="t-label">${label}</span><span class="t-2">${st.phase === 'done' ? esc(q.name) : '???'}</span></div></div><div id="area"></div>`;

    if (st.phase === 'champ') {
      $('#area').innerHTML = champChoices(st.opts);
      board().querySelectorAll('.choice').forEach(b => { b.onclick = () => {
        const ok = lockAnswers(q.c.id, b); if (ok) st.score++; st.champOk = ok;
        later(() => { st.phase = 'key'; render(); }, ok ? 500 : 1100);
      }; });
    } else if (st.phase === 'key') {
      $('#area').innerHTML = `<p class="t-sm">${st.champOk ? 'Right champion. ' : `It belongs to ${esc(q.c.name)}. `}Now the key for a bonus point.</p>` + textOptions(['Passive', ...KEYS]);
      board().querySelectorAll('.option').forEach(b => { b.onclick = () => {
        const ok = lockAnswers(q.key, b); if (ok) st.score++;
        later(() => { st.phase = 'done'; render(); }, ok ? 500 : 1000);
      }; });
    } else {
      $('#area').innerHTML = `<div class="between"><div class="row">${icon(q.c.id)}<p class="note">${esc(q.name)} is ${esc(q.c.name)}'s ${q.key === 'Passive' ? 'passive' : `${q.key} ability`}.</p></div>${nextButton(st.round + 1 >= ROUNDS, 'Next ability')}</div>`;
      onNext(() => { st.round++; st.q = null; render(); });
    }
  },
});
