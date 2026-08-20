/* 
   FOCUS GUARD — GEMINI CORE
   Contest Build v1.0
*/

const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    activeTab: 'home',
    timer: 0,
    limit: 7,
    isBlocked: false,
    interval: null,
    pomoSeconds: 25 * 60,
    pomoInterval: null
};

const $ = (s) => document.querySelector(s);

function log(msg) {
    const box = $('#log-output');
    const line = document.createElement('div');
    line.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
}

/* --- TABS --- */
function changeTab(tabName) {
    if (State.isBlocked && tabName === 'reels') {
        log("BLOCKED: Attention threshold exceeded. Redirect to Study/Compass.");
        return;
    }

    State.activeTab = tabName;
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    $(`#view-${tabName}`).classList.add('active');
    
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === tabName);
    });

    if (tabName === 'reels') startReelsMonitor();
    else stopReelsMonitor();
}

/* --- TIMER --- */
function startReelsMonitor() {
    log("Reels activity detected. Monitoring dopamine loops...");
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        updateUI();
        if (State.timer >= State.limit) triggerGuard();
    }, 100);
}

function stopReelsMonitor() {
    clearInterval(State.interval);
    if (!State.isBlocked) {
        State.timer = 0;
        updateUI();
    }
}

function updateUI() {
    const pct = Math.min(State.timer / State.limit, 1);
    $('#ring-fill').style.strokeDashoffset = 100.5 * (1 - pct);
    $('#ring-text').textContent = Math.floor(State.timer) + 's';
}

function triggerGuard() {
    stopReelsMonitor();
    State.isBlocked = true;
    $('#guard-overlay').classList.remove('hidden');
    log("INTERVENTION: 7-second limit reached. Guard engaged.");
}

/* --- GUARD --- */
function openGuardFeature(feat) {
    document.querySelectorAll('.guard-pane').forEach(p => p.classList.add('hidden'));
    $(`#guard-${feat}`).classList.remove('hidden');
    if (feat === 'study') startPomodoro();
}

function backToGuardMenu() {
    document.querySelectorAll('.guard-pane').forEach(p => p.classList.add('hidden'));
    $('#guard-menu').classList.remove('hidden');
}

function exitGuard() {
    State.isBlocked = false;
    State.timer = 0;
    updateUI();
    $('#guard-overlay').classList.add('hidden');
    changeTab('home');
    log("Session successful. Attention reclaimed.");
}

/* --- GEMINI AI --- */
async function sendGemini(mode) {
    const input = $(`#${mode}-input`);
    const display = $(`#${mode}-chat`);
    if (!input.value) return;

    const u = document.createElement('div');
    u.className = 'user-bubble';
    u.textContent = input.value;
    display.appendChild(u);
    const val = input.value;
    input.value = '';

    const b = document.createElement('div');
    b.className = 'bot-bubble';
    b.textContent = "AI is thinking...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Act as a ${mode === 'therapy' ? 'wellbeing coach' : 'tutor'}. Topic: ${val}` }] }]
            })
        });
        const data = await response.json();
        b.innerHTML = data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');
    } catch (e) {
        b.textContent = "Take a breath. Reclaiming your time is the real win today.";
    }
    display.scrollTop = display.scrollHeight;
}

function startPomodoro() {
    clearInterval(State.pomoInterval);
    State.pomoInterval = setInterval(() => {
        State.pomoSeconds--;
        const m = Math.floor(State.pomoSeconds / 60);
        const s = State.pomoSeconds % 60;
        $('#study-timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (State.pomoSeconds <= 0) clearInterval(State.pomoInterval);
    }, 1000);
}
