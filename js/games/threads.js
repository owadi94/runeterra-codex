// Threads: get from one champion to another by following who is bound to whom.
// Made to teach the bonds while you play: every option shows why the two are linked, a compass says after each move
// whether you got closer to the target, a hint can light up a good move, and the rounds grow from 2 links to 4.
import { $, esc, pick } from '../ui.js';
import { iconFor } from '../riot.js';
import { BOND } from '../data/lore.js';
import { getGraph, bondText, shortestPath } from '../graph.js';
import { register, render, board, hud, nextButton, onNext, finish } from './engine.js';

const ROUNDS = 3, MAX_STEPS = 10;
const DISTANCE = [[2, 2], [3, 3], [3, 4]];          // links between start and target, round by round

/** Distances over the graph, counting only bonds we have explained (so a readable route always exists), or all links. */
function distances(from, explainedOnly) {
  const { adj } = getGraph(), dist = { [from]: 0 }, queue = [from];
  while (queue.length) {
    const s = queue.shift();
    for (const { o, e } of adj[s]) if (dist[o] == null && (!explainedOnly || e.txt)) { dist[o] = dist[s] + 1; queue.push(o); }
  }
  return dist;
}

function newRound(st) {
  const { nodes, adj } = getGraph(), [lo, hi] = DISTANCE[Math.min(st.round, DISTANCE.length - 1)];
  for (let i = 0; i < 400; i++) {
    const a = pick(nodes);
    if (!adj[a.slug].some(x => x.e.txt)) continue;
    const told = distances(a.slug, true), all = distances(a.slug, false);
    const far = Object.keys(told).filter(s => told[s] >= lo && told[s] <= hi && all[s] >= lo);   // no shortcut through a vague link
    if (!far.length) continue;
    const target = pick(far);
    Object.assign(st, { start: a.slug, target, short: all[target], toTarget: distances(target, false),
      path: [a.slug], edges: [], hints: 0, hinted: null, scored: false, moved: null });
    return;
  }
}
const points = (reached, steps, short, hints) => Math.max(0, (!reached ? 0 : steps === short ? 3 : steps <= short + 2 ? 2 : 1) - hints);

/** A champion chip: icon and name. */
const chip = (G, s) => `<span class="step"><img alt="" src="${esc(iconFor(G.by[s]))}">${esc(G.by[s].name)}</span>`;

register({
  id: 'threads',
  init: () => ({ round: 0, score: 0, start: null }),
  render(st) {
    const G = getGraph();
    if (st.round >= ROUNDS) return finish(st.score, ROUNDS * 3, 'Three points for the shortest route, two if you were close, one for getting there at all, minus one for each hint.');
    if (!st.start) newRound(st);

    const cur = st.path[st.path.length - 1], target = G.by[st.target], steps = st.path.length - 1, left = st.toTarget[cur];
    // the route so far, each link labelled with its bond
    const pathHTML = `<div class="path">${st.path.map((s, i) => {
      if (!i) return chip(G, s);
      const b = BOND[st.edges[i - 1].t];
      return `<span class="link" style="color:${b.c};border-color:${b.c}">${b.label}</span>${chip(G, s)}`;
    }).join('')}</div>`;
    const head = hud([['Round', `${st.round + 1}/${ROUNDS}`], ['Score', st.score], ['Steps', steps]]) +
      (st.round === 0 && !steps ? `<div class="howto"><b>How it works</b>Every champion is tied to others by a story: family, love, rivals, a mentor, an old enemy.
        Hop from one champion to someone they are tied to, and keep going until you reach the target. Each option says why they are linked,
        and the compass tells you if you are getting warmer.</div>` : '') +
      `<div class="goal"><img alt="" src="${esc(iconFor(target))}"><div class="stack" style="gap:var(--s1)"><span class="t-label">Reach this champion</span><span class="t-2">${esc(target.name)}</span></div>
        <span class="t-sm" style="margin-left:auto">Best possible: ${st.short} ${st.short === 1 ? 'link' : 'links'}</span></div>${pathHTML}`;

    const last = st.edges[st.edges.length - 1];
    const lastNote = last ? `<p class="note"><b>${esc(G.by[st.path[steps - 1]].name)} → ${esc(G.by[cur].name)}</b> (${BOND[last.t].label}): ${esc(bondText(last))}</p>` : '';

    if (cur === st.target || steps >= MAX_STEPS) {
      const reached = cur === st.target, pts = points(reached, steps, st.short, st.hints);
      if (!st.scored) { st.score += pts; st.scored = true; }
      const best = shortestPath(st.start, st.target);
      const bestHTML = best.map((s, i) => {
        if (!i) return chip(G, s);
        const e = G.adj[best[i - 1]].find(x => x.o === s).e, b = BOND[e.t];
        return `<span class="link" style="color:${b.c};border-color:${b.c}" title="${esc(bondText(e))}">${b.label}</span>${chip(G, s)}`;
      }).join('');
      board().innerHTML = head + lastNote + `<div class="stack"><p class="t-body">${reached
        ? `You reached ${esc(target.name)} in ${steps} ${steps === 1 ? 'step' : 'steps'}${st.hints ? ` with ${st.hints} ${st.hints === 1 ? 'hint' : 'hints'}` : ''}: ${pts} ${pts === 1 ? 'point' : 'points'}.`
        : 'Out of steps.'}</p><span class="t-label">One shortest route</span><div class="path">${bestHTML}</div>
        <div class="row">${nextButton(st.round + 1 >= ROUNDS, 'Next thread')}</div></div>`;
      onNext(() => { st.round++; st.start = null; render(); });
      return;
    }

    // the compass: how far the target is now, and whether the last move helped
    const before = steps ? st.toTarget[st.path[steps - 1]] : null;
    const feel = before == null ? ['start', 'Your thread starts here.'] : left < before ? ['warm', 'Warmer, that took you closer.'] : left > before ? ['cold', 'Colder, that took you further away.'] : ['same', 'Same distance as before.'];
    const compass = `<div class="compass ${feel[0]}"><span class="t-label">Compass</span><b>${left} ${left === 1 ? 'link' : 'links'} to ${esc(target.name)}</b><span>${feel[1]}</span></div>`;

    const options = G.adj[cur].slice().sort((a, b) => (!a.e.txt) - (!b.e.txt) || G.by[a.o].name.localeCompare(G.by[b.o].name));
    board().innerHTML = head + compass + lastNote + `<p class="prompt">From ${esc(G.by[cur].name)}, who do you follow?</p>
      <div class="choices threads">${options.map(x => {
        const b = BOND[x.e.t], visited = st.path.includes(x.o);
        return `<button class="choice${st.hinted === x.o ? ' hint' : ''}" data-o="${esc(x.o)}"${visited ? ' data-visited' : ''}>
          <img class="icon" alt="" src="${esc(iconFor(G.by[x.o]))}"><span class="who">${esc(G.by[x.o].name)}${visited ? ' <em>(been here)</em>' : ''}</span>
          <span class="ttype" style="color:${b.c}">${b.label}</span><span class="why">${esc(bondText(x.e))}</span></button>`;
      }).join('')}</div>
      <div class="row">${steps ? '<button class="btn secondary" id="back">Step back</button>' : ''}
        <button class="btn secondary" id="hint"${st.hinted ? ' disabled' : ''}>Hint (−1 point)</button></div>`;
    board().querySelectorAll('.choice').forEach(btn => { btn.onclick = () => {
      const x = options.find(o => o.o === btn.dataset.o);
      st.path.push(x.o); st.edges.push(x.e); st.hinted = null; render();
    }; });
    $('#hint').onclick = () => {                  // light up a move on a shortest route from here
      const good = options.filter(x => st.toTarget[x.o] === left - 1);
      st.hinted = (good.find(x => x.e.txt) || good[0]).o; st.hints++; render();
    };
    if (steps) $('#back').onclick = () => { st.path.pop(); st.edges.pop(); st.hinted = null; render(); };
  },
});
