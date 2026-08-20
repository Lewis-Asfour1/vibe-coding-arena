/* 
   FOCUS GUARD CORE LOGIC
   Featuring Gemini AI Integration
*/

const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    app: 'social', // social or guard
    socialTab: 'home',
    timer: 0,
    limit: 7,
    isLocked: false,
    interval: null,
    studyTime: 25 * 60,
    studyInterval: null
};

const $ = (s) => document.querySelector(s);

function log(msg) {
    const b = $('#c-body');
    const l = document.createElement('div');
    l.className = 'c-line';
    l.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
    b.appendChild(l);
    b.scrollTop = b.scrollHeight;
}

/* --- NAVIGATION --- */
function appNav(tab) {
    if (State.isLocked && tab === 'reels') {
        log("ACCESS_DENIED: Reels are currently blocked.");
        return;
    }
    
    State.socialTab = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${tab}`).classList.add('active');
    
    document.querySelectorAll('.t-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === tab);
    });

    if (tab === 'reels') startReelsMonitor();
    else stopReelsMonitor();
}

/* --- MONITORING --- */
function startReelsMonitor() {
    log("Reels monitoring started...");
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        updateUI();
        if (State.timer >= State.limit) {
            triggerTakeover();
        }
    }, 100);
}

function stopReelsMonitor() {
    clearInterval(State.interval);
    if (!State.isLocked) {
        State.timer = 0;
        updateUI();
    }
}

function updateUI() {
    const pct = Math.min(State.timer / State.limit, 1);
    $('#timer-progress').style.strokeDashoffset = 100.5 * (1 - pct);
    $('#ring-text').textContent = Math.floor(State.timer) + 's';
}

function triggerTakeover() {
    stopReelsMonitor();
    State.isLocked = true;
    State.app = 'guard';
    $('#guard-takeover').classList.remove('hidden');
    log("LIMIT_EXCEEDED: Pivot required.");
}

/* --- GUARD FEATURES --- */
function showGuardMenu() {
    document.querySelectorAll('.guard-content').forEach(c => c.classList.add('hidden'));
    $('#guard-menu').classList.remove('hidden');
}

function openFeature(feat) {
    document.querySelectorAll('.guard-content').forEach(c => c.classList.add('hidden'));
    $(`#guard-${feat}`).classList.remove('hidden');
    if (feat === 'study') startPomodoro();
}

function deactivateGuard() {
    State.isLocked = false;
    State.timer = 0;
    State.app = 'social';
    $('#guard-takeover').classList.add('hidden');
    appNav('home');
    log("Guard released. Returning to Home.");
}

/* --- GEMINI AI INTEGRATION --- */
async function talkToGemini(userInput, mode) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    const context = mode === 'therapy' 
        ? "You are The Compass, a wise digital wellbeing coach. Be empathetic. The user just got blocked for scrolling too much. Give them one small real-world tip."
        : "You are Study Buddy. A student wants to learn a topic. Explain it in 3 bullet points and ask a quiz question.";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${context} User says: ${userInput}` }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "I'm having trouble connecting to my brain (API Error). Check your connection.";
    }
}

async function handleChat(mode) {
    const input = $(`#${mode}-input`);
    const display = $(`#${mode}-chat`);
    const val = input.value;
    if (!val) return;

    // User Message
    const u = document.createElement('div');
    u.className = 'user-msg';
    u.textContent = val;
    display.appendChild(u);
    input.value = '';

    // Thinking...
    const b = document.createElement('div');
    b.className = 'bot-msg';
    b.textContent = "Gemini is thinking...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    const reply = await talkToGemini(val, mode);
    b.innerHTML = reply.replace(/\n/g, '<br>');
    display.scrollTop = display.scrollHeight;
}

/* --- POMODORO --- */
function startPomodoro() {
    clearInterval(State.studyInterval);
    State.studyInterval = setInterval(() => {
        State.studyTime--;
        const m = Math.floor(State.studyTime / 60);
        const s = State.studyTime % 60;
        $('#study-timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (State.studyTime <= 0) clearInterval(State.studyInterval);
    }, 1000);
}

/* --- BUTTONS --- */
$('#send-therapy').addEventListener('click', () => handleChat('therapy'));
$('#send-study').addEventListener('click', () => handleChat('study'));
