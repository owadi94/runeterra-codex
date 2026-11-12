// Support and About pages.
import { $, esc, copyText } from '../ui.js';
import { SUPPORT } from '../config.js';
import { resetProgress } from '../state.js';

const SHARE_TEXT = 'Try Runeterra Codex: League of Legends games with splash art, abilities, titles and a new champion riddle every day.';

export function enterSupport() {
  const soon = '<button class="btn secondary" disabled>Opening soon</button>';
  $('#kofi').innerHTML = SUPPORT.kofi ? `<a class="btn" href="${esc(SUPPORT.kofi)}" target="_blank" rel="noopener">Support on Ko-fi</a>` : soon;
  $('#paypal').innerHTML = SUPPORT.paypal ? `<a class="btn" href="${esc(SUPPORT.paypal)}" target="_blank" rel="noopener">Send with PayPal</a>` : soon;
  $('#shareSite').onclick = () => copyText(SHARE_TEXT, $('#shareMsg'));
}

export function enterAbout() {
  const box = $('#resetBox');
  const ask = () => {
    box.innerHTML = `<div class="confirm"><span>This clears your level, scores, streak and regions read in this browser.</span><button class="btn" id="rY">Clear my progress</button><button class="btn secondary" id="rN">Keep it</button></div>`;
    $('#rY').onclick = () => { resetProgress(); box.innerHTML = '<p class="t-sm">Your progress has been cleared.</p>'; };
    $('#rN').onclick = enterAbout;
  };
  box.innerHTML = '<button class="btn secondary" id="resetBtn">Reset my progress</button>';
  $('#resetBtn').onclick = ask;
}
