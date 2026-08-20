const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    tab: 'feed',
    timer: 0,
    limit: 7,
    locked: false,
    interval: null,
    pomo: 25 * 60,
    pomoInterval: null
};

const $ = (s) => document.querySelector(s);

function log(msg) {
    const b = $('#log-output');
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

    if (name === 'reels') startReels();
    else stopReels();
}

function startReels() {
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        $('#meter-text').textContent = Math.floor(State.timer) + 's';
        $('#ring-fill').style.strokeDashoffset = 100.5 * (1 - (State.timer/State.limit));
        if (State.timer >= State.limit) triggerGuard();
    }, 100);
}

function stopReels() {
    clearInterval(State.interval);
    if (!State.locked) { State.timer = 0; $('#ring-fill').style.strokeDashoffset = 100.5; }
}

function triggerGuard() {
    stopReels();
    State.locked = true;
    $('#guard-overlay').classList.remove('hidden');
    log("INTERVENTION: Limit reached.");
}

function openGuardFeature(f) {
    document.querySelectorAll('.guard-pane').forEach(p => p.classList.add('hidden'));
    $(`#guard-${f}`).classList.remove('hidden');
    if (f === 'study') startPomo();
}

function backToGuardMenu() {
    document.querySelectorAll('.guard-pane').forEach(p => p.classList.add('hidden'));
    $('#guard-menu').classList.remove('hidden');
}

function exitGuard() {
    State.locked = false; State.timer = 0;
    $('#guard-overlay').classList.add('hidden');
    switchTab('feed');
}

async function sendGemini(mode) {
    const input = $(`#${mode}-input`);
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
    b.textContent = "Thinking...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: val }] }] })
        });
        const data = await res.json();
        b.innerHTML = data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');
    } catch (e) {
        b.textContent = "Focus on your breathing. You're doing great.";
    }
    display.scrollTop = display.scrollHeight;
}

function startPomo() {
    clearInterval(State.pomoInterval);
    State.pomoInterval = setInterval(() => {
        State.pomo--;
        const m = Math.floor(State.pomo / 60);
        const s = State.pomo % 60;
        $('#study-timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (State.pomo <= 0) clearInterval(State.pomoInterval);
    }, 1000);
}
