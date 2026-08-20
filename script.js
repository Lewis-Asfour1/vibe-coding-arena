const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    timer: 0,
    limit: 7,
    locked: false,
    tab: 'feed',
    interval: null
};

const $ = (s) => document.querySelector(s);

function log(msg) {
    const b = $('#c-body');
    const l = document.createElement('div');
    l.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
    b.appendChild(l);
    b.scrollTop = b.scrollHeight;
}

function switchTab(name) {
    if (State.locked && name === 'reels') return;
    State.tab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(name)));

    if (name === 'reels') startMonitoring();
    else stopMonitoring();
}

function startMonitoring() {
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        $('#meter-text').textContent = Math.floor(State.timer) + 's';
        $('#ring-fill').style.strokeDashoffset = 100.5 * (1 - (State.timer/State.limit));
        if (State.timer >= State.limit) triggerGuard();
    }, 100);
}

function stopMonitoring() {
    clearInterval(State.interval);
    if (!State.locked) { State.timer = 0; $('#ring-fill').style.strokeDashoffset = 100.5; }
}

function triggerGuard() {
    stopMonitoring();
    State.locked = true;
    $('#guard-overlay').classList.remove('hidden');
    log("LIMIT_EXCEEDED: Dopamine loop interrupted.");
}

function showFeature(f) {
    $('#guard-menu').classList.add('hidden');
    $(`#feature-${f}`).classList.remove('hidden');
}

function resetGuard() {
    document.querySelectorAll('.guard-content').forEach(c => c.classList.add('hidden'));
    $('#guard-menu').classList.remove('hidden');
}

function exitGuard() {
    State.locked = false; State.timer = 0;
    $('#guard-overlay').classList.add('hidden');
    switchTab('feed');
}

async function askAI(mode) {
    const input = $(`#${mode}-in`);
    const display = $(`#${mode}-chat`);
    if (!input.value) return;

    const u = document.createElement('div');
    u.className = 'user-msg';
    u.textContent = input.value;
    display.appendChild(u);
    const val = input.value;
    input.value = '';

    const b = document.createElement('div');
    b.className = 'bot-msg';
    b.textContent = "AI is thinking...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: val }] }] })
        });
        const data = await res.json();
        b.textContent = data.candidates[0].content.parts[0].text;
    } catch (e) {
        b.textContent = mode === 'therapy' ? "Take a breath. You're doing great." : "Focus on the basics of that topic first.";
    }
    display.scrollTop = display.scrollHeight;
}
