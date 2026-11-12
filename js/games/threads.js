// Threads: get from one champion to another by following who is bound to whom.
import { $, esc, pick } from '../ui.js';
import { iconFor } from '../riot.js';
import { BOND } from '../data/lore.js';
import { getGraph, bfs, bondText, shortestPath } from '../graph.js';
import { register, render, board, hud, nextButton, onNext, finish } from './engine.js';

const ROUNDS = 3, MAX_STEPS = 10;

/** A start and target 2 to 4 steps apart. */
function newRound(st) {
  const { nodes, adj } = getGraph();
  for (let i = 0; i < 300; i++) {
    const a = pick(nodes);
    if (!adj[a.slug].length) continue;
    const far = Object.entries(bfs(a.slug).dist).filter(([, k]) => k >= 2 && k <= 4);
    if (!far.length) continue;
    const [target, short] = pick(far);
    Object.assign(st, { start: a.slug, target, short, path: [a.slug], edges: [], scored: false });
    return;
  }
}
const points = (reached, steps, short) => (!reached ? 0 : steps === short ? 3 : steps <= short + 2 ? 2 : 1);

register({
  id: 'threads',
  init: () => ({ round: 0, score: 0, start: null }),
  render(st) {
    const G = getGraph();
    if (st.round >= ROUNDS) return finish(st.score, ROUNDS * 3, 'Three points for the shortest route, two if you were close, one for getting there at all.');
    if (!st.start) newRound(st);

    const cur = st.path[st.path.length - 1], target = G.by[st.target], steps = st.path.length - 1;
    const pathHTML = `<div class="path">${st.path.map((s, i) => `${i ? `<i class="arrow" style="background:${BOND[st.edges[i - 1].t].c}"></i>` : ''}<span class="step"><img alt="" src="${esc(iconFor(G.by[s]))}">${esc(G.by[s].name)}</span>`).join('')}</div>`;
    const head = hud([['Round', `${st.round + 1}/${ROUNDS}`], ['Score', st.score], ['Steps', steps]]) +
      `<div class="goal"><img alt="" src="${esc(iconFor(target))}"><div class="stack" style="gap:var(--s1)"><span class="t-label">Reach this champion</span><span class="t-2">${esc(target.name)}</span></div><span class="t-sm" style="margin-left:auto">Shortest route: ${st.short} steps</span></div>${pathHTML}`;
    const last = st.edges[st.edges.length - 1];
    const lastNote = last ? `<p class="note">${esc(G.by[st.path[steps - 1]].name)} → ${esc(G.by[cur].name)}: ${esc(bondText(last))}</p>` : '';

    if (cur === st.target || steps >= MAX_STEPS) {
      const reached = cur === st.target, pts = points(reached, steps, st.short);
      if (!st.scored) { st.score += pts; st.scored = true; }
      const best = shortestPath(st.start, st.target).map(s => esc(G.by[s].name)).join(' → ');
      board().innerHTML = head + lastNote + `<div class="between"><p class="t-body">${reached ? `You reached ${esc(target.name)} in ${steps} steps for ${pts} ${pts === 1 ? 'point' : 'points'}.` : 'Out of steps.'} One shortest route: ${best}.</p>${nextButton(st.round + 1 >= ROUNDS, 'Next thread')}</div>`;
      onNext(() => { st.round++; st.start = null; render(); });
      return;
    }

    const options = G.adj[cur].slice().sort((a, b) => G.by[a.o].name.localeCompare(G.by[b.o].name));
    board().innerHTML = head + lastNote + `<p class="prompt">From ${esc(G.by[cur].name)}, who do you follow?</p>
      <div class="choices">${options.map(x => `<button class="choice" data-o="${esc(x.o)}"><img class="icon" alt="" src="${esc(iconFor(G.by[x.o]))}"><span>${esc(G.by[x.o].name)}</span><span class="ttype" style="color:${BOND[x.e.t].c}">${BOND[x.e.t].label}</span></button>`).join('')}</div>
      ${steps ? '<div class="row"><button class="btn secondary" id="back">Step back</button></div>' : ''}`;
    board().querySelectorAll('.choice').forEach(b => { b.onclick = () => {
      const x = options.find(o => o.o === b.dataset.o);
      st.path.push(x.o); st.edges.push(x.e); render();
    }; });
    if (steps) $('#back').onclick = () => { st.path.pop(); st.edges.pop(); render(); };
  },
});
