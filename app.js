'use strict';
/* Arrow Neon Puzzle - vanilla JS. Board is always 20x20 = 400 cells. */
const CONFIG = { SIZE: 20, LIVES: 3, HINT_COST: 10, LEVEL_REWARD: 20, START_COINS: 30,
  MAX_ATTEMPTS: 25, MIN_ARROWS: 40, SAVE_KEY: 'arrowNeonSave_v1' };
const N = CONFIG.SIZE;
const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];   // up, right, down, left
const GLYPH = ['\u2191', '\u2192', '\u2193', '\u2190'];
const idx = (r, c) => r * N + c;

/* An arrow is a snake: cells[] runs tail -> head, d is the exit direction (last step of the body).
   occ[] maps each cell to the id of the active arrow covering it, or -1. */
function rayClear(occ, a) {
  const h = a.cells[a.cells.length - 1]; let r = (h / N) | 0, c = h % N; const [dr, dc] = DIRS[a.d];
  r += dr; c += dc;
  while (r >= 0 && r < N && c >= 0 && c < N) { if (occ[idx(r, c)] !== -1) return false; r += dr; c += dc; }
  return true;
}
function exitDistance(a) { const h = a.cells[a.cells.length - 1], r = (h / N) | 0, c = h % N; return [r + 1, N - c, N - r, c + 1][a.d] + a.cells.length; }
function shuffle(x) { for (let i = x.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [x[i], x[j]] = [x[j], x[i]]; } return x; }
function makeOcc(list) { const o = new Array(N * N).fill(-1); list.forEach(a => a.cells.forEach(i => { o[i] = a.id; })); return o; }

/* Step 1: tile the board with random winding snakes (random walk over free cells). */
function tile(level) {
  const maxLen = Math.min(14, 5 + level), occ = new Array(N * N).fill(-1), list = [];
  for (const s of shuffle([...Array(N * N).keys()])) {
    if (occ[s] !== -1) continue;
    const id = list.length, cells = [s], target = 2 + (Math.random() * (maxLen - 1) | 0); occ[s] = id;
    let last = -1;
    while (cells.length < target) {
      const cur = cells[cells.length - 1], r = (cur / N) | 0, c = cur % N;
      const opts = [0, 1, 2, 3].filter(d => { const nr = r + DIRS[d][0], nc = c + DIRS[d][1]; return nr >= 0 && nr < N && nc >= 0 && nc < N && occ[idx(nr, nc)] === -1; });
      if (!opts.length) break;
      const d = opts.includes(last) && Math.random() < 0.5 ? last : opts[Math.random() * opts.length | 0];
      const n = idx(r + DIRS[d][0], c + DIRS[d][1]); occ[n] = id; cells.push(n); last = d;
    }
    if (last === -1) last = Math.random() * 4 | 0;
    list.push({ id, cells, d: last });
  }
  return list.filter(a => a.cells.length >= 2);   // drop 1-cell stubs: only real snakes remain
}
function redirect(a, occ) {
  const n = a.cells.length;
  if (n === 1) { for (const d of shuffle([0, 1, 2, 3])) { const t = { cells: a.cells, d }; if (rayClear(occ, t)) { a.d = d; return true; } } return false; }
  const cs = a.cells.slice().reverse(), p = cs[n - 2], h = cs[n - 1], dr = (h / N | 0) - (p / N | 0), dc = h % N - p % N;
  const t = { cells: cs, d: DIRS.findIndex(v => v[0] === dr && v[1] === dc) };
  if (rayClear(occ, t)) { a.cells = cs; a.d = t.d; return true; } return false;
}
/* Step 2: guarantee solvability. Greedily remove every arrow with a clear exit; if some remain
   stuck (a blocking cycle), delete one stuck arrow from the board and retry. Each pass deletes
   at least one arrow, so this always terminates with a solvable board. */
function makeSolvable(list) {
  for (;;) {
    const occ = makeOcc(list); let rest = list.slice(), moved = true;
    while (moved && rest.length) {
      moved = false;
      rest = rest.filter(a => { if (rayClear(occ, a)) { a.cells.forEach(i => { occ[i] = -1; }); moved = true; return false; } return true; });
    }
    if (!rest.length) return list;
    // Try flipping a stuck snake (swap head/tail, or turn a 1-cell arrow) before deleting anything.
    let fixed = false;
    for (const a of shuffle(rest.slice())) { if (redirect(a, occ)) { fixed = true; break; } }
    if (!fixed) { const drop = rest[Math.random() * rest.length | 0]; list = list.filter(a => a !== drop); }
  }
}
/* Independent validator used by tests and by createBoard. */
function isSolvable(list) {
  const occ = makeOcc(list); let rest = list.slice(), moved = true;
  while (moved && rest.length) { moved = false; rest = rest.filter(a => { if (rayClear(occ, a)) { a.cells.forEach(i => { occ[i] = -1; }); moved = true; return false; } return true; }); }
  return rest.length === 0;
}
function validShape(list) {
  const seen = new Set();
  return list.every(a => a.cells.every((i, k) => { if (seen.has(i) || i < 0 || i >= N * N) return false; seen.add(i);
    if (!k) return true; const p = a.cells[k - 1]; return Math.abs((p / N | 0) - (i / N | 0)) + Math.abs(p % N - i % N) === 1; }));
}
/* Fallback: one full-width arrow per row, alternating right/left. */
function fallbackBoard() { return [...Array(N).keys()].map(r => { const cells = [...Array(N).keys()].map(c => idx(r, c)); if (r % 2) cells.reverse(); return { id: r, cells, d: r % 2 ? 3 : 1 }; }); }
function createBoard(level) {
  for (let t = 0; t < CONFIG.MAX_ATTEMPTS; t++) {
    const list = makeSolvable(tile(level)).map((a, i) => ({ id: i, cells: a.cells, d: a.d }));
    if (list.length >= CONFIG.MIN_ARROWS && validShape(list) && isSolvable(list)) return list;
  }
  return fallbackBoard();
}

if (typeof module !== 'undefined') module.exports = { createBoard, isSolvable, validShape, CONFIG, N };

if (typeof document !== 'undefined') (function () {
  const $ = id => document.getElementById(id);
  const el = { coins: $('coins'), level: $('level'), bar: $('bar'), hearts: $('hearts'), board: $('board'),
    think: $('think'), restart: $('restart'), msg: $('msg'), over: $('modal-over'), win: $('modal-win'),
    overRestart: $('over-restart'), overAd: $('over-ad'), overNote: $('over-note'), winNext: $('win-next'), winCoins: $('win-coins'),
    freeCoins: $('free-coins'), adTop: $('ad'), adWin: $('ad-win'), adOver: $('ad-over'), adLayer: $('adlayer'), adBox: $('adcontainer'), adVideo: $('advideo') };
  const ADS = Object.assign({ topBanner: '', winBanner: '', overBanner: '', socialBar: '', vastTagUrl: '', continueHearts: 3,
    maxContinuesPerLevel: 1, coinsVideoReward: 20, coinsVideoCooldownSec: 60 }, window.ARROW_ADS || {});
  let winUsed = false, overUsed = false, continuesUsed = 0, adBusy = false, lastCoinVideo = 0;
  let S = { level: 1, coins: CONFIG.START_COINS };
  let arrows = [], active = [], occ = [], red = new Set(), hearts = CONFIG.LIVES, over = false, done = false, hintId = -1;
  const NS = 'http://www.w3.org/2000/svg', nodes = [];
  let svg;

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY));
      if (d && Number.isInteger(d.level) && d.level >= 1 && Number.isInteger(d.coins) && d.coins >= 0) S = { level: d.level, coins: d.coins };
    } catch (e) { /* corrupted or unavailable: keep defaults */ }
  }
  function save() { try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  const say = t => { el.msg.textContent = t; };

  // 400 fixed grid cells (CSS grid) draw the dot lattice; arrows are drawn in one SVG overlay.
  for (let i = 0; i < N * N; i++) { const c = document.createElement('div'); c.className = 'cell'; el.board.appendChild(c); }
  svg = document.createElementNS(NS, 'svg'); svg.setAttribute('id', 'lines'); svg.setAttribute('viewBox', '0 0 ' + N + ' ' + N);
  el.board.appendChild(svg);
  for (let i = 0; i < CONFIG.LIVES; i++) { const h = document.createElement('span'); h.className = 'heart'; h.textContent = '\u2665'; el.hearts.appendChild(h); }

  function render() {
    svg.textContent = ''; nodes.length = 0;
    arrows.forEach(a => {
      const pts = a.cells.map(i => ((i % N) + .5) + ' ' + (((i / N) | 0) + .5));
      const [dr, dc] = DIRS[a.d], [hx, hy] = pts[pts.length - 1].split(' ').map(Number);
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'ar'); g.dataset.id = a.id;
      const d = 'M' + pts.join('L');
      g.innerHTML = '<path class="hit" d="' + d + '"/><path class="body" d="' + d + '"/><polygon class="head" points="' +
        (hx + dc * .5) + ',' + (hy + dr * .5) + ' ' + (hx - dr * .3) + ',' + (hy + dc * .3) + ' ' + (hx + dr * .3) + ',' + (hy - dc * .3) + '"/>';
      svg.appendChild(g); nodes[a.id] = g;
    });
  }
  const left = () => active.filter(Boolean).length;
  function hud() {
    el.coins.textContent = S.coins; el.level.textContent = S.level;
    el.bar.style.width = (arrows.length ? (arrows.length - left()) / arrows.length * 100 : 0) + '%';
    [...el.hearts.children].forEach((h, i) => h.classList.toggle('lost', i >= hearts));
  }
  /* ---------- Adsterra ads ---------- */
  // Banner / native snippets run in their own iframe (no sandbox: Adsterra needs the page's real domain and
  // popups to serve and track ads; a sandboxed iframe has no domain and gets no ads).
  // Code that still contains the REPLACE_WITH_YOUR marker is sample code: show a labelled box only.
  const isSample = t => !t || !t.trim() || /REPLACE_WITH_YOUR/.test(t);
  function fillAd(slot, snippet, w, h, name) {
    slot.textContent = ''; slot.classList.remove('live');
    if (isSample(snippet)) { slot.textContent = (snippet && name ? 'SAMPLE: ' + name + ' ' : 'Ad space ') + w + '\u00d7' + h; return Promise.resolve(); }
    return new Promise(res => {
      const f = document.createElement('iframe'); f.width = w; f.height = h; f.scrolling = 'no';
      f.addEventListener('load', res); setTimeout(res, 4000);
      f.srcdoc = '<!doctype html><body style="margin:0;background:transparent">' + snippet + '</body>';
      slot.appendChild(f); slot.classList.add('live');
    });
  }
  // Social Bar is one script that floats over the page by itself, so it is added to the page once.
  function injectSnippet(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script').forEach(o => { const s = document.createElement('script');
      [...o.attributes].forEach(a => s.setAttribute(a.name, a.value)); s.text = o.textContent; document.body.appendChild(s); });
  }
  // Rewarded video: Adsterra VAST tag played through the Google IMA SDK.
  // The ad is requested in advance (preloadVideo) so it starts at once when the player taps.
  // Reward only after IMA reports the ad COMPLETE; skip, error, timeout or no SDK = no reward.
  let pre = null;
  function loadIma() {
    return new Promise(res => {
      if (isSample(ADS.vastTagUrl) || window.google && window.google.ima) return res();
      const s = document.createElement('script'); s.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js'; s.async = true;
      s.onload = s.onerror = () => res(); document.head.appendChild(s);
    });
  }
  function preloadVideo() {
    const ima = window.google && window.google.ima;
    if (isSample(ADS.vastTagUrl) || !ima || (pre && Date.now() - pre.t < 15 * 60000)) return Promise.resolve();   // tags expire, refresh after 15 min
    if (pre && pre.mgr) { try { pre.mgr.destroy(); } catch (e) {} }
    const p = pre = { t: Date.now(), mgr: null, state: 'loading', cbs: [], dc: new ima.AdDisplayContainer(el.adBox, el.adVideo) };
    const settle = st => { p.state = st; p.cbs.splice(0).forEach(f => f()); };
    const loader = new ima.AdsLoader(p.dc);
    loader.addEventListener(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, e => { p.mgr = e.getAdsManager(el.adVideo); settle('ready'); });
    loader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => { if (pre === p) pre = null; settle('failed'); });
    const req = new ima.AdsRequest(), w = window.innerWidth, h = window.innerHeight; req.adTagUrl = ADS.vastTagUrl;
    req.linearAdSlotWidth = w; req.linearAdSlotHeight = h; req.nonLinearAdSlotWidth = w; req.nonLinearAdSlotHeight = h;
    loader.requestAds(req);
    return new Promise(res => { if (p.state !== 'loading') res(); else p.cbs.push(res); });
  }
  function playVideo() {
    return new Promise(resolve => {
      const ima = window.google && window.google.ima;
      if (isSample(ADS.vastTagUrl)) return resolve({ ok: false, reason: 'config' });
      if (!ima) return resolve({ ok: false, reason: 'sdk' });
      if (!pre || Date.now() - pre.t >= 15 * 60000) { pre = null; preloadVideo(); }
      const p = pre; let completed = false, settled = false, timer = 0;
      const finish = (ok, reason) => { if (settled) return; settled = true; clearTimeout(timer);
        try { if (p.mgr) p.mgr.destroy(); } catch (e) {} if (pre === p) pre = null; el.adLayer.hidden = true; resolve({ ok, reason });
        setTimeout(preloadVideo, 500); };                    // get the next video ready
      el.adLayer.hidden = false; p.dc.initialize();            // must run inside the tap handler
      const T = ima.AdEvent.Type, start = () => {
        if (settled) return; if (p.state !== 'ready') return finish(false, 'error');
        const mgr = p.mgr;
        mgr.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => finish(false, 'error'));
        mgr.addEventListener(T.STARTED, () => clearTimeout(timer));
        mgr.addEventListener(T.SKIPPED, () => finish(false, 'skipped'));
        mgr.addEventListener(T.COMPLETE, () => { completed = true; });
        mgr.addEventListener(T.ALL_ADS_COMPLETED, () => finish(completed, completed ? 'ok' : 'incomplete'));
        try { mgr.init(window.innerWidth, window.innerHeight, ima.ViewMode.NORMAL); mgr.start(); } catch (err) { finish(false, 'error'); }
      };
      timer = setTimeout(() => finish(false, 'timeout'), 15000);
      if (p.state === 'loading') p.cbs.push(start); else start();
    });
  }
  const failText = r => r === 'config' ? 'Video ads are not set up yet.' : r === 'skipped' ? 'Video was skipped, so no reward.'
    : 'No video available right now. Try again later.';
  function refreshOver() {
    const left = ADS.maxContinuesPerLevel - continuesUsed;
    el.overAd.disabled = left <= 0; el.overAd.textContent = left > 0 ? 'Watch video: continue' : 'Continue used for this level';
  }
  // Banners for both popups are loaded at start-up; after a popup was shown, its banner is reloaded in the background.
  const loadWinAd = () => { winUsed = false; return fillAd(el.adWin, ADS.winBanner, 300, 250, 'winBanner'); };
  const loadOverAd = () => { overUsed = false; return fillAd(el.adOver, ADS.overBanner, 300, 250, 'overBanner'); };
  function showOver() { over = true; el.overNote.textContent = ''; refreshOver(); overUsed = true; el.over.hidden = false; say('Game over.'); }
  const headPts = (B, dx, dy) => (B[0] + dx * .42) + ',' + (B[1] + dy * .42) + ' ' + (B[0] - dy * .26) + ',' + (B[1] + dx * .26) + ' ' + (B[0] + dy * .26) + ',' + (B[1] - dx * .26);
  let token = 0;
  /* Dashed line from the arrow's head to the board edge: cyan when clear, red when blocked. */
  function showRay(a, ok) {
    const h = a.cells[a.cells.length - 1], x = h % N + .5, y = ((h / N) | 0) + .5, [dr, dc] = DIRS[a.d];
    const k = exitDistance(a) - a.cells.length, ln = document.createElementNS(NS, 'line');
    ln.setAttribute('class', 'ray ' + (ok ? 'ok' : 'bad'));
    ln.setAttribute('x1', x); ln.setAttribute('y1', y); ln.setAttribute('x2', x + dc * (k - .5)); ln.setAttribute('y2', y + dr * (k - .5));
    svg.appendChild(ln); return ln;
  }
  /* The snake travels along its own bends: the head leads, the body follows the same track,
     then everything continues straight past the edge. We slide a window along one long polyline. */
  function slide(a, g, done) {
    const P = a.cells.map(i => [i % N + .5, ((i / N) | 0) + .5]), [dr, dc] = DIRS[a.d], h = P[P.length - 1], my = token;
    const n = a.cells.length, k = exitDistance(a) - n;
    for (let j = 1; j <= k + n + 1; j++) P.push([h[0] + dc * j, h[1] + dr * j]);
    const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const Lb = cum[n - 1], end = cum[cum.length - 1] - Lb;
    const at = s => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const f = (s - cum[i - 1]) / (cum[i] - cum[i - 1]);
      return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f, i]; };
    const body = g.querySelector('.body'), head = g.querySelector('.head'); g.querySelector('.hit').remove();
    const t0 = performance.now();
    (function step(now) {
      if (my !== token) return;                                   // level restarted meanwhile
      const s = Math.min(end, (now - t0) / 1000 * 24), A = at(s), B = at(s + Lb), pts = [[A[0], A[1]]];
      for (let i = A[2]; i < B[2]; i++) pts.push(P[i]);
      pts.push([B[0], B[1]]);
      body.setAttribute('d', 'M' + pts.map(p => p[0] + ' ' + p[1]).join('L'));
      const q = pts[pts.length - 2]; let dx = B[0] - q[0], dy = B[1] - q[1]; const m = Math.hypot(dx, dy);
      if (m < 1e-6) { dx = dc; dy = dr; } else { dx /= m; dy /= m; }
      head.setAttribute('points', headPts(B, dx, dy));
      if (s < end) requestAnimationFrame(step); else done();
    })(t0);
  }
  function startLevel(newBoard) {
    token++; if (newBoard) continuesUsed = 0;
    if (winUsed) loadWinAd(); if (overUsed) loadOverAd();
    if (newBoard) arrows = createBoard(S.level);
    active = arrows.map(() => true); occ = new Array(N * N).fill(-1); arrows.forEach(a => a.cells.forEach(i => { occ[i] = a.id; }));
    red = new Set(); hearts = CONFIG.LIVES; over = false; done = false; hintId = -1;
    el.over.hidden = el.win.hidden = true; render(); hud();
    say('Tap an arrow whose path to the edge is clear.');
  }
  function clearHint() { if (hintId >= 0 && nodes[hintId]) nodes[hintId].classList.remove('hint'); hintId = -1; }

  svg.addEventListener('click', e => {
    if (Date.now() - lastPinch < 300) return;          // a pinch must never count as a tap
    const g = e.target.closest('.ar'); if (!g || over || done) return;
    const id = +g.dataset.id, a = arrows[id];
    if (!active[id]) return;                              // already removed / animating
    clearHint();
    const ok = rayClear(occ, a), ray = showRay(a, ok);
    if (ok) {
      active[id] = false; a.cells.forEach(i => { occ[i] = -1; });   // free cells now; blocks double-removal
      hud(); say('Cleared.');
      slide(a, g, () => { g.remove(); ray.remove(); checkWin(); });
    } else if (red.has(id)) {
      setTimeout(() => ray.remove(), 900);
      say('That arrow is already blocked. No heart lost.');
    } else {
      setTimeout(() => ray.remove(), 900);
      red.add(id); g.classList.add('red'); hearts--; hud();
      if (hearts <= 0) showOver();
      else say('Blocked! ' + hearts + (hearts === 1 ? ' heart' : ' hearts') + ' left.');
    }
  });
  // Level-complete dialog: stars = hearts left (3/2/1), reward counts up, then the real value is set.
  function showWin() {
    const $w = id => document.getElementById(id), stars = [...$w('win-stars').children];
    $w('win-level').textContent = S.level - 1; $w('win-hearts').textContent = hearts; $w('win-total').textContent = S.coins;
    el.winNext.textContent = 'Next level ' + S.level;
    stars.forEach((st, i) => { st.classList.remove('on'); void st.offsetWidth; if (i < hearts) { st.style.setProperty('--d', (0.45 + i * 0.18) + 's'); st.classList.add('on'); } });
    el.winCoins.textContent = 0; winUsed = true; el.win.hidden = false;
    const wc = el.win.firstElementChild; wc.classList.remove('play'); void wc.offsetWidth; wc.classList.add('play');   // replay the intro animation
    const t0 = performance.now(), R = CONFIG.LEVEL_REWARD;
    (function tick(now) { const f = Math.min(1, (now - t0) / 700); el.winCoins.textContent = Math.round(R * f); if (f < 1) requestAnimationFrame(tick); })(t0);
    setTimeout(() => { el.winCoins.textContent = R; }, 800);   // guarantees the exact final value
  }
  function checkWin() {
    if (done || over || left()) return;
    done = true; S.coins += CONFIG.LEVEL_REWARD; S.level += 1; save(); hud();   // reward granted once (guarded by done)
    showWin();
  }
  el.think.addEventListener('click', () => {
    if (over || done) return;
    if (S.coins < CONFIG.HINT_COST) { say('Not enough coins. A hint costs ' + CONFIG.HINT_COST + '.'); return; }
    const free = arrows.filter(a => active[a.id] && rayClear(occ, a));
    if (!free.length) { say('No hint available.'); return; }
    clearHint(); hintId = free[Math.random() * free.length | 0].id;
    S.coins -= CONFIG.HINT_COST; save(); hud();
    nodes[hintId].classList.add('hint'); say('This arrow can leave the board.');
  });
  el.restart.addEventListener('click', () => startLevel(false));
  el.overRestart.addEventListener('click', () => startLevel(false));
  el.overAd.addEventListener('click', async () => {
    if (adBusy || !over || continuesUsed >= ADS.maxContinuesPerLevel) return;
    adBusy = true; el.overNote.textContent = 'Loading video...';
    const r = await playVideo(); adBusy = false;
    if (r.ok) {                                            // verified: IMA reported the video COMPLETE
      continuesUsed++; hearts = Math.max(1, Math.min(CONFIG.LIVES, ADS.continueHearts | 0)); over = false;
      el.over.hidden = true; loadOverAd(); hud(); say('Thanks! Hearts restored. Keep going.');
    } else el.overNote.textContent = failText(r.reason);
  });
  el.freeCoins.addEventListener('click', async () => {
    if (adBusy || over || done) return;
    const wait = Math.ceil((lastCoinVideo + ADS.coinsVideoCooldownSec * 1000 - Date.now()) / 1000);
    if (wait > 0) { say('Next free-coins video in ' + wait + 's.'); return; }
    adBusy = true; say('Loading video...');
    const r = await playVideo(); adBusy = false;
    if (r.ok) { lastCoinVideo = Date.now(); S.coins += ADS.coinsVideoReward | 0; save(); hud(); say('+' + ADS.coinsVideoReward + ' coins!'); }
    else say(failText(r.reason));
  });
  el.winNext.addEventListener('click', () => startLevel(true));   // S.level was already advanced on completion

  /* ---------- Zoom: +/- buttons and two-finger pinch; one finger scrolls the zoomed board ---------- */
  let zoom = 1, lastPinch = 0; const stage = $('stage'), pts = new Map(); let pinch = null;
  function setZoom(z, cx, cy) {
    z = Math.max(1, Math.min(3, Math.round(z * 100) / 100)); if (z === zoom) return;
    if (cx === undefined) { cx = stage.clientWidth / 2; cy = stage.clientHeight / 2; }
    const r = z / zoom, sl = stage.scrollLeft, st = stage.scrollTop; zoom = z;
    el.board.style.setProperty('--z', z);
    stage.scrollLeft = (sl + cx) * r - cx; stage.scrollTop = (st + cy) * r - cy;   // keep the point under the fingers fixed
    $('zreset').textContent = (z % 1 ? z.toFixed(1) : z) + '\u00d7';
  }
  $('zin').addEventListener('click', () => setZoom(zoom + 0.5));
  $('zout').addEventListener('click', () => setZoom(zoom - 0.5));
  $('zreset').addEventListener('click', () => { setZoom(1); stage.scrollLeft = stage.scrollTop = 0; });
  const gap = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1; };
  stage.addEventListener('pointerdown', e => { pts.set(e.pointerId, e); pinch = pts.size === 2 ? { d: gap(), z: zoom } : null; });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
    if (pts.size !== 2) return;
    const [a, b] = [...pts.values()], dist = gap(), rc = stage.getBoundingClientRect();
    if (!pinch) pinch = { d: dist, z: zoom };
    lastPinch = Date.now();
    setZoom(pinch.z * dist / pinch.d, (a.clientX + b.clientX) / 2 - rc.left, (a.clientY + b.clientY) / 2 - rc.top);
  });
  const endPtr = e => { if (pts.size === 2) lastPinch = Date.now(); pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
  stage.addEventListener('pointerup', endPtr); stage.addEventListener('pointercancel', endPtr);

  /* ---------- PWA: offline cache + "Install app" button ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  let installEvt = null; const installBtn = $('install');
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; installBtn.hidden = false; });
  installBtn.addEventListener('click', async () => {
    if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {}
    installEvt = null; installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

  const adsReady = [fillAd(el.adTop, ADS.topBanner, 320, 50, 'topBanner'), loadWinAd(), loadOverAd(), loadIma().then(preloadVideo)];
  if (!isSample(ADS.socialBar)) injectSnippet(ADS.socialBar);
  Promise.race([Promise.all(adsReady), new Promise(r => setTimeout(r, 4000))]).then(() => { $('boot').hidden = true; });
  load(); startLevel(true);
})();
