// Home page: hero slideshow, today's riddle, featured games, the Web teaser and the regions rail.
import { $, $$, esc, bg, reduceMotion } from '../ui.js';
import { CHAMPS, VER, idOf, splash, loading } from '../riot.js';
import { REGIONS, BOND } from '../data/lore.js';
import { GAMES, HERO } from '../data/games.js';
import { to } from '../router.js';
import { dailyCard } from '../games/daily.js';
import { gameCard } from './hub.js';

let slide = 0;

export function enterHome() {
  const slides = $('#slides');
  if (!slides.children.length) {
    slides.innerHTML = HERO.map((n, i) => `<div class="slide art${i ? '' : ' on'}" style="${bg(splash(idOf(n)))}"></div>`).join('');
    $('#credit').textContent = HERO[0];
    if (!reduceMotion) setInterval(nextSlide, 7000);
  }
  refreshHome();
  $('#homeDaily').innerHTML = dailyCard();
  $('#homeGames').innerHTML = ['splash', 'ability', 'threads', 'titles'].map(id => gameCard(GAMES.find(g => g.id === id))).join('');
  $('#homeRegions').innerHTML = REGIONS.map(r =>
    `<a class="card region" href="${to.region(r.id)}"><div class="pic art" style="${bg(loading(idOf(r.key)))}"></div><div class="body"><h3 class="t-3" style="display:flex;align-items:center;gap:8px"><i class="swatch" style="background:${r.hue}"></i>${esc(r.name)}</h3><p>${esc(r.tag)}</p></div></a>`).join('');
  requestAnimationFrame(drawConstellation);
}

/** Counts that change when Riot's data arrives. */
export function refreshHome() {
  $('#champCount').innerHTML = `<span class="tag gold"><b class="num" style="color:var(--gold-1)">${CHAMPS.length}</b>&nbsp;champions</span><span class="tag gold">${GAMES.length} games</span><span class="tag gold">13 regions</span><span class="tag">Patch ${esc(VER)}</span>`;
}

function nextSlide() {
  if ($('[data-view="home"]').hidden) return;
  const all = $$('#slides .slide');
  all[slide].classList.remove('on');
  slide = (slide + 1) % all.length;
  all[slide].classList.add('on');
  $('#credit').textContent = HERO[slide];
}

/* The Web teaser background: an abstract constellation of threads (no characters). */
function drawConstellation() {
  const cv = $('#featureSky'), r = cv.getBoundingClientRect();
  if (!r.width) return;
  const d = Math.min(devicePixelRatio || 1, 2);
  cv.width = r.width * d; cv.height = r.height * d;
  const c = cv.getContext('2d'); c.scale(d, d);
  const colors = Object.values(BOND).map(b => b.c);
  const pts = Array.from({ length: 46 }, () => ({ x: r.width * (0.45 + Math.random() * 0.55), y: Math.random() * r.height, s: Math.random() * 2 + 1.2 }));
  pts.forEach((p, i) => { for (let j = i + 1; j < pts.length; j++) {
    const q = pts[j];
    if (Math.hypot(p.x - q.x, p.y - q.y) < 120 && Math.random() < 0.55) {
      c.globalAlpha = 0.35; c.strokeStyle = colors[(i + j) % colors.length]; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo((p.x + q.x) / 2 - (q.y - p.y) * 0.15, (p.y + q.y) / 2 + (q.x - p.x) * 0.15, q.x, q.y); c.stroke();
    }
  } });
  pts.forEach(p => {
    c.globalAlpha = 0.9; c.fillStyle = '#f0e6d2'; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 6.283); c.fill();
    c.globalAlpha = 0.18; c.fillStyle = '#c89b3c'; c.beginPath(); c.arc(p.x, p.y, p.s * 4, 0, 6.283); c.fill();
  });
}
