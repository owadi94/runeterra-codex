// One champion's profile: Riot's quote and short biography (loaded live, with a link to the full story),
// our connection stories, abilities and quick facts.
import { $, esc, cap, bg, plain } from '../ui.js';
import { UNIV, uFailed, U_SITE, ddIdFor, splashFor, iconFor, titleOf, championDetail, universeChampion, spellIcon, passiveIcon } from '../riot.js';
import { BOND } from '../data/lore.js';
import { groupOf } from '../components.js';
import { connectionsOf, getGraph, bondText, storyUrl } from '../graph.js';
import { to } from '../router.js';

const KEYS = ['Q', 'W', 'E', 'R'];
const page = () => $('#champView');

export async function enterChampion({ slug }) {
  if (!UNIV) {
    page().innerHTML = `<div class="band section"><div class="wrap"><p class="${uFailed ? 'banner-msg' : 'skel'}">${uFailed ? "We couldn't reach Riot's servers. Check your connection, then reload the page." : 'Loading champion…'}</p></div></div>`;
    return;
  }
  const u = UNIV.find(c => c.slug === slug);
  if (!u) {
    page().innerHTML = `<div class="band section"><div class="wrap stack"><h2 class="t-1">Champion not found</h2><p class="t-body">We couldn't find that champion. Pick one from the full list.</p><a class="btn" href="${to.champions}">All champions</a></div></div>`;
    return;
  }
  document.title = `${u.name} · Runeterra Codex`;
  const g = groupOf(u), id = ddIdFor(u);
  const sameRegion = UNIV.filter(c => c.faction === u.faction), idx = sameRegion.findIndex(x => x.slug === slug);
  const prev = sameRegion[(idx - 1 + sameRegion.length) % sameRegion.length], next = sameRegion[(idx + 1) % sameRegion.length];
  const title = (id && titleOf(id)) || (u.title !== u.name ? u.title : '');

  page().innerHTML = `<div class="ch-hero band"><div class="art" style="${bg(splashFor(u))}"></div><div class="wrap">
      <a class="link" href="${to.champions}">← All champions</a>
      <h1 class="t-hero">${esc(u.name)}</h1><p class="t-2">${esc(cap(title))}</p>
      <div class="row"><a class="chip" href="${to.region(g.id)}"><i class="swatch" style="background:${g.hue}"></i>${esc(g.name)}</a><span id="heroTags" class="row"></span></div></div></div>
    <div class="band section"><div class="wrap ch-body">
      <div class="ch-main" id="chMain"><p class="skel">Loading ${esc(u.name)}'s story from Riot…</p></div>
      <aside class="ch-side" id="chSide"></aside></div>
      <div class="wrap pager" style="margin-top:var(--s7)"><a class="link" href="${to.champion(esc(prev.slug))}">← ${esc(prev.name)}</a><span class="t-sm">${idx + 1} of ${sameRegion.length} in ${esc(g.name)}</span><a class="link" href="${to.champion(esc(next.slug))}">${esc(next.name)} →</a></div></div>`;

  const [uni, dd] = await Promise.all([
    universeChampion(slug).catch(() => null),
    id ? championDetail(id).catch(() => null) : null,
  ]);
  if (location.hash !== to.champion(slug)) return;   // the player moved on while this loaded

  const c = uni && uni.champion, bio = (c && c.biography) || {};
  const races = ((c && c.races) || []).map(r => r.name), roles = ((c && c.roles) || []).map(r => r.name);
  $('#heroTags').innerHTML = [...races, ...roles].map(t => `<span class="tag">${esc(t)}</span>`).join('');
  $('#chMain').innerHTML = quote(bio, u) + biography(bio, uni, slug) + stories(uni) + abilities(dd) + connections(slug, u);
  $('#chSide').innerHTML = sidebar(u, g, dd, races, sameRegion.length);
}

const quote = (bio, u) => (bio.quote
  ? `<blockquote class="blockquote">“${esc(plain(bio.quote).replace(/^["“”']+|["“”']+$/g, ''))}”<cite>${esc(plain(bio['quote-author']) || u.name)}</cite></blockquote>` : '');

const biography = (bio, uni, slug) => `<section class="stack"><h2 class="t-2">Biography</h2>
  ${bio.short ? `<p class="bio">${esc(plain(bio.short))}</p><p class="src">Short biography by Riot Games, from the official Universe site.</p>`
    : `<p class="t-body">${uni ? "Riot hasn't published a short biography for this champion yet." : "We couldn't load the biography from Riot's servers."}</p>`}
  <div class="row"><a class="btn" href="${U_SITE}champion/${esc(slug)}/" target="_blank" rel="noopener">Read the full story on Universe ↗</a></div></section>`;

function stories(uni) {
  const list = ((uni && uni.modules) || []).filter(m => m.type === 'story-preview' && m['story-slug']);
  return list.length ? `<section class="stack"><h2 class="t-2">Stories</h2><ul class="storylist">${list.map(s =>
    `<li><a href="${U_SITE}story/${esc(s['story-slug'])}/" target="_blank" rel="noopener"><span>${esc(plain(s.title))}</span><span>Read ↗</span></a></li>`).join('')}</ul></section>` : '';
}

function abilities(dd) {
  if (!dd) return '';
  const list = [{ k: 'Passive', n: dd.passive.name, img: passiveIcon(dd.passive.image.full) }, ...dd.spells.map((s, i) => ({ k: KEYS[i], n: s.name, img: spellIcon(s.image.full) }))];
  return `<section class="stack"><h2 class="t-2">Abilities</h2><div class="abilities">${list.map(a =>
    `<figure><img loading="lazy" alt="" src="${esc(a.img)}"><span class="k">${a.k}</span><figcaption>${esc(a.n)}</figcaption></figure>`).join('')}</div></section>`;
}

function connections(slug, u) {
  const list = connectionsOf(slug), G = getGraph();
  if (!list.length) return '';
  return `<section class="stack"><div class="between"><h2 class="t-2">Connections</h2><a class="btn secondary" href="${to.webFocus(esc(slug))}">See ${esc(u.name)} in the Web</a></div>
    <div class="conns">${list.map(x => { const n = G.by[x.o], b = BOND[x.e.t];
      const story = storyUrl(x.e);
      return `<div class="conn"><a href="${to.champion(esc(x.o))}"><img loading="lazy" alt="${esc(n.name)}" src="${esc(iconFor(n))}"></a><span><span class="who"><a class="plain" href="${to.champion(esc(x.o))}"><b>${esc(n.name)}</b></a><span class="ttype" style="color:${b.c}">${b.label}</span></span><p>${esc(bondText(x.e))}</p>${story ? `<a class="story-link" href="${esc(story)}" target="_blank" rel="noopener">Read “${esc(x.e.story.title)}” on Riot's site</a>` : ''}</span></div>`; }).join('')}</div></section>`;
}

function sidebar(u, g, dd, races, regionCount) {
  const facts = [['Region', g.name]];
  if (u.release) facts.push(['Released', new Date(u.release).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })]);
  if (races.length) facts.push(['Race', races.join(', ')]);
  if (dd) {
    facts.push(['Attack range', dd.stats.attackrange <= 350 ? `Melee (${dd.stats.attackrange})` : `Ranged (${dd.stats.attackrange})`]);
    facts.push(['Resource', dd.partype || 'None']);
    facts.push(['Skins', String(dd.skins.length - 1)]);
    if (dd.skins.length > 1) facts.push(['Newest skin', dd.skins[dd.skins.length - 1].name]);
    facts.push(['Ultimate', dd.spells[3].name]);
  }
  facts.push([`Champions from ${g.name}`, String(regionCount)]);
  const stat = (label, n) => `<div class="stat"><span>${label}</span><span class="bar"><i style="width:${n * 10}%"></i></span><b>${n}</b></div>`;
  return `${dd ? `<div class="panel"><h3 class="t-3">Playstyle</h3>${stat('Attack', dd.info.attack)}${stat('Defense', dd.info.defense)}${stat('Magic', dd.info.magic)}${stat('Difficulty', dd.info.difficulty)}</div>` : ''}
    <div class="panel"><h3 class="t-3">Quick facts</h3><ul class="facts">${facts.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join('')}</ul></div>
    <div class="panel"><h3 class="t-3">Test yourself</h3><p class="t-sm">Think you know ${esc(u.name)}? Try spotting them in Splash Zoom or Ability Check.</p>
      <div class="row"><a class="btn secondary" href="${to.game('splash')}">Splash Zoom</a><a class="btn secondary" href="${to.game('ability')}">Ability Check</a></div></div>`;
}
