/* 
   FOCUS GUARD — PREMIUM CORE 
   Integrating Gemini API with Surgical Blocking
*/

const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    currentTab: 'feed',
    limit: 7,
    elapsed: 0,
    locked: false,
    ticker: null,
    studyActive: false,
    studyInterval: null,
    therapyHistory: [],
    studyHistory: []
};

const $ = (s) => document.querySelector(s);

function log(msg) {
    const b = $('#console-body');
    const l = document.createElement('div');
    l.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    b.appendChild(l);
    b.scrollTop = b.scrollHeight;
}

/* --- TAB NAVIGATION --- */
function switchTab(name) {
    if (State.locked && name === 'reels') {
        log("Access Denied: You are currently blocked from Reels.");
        return;
    }
    
    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.textContent.toLowerCase() === name);
    });

    if (name === 'reels') startTimer();
    else stopTimer();
}

/* --- BLOCKER LOGIC --- */
function startTimer() {
    if (State.locked) return;
    log("Monitoring Reels consumption...");
    clearInterval(State.ticker);
    State.ticker = setInterval(() => {
        State.elapsed += 0.1;
        updateMeter();
        if (State.elapsed >= State.limit) triggerBlock();
    }, 100);
}

function stopTimer() {
    clearInterval(State.ticker);
    if (!State.locked) {
        State.elapsed = 0;
        updateMeter();
    }
}

function updateMeter() {
    const pct = Math.min(State.elapsed / State.limit, 1);
    $('#ring-fill').style.strokeDashoffset = 97.4 * (1 - pct);
    $('#meter-text').textContent = Math.floor(State.elapsed) + 's';
}

function triggerBlock() {
    clearInterval(State.ticker);
    State.locked = true;
    $('#guard-overlay').classList.remove('hidden');
    log("BLOCK TRIGGERED: 7-second limit reached.");
}

/* --- GUARD UI NAVIGATION --- */
function showGuardFeature(feature) {
    document.querySelectorAll('.guard-content').forEach(c => c.classList.add('hidden'));
    $(`#guard-${feature}`).classList.remove('hidden');
    if (feature === 'study') startPomodoro();
}

function backToChoice() {
    document.querySelectorAll('.guard-content').forEach(c => c.classList.add('hidden'));
    $('#guard-choice').classList.remove('hidden');
}

function exitGuard() {
    State.locked = false;
    State.elapsed = 0;
    $('#guard-overlay').classList.add('hidden');
    switchTab('feed');
    updateMeter();
}

/* --- GEMINI AI CORE --- */
async function callGemini(prompt, mode) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    const context = mode === 'therapy' 
        ? "You are The Compass, a digital wellbeing therapist. Be empathetic and calm. Help the user stop doom-scrolling."
        : "You are Study Buddy, an academic tutor. Explain the topic in 3 simple bullets and ask a quiz question.";

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${context} User says: ${prompt}` }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        return "Connection Error: API key might be invalid or expired.";
    }
}

async function handleAI(mode) {
    const input = $(`#${mode}-input`);
    const display = $(`#${mode}-display`);
    const val = input.value;
    if (!val) return;

    // Append User Message
    const u = document.createElement('div');
    u.className = 'user-msg';
    u.textContent = val;
    display.appendChild(u);
    input.value = '';

    // Thinking...
    const b = document.createElement('div');
    b.className = 'bot-msg';
    b.textContent = "Connecting to Gemini...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    const res = await callGemini(val, mode);
    b.innerHTML = res.replace(/\n/g, '<br>');
    display.scrollTop = display.scrollHeight;
}

/* --- POMODORO TIMER --- */
function startPomodoro() {
    if (State.studyActive) return;
    State.studyActive = true;
    let time = 25 * 60;
    State.studyInterval = setInterval(() => {
        time--;
        const m = Math.floor(time / 60);
        const s = time % 60;
        $('.study-timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (time <= 0) {
            clearInterval(State.studyInterval);
            State.studyActive = false;
        }
    }, 1000);
}
