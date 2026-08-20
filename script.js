/* ================================================
   FOCUS GUARD — MVP Demo Engine
   All state is held in memory / localStorage only.
   No network calls exist in this file. By design.
   ================================================ */

const State = {
  currentTab: 'feed',
  limit: 7,            // seconds
  elapsed: 0,          // seconds on reels this session
  locked: false,
  ticker: null,
  totalSaved: 0
};

const SUGGESTIONS = [
  "Text a friend back",
  "Drink a glass of water",
  "Stand up and stretch for 60 seconds",
  "Write down one thing on your mind",
  "Step outside and look at something far away",
  "Open the notes you were supposed to read",
  "Take 5 slow breaths"
];

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const tabs        = document.querySelectorAll('.tab');
const overlay     = $('#guard-overlay');
const ringFill    = $('#ring-fill');
const meterText   = $('#meter-text');
const guardTime   = $('#guard-time');
const suggestion  = $('#suggestion-text');
const lockBadge   = $('#lock-badge');
const consoleBody = $('#console-body');
const slider      = $('#limit-slider');
const limitVal    = $('#limit-val');
const RING_LEN    = 97.4;

/* ---------- LOCAL LOG ---------- */
function log(msg, type = '') {
  const t = new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 8);
  const el = document.createElement('div');
  el.className = `log ${type}`;
  el.innerHTML = `<span class="ts">${t}</span>${msg}`;
  consoleBody.appendChild(el);
  consoleBody.scrollTop = consoleBody.scrollHeight;
  // persist locally — proof of "local-only"
  try {
    const hist = JSON.parse(localStorage.getItem('fg_log') || '[]');
    hist.push({ t, msg });
    localStorage.setItem('fg_log', JSON.stringify(hist.slice(-50)));
  } catch (e) {}
}

/* ---------- TAB SWITCHING ---------- */
function switchTab(name) {
  // Guard is active: only escape routes allowed
  if (State.locked && name === 'reels') {
    overlay.querySelector('.guard-inner').classList.remove('shake');
    void overlay.offsetWidth;
    overlay.querySelector('.guard-inner').classList.add('shake');
    log('blocked_surface=reels · redirect required', 'log-block');
    return;
  }

  State.currentTab = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $('#view-' + name).classList.add('active');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));

  if (name === 'reels') {
    startWatching();
  } else {
    stopWatching();
    if (State.locked) releaseGuard(name);
  }
}

/* ---------- MONITORING ---------- */
function startWatching() {
  if (State.locked) return;
  log('surface_detected: short_form_video_feed', 'log-warn');
  log('classifier → vertical | autoplay | infinite = TRUE');
  clearInterval(State.ticker);
  State.ticker = setInterval(tick, 100);
}

function stopWatching() {
  clearInterval(State.ticker);
  State.ticker = null;
  if (!State.locked && State.elapsed > 0) {
    log(`surface_exited · session=${State.elapsed.toFixed(1)}s`, 'log-ok');
  }
}

function tick() {
  State.elapsed += 0.1;
  const pct = Math.min(State.elapsed / State.limit, 1);
  ringFill.style.strokeDashoffset = RING_LEN * (1 - pct);
  meterText.textContent = Math.floor(State.elapsed) + 's';

  if (pct > 0.65 && pct < 1) ringFill.style.stroke = '#ffd479';
  if (pct >= 1) ringFill.style.stroke = '#ff8f7a';

  if (State.elapsed >= State.limit) triggerGuard();
}

/* ---------- THE GUARD ---------- */
function triggerGuard() {
  clearInterval(State.ticker);
  State.locked = true;
  guardTime.textContent = Math.round(State.elapsed) + 's';
  suggestion.textContent = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
  overlay.classList.remove('hidden');
  lockBadge.classList.remove('hidden');
  log(`LIMIT REACHED (${State.limit}s) → guard engaged`, 'log-block');
  log('awaiting user redirect to safe surface…', 'log-warn');
}

function releaseGuard(destination) {
  overlay.classList.add('hidden');
  lockBadge.classList.add('hidden');
  State.locked = false;
  State.totalSaved += State.elapsed;
  State.elapsed = 0;
  ringFill.style.strokeDashoffset = RING_LEN;
  ringFill.style.stroke = '#6fd39c';
  meterText.textContent = '0s';
  log(`redirected → ${destination} · guard released`, 'log-ok');
}

/* ---------- LISTENERS ---------- */
tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b =>
  b.addEventListener('click', () => switchTab(b.dataset.go))
);

$('#reels-scroll').addEventListener('scroll', () => {
  if (!State.locked && Math.random() > 0.85) log('scroll_event · stored_locally=true');
}, { passive: true });

slider.addEventListener('input', e => {
  State.limit = +e.target.value;
  limitVal.textContent = State.limit + 's';
  log(`user_pref updated: limit=${State.limit}s (device only)`);
});

$('#reset-btn').addEventListener('click', () => {
  clearInterval(State.ticker);
  State.locked = false; State.elapsed = 0;
  overlay.classList.add('hidden');
  lockBadge.classList.add('hidden');
  ringFill.style.strokeDashoffset = RING_LEN;
  ringFill.style.stroke = '#6fd39c';
  meterText.textContent = '0s';
  switchTab('feed');
  log('session reset', 'log-sys');
});

/* ---------- BOOT ---------- */
log('daemon started · storage=device · network=disabled', 'log-sys');
log('monitoring: reels | shorts | tiktok');
log('excluded: dms | feed | search | profile', 'log-ok');
