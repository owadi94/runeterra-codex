// Building blocks reused across pages and games.
import { $, esc, norm, bg } from './ui.js';
import { CHAMPS, square, iconFor, portraitFor } from './riot.js';
import { GROUPS, WANDERERS, FANART } from './data/lore.js';
import { to } from './router.js';

export const groupOf = u => GROUPS.find(g => g.u === u.faction) || WANDERERS;

/** Square champion icon as a block with a fallback gradient. */
export const icon = (id, cls = '') => `<span class="icon art ${cls}" style="${bg(square(id))}"></span>`;

/** A clickable champion: square icon (roster) or tall portrait (region page). */
export const champTile = (u, tall = false) =>
  `<a class="champ" href="${to.champion(esc(u.slug))}"><img loading="lazy" alt="" src="${esc(tall ? portraitFor(u) : iconFor(u))}"><b>${esc(u.name)}</b>${tall ? '' : `<small>${esc(groupOf(u).name)}</small>`}</a>`;

/** Fan art gallery for one region; empty string until art exists. */
export function gallery(regionId) {
  const list = FANART.filter(a => a.region === regionId);
  if (!list.length) return '';
  return `<section class="stack"><h3 class="t-3">Fan art</h3><div class="gallery">${list.map(a =>
    `<figure><img loading="lazy" src="${esc(a.src)}" alt="${esc(a.title)}"><figcaption><span class="t-label">${esc(a.kind)}</span>${esc(a.title)}</figcaption></figure>`).join('')}</div>
    <p class="src">Original fan art made for Runeterra Codex.</p></section>`;
}

/**
 * Champion search box with icons. Calls onPick(champion) when the player chooses one.
 * Enter picks the top match.
 */
export function mountPicker(root, onPick, placeholder = 'Search a champion') {
  root.innerHTML = `<div class="picker"><input class="field" id="pk" placeholder="${esc(placeholder)}" autocomplete="off" aria-label="${esc(placeholder)}"><ul class="pk-list" id="pkList" hidden></ul></div><p class="formmsg" id="pkMsg" role="alert"></p>`;
  const input = $('#pk', root), list = $('#pkList', root), msg = $('#pkMsg', root);
  let matches = [];
  const choose = c => { if (!c) return; input.value = ''; list.hidden = true; msg.textContent = ''; onPick(c, msg); };
  input.oninput = () => {
    const q = norm(input.value);
    if (!q) { list.hidden = true; matches = []; return; }
    matches = CHAMPS.filter(c => norm(c.name).startsWith(q))
      .concat(CHAMPS.filter(c => !norm(c.name).startsWith(q) && norm(c.name).includes(q))).slice(0, 8);
    list.innerHTML = matches.map((c, i) => `<li><button type="button" data-i="${i}" class="${i === 0 ? 'hl' : ''}">${icon(c.id, 'sm')}${esc(c.name)}</button></li>`).join('')
      || '<li class="t-sm" style="padding:8px 12px">No champion by that name</li>';
    list.hidden = false;
    list.querySelectorAll('button').forEach(b => { b.onclick = () => choose(matches[+b.dataset.i]); });
  };
  input.onkeydown = e => {
    if (e.key === 'Enter') { e.preventDefault(); matches[0] ? choose(matches[0]) : (msg.textContent = "Type a champion's name, then pick from the list."); }
    if (e.key === 'Escape') list.hidden = true;
  };
  input.focus({ preventScroll: true });
}
