// Small helpers shared by every page.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z]/g, '');
export const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const shuffle = list => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export const pick = list => list[Math.floor(Math.random() * list.length)];

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Riot's text arrives as HTML. DOMParser reads it without running scripts or loading images. */
export const plain = s => (s ? new DOMParser().parseFromString(String(s), 'text/html').body.textContent.trim() : '');

/** A background image with a dark gradient underneath, shown if the image cannot load. */
export const bg = url => `background-image:url('${url}'),linear-gradient(160deg,#0a323c,#010a13)`;

export async function copyText(text, statusEl) {
  try { await navigator.clipboard.writeText(text); statusEl.textContent = 'Copied'; }
  catch { statusEl.textContent = 'Copy is blocked. Select the text and copy it yourself.'; }
}

let toastTimer;
export function toast(message) {
  const t = $('#toast');
  t.textContent = message; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3000);
}
