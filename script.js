/* ================================================
   FOCUS GUARD — MVP Demo Engine
   All state is held in memory / localStorage only.
   No network calls exist in this file. By design.
   ================================================ */

const State = {
  currentTab: 'feed',
  limit: 7,
  elapsed: 0,
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

/* ---------- COMPASS BOT BRAIN ---------- */
const BOT_REPLIES = [
  { keys: ["bored", "boring", "nothing to do"],
    reply: "Boredom is actually your brain resetting from overstimulation. Sit with it for 2 minutes — then pick ONE small thing: a glass of water, a short walk, or a message to a friend." },
  { keys: ["anxious", "anxiety", "stress", "stressed", "overwhelmed"],
    reply: "Fast scrolling keeps your nervous system on high alert. Let's slow it down: breathe in for 4 seconds, hold for 4, out for 6. Repeat that 3 times. I'll wait." },
  { keys: ["lost", "empty", "no purpose", "pointless", "don't know"],
    reply: "That empty feeling after scrolling is called the 'dopamine gap' — it's temporary, and it fades fast. What is ONE thing you wanted to get done today? Start there, even for 5 minutes." },
  { keys: ["tired", "exhausted", "sleepy", "drained"],
    reply: "Scrolling drains mental energy without resting you. If you can, close your eyes for 60 seconds, or look at something 20 feet away. Real rest beats fake rest." },
  { keys: ["sad", "down", "depressed", "unhappy"],
    reply: "I hear you. Comparing our lives to highlight reels makes everything feel heavier. Remember: you just chose to step away — that's a real win. Try texting someone who makes you feel like yourself." },
  { keys: ["good", "fine", "great", "okay", "ok", "better"],
    reply: "That's great to hear. Ride that momentum — pick one small task and finish it now while your focus is fresh. Future-you will thank you." },
  { keys: ["study", "work", "focus", "homework", "exam"],
    reply: "Perfect timing. Try this: 10 minutes of focused work, no phone in reach. Just 10. Once you start, momentum usually carries you further than you expect." },
  { keys: ["help", "how", "what do i do"],
    reply: "I'm here to bridge the gap between scrolling and real life. Tell me how you feel — bored, anxious, lost, tired — and I'll give you one small step forward." }
];
const BOT_DEFAULT = "I hear you. You've already done the hardest part — you stopped the scroll. Now, what's one small thing you could do off-screen in the next 5 minutes? Start small. Small wins rebuild focus.";

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
const chatDisplay = $('#chat-display');
const userInput   = $('#user-input');
const RING_LEN    = 97.4;

/* ---------- LOCAL LOG ---------- */
function log(msg, type = '') {
  const t = new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 8);
  const el = document.createElement('div');
  el.className = `log ${type}`;
  el.innerHTML = `<span class="ts">${t}</span>${msg}`;
  consoleBody.appendChild(el);
  consoleBody.scrollTop = consoleBody.scrollHeight;
  try {
    const hist = JSON.parse(localStorage.getItem('fg_log') || '[]');
    hist.push({ t, msg });
    localStorage.setItem('fg_log', JSON.stringify(hist.slice(-50)));
  } catch (e) {}
}

/* ---------- TAB SWITCHING ---------- */
function switchTab(name) {
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

  if (name === 'therapy') {
    log('compass_opened · session=local', 'log-ok');
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

/* ---------- COMPASS CHAT ---------- */
function addMessage(text, cls) {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  chatDisplay.appendChild(el);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function botReplyTo(text) {
  const val = text.toLowerCase();
  let reply = BOT_DEFAULT;
  for (const item of BOT_REPLIES) {
    if (item.keys.some(k => val.includes(k))) { reply = item.reply; break; }
  }

  // typing indicator
  const typing = document.createElement('div');
  typing.className = 'bot-msg typing';
  typing.innerHTML = '<i></i><i></i><i></i>';
  chatDisplay.appendChild(typing);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;

  setTimeout(() => {
    typing.remove();
    addMessage(reply, 'bot-msg');
    log('compass_reply · generated=on-device', 'log-ok');
  }, 1100);
}

function sendChat(textOverride) {
  const text = (textOverride || userInput.value).trim();
  if (!text) return;
  addMessage(text, 'user-msg');
  userInput.value = '';
  botReplyTo(text);
}

/* ---------- LISTENERS ---------- */
tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b =>
  b.addEventListener('click', () => switchTab(b.dataset.go))
);

$('#send-btn').addEventListener('click', () => sendChat());
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });
document.querySelectorAll('.chip').forEach(c =>
  c.addEventListener('click', () => sendChat(c.dataset.say))
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
log('excluded: dms | feed | search | profile | compass', 'log-ok');
