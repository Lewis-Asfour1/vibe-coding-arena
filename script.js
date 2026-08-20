/* FOCUS GUARD ENGINE */

const State = {
    currentTab: 'feed',
    timer: 0,
    limit: 7,
    isLocked: false,
    interval: null,
    aiMode: 'therapy'
};

const $ = (s) => document.querySelector(s);

/* --- NAVIGATION --- */
function switchTab(name) {
    if (State.isLocked && name === 'reels') {
        $('.phone-frame').animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'}], 100);
        return;
    }

    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.textContent.toLowerCase().includes(name));
    });

    if (name === 'reels') startMonitoring();
    else stopMonitoring();
}

/* --- REELS MONITOR --- */
function startMonitoring() {
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        $('#meter-text').textContent = Math.floor(State.timer) + 's';
        $('#ring-fill').style.strokeDashoffset = 97.4 * (1 - (State.timer/State.limit));
        
        if (State.timer >= State.limit) triggerLock();
    }, 100);
}

function stopMonitoring() {
    clearInterval(State.interval);
    if (!State.isLocked) {
        State.timer = 0;
        $('#ring-fill').style.strokeDashoffset = 97.4;
    }
}

function triggerLock() {
    stopMonitoring();
    State.isLocked = true;
    $('#guard-overlay').classList.remove('hidden');
}

/* --- GUARD UI LOGIC --- */
function openAI(mode) {
    State.aiMode = mode;
    $('#ai-feature-title').textContent = mode === 'study' ? 'Study Buddy' : 'Compass';
    $('#guard-menu').classList.add('hidden');
    $('#guard-chat-feature').classList.remove('hidden');
    
    const display = $('#ai-chat-display');
    display.innerHTML = `<div class="bot-msg">${mode === 'study' ? 'What are we learning today? Give me a topic and I will simplify it.' : 'I am here. How are you feeling right now?'}</div>`;
}

function showGuardMenu() {
    $('#guard-chat-feature').classList.add('hidden');
    $('#guard-menu').classList.remove('hidden');
}

function releaseGuard(dest) {
    State.isLocked = false;
    State.timer = 0;
    $('#guard-overlay').classList.add('hidden');
    switchTab(dest);
}

/* --- CHAT BOT LOGIC --- */
function sendChatMessage() {
    const input = $('#ai-input');
    const display = $('#ai-chat-display');
    const val = input.value;
    if (!val) return;

    // User message
    const u = document.createElement('div');
    u.className = 'user-msg';
    u.textContent = val;
    display.appendChild(u);
    input.value = '';

    // Bot "thinking"
    const b = document.createElement('div');
    b.className = 'bot-msg';
    b.textContent = "...";
    display.appendChild(b);
    display.scrollTop = display.scrollHeight;

    setTimeout(() => {
        if (State.aiMode === 'therapy') {
            b.textContent = "Take a breath. Reclaiming your time from the scroll loop is a victory. What's one thing you can see right now?";
        } else {
            b.textContent = `That's a great topic. To learn ${val} effectively, let's start with the basic definition. Can you explain what you know so far?`;
        }
        display.scrollTop = display.scrollHeight;
    }, 800);
}

/* --- LISTENERS --- */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => releaseGuard(btn.dataset.go)));
