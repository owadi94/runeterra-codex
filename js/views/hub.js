// Games list and the player's record; also the game screen itself.
import { $, esc, bg } from '../ui.js';
import { splash } from '../riot.js';
import { progress, RANKS, rankIdx } from '../state.js';
import { GAMES } from '../data/games.js';
import { to } from '../router.js';
import { liveStreak } from '../games/daily.js';
import { startGame } from '../games/engine.js';

const bestLabel = id => {
  if (id === 'daily') return liveStreak() ? `Streak <b>${liveStreak()}</b>` : 'New every day';
  const b = progress.best[id];
  return b == null ? 'Not played' : id === 'blitz' ? `Best <b>${b}</b>` : `Best <b>${b}%</b>`;
};

export const gameCard = g => `<a class="card" href="${to.game(g.id)}"><div class="pic art" style="${bg(splash(g.art))}"><span class="tag gold">${g.kind}</span></div>
  <div class="body"><h3 class="t-3">${esc(g.name)}</h3><p>${esc(g.blurb)}</p><div class="foot"><span>${g.len}</span><span>${bestLabel(g.id)}</span></div></div></a>`;

export function enterHub() {
  const i = rankIdx(progress.xp), next = RANKS[i + 1], low = RANKS[i][0];
  const pct = next ? Math.round(((progress.xp - low) / (next[0] - low)) * 100) : 100;
  $('#record').innerHTML = `<div><span class="t-label">Level ${i + 1}</span><span class="t-2">${RANKS[i][1]}</span><div class="meter"><i style="width:${pct}%"></i></div><span class="t-sm">${next ? `${next[0] - progress.xp} XP to ${next[1]}` : 'Highest rank reached'}</span></div>
    <div><span class="t-label">XP</span><span class="v">${progress.xp}</span></div>
    <div><span class="t-label">Streak</span><span class="v">${liveStreak()}</span></div>
    <div><span class="t-label">Regions</span><span class="v">${progress.visited.length}<span class="t-sm"> / 13</span></span></div>`;
  $('#allGames').innerHTML = GAMES.map(gameCard).join('');
}

export const gameName = id => (GAMES.find(g => g.id === id) || {}).name;

export function enterGame({ id }) {
  const g = GAMES.find(x => x.id === id);
  if (!g) { location.hash = to.games; return; }
  $('#stageTitle').textContent = g.name;
  $('#stageBlurb').textContent = g.blurb;
  $('#stageArt').setAttribute('style', bg(splash(g.art)));
  startGame(id);
}
