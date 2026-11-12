// Who is connected to whom: our explained bonds plus Riot's related-champion links.
import { STORIES } from './data/lore.js';
import { RELATIONS } from './data/relations.js';

let graph = null;

/** { nodes:[{slug,name,faction,deg,story}], by:{slug:node}, edges:[{a,b,t,txt}], adj:{slug:[{o,e}]} } */
export function getGraph() {
  if (graph) return graph;
  const nodes = RELATIONS.map(r => ({ slug: r.s, name: r.n, faction: r.f }));
  const by = Object.fromEntries(nodes.map(n => [n.slug, n]));
  const key = (a, b) => [a, b].sort().join('|');
  const edges = new Map();
  STORIES.forEach(([a, b, t, txt]) => { if (by[a] && by[b]) edges.set(key(a, b), { a, b, t, txt }); });
  RELATIONS.forEach(r => r.r.forEach(t => {
    if (by[t] && t !== r.s && !edges.has(key(r.s, t))) edges.set(key(r.s, t), { a: r.s, b: t, t: 'linked' });
  }));
  const list = [...edges.values()], adj = {};
  nodes.forEach(n => { adj[n.slug] = []; });
  list.forEach(e => { adj[e.a].push({ o: e.b, e }); adj[e.b].push({ o: e.a, e }); });
  nodes.forEach(n => { n.deg = adj[n.slug].length; n.story = adj[n.slug].some(x => x.e.t !== 'linked'); });
  return (graph = { nodes, by, edges: list, adj });
}

/** Explained bonds first, then Riot's links. */
export const connectionsOf = slug => (getGraph().adj[slug] || []).slice().sort((x, y) => (x.e.t === 'linked') - (y.e.t === 'linked'));

export const bondText = e => (e.t === 'linked'
  ? 'Riot links these two on its Universe site. Their stories cross; read both biographies to see how.'
  : e.txt);

/** Breadth-first search: distance from `from` to every reachable champion, and the step before each. */
export function bfs(from) {
  const { adj } = getGraph(), dist = { [from]: 0 }, prev = {}, queue = [from];
  while (queue.length) {
    const s = queue.shift();
    for (const { o } of adj[s]) if (dist[o] == null) { dist[o] = dist[s] + 1; prev[o] = s; queue.push(o); }
  }
  return { dist, prev };
}

export function shortestPath(from, target) {
  const { prev } = bfs(from);
  if (from !== target && !prev[target]) return null;
  const path = [target];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}
