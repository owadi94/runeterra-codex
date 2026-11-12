// Rebuild js/data/relations.js from Riot's Universe site (the related-champion links).
// Run after Riot adds champions: node tools/build-relations.mjs
import { writeFile } from 'node:fs/promises';

const API = 'https://universe-meeps.leagueoflegends.com/v1/en_us/';
const index = await (await fetch(API + 'search/index.json')).json();
const out = [];
for (const c of index.champions) {
  let related = [];
  try {
    const d = await (await fetch(`${API}champions/${c.slug}/index.json`)).json();
    related = (d['related-champions'] || []).map(r => r.slug);
  } catch { /* keep going; one missing champion should not stop the build */ }
  out.push({ s: c.slug, n: c.name, f: c['associated-faction-slug'], r: related });
  await new Promise(r => setTimeout(r, 120));   // be gentle with Riot's servers
}
const file = new URL('../js/data/relations.js', import.meta.url);
await writeFile(file, "// Riot's related-champion links from the Universe site: {s: slug, n: name, f: region, r: related slugs}.\n// Rebuild with: node tools/build-relations.mjs\nexport const RELATIONS = " + JSON.stringify(out) + ';\n');
console.log(`${out.length} champions written`);
