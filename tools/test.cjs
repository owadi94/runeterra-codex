// Site test: plays every game in headless Edge or Chrome, one move at a time, and checks every route and page.
// Run: npm test   (starts the local server itself; needs Edge or Chrome installed)
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const EDGE = [process.env.BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && fs.existsSync(p));
const SITE_PORT = 5174, BASE = `http://localhost:${SITE_PORT}/?debug`, PORT = 9352;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = u => new Promise((res, rej) => http.get(u, r => { let s = ''; r.on('data', d => s += d); r.on('end', () => res(s)); }).on('error', rej));
const results = []; let failures = 0;
const ok = (name, cond, info = '') => { results.push(`${cond ? 'ok ' : 'ERR'} ${name}${info ? ' → ' + info : ''}`); if (!cond) failures++; };

/* One move in a game. Runs inside the page; returns 'done', 'waiting' or a short note. */
const STEP = `(() => {
  const c = window.codex; if (!c) return 'waiting';
  const st = c.engine.run.st, id = c.engine.run.id, q = s => document.querySelector(s);
  if (q('#game .result .score')) return 'done ' + q('#game .result .score').textContent.replace(/\\s+/g,' ');
  const go = q('#go'); if (go) { go.click(); return 'next'; }
  const typeIn = name => { const i = q('#pk'); if (!i) return 'no picker'; i.value = name; i.dispatchEvent(new Event('input')); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); return 'typed ' + name; };
  switch (id) {
    case 'daily': { const rec = c.daily.dailyRecord(); if (rec.done) return 'done daily won=' + rec.won + ' guesses=' + rec.guesses.length; return typeIn(rec.guesses.length ? c.daily.dailyPick().a : (c.daily.dailyPick().a === 'Teemo' ? 'Garen' : 'Teemo')); }
    case 'splash': { if (!st.c) return 'waiting'; return typeIn(st.misses.length ? st.c.name : (st.c.name === 'Teemo' ? 'Garen' : 'Teemo')); }
    case 'ability': { if (!st.q) return 'waiting'; const ans = st.phase === 'champ' ? st.q.c.id : st.q.key; const b = q('[data-o="' + ans + '"]:not(:disabled)'); if (b) { b.click(); return 'answer ' + ans; } return 'waiting'; }
    case 'kinship': { if (st.locked) return 'waiting'; const open = st.open[0]; const i = open === undefined ? st.cards.findIndex(x => !st.matched.includes(x.pi)) : st.cards.findIndex((x, k) => k !== open && x.pi === st.cards[open].pi); if (i < 0) return 'waiting'; q('.kcard[data-i="' + i + '"]').click(); return 'flip ' + i; }
    case 'threads': { const cur = st.path[st.path.length - 1]; const p = c.graph.shortestPath(cur, st.target); const b = q('.choice[data-o="' + p[1] + '"]'); if (!b) return 'no choice ' + p[1]; b.click(); return 'step ' + p[1]; }
    case 'blitz': { if (st.phase === 'run' && st.answered >= 4) { st.end = Date.now() - 1; return 'time up'; } const b = q('.option:not(:disabled)'); if (b) { b.click(); return 'answered'; } return 'waiting'; }
    default: { const b = q('.option:not(:disabled), .choice:not(:disabled)'); if (b) { b.click(); return 'answered'; } return 'waiting'; }
  }
})()`;

(async () => {
  if (!EDGE) { console.error('Install Edge or Chrome, or set BROWSER to its path.'); process.exit(1); }
  const server = spawn(process.execPath, [path.join(__dirname, 'serve.mjs')], { env: { ...process.env, PORT: String(SITE_PORT) } });
  await sleep(800);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'rc2-'));
  const br = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--window-size=1440,1000', 'about:blank']);
  let targets; for (let i = 0; i < 40; i++) { try { targets = JSON.parse(await get(`http://127.0.0.1:${PORT}/json`)); break; } catch { await sleep(250); } }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pend = {}, errors = [];
  ws.addEventListener('message', ev => { const d = JSON.parse(ev.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description?.split('\n')[0] || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' ')); });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const js = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
  await send('Runtime.enable'); await send('Page.enable');
  const open = async (hash, wait = 2500) => { await send('Page.navigate', { url: BASE + hash }); await sleep(wait); };
  const hashTo = async (hash, wait = 1200) => { await js(`location.hash=${JSON.stringify(hash)};1`); await sleep(wait); };

  await open('#/', 6000);
  ok('home renders', await js(`document.querySelectorAll('#homeGames .card').length===4 && !document.querySelector('[data-view=home]').hidden`));
  ok('debug handle', await js('!!window.codex'));

  for (const g of ['trial', 'origins', 'titles', 'splash', 'ability', 'kinship', 'threads', 'blitz', 'daily']) {
    await hashTo('#/games/' + g, 1500);
    let last = '';
    for (let n = 0; n < 160; n++) { last = await js(STEP); if (String(last).startsWith('done')) break; await sleep(g === 'kinship' ? 450 : g === 'ability' ? 700 : 150); }
    const xp = await js('JSON.parse(localStorage.codex).xp');
    ok(`game ${g} finishes`, String(last).startsWith('done'), `${last} · xp ${xp}`);
  }
  ok('no repeats in titles', await js(`(async()=>{location.hash='#/games/titles';await new Promise(r=>setTimeout(r,800));const seen=new Set();for(let i=0;i<10;i++){const st=codex.engine.run.st;if(seen.has(st.c.id))return false;seen.add(st.c.id);document.querySelector('.choice').click();document.querySelector('#go').click()}return true})()`));

  await hashTo('#/games/blitz', 800);
  await js(`document.querySelector('#go').click();1`); await sleep(500); await hashTo('#/', 1500);
  ok('blitz clock stops when leaving', await js(`codex.engine.run.id==='blitz' && document.querySelector('#game .result')===null`));

  await hashTo('#/games/ability', 50); await hashTo('#/games/titles', 2500);
  ok('ability load does not leak into the next game', await js(`document.querySelector('#stageTitle').textContent==='Title Match' && !!document.querySelector('#game .prompt')`));

  // Routes
  for (const [hash, check] of [['#/champions', `document.querySelectorAll('#roster .champ').length>150`], ['#/champions/ahri', `document.querySelector('#champView h1').textContent==='Ahri'`],
    ['#/regions/ionia', `document.querySelector('#rpanel h2').textContent==='Ionia' && document.querySelector('#mapSvg .land.on').dataset.r==='ionia'`],
    ['#/web/lucian', `document.querySelector('#webSide h3').textContent==='Lucian'`], ['#/support', `!document.querySelector('[data-view=support]').hidden`], ['#/about', `!!document.querySelector('#resetBtn')`],
    ['#/nowhere', `!document.querySelector('[data-view=home]').hidden`]]) {
    await hashTo(hash, 2500);
    ok('route ' + hash, await js(check));
  }
  // Old addresses still work
  for (const [old, now] of [['#champ-garen', '#/champions/garen'], ['#atlas', '#/regions'], ['#splash', '#/games/splash'], ['#daily', '#/games/daily']]) {
    await open(old, 3500);
    ok(`old link ${old}`, (await js('location.hash')) === now, await js('location.hash'));
  }
  // Nav highlight
  await hashTo('#/games/daily', 800);
  ok('daily tab highlighted', await js(`document.querySelector('[aria-current=page]').dataset.nav==='daily'`));
  // Map click and region list link
  await hashTo('#/regions', 1500);
  await js(`document.querySelector('#mapSvg .land[data-r=void]').dispatchEvent(new MouseEvent('click',{bubbles:true}));1`); await sleep(1200);
  ok('map click routes to region', (await js('location.hash')) === '#/regions/void');
  // Filters
  await hashTo('#/champions', 2000);
  ok('filter + search message', await js(`const i=document.querySelector('#rosterSearch');i.value='ga';i.dispatchEvent(new Event('input'));const b=document.querySelector('#rosterFilters [data-f=noxus]');b.focus();b.click();document.querySelector('#roster .empty p').textContent.includes('in other regions') && document.activeElement===b`));
  // Web legend
  await hashTo('#/web/garen', 2500);
  ok('web legend filters side panel', await js(`document.querySelector('#legend [data-t=linked]').click();[...document.querySelectorAll('#webSide .ttype')].every(x=>x.textContent!=='Linked by Riot')`));
  // Phone width
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  for (const h of ['#/', '#/champions', '#/regions', '#/games/threads']) { await hashTo(h, 1800); ok('no sideways scroll at 390px ' + h, await js('document.documentElement.scrollWidth<=window.innerWidth+1'), String(await js('document.documentElement.scrollWidth'))); }

  ok('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  console.log(results.join('\n'));
  console.log(`\n${results.length - failures} passed, ${failures} failed`);
  ws.close(); br.kill(); server.kill(); process.exit(failures ? 1 : 0);
})();
