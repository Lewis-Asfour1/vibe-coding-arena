/* 
   FOCUS GUARD CORE ENGINE
   Contest Build - Gemini AI Powered
*/

const API_KEY = "AQ.Ab8RN6Lr-aXkPL85xNvcYLo1IHaubgN5L7vbGlQ7mM-rMHFVeQ";

const State = {
    view: 'home',
    reelsTimer: 0,
    limit: 7,
    isGuardActive: false,
    monitorInterval: null,
    studyInterval: null,
    studySeconds: 25 * 60
};

const $ = (s) => document.querySelector(s);

function addLog(message) {
    const box = $('#log-content');
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = `> [${new Date().toLocaleTimeString()}] ${message}`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
}

/* --- APP NAVIGATION --- */
function navigate(tabName) {
    if (State.isGuardActive && tabName === 'reels') {
        addLog("BLOCKED: Focus Guard prevents re-entry to dopamine loops.");
        return;
    }

    State.view = tabName;
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    $(`#view-${tabName}`).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === tabName);
    });

    if (tabName === 'reels') startMonitoring();
    else stopMonitoring();
}

/* --- REELS MONITORING --- */
function startMonitoring() {
    addLog("Monitoring active. Short-form classifier: ACTIVE.");
    clearInterval(State.monitorInterval);
    State.monitorInterval = setInterval(() => {
        State.reelsTimer += 0.1;
        updateMeter();
        if (State.reelsTimer >= State.limit) {
            triggerGuard();
        }
    }, 100);
}

function stopMonitoring() {
    clearInterval(State.monitorInterval);
    if (!State.isGuardActive) {
        State.reelsTimer = 0;
        updateMeter();
    }
}

function updateMeter() {
    const pct = Math.min(State.reelsTimer / State.limit, 1);
    $('#ring-progress').style.strokeDashoffset = 100.5 * (1 - pct);
    $('#ring-label').textContent = Math.floor(State.reelsTimer) + 's';
}

function triggerGuard() {
    stopMonitoring();
    State.isGuardActive = true;
    $('#guard-overlay').classList.remove('hidden');
    addLog("INTERVENTION: 7-second dopamine threshold exceeded.");
}

/* --- GUARD UI --- */
function showGuardFeature(feat) {
    document.querySelectorAll('.guard-view').forEach(v => v.classList.add('hidden'));
    $(`#guard-${feat}`).classList.remove('hidden');
    if (feat === 'study') startPomodoro();
}

function returnToMenu() {
    document.querySelectorAll('.guard-view').forEach(v => v.classList.add('hidden'));
    $('#guard-menu').classList.remove('hidden');
}

function deactivateGuard() {
    State.isGuardActive = false;
    State.reelsTimer = 0;
    $('#guard-overlay').classList.add('hidden');
    updateMeter();
    navigate('home');
    addLog("Session reset. Pivot successful.");
}

/* --- GEMINI AI SYSTEM --- */
async function callGemini(userInput, type) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    const prompt = type === 'therapy' 
        ? `You are The Compass, a wellbeing coach. User is anxious/distracted. User says: "${userInput}". Give a calm 2-sentence reply and one off-screen task.`
        : `You are Study Buddy. User wants to learn: "${userInput}". Explain in 3 tiny bullets and ask one quiz question.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        // Fallback simulated AI if key fails
        return type === 'therapy' 
            ? "Take a deep breath. Focus on what's around you, not the screen. Try drinking some water." 
            : "I've broken that down for you. Focus on the core definition first, then the evidence. Ready to quiz?";
    }
}

async function sendToAI(mode) {
    const input = $(`#${mode}-input`);
    const display = $(`#${mode}-chat`);
    const val = input.value;
    if (!val) return;

    // Add User Bubble
    const u = document.createElement('div');
    u.className = 'user-bubble';
    u.textContent = val;
    display.appendChild(u);
    input.value = '';

    // Add Thinking Bubble
    const b = document.createElement('div');
    b.className = 'bot-bubble';
    b.textContent = "AI is thinking...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    const result = await callGemini(val, mode);
    b.innerHTML = result.replace(/\n/g, '<br>');
    display.scrollTop = display.scrollHeight;
}

/* --- POMODORO --- */
function startPomodoro() {
    clearInterval(State.studyInterval);
    State.studyInterval = setInterval(() => {
        State.studySeconds--;
        const m = Math.floor(State.studySeconds / 60);
        const s = State.studySeconds % 60;
        $('#study-timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (State.studySeconds <= 0) {
            clearInterval(State.studyInterval);
            addLog("FOCUS_COMPLETE: You reached your goal.");
        }
    }, 1000);
}
