const State = {
    currentTab: 'feed',
    timer: 0,
    limit: 7,
    isLocked: false,
    interval: null,
    aiMode: 'therapy'
};

const $ = (s) => document.querySelector(s);

function log(msg) {
    const b = $('#console-body');
    const l = document.createElement('div');
    l.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
    b.appendChild(l);
    b.scrollTop = b.scrollHeight;
}

/* --- NAVIGATION --- */
function switchTab(name) {
    if (State.isLocked && name === 'reels') {
        $('.phone-frame').animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'}], 100);
        return;
    }
    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(name)));

    if (name === 'reels') startTimer();
    else stopTimer();
}

/* --- MONITORING --- */
function startTimer() {
    log("Reels monitor: ACTIVE");
    clearInterval(State.interval);
    State.interval = setInterval(() => {
        State.timer += 0.1;
        $('#ring-fill').style.strokeDashoffset = 97.4 * (1 - (State.timer/State.limit));
        $('#meter-text').textContent = Math.floor(State.timer) + 's';
        if (State.timer >= State.limit) triggerLock();
    }, 100);
}

function stopTimer() {
    clearInterval(State.interval);
    if (!State.isLocked) { State.timer = 0; $('#ring-fill').style.strokeDashoffset = 97.4; }
}

function triggerLock() {
    stopTimer();
    State.isLocked = true;
    $('#guard-overlay').classList.remove('hidden');
    log("LIMIT_EXCEEDED: Interrupting dopamine loop.");
}

/* --- AI LOGIC --- */
function openAI(mode) {
    State.aiMode = mode;
    $('#ai-title').textContent = mode === 'therapy' ? 'The Compass' : 'Study Buddy';
    $('#guard-menu').classList.add('hidden');
    $('#guard-ai').classList.remove('hidden');
}

function showGuardMenu() {
    $('#guard-ai').classList.add('hidden');
    $('#guard-menu').classList.remove('hidden');
}

function releaseGuard() {
    State.isLocked = false; State.timer = 0;
    $('#guard-overlay').classList.add('hidden');
    switchTab('feed');
    log("Session Reset: Returning to safety.");
}

function handleChat() {
    const input = $('#ai-input');
    const chat = $('#ai-chat');
    if (!input.value) return;

    const u = document.createElement('div');
    u.className = 'user-msg';
    u.textContent = input.value;
    chat.appendChild(u);
    const val = input.value;
    input.value = '';

    const b = document.createElement('div');
    b.className = 'bot-msg';
    b.textContent = "...";
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
        if (State.aiMode === 'therapy') {
            b.textContent = "Reclaiming your time is a victory. Take a breath. What's one thing you're grateful for right now?";
        } else {
            b.textContent = `That's a great topic. Let's focus on the fundamentals of ${val} first. Ready for a 25-minute focus sprint?`;
        }
        chat.scrollTop = chat.scrollHeight;
    }, 800);
}

/* --- LISTENERS --- */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
