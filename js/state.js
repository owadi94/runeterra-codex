// The player's progress, saved in this browser only.
import { $, toast } from './ui.js';

const KEY = 'codex';
const fresh = () => ({ visited: [], best: {}, daily: {}, xp: 0, played: 0, streak: 0, lastWin: -99 });

function load() {
  try { return { ...fresh(), ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) }; }
  catch { return fresh(); }
}

/** The one progress object. Change its fields, then call save(). */
export const progress = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* private mode: progress lasts this visit */ }
}

export function resetProgress() {
  Object.keys(progress).forEach(k => delete progress[k]);
  Object.assign(progress, fresh());
  save(); updateProfile();
}

export const RANKS = [[0, 'Wandering Novice'], [60, 'Archive Initiate'], [180, 'Lorekeeper'], [400, 'Keeper of the Library'], [800, 'Voice of the Codex']];
export const rankIdx = xp => RANKS.filter(r => xp >= r[0]).length - 1;

export function addXP(n) {
  const before = rankIdx(progress.xp);
  progress.xp += n; save(); updateProfile();
  const after = rankIdx(progress.xp);
  if (after > before) toast(`Rank up: ${RANKS[after][1]}`);
}

export function markRegionRead(id) {
  if (id === 'wanderers' || progress.visited.includes(id)) return;
  progress.visited.push(id); save();
  if (progress.visited.length === 13) toast('All thirteen regions read');
}

export function updateProfile() {
  const i = rankIdx(progress.xp);
  $('#pLvl').textContent = i + 1;
  $('#pRank').textContent = RANKS[i][1];
  $('#pXp').textContent = `${progress.xp} XP`;
}
