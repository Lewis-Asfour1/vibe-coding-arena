/* 
   FOCUS GUARD CORE LOGIC 
   Gemini API Key Integrated
*/
const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    currentTab: 'feed',
    timer: 0,
    limit: 7,
    locked: false,
    interval: null,
    aiMode: 'therapy'
};

const $ = (s) => document.querySelector(s);

/* --- NAVIGATION --- */
function switchTab(name) {
    if (State.locked && name === 'reels') return;
    
    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));

    if (name === 'reels') startTimer();
    else stopTimer();
}

/* --- BLOCKER --- */
function startTimer() {
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        updateMeter();
        if (State.timer >= State.limit) triggerLock();
    }, 100);
}

function stopTimer() {
    clearInterval(State.interval);
    if (!State.locked) { State.timer = 0; updateMeter(); }
}

function updateMeter() {
    const pct = Math.min(State.timer / State.limit, 1);
    $('#ring-fill').style.strokeDashoffset = 97.4 * (1 - pct);
    $('#meter-text').textContent = Math.floor(State.timer) + 's';
}

function triggerLock() {
    stopTimer();
    State.locked = true;
    $('#guard-overlay').classList.remove('hidden');
}

/* --- GUARD OVERLAY LOGIC --- */
function showAI(mode) {
    State.aiMode = mode;
    $('#ai-title').textContent = mode === 'therapy' ? 'Compass' : 'Study Buddy';
    $('#guard-choice').classList.add('hidden');
    $('#guard-chat').classList.remove('hidden');
}

function backToGuardMenu() {
    $('#guard-chat').classList.add('hidden');
    $('#guard-choice').classList.remove('hidden');
}

function exitGuard() {
    State.locked = false;
    State.timer = 0;
    $('#guard-overlay').classList.add('hidden');
    switchTab('feed');
}

/* --- GEMINI AI INTEGRATION --- */
async function handleGemini() {
    const input = $('#ai-input');
    const display = $('#ai-chat-display');
    const val = input.value;
    if (!val) return;

    // User Msg
    const u = document.createElement('div');
    u.className = 'user-msg';
    u.textContent = val;
    display.appendChild(u);
    input.value = '';

    // Thinking
    const b = document.createElement('div');
    b.className = 'bot-msg';
    b.textContent = "AI is thinking...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    const context = State.aiMode === 'therapy' 
        ? "You are The Compass, an empathetic digital therapist. User just got blocked from Reels."
        : "You are Study Buddy, an academic tutor. Explain the topic simply.";

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: `${context} User: ${val}` }] }] })
        });
        const data = await res.json();
        b.textContent = data.candidates[0].content.parts[0].text;
    } catch (e) {
        b.textContent = State.aiMode === 'therapy' ? "Take a breath. You are in control." : "Focus on the basics of this topic first.";
    }
    display.scrollTop = display.scrollHeight;
}

/* --- LISTENERS --- */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    if(b.dataset.go === 'feed') exitGuard();
    else switchTab(b.dataset.go);
}));
$('#ai-send-btn').addEventListener('click', handleGemini);
