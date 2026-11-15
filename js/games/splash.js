// Splash Zoom: name the champion from a close-up of their splash art (the original or one of their skins). Every miss zooms out.
import { $, esc } from '../ui.js';
import { splash, championDetail } from '../riot.js';
import { mountPicker } from '../components.js';
import { register, render, run, isCurrent, board, hud, nextButton, onNext, finish, waitForChampions, freshChampion } from './engine.js';

const ZOOM = [4, 3.1, 2.3, 1.6, 1];
const ROUNDS = 5;
const SKIN_CHANCE = 0.7;                   // most rounds use a skin; the rest the original splash


/** Where the close-up looks. Splash art puts the face in the upper middle, so the first look is kept off it:
 *  usually a side of the picture (weapon, clothing, effects), sometimes the lower middle. Later zoom-outs reveal more. */
function focus() {
  const r = Math.random;
  if (r() < 0.75) return { px: r() < 0.5 ? 6 + r() * 24 : 70 + r() * 24, py: 25 + r() * 60 };
  return { px: 35 + r() * 30, py: 68 + r() * 26 };
}

/** Pick the art for this round: a random skin (or the original), preloaded so the round never shows a broken image. */
async function chooseArt(st, c) {
  const token = run.token;
  let skin = { num: 0, name: 'default' };
  try {
    const skins = ((await championDetail(c.id)).skins || []).filter(s => s.num > 0);
    if (skins.length && Math.random() < SKIN_CHANCE) skin = skins[Math.floor(Math.random() * skins.length)];
  } catch { /* detail failed to load: the original splash still works */ }
  const ok = await new Promise(res => { const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = splash(c.id, skin.num); });
  if (!ok) skin = { num: 0, name: 'default' };
  if (!isCurrent(token) || st.c !== c) return;   // the player left, restarted or moved on while this loaded
  st.skin = skin; render();
}

function newRound(st) {
  const c = freshChampion(st);
  Object.assign(st, { c, skin: null, z: 0, ...focus(), misses: [], done: false, won: false, got: 0 });
  chooseArt(st, c);
}

register({
  id: 'splash',
  init: () => ({ round: 0, score: 0 }),
  render(st) {
    if (waitForChampions()) return;
    if (st.round >= ROUNDS) return finish(st.score, ROUNDS * 5, 'You score 5 points for a first-look answer, down to 1 at full view. Most rounds use a skin, so look for the shape of a weapon or a pose, not the colours.');
    if (!st.c) newRound(st);
    const hudHTML = hud([['Round', `${st.round + 1}/${ROUNDS}`], ['Score', st.score], ['Worth', st.done ? '—' : `${5 - st.z} pts`]]);
    if (!st.skin) { board().innerHTML = hudHTML + '<div class="zoom" aria-busy="true"></div><p class="t-sm">Choosing a splash…</p>'; return; }

    const zoom = st.done ? 1 : ZOOM[st.z];
    // each zoom-out drifts the view toward the middle of the picture, so you see a little more each time
    const t = st.done ? 1 : st.z / (ZOOM.length - 1), px = st.px + (50 - st.px) * t, py = st.py + (25 - st.py) * t;
    board().innerHTML = hudHTML +
      `<div class="zoom" style="background-image:url('${splash(st.c.id, st.skin.num)}');background-size:${zoom * 100}% auto;background-position:${px}% ${py}%" role="img" aria-label="Close-up of a champion's splash art"></div>
      <div class="zoomsteps">${ZOOM.map((_, k) => `<i class="${k <= st.z ? 'on' : ''}"></i>`).join('')}</div>
      ${st.misses.length ? `<div class="row">${st.misses.map(m => `<span class="tag bad">${esc(m)}</span>`).join('')}</div>` : ''}
      <div id="area"></div>`;

    if (st.done) {
      const art = st.skin.num ? `in the <b>${esc(st.skin.name)}</b> skin` : 'in the original splash art';
      const who = `<b style="color:var(--gold-1)">${esc(st.c.name)}</b>, ${esc(st.c.title)}, ${art}`;
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
