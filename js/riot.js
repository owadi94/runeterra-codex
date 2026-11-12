// Live data from Riot: Data Dragon (champions, abilities, art) and the Universe site (regions, biographies).
// Exported `let` values are live: other modules always see the latest value after loading.
import { norm } from './ui.js';

const DD = 'https://ddragon.leagueoflegends.com/cdn/';
export const U_API = 'https://universe-meeps.leagueoflegends.com/v1/en_us/';
export const U_SITE = 'https://universe.leagueoflegends.com/en_us/';

/* Names used in our lore data, mapped to Data Dragon ids, so art works before the live list loads. */
const ID = { 'Ashe': 'Ashe', 'Sejuani': 'Sejuani', 'Braum': 'Braum', 'Lissandra': 'Lissandra', 'Garen': 'Garen', 'Lux': 'Lux', 'Jarvan IV': 'JarvanIV', 'Sylas': 'Sylas', 'Darius': 'Darius', 'Swain': 'Swain', 'Katarina': 'Katarina', 'LeBlanc': 'Leblanc', 'Teemo': 'Teemo', 'Tristana': 'Tristana', 'Lulu': 'Lulu', 'Veigar': 'Veigar', 'Caitlyn': 'Caitlyn', 'Jayce': 'Jayce', 'Vi': 'Vi', 'Heimerdinger': 'Heimerdinger', 'Jinx': 'Jinx', 'Viktor': 'Viktor', 'Ekko': 'Ekko', 'Warwick': 'Warwick', 'Leona': 'Leona', 'Diana': 'Diana', 'Pantheon': 'Pantheon', 'Taric': 'Taric', 'Azir': 'Azir', 'Nasus': 'Nasus', 'Renekton': 'Renekton', 'Sivir': 'Sivir', 'Qiyana': 'Qiyana', 'Malphite': 'Malphite', 'Nidalee': 'Nidalee', 'Zyra': 'Zyra', "Kai'Sa": 'Kaisa', "Cho'Gath": 'Chogath', "Kha'Zix": 'Khazix', "Vel'Koz": 'Velkoz', 'Irelia': 'Irelia', 'Yasuo': 'Yasuo', 'Ahri': 'Ahri', 'Karma': 'Karma', 'Miss Fortune': 'MissFortune', 'Gangplank': 'Gangplank', 'Twisted Fate': 'TwistedFate', 'Graves': 'Graves', 'Thresh': 'Thresh', 'Kalista': 'Kalista', 'Viego': 'Viego', 'Hecarim': 'Hecarim', 'Draven': 'Draven', 'Yone': 'Yone', 'Xayah': 'Xayah', 'Rakan': 'Rakan', 'Kayle': 'Kayle', 'Morgana': 'Morgana', 'Shen': 'Shen', 'Zed': 'Zed', 'Xerath': 'Xerath', 'Ryze': 'Ryze' };

export let VER = '16.22.1';                 // replaced by the newest patch on load
export let CHAMPS = Object.entries(ID).map(([name, id]) => ({ id, name, title: '', tags: [] }));
export let ddReady = false, ddFailed = false;
export let UNIV = null, uFailed = false;    // [{slug,name,title,faction,release,img}]

const cache = {};
export async function getJSON(url) {
  if (cache[url]) return cache[url];
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return (cache[url] = await r.json());
}

export async function loadDataDragon() {
  try {
    VER = (await getJSON('https://ddragon.leagueoflegends.com/api/versions.json'))[0];
    const d = await getJSON(`${DD}${VER}/data/en_US/champion.json`);
    CHAMPS = Object.values(d.data).map(c => ({ id: c.id, name: c.name, title: c.title, tags: c.tags })).sort((a, b) => a.name.localeCompare(b.name));
    ddReady = true;
  } catch { ddFailed = true; }
}

export async function loadUniverse() {
  try {
    const d = await getJSON(U_API + 'search/index.json');
    UNIV = d.champions.map(c => ({ slug: c.slug, name: c.name, title: c.title, faction: c['associated-faction-slug'], release: c['release-date'], img: c.image && c.image.uri }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch { uFailed = true; }
}

export const championDetail = id => getJSON(`${DD}${VER}/data/en_US/champion/${id}.json`).then(d => d.data[id]);
export const universeChampion = slug => getJSON(`${U_API}champions/${slug}/index.json`);

/* ---- Art ---- */
export const splash = id => `${DD}img/champion/splash/${id}_0.jpg`;
export const loading = id => `${DD}img/champion/loading/${id}_0.jpg`;
export const square = id => `${DD}${VER}/img/champion/${id}.png`;
export const spellIcon = file => `${DD}${VER}/img/spell/${file}`;
export const passiveIcon = file => `${DD}${VER}/img/passive/${file}`;

/* ---- Lookups ---- */
/** Data Dragon id for a lore name like "Kai'Sa". Falls back to the name itself. */
export const idOf = name => ID[name] || (CHAMPS.find(c => c.name === name) || {}).id || name;

/** Data Dragon id for a Universe champion ({slug,name}). */
export function ddIdFor(u) {
  const c = CHAMPS.find(x => x.id.toLowerCase() === u.slug) || CHAMPS.find(x => norm(x.name) === norm(u.name));
  return c ? c.id : (ID[u.name] || null);
}
/** Best guess before Riot's list arrives: "Gwen" -> "Gwen". */
const guessId = name => String(name).replace(/[^A-Za-z]/g, '').replace(/^./, ch => ch.toUpperCase());

export const iconFor = u => { const id = ddIdFor(u) || guessId(u.name); return id ? square(id) : (u.img || ''); };
export const portraitFor = u => { const id = ddIdFor(u); return id ? loading(id) : (u.img || ''); };
export const splashFor = u => { const id = ddIdFor(u); return id ? splash(id) : (u.img || ''); };

export const slugOf = name => { const u = UNIV && UNIV.find(c => norm(c.name) === norm(name)); return u ? u.slug : norm(name); };
export const titleOf = id => (CHAMPS.find(c => c.id === id) || {}).title || '';
