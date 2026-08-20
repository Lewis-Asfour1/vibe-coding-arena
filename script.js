/* 
   FOCUS GUARD — GEMINI CORE 
   PASTE YOUR API KEY BELOW
*/
const GEMINI_API_KEY = "PASTE_YOUR_API_KEY_HERE";

const State = {
    currentTab: 'feed',
    limit: 7, 
    elapsed: 0,
    locked: false,
    ticker: null,
    studyActive: false,
    studyTimer: null,
    // AI Memory Banks
    therapyHistory: [],
    studyHistory: []
};

const $ = (s) => document.querySelector(s);

/* --- LOGGING --- */
function log(msg, type = '') {
    const body = $('#console-body');
    const l = document.createElement('div');
    l.className = `log ${type}`;
    l.innerHTML = `<span class="ts">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    body.appendChild(l);
    body.scrollTop = body.scrollHeight;
}

/* --- TAB LOGIC --- */
function switchTab(name) {
    // If Study Buddy is active, Reels are HARD LOCKED
    if (name === 'reels' && (State.locked || State.studyActive)) {
        $('.guard-inner')?.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'}], 100);
        log('REELS_LOCKED: active_focus_session_detected', 'log-warn');
        return;
    }

    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === name);
    });

    if (name === 'reels') startTimer();
    else {
        stopTimer();
        if (State.locked) unlock();
    }
}

/* --- REELS TIMER --- */
function startTimer() {
    if (State.locked || State.studyActive) return;
    clearInterval(State.ticker);
    State.ticker = setInterval(() => {
        State.elapsed += 0.1;
        updateMeter();
        if (State.elapsed >= State.limit) lock();
    }, 100);
}

function stopTimer() { clearInterval(State.ticker); }

function updateMeter() {
    const pct = Math.min(State.elapsed / State.limit, 1);
    const offset = 97.4 * (1 - pct);
    $('#ring-fill').style.strokeDashoffset = offset;
    $('#meter-text').textContent = Math.floor(State.elapsed) + 's';
}

function lock() {
    stopTimer();
    State.locked = true;
    $('#guard-overlay').classList.remove('hidden');
    $('#lock-badge').classList.remove('hidden');
    log('BLOCK_TRIGGERED: dopamine_loop_detected', 'log-warn');
}

function unlock() {
    State.locked = false;
    State.elapsed = 0;
    $('#guard-overlay').classList.add('hidden');
    $('#lock-badge').classList.add('hidden');
    updateMeter();
}

/* --- GEMINI API CORE --- */
async function askGemini(prompt, mode) {
    if (GEMINI_API_KEY.includes("PASTE")) {
        return "System: Please add your Gemini API key to script.js to enable AI features.";
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Set System Instructions based on Tab
    const systemPrompt = mode === 'therapy' 
        ? "You are The Compass, a digital wellbeing coach. User is struggling with social media addiction. Be empathetic, calm, and help them transition to a real-life task."
        : "You are Study Buddy, an academic tutor. Explain the topic simply in 3 bullets and ask a follow-up question. Be energetic and helpful.";

    // Get relevant history
    const history = mode === 'therapy' ? State.therapyHistory : State.studyHistory;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    ...history,
                    { role: "user", parts: [{ text: prompt }] }
                ]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // Save to memory
        history.push({ role: "user", parts: [{ text: prompt }] });
        history.push({ role: "model", parts: [{ text: text }] });

        return text;
    } catch (e) {
        return "Gemini is busy or API key is invalid. Try again shortly.";
    }
}

/* --- FEATURE: COMPASS (THERAPY) --- */
async function handleTherapy() {
    const input = $('#therapy-input');
    const display = $('#therapy-display');
    const val = input.value;
    if (!val) return;

    appendMsg(display, val, 'user-msg');
    input.value = '';
    
    const loading = appendMsg(display, "Thinking...", 'bot-msg');
    const response = await askGemini(val, 'therapy');
    loading.innerHTML = response.replace(/\n/g, '<br>');
    display.scrollTop = display.scrollHeight;
}

/* --- FEATURE: STUDY BUDDY --- */
async function handleStudy() {
    const input = $('#study-input');
    const display = $('#study-display');
    const val = input.value;
    if (!val) return;

    appendMsg(display, val, 'user-msg');
    input.value = '';
    
    const loading = appendMsg(display, "Consulting Gemini...", 'bot-msg-study');
    const response = await askGemini(val, 'study');
    loading.innerHTML = response.replace(/\n/g, '<br>');
    display.scrollTop = display.scrollHeight;

    // Start Focus Timer if not already active
    if (!State.studyActive) startStudyTimer();
}

function startStudyTimer() {
    State.studyActive = true;
    let seconds = 25 * 60;
    log('STUDY_MODE_ACTIVE: hard_locking_reels', 'log-sys');
    
    clearInterval(State.studyTimer);
    State.studyTimer = setInterval(() => {
        seconds--;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        $('.pomodoro').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        $('.study-status').textContent = "Deep Focus Active";

        if (seconds <= 0) {
            clearInterval(State.studyTimer);
            State.studyActive = false;
            $('.study-status').textContent = "Session Complete";
            log('STUDY_COMPLETE: reels_unlocked', 'log-ok');
        }
    }, 1000);
}

function appendMsg(container, text, className) {
    const d = document.createElement('div');
    d.className = className;
    d.textContent = text;
    container.appendChild(d);
    container.scrollTop = container.scrollHeight;
    return d;
}

/* --- LISTENERS --- */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.go)));
$('#therapy-send-btn').addEventListener('click', handleTherapy);
$('#study-send-btn').addEventListener('click', handleStudy);
$('#therapy-input').addEventListener('keypress', (e) => { if(e.key==='Enter') handleTherapy(); });
$('#study-input').addEventListener('keypress', (e) => { if(e.key==='Enter') handleStudy(); });

log('daemon started · storage=local · network=GeminiEnabled', 'log-sys');
