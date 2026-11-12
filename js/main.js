// Entry point: register the pages, start the router, load Riot's data.
import { route, start, refresh, onBeforeEach } from './router.js';
import { loadDataDragon, loadUniverse } from './riot.js';
import { updateProfile } from './state.js';
import { stopTimers } from './games/engine.js';

// Each game registers itself with the engine when imported.
import './games/daily.js';
import './games/splash.js';
import './games/ability.js';
import './games/titles.js';
import './games/origins.js';
import './games/trial.js';
import './games/kinship.js';
import './games/threads.js';
import './games/blitz.js';

import { enterHome, refreshHome } from './views/home.js';
import { enterHub, enterGame, gameName } from './views/hub.js';
import { enterChampions, refreshChampions } from './views/champions.js';
import { enterChampion } from './views/champion.js';
import { enterRegions, refreshRegions, regionName } from './views/regions.js';
import { enterWeb, refreshWeb } from './views/web.js';
import { enterSupport, enterAbout } from './views/info.js';
import { enterExplore, enterCity, cityName, leaveCity } from './views/explore.js';

/*            address                page view     nav tab        */
route('/',                   { view: 'home',      nav: 'home',      enter: enterHome, refresh: refreshHome });
route('/games',              { view: 'games',     nav: 'games',     title: () => 'Games', enter: enterHub });
route('/games/:id',          { view: 'game',      nav: p => (p.id === 'daily' ? 'daily' : 'games'), title: p => gameName(p.id) || 'Games', enter: enterGame });
route('/champions',          { view: 'champions', nav: 'champions', title: () => 'Champions', enter: enterChampions, refresh: refreshChampions });
route('/champions/:slug',    { view: 'champion',  nav: 'champions', title: () => 'Champion', enter: enterChampion, refresh: enterChampion });
route('/regions',            { view: 'atlas',     nav: 'atlas',     title: () => 'Regions', enter: enterRegions, refresh: refreshRegions });
route('/regions/:id',        { view: 'atlas',     nav: 'atlas',     title: p => regionName(p.id), enter: enterRegions, refresh: refreshRegions });
route('/web',                { view: 'web',       nav: 'web',       title: () => 'The Web of Runeterra', enter: enterWeb });
route('/web/:slug',          { view: 'web',       nav: 'web',       title: () => 'The Web of Runeterra', enter: enterWeb });
route('/explore',            { view: 'explore',   nav: 'explore',   title: () => 'Explore', enter: enterExplore });
route('/explore/:id',        { view: 'city',      nav: 'explore',   title: p => cityName(p.id), enter: enterCity });
route('/support',            { view: 'support',   nav: 'support',   title: () => 'Support', enter: enterSupport });
route('/about',              { view: 'about',     nav: 'about',     title: () => 'About', enter: enterAbout });

// Testing aid: open the site with ?debug to reach the running game's state from the browser console.
if (new URLSearchParams(location.search).has('debug')) {
  Promise.all([import('./games/engine.js'), import('./graph.js'), import('./games/daily.js'), import('./riot.js')])
    .then(([engine, graph, daily, riot]) => { window.codex = { engine, graph, daily, riot }; });
}

onBeforeEach(() => { stopTimers(); leaveCity(); });   // leaving a page stops game clocks and closes any open city
updateProfile();
start();

loadDataDragon().then(() => { refresh(); refreshWeb(); });
loadUniverse().then(refresh);
