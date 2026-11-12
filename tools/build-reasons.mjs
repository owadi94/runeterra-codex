// Explain Riot's related-champion links: why are these two connected?
// Sources, in order: our own researched sentence (tools/written-bonds.mjs), then any official Riot story that features both
// (read from Universe story pages), otherwise an honest "not told yet". Nothing is guessed from keywords: an early version
// did that and mislabelled bonds, so every bond type shown on the site is one we checked.
// Run after build-relations: node tools/build-reasons.mjs   (caches downloads in tools/.cache)
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { RELATIONS } from '../js/data/relations.js';
import { GROUPS, STORIES } from '../js/data/lore.js';
import { WRITTEN } from './written-bonds.mjs';

const API = 'https://universe-meeps.leagueoflegends.com/v1/en_us/';
const CACHE = new URL('./.cache/', import.meta.url);
await mkdir(CACHE, { recursive: true });
const pause = () => new Promise(r => setTimeout(r, 120));         // be gentle with Riot's servers

async function cached(file, load) {
  try { return JSON.parse(await readFile(new URL(file, CACHE), 'utf8')); } catch { /* not cached yet */ }
  const value = await load(); await writeFile(new URL(file, CACHE), JSON.stringify(value)); await pause();
  return value;
}
/** A champion's official stories (from their Universe page). */
const storiesOf = slug => cached(`stories-${slug}.json`, async () => {
  const d = await (await fetch(`${API}champions/${slug}/index.json`)).json();
  return (d.modules || []).filter(m => m.type === 'story-preview' && m['story-slug']).map(m => m['story-slug']);
});
/** The champions a story features (from the story page itself). */
const castOf = slug => cached(`story-${slug}.json`, async () => {
  try {
    const d = await (await fetch(`${API}story/${slug}/index.json`)).json(), found = new Set();
    for (const m of JSON.stringify(d).matchAll(/"type":"champion"[^{}]*?"slug":"([a-z]+)"/g)) found.add(m[1]);
    return { title: d.story?.title || slug, slugs: [...found] };
  } catch { return { title: slug, slugs: [] }; }
});

const nameOf = Object.fromEntries(RELATIONS.map(r => [r.s, r.n]));
const regionOf = slug => GROUPS.find(g => g.u === RELATIONS.find(r => r.s === slug)?.f)?.name || 'the wider world';

const stories = new Map();
for (const r of RELATIONS) for (const s of await storiesOf(r.s)) if (!stories.has(s)) stories.set(s, await castOf(s));
const shared = (a, b) => [...stories].filter(([, c]) => c.slugs.includes(a) && c.slugs.includes(b)).map(([slug, c]) => ({ slug, title: c.title }));

const told = new Set(STORIES.map(([a, b]) => [a, b].sort().join('|')));   // bonds already explained in lore.js
const pairs = new Map();
for (const r of RELATIONS) for (const t of r.r) if (nameOf[t] && t !== r.s) { const k = [r.s, t].sort().join('|'); if (!told.has(k)) pairs.set(k, [r.s, t]); }

const out = {}, stats = {};
for (const [k, [a, b]] of pairs) {
  const both = shared(a, b);
  let t = 'linked', txt;
  if (WRITTEN[k]) [t, txt] = WRITTEN[k];
  else if (both.length) txt = `Both appear in the official story “${both[0].title}”.`;
  else {
    const ra = regionOf(a), rb = regionOf(b);
    txt = ra === rb ? `Both come from ${ra}. Riot lists them as related but has not yet told how their stories meet.`
      : `One from ${ra}, one from ${rb}. Riot lists them as related but has not yet told how their stories meet.`;
  }
  out[k] = { t, txt, ...(both.length ? { story: both[0] } : {}) };
  stats[t] = (stats[t] || 0) + 1;
}
await writeFile(new URL('../js/data/reasons.js', import.meta.url),
  "// Why Riot's related champions are connected. Built by tools/build-reasons.mjs from our researched lines\n" +
  "// (tools/written-bonds.mjs) and Riot's official stories. t = bond type, txt = our sentence, story = a story both appear in.\n" +
  'export const REASONS = ' + JSON.stringify(out) + ';\n');
console.log(stories.size, 'stories,', pairs.size, 'pairs,', Object.keys(WRITTEN).length, 'written', stats);
