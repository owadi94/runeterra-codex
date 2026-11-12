// Daily Riddle: the same champion for every player each day. Four clues, four guesses.
import { $, esc, norm, bg, copyText, toast } from '../ui.js';
import { idOf, splash, slugOf } from '../riot.js';
import { progress, save, addXP } from '../state.js';
import { CLUES } from '../data/lore.js';
import { mountPicker } from '../components.js';
import { to } from '../router.js';
import { register, render, board, hud } from './engine.js';

const EPOCH = Date.UTC(2026, 10, 1);
const today = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
export const dayNumber = () => Math.floor((today() - EPOCH) / 864e5) + 1;
export const dailyPick = () => CLUES[(dayNumber() * 7) % CLUES.length];
export const dailyRecord = () => progress.daily[dayNumber()] || { guesses: [], done: false, won: false };
/** The streak only counts if yesterday or today was solved. */
export const liveStreak = () => (progress.lastWin >= dayNumber() - 1 ? progress.streak : 0);

const isRight = (guess, answer) => norm(guess) === norm(answer);

/** The small riddle card on the home page. */
export function dailyCard() {
  const it = dailyPick(), rec = dailyRecord();
  const pips = [0, 1, 2, 3].map(k => { const g = rec.guesses[k]; return g === undefined ? '<i></i>' : isRight(g, it.a) ? '<i class="win"></i>' : '<i class="miss"></i>'; }).join('');
  return `<div class="between"><span class="t-label">Daily Riddle · No. ${dayNumber()}</span><span class="tag">Streak <b class="num" style="color:var(--gold-1);margin-left:4px">${liveStreak()}</b></span></div>
    <p class="t-sm">Who is speaking?</p><p class="quote">“${esc(it.c[0])}”</p><div class="pips">${pips}</div>
    ${rec.done
      ? `<p class="t-sm">${rec.won ? `Solved with ${rec.guesses.length} of 4 clues.` : `Today's answer was ${esc(it.a)}.`} A new riddle starts at midnight.</p><a class="btn secondary" href="${to.game('daily')}">See today's result</a>`
      : `<a class="btn" href="${to.game('daily')}">Answer the riddle</a>`}`;
}

function guess(name) {
  const it = dailyPick(), n = dayNumber(), rec = dailyRecord();
  rec.guesses.push(name);
  if (isRight(name, it.a)) {
    rec.done = true; rec.won = true;
    progress.streak = progress.lastWin === n - 1 ? progress.streak + 1 : 1;
    progress.lastWin = n;
    progress.daily[n] = rec; save();
    addXP(30 - rec.guesses.length * 5);
    toast('Solved. See you tomorrow');
  } else {
    if (rec.guesses.length >= 4) rec.done = true;
    progress.daily[n] = rec; save();
  }
  render();
}

register({
  id: 'daily',
  init: () => ({}),
  render() {
    const it = dailyPick(), n = dayNumber(), rec = dailyRecord(), shown = rec.done ? 4 : Math.min(4, rec.guesses.length + 1);
    const now = new Date(), ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const hh = Math.floor(ms / 36e5), mm = Math.floor((ms % 36e5) / 6e4);
    board().innerHTML = hud([['Riddle', `No. ${n}`], ['Guesses', `${rec.guesses.length}/4`], ['Streak', liveStreak()]]) +
      `<p class="prompt">Who is speaking?</p>
      <ol class="clues">${it.c.map((c, k) => `<li class="${k < shown ? '' : 'locked'}"><span class="t-label">Clue ${k + 1}</span><span>${k < shown ? esc(c) : 'Unlocks after a wrong guess'}</span></li>`).join('')}</ol>
      ${rec.guesses.length ? `<div class="row">${rec.guesses.map(g => `<span class="tag ${isRight(g, it.a) ? 'good' : 'bad'}">${esc(g)}</span>`).join('')}</div>` : ''}
      <div id="area"></div>`;

    if (rec.done) {
      $('#area').innerHTML = `<div class="reveal"><div class="pic art" style="${bg(splash(idOf(it.a)))}"></div><div class="body">
        <span class="t-label">${rec.won ? `Solved with ${rec.guesses.length} of 4 clues` : "Today's answer"}</span><h3 class="t-1">${esc(it.a)}</h3>
        <p class="t-sm">A new riddle starts in ${hh} h ${mm} min. ${rec.won ? `Your streak is ${liveStreak()}.` : 'Your streak starts again tomorrow.'}</p>
        <div class="row"><button class="btn" id="share">Copy my result</button><a class="btn secondary" href="${to.champion(esc(slugOf(it.a)))}">Read ${esc(it.a)}'s story</a></div><span class="t-sm" id="shareOk"></span></div></div>`;
      $('#share').onclick = () => {
        const squares = [0, 1, 2, 3].map(k => { const g = rec.guesses[k]; return g === undefined ? '⬜' : isRight(g, it.a) ? '🟩' : '🟥'; }).join('');
        copyText(`Runeterra Codex · Daily Riddle No. ${n}\n${squares}`, $('#shareOk'));
      };
      return;
    }
    $('#area').innerHTML = `<div class="row" style="align-items:flex-start"><div id="pkRoot" style="flex:1;min-width:240px"></div><button class="btn secondary" id="skip">Skip to next clue</button></div>`;
    $('#skip').onclick = () => guess('Skipped');
    mountPicker($('#pkRoot'), (c, msg) => {
      if (rec.guesses.some(g => isRight(g, c.name))) { msg.textContent = 'You already tried that one.'; return; }
      guess(c.name);
    }, "Type a champion's name");
  },
});
