// Hash router. Addresses look like #/champions/ahri so they work on any static host.
import { $$ } from './ui.js';

const routes = [];
let active = null;          // { route, params }
let beforeEach = () => {};

/** Every link the site builds goes through here, so addresses live in one place. */
export const to = {
  home: '#/',
  games: '#/games',
  game: id => `#/games/${id}`,
  champions: '#/champions',
  champion: slug => `#/champions/${slug}`,
  regions: '#/regions',
  region: id => `#/regions/${id}`,
  web: '#/web',
  webFocus: slug => `#/web/${slug}`,
  support: '#/support',
  about: '#/about',
};

/**
 * Register a page.
 * @param {string} pattern  e.g. "/champions/:slug"
 * @param {{view:string, nav?:string|((p)=>string), title?:(p)=>string, enter:(p)=>void, refresh?:(p)=>void}} page
 */
export function route(pattern, page) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/\/:([a-z]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
  routes.push({ re, keys, ...page });
}

export function onBeforeEach(fn) { beforeEach = fn; }
export function go(hash) { location.hash = hash; }

/* Addresses from before the router (#champ-ahri, #atlas, #splash) keep working. */
const LEGACY = {
  home: '/', games: '/games', daily: '/games/daily', champions: '/champions', web: '/web',
  atlas: '/regions', support: '/support', about: '/about',
};
const GAME_IDS = ['daily', 'splash', 'ability', 'titles', 'origins', 'trial', 'kinship', 'threads', 'blitz'];
function upgrade(old) {
  if (LEGACY[old]) return LEGACY[old];
  if (GAME_IDS.includes(old)) return `/games/${old}`;
  if (old.startsWith('champ-')) return `/champions/${old.slice(6)}`;
  return '/';
}

function currentPath() {
  const raw = location.hash.replace(/^#/, '');
  if (raw.startsWith('/')) return raw;
  const path = upgrade(raw);
  history.replaceState(null, '', '#' + path);
  return path;
}

function match(path) {
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

function resolve() {
  const found = match(currentPath()) || match('/');
  const { route: r, params } = found;
  beforeEach();
  active = found;
  $$('[data-view]').forEach(v => { v.hidden = v.dataset.view !== r.view; });
  const nav = typeof r.nav === 'function' ? r.nav(params) : r.nav;
  $$('[data-nav]').forEach(a => (a.dataset.nav === nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.title = r.title ? `${r.title(params)} · Runeterra Codex` : 'Runeterra Codex';
  r.enter(params);
  window.scrollTo(0, 0);
}

/** Redraw the current page when new data arrives, without restarting it or scrolling. */
export function refresh() {
  if (active && active.route.refresh) active.route.refresh(active.params);
}

export function start() {
  addEventListener('hashchange', resolve);
  resolve();
}
