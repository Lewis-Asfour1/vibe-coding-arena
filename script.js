/* FOCUS GUARD ENGINE */
const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    timer: 0,
    limit: 7,
    isLocked: false,
    activeTab: 'feed',
    interval: null
};

const $ = (s) => document.querySelector(s);

function switchTab(name) {
    if (State.isLocked && name === 'reels') return;
    State.activeTab = name;
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
        if (State.timer >= State.limit) triggerBlock();
    }, 100);
}

function stopMonitoring() {
    clearInterval(State.interval);
    if (!State.isLocked) State.timer = 0;
}

function triggerBlock() {
    stopMonitoring();
    State.isLocked = true;
    $('#guard-overlay').classList.remove('hidden');
}

/* Guard Logic */
function showFeature(feat) {
    $('#guard-menu').classList.add('hidden');
    $(`#feature-${feat}`).classList.remove('hidden');
}

function resetGuard() {
    document.querySelectorAll('.guard-content').forEach(c => c.classList.add('hidden'));
    $('#guard-menu').classList.remove('hidden');
}

function exitGuard() {
    State.isLocked = false;
    State.timer = 0;
    $('#guard-overlay').classList.add('hidden');
    switchTab('feed');
}

/* Gemini Logic */
async function askAI(mode) {
    const input = $(`#${mode}-in`);
    const display = $(`#${mode}-chat`);
    const val = input.value;
    if (!val) return;

    // User Message
    const u = document.createElement('div');
    u.className = 'user-msg';
    u.textContent = val;
    display.appendChild(u);
    input.value = '';

    // Bot Response
    const b = document.createElement('div');
    b.className = 'bot-msg';
    b.textContent = "Gemini is thinking...";
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
        b.textContent = "Error: Invalid API Key or Network issue.";
    }
    display.scrollTop = display.scrollHeight;
}
