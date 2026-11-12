// Shared game engine: one game runs at a time, with its own state and timers.
import { $, esc, shuffle } from '../ui.js';
import { CHAMPS, ddReady, ddFailed } from '../riot.js';
import { progress, save, addXP } from '../state.js';
import { GAMES } from '../data/games.js';
import { icon } from '../components.js';
import { to } from '../router.js';

const registry = {};
/** A game module: { id, init(): state, render(state) }. */
export const register = game => { registry[game.id] = game; };

/** The running game. `token` changes every time a game starts, so late async work can tell it is stale. */
export const run = { id: null, st: null, token: 0 };

const timers = new Set();
export function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; }
export function every(fn, ms) { const t = setInterval(fn, ms); timers.add(t); return t; }
export function stopTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers.clear(); }

export const board = () => $('#game');

export function startGame(id) {
  stopTimers();
  run.id = id; run.token++; run.st = registry[id].init();
  render();
}
export const render = () => registry[run.id].render(run.st);

/** True while this round of this game is still the one on screen. */
export const isCurrent = token => token === run.token;

/* ---- Pieces games share ---- */
export const hud = parts => `<div class="hud">${parts.map(([k, v]) => `<span class="tag">${k}<b class="num">${v}</b></span>`).join('')}</div>`;
export const textOptions = list => `<div class="options">${list.map(o => `<button class="option" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
export const champChoices = list => `<div class="choices">${list.map(c => `<button class="choice" data-o="${esc(c.id)}">${icon(c.id)}<span>${esc(c.name)}</span></button>`).join('')}</div>`;
export const nextButton = (last, label) => `<button class="btn" id="go">${last ? 'See your result' : label}</button>`;

/** Disable all answers, mark the right one, and the clicked one if it was wrong. Returns true when right. */
export function lockAnswers(answer, clicked) {
  board().querySelectorAll('.option,.choice').forEach(x => { x.disabled = true; if (x.dataset.o === answer) x.classList.add('right'); });
  const ok = clicked.dataset.o === answer;
  if (!ok) clicked.classList.add('wrong');
  return ok;
}

/** Wire the "next" button and focus it. */
export function onNext(fn) { const b = $('#go'); b.onclick = fn; b.focus(); }

/** Games that need Riot's champion list wait for it here. Returns true while waiting. */
export function waitForChampions() {
  if (ddReady) return false;
  board().innerHTML = ddFailed
    ? `<p class="banner-msg">This game needs Riot's champion data, and we couldn't reach their servers. Check your connection, then reload the page.</p>`
    : `<p class="t-body">Loading champion data from Riot…</p>`;
  if (!ddFailed) later(render, 400);
  return true;
}

/** A champion not used yet in this game (keeps a `used` set on the state). */
export function freshChampion(st) {
  st.used = st.used || new Set();
  const pool = CHAMPS.filter(c => !st.used.has(c.id));
  const c = (pool.length ? pool : CHAMPS)[Math.floor(Math.random() * (pool.length || CHAMPS.length))];
  st.used.add(c.id);
  return c;
}

/** n other champions, preferring the same main role so the choice is harder. */
export function lookalikes(c, n) {
  const same = CHAMPS.filter(x => x.id !== c.id && x.tags[0] === c.tags[0]);
  return shuffle(same.length >= n ? same : CHAMPS.filter(x => x.id !== c.id)).slice(0, n);
}

const verdict = p => (p >= 90 ? 'Flawless' : p >= 70 ? 'Well played' : p >= 40 ? 'Getting there' : 'Keep practising');
const nextGame = () => { const l = GAMES.filter(g => g.id !== 'daily'), i = l.findIndex(g => g.id === run.id); return l[(i + 1) % l.length]; };

/** Show the result screen, save the best score and award XP. Blitz scores by count, the rest by percent. */
export function finish(score, max, note = '') {
  stopTimers();
  const id = run.id, pct = max ? Math.round((score / max) * 100) : 0;
  const metric = id === 'blitz' ? score : pct, prev = progress.best[id], record = prev == null || metric > prev;
  if (record) progress.best[id] = metric;
  progress.played++; save();
  const xp = id === 'blitz' ? 5 + score * 2 : 5 + Math.round(pct / 10) * 2;
  addXP(xp);
  const nx = nextGame();
  board().innerHTML = `<div class="result"><span class="t-label">Game complete · +${xp} XP</span>
    <div class="row" style="gap:var(--s5);align-items:baseline"><span class="score">${score}<small> / ${max}</small></span><h3 class="t-2">${verdict(pct)}</h3></div>
    ${note ? `<p class="t-body">${esc(note)}</p>` : ''}
    <p class="t-sm">${record && prev != null ? 'New personal best. ' : ''}Your best: ${id === 'blitz' ? `${progress.best[id]} correct` : `${progress.best[id]}%`}</p>
    <div class="row"><button class="btn" id="again">Play again</button><a class="btn secondary" href="${to.game(nx.id)}">Next: ${esc(nx.name)}</a></div></div>`;
  const again = $('#again'); again.onclick = () => startGame(id); again.focus();
}
