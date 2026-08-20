/* 
   FOCUS GUARD CORE
   Surgical Blocking Logic + Local AI
*/

const State = {
    timer: 0,
    limit: 7,
    locked: false,
    view: 'home',
    interval: null,
    mode: 'therapy'
};

const $ = (s) => document.querySelector(s);

/* --- NAVIGATION --- */
function tab(name) {
    if (State.locked && name === 'reels') return;
    State.view = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === name));

    if (name === 'reels') startMonitoring();
    else stopMonitoring();
}

/* --- REELS MONITOR --- */
function startMonitoring() {
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        $('#meter-val').textContent = Math.floor(State.timer) + 's';
        $('#c-fill').style.strokeDashoffset = 100.5 * (1 - (State.timer/State.limit));
        if (State.timer >= State.limit) triggerGuard();
    }, 100);
}

function stopMonitoring() {
    clearInterval(State.interval);
    if (!State.locked) { State.timer = 0; $('#c-fill').style.strokeDashoffset = 100.5; }
}

function triggerGuard() {
    stopMonitoring();
    State.locked = true;
    $('#guard-overlay').classList.remove('hidden');
}

/* --- OVERLAY UI --- */
function openAI(m) {
    State.mode = m;
    $('#chat-title').textContent = m === 'therapy' ? 'The Compass' : 'Study Buddy';
    $('#guard-menu').classList.add('hidden');
    $('#guard-chat').classList.remove('hidden');
}

function backToMenu() {
    $('#guard-chat').classList.add('hidden');
    $('#guard-menu').classList.remove('hidden');
}

function deactivateGuard() {
    State.locked = false; State.timer = 0;
    $('#guard-overlay').classList.add('hidden');
    tab('home');
}

/* --- LOCAL AI LOGIC --- */
function handleBotMessage() {
    const input = $('#chat-input');
    const display = $('#chat-display');
    if (!input.value) return;

    const u = document.createElement('div');
    u.className = 'user-bubble';
    u.textContent = input.value;
    display.appendChild(u);
    input.value = '';

    const b = document.createElement('div');
    b.className = 'bot-bubble';
    b.textContent = "...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    setTimeout(() => {
        if (State.mode === 'therapy') {
            b.textContent = "Take a breath. Reclaiming your time from the scroll loop is a victory. What's one thing you can see right now?";
        } else {
            b.textContent = "Great topic. Focus on the core definition first. Can you summarize why this is important in one sentence?";
        }
        display.scrollTop = display.scrollHeight;
    }, 800);
}
