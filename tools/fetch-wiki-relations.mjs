// Research helper (not shipped): collect each champion's "Relations" notes from the League of Legends fandom wiki,
// so we can write our own one-line explanations of Riot's related-champion links.
// Output: tools/.cache/wiki-relations.json  { slug: { "Other Name": "plain text" } }
// The wiki's text is CC BY-SA; we only use it as a reference and write the site's lines in our own words.
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { RELATIONS } from '../js/data/relations.js';

const API = 'https://leagueoflegends.fandom.com/api.php';
const UA = { 'User-Agent': 'RuneterraCodex/1.0 (fan site research script)' };
const CACHE = new URL('./.cache/', import.meta.url);
await mkdir(CACHE, { recursive: true });
const get = async q => (await fetch(`${API}?${new URLSearchParams({ format: 'json', ...q })}`, { headers: UA })).json();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function plain(w) {
  return w.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{(?:cbis|cis)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, "$1's")                       // possessive name templates
    .replace(/\{\{(?:sm2|sbc|ai|tt)\|[^}]*\}\}/gi, '')                                       // sound files, tooltips
    .replace(/\{\{[a-z0-9 ]{1,8}\|([^|}]+)(?:\|([^}=]*))?(?:\|[^}]*)?\}\}/gi, (_, a, b) => (b ? b : a))   // {{cbi|Name|shown}}
    .replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1').replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const out = {};
for (const r of RELATIONS) {
  const file = new URL(`wiki-${r.s}.txt`, CACHE);
  let text;
  try { text = await readFile(file, 'utf8'); } catch {
    try {
      const sec = await get({ action: 'parse', page: r.n, prop: 'sections', redirects: 1 });
      const rel = (sec.parse?.sections || []).find(s => /^Relations?$/i.test(s.line.trim()));
      text = '';
      if (rel) { const w = await get({ action: 'parse', page: r.n, prop: 'wikitext', section: rel.index, redirects: 1 }); text = w.parse?.wikitext?.['*'] || ''; }
    } catch { text = ''; }
    await writeFile(file, text); await sleep(250);
  }
  const map = {};
  for (const part of text.split(/\n(?====+)/)) {
    const head = part.match(/^===+\s*(.+?)\s*===+/); if (!head) continue;
    map[plain(head[1])] = plain(part.replace(/^===+.*===+/, '')).slice(0, 700);
  }
  out[r.s] = map;
}
await writeFile(new URL('wiki-relations.json', CACHE), JSON.stringify(out, null, 1));
console.log(Object.values(out).filter(m => Object.keys(m).length).length, 'champions with relations');
