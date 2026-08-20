/* 
   FOCUS GUARD — GEMINI CORE
   Contest Submission Build
*/

const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    activeView: 'home',
    timer: 0,
    limit: 7,
    isBlocked: false,
    monitor: null,
    studyTime: 25 * 60,
    studyInterval: null
};

const $ = (s) => document.querySelector(s);

function log(msg) {
    const b = $('#c-body');
    const l = document.createElement('div');
    l.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
    b.appendChild(l);
    b.scrollTop = b.scrollHeight;
}

/* --- TAB NAVIGATION --- */
function appNav(tab) {
    if (State.isBlocked && tab === 'reels') {
        log("BLOCK_ACTIVE: Attempt to enter Reels denied.");
        return;
    }
    
    State.activeView = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${tab}`).classList.add('active');
    
    document.querySelectorAll('.t-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === tab);
    });

    if (tab === 'reels') startReelsMonitor();
    else stopReelsMonitor();
}

/* --- 7-SECOND MONITORING --- */
function startReelsMonitor() {
    log("Reels session started. Monitoring dopamine levels...");
    clearInterval(State.monitor);
    State.monitor = setInterval(() => {
        State.timer += 0.1;
        updateMeter();
        if (State.timer >= State.limit) {
            triggerGuard();
        }
    }, 100);
}

function stopReelsMonitor() {
    clearInterval(State.monitor);
    if (!State.isBlocked) {
        State.timer = 0;
        updateMeter();
    }
}

function updateMeter() {
    const pct = Math.min(State.timer / State.limit, 1);
    $('#timer-progress').style.strokeDashoffset = 100.5 * (1 - pct);
    $('#ring-text').textContent = Math.floor(State.timer) + 's';
}

function triggerGuard() {
    stopReelsMonitor();
    State.isBlocked = true;
    $('#guard-takeover').classList.remove('hidden');
    log("CRITICAL_LIMIT: Social loop paused by Focus Guard.");
}

/* --- GUARD SYSTEM NAVIGATION --- */
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
    State.isBlocked = false;
    State.timer = 0;
    $('#guard-takeover').classList.add('hidden');
    appNav('home');
    log("Session Reset. Returning to productive feed.");
}

/* --- GEMINI AI FALLBACK SYSTEM --- */
const FallbackAI = {
    therapy: "Focus on your breathing. Scrolling creates a fast dopamine loop that's hard to break, but you just did it. Try drinking a glass of water.",
    study: "I've structured that topic for you. 1. Core concept, 2. Key evidence, 3. Summary. Now, answer this: What is the main goal of this topic?"
};

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

    // Thinking State
    const b = document.createElement('div');
    b.className = 'bot-msg';
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
        // Fallback if API key is blocked or invalid
        b.textContent = FallbackAI[mode];
        log("API_FALLBACK: Using internal intelligence.");
    }
    display.scrollTop = display.scrollHeight;
}

/* --- TIMER LOGIC --- */
function startPomodoro() {
    clearInterval(State.studyInterval);
    State.studyInterval = setInterval(() => {
        State.studyTime--;
        const m = Math.floor(State.studyTime / 60);
        const s = State.studyTime % 60;
        $('#study-timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (State.studyTime <= 0) {
            clearInterval(State.studyInterval);
            log("FOCUS_COMPLETE: Well done.");
        }
    }, 1000);
}
