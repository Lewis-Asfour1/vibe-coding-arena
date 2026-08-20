/* FOCUS GUARD ENGINE */

const State = {
    currentTab: 'feed',
    limit: 7, 
    elapsed: 0,
    locked: false,
    ticker: null
};

const BotResponses = {
    "bored": "Boredom is just your brain asking for real stimulation. Try drinking some water or walking for 2 minutes.",
    "anxious": "When we scroll fast, our heart rate goes up. Take three deep breaths right now. I'm here.",
    "lost": "It's okay to feel lost. The loop is designed to make you forget your goals. What is ONE thing you wanted to do today?",
    "help": "I'm here. You've already done the hardest part: putting the scroll down. How does your body feel?",
    "default": "I hear you. Breaking the digital loop is tough, but you're back in control now. What's one small thing you can do off-screen?"
};

const $ = (s) => document.querySelector(s);

function log(msg, type = '') {
    const body = $('#console-body');
    const l = document.createElement('div');
    l.className = `log ${type}`;
    l.innerHTML = `<span class="ts">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    body.appendChild(l);
    body.scrollTop = body.scrollHeight;
}

function switchTab(name) {
    if (State.locked && name === 'reels') {
        $('.guard-inner').animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'}], 100);
        return;
    }

    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === name);
    });

    if (name === 'reels') {
        log('surface_detected: short_form_video', 'log-warn');
        startTimer();
    } else {
        stopTimer();
        if (State.locked) unlock(name);
    }
}

function startTimer() {
    if (State.locked) return;
    clearInterval(State.ticker);
    State.ticker = setInterval(() => {
        State.elapsed += 0.1;
        updateMeter();
        if (State.elapsed >= State.limit) lock();
    }, 100);
}

function stopTimer() {
    clearInterval(State.ticker);
}

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
    log('LIMIT REACHED → guard engaged', 'log-warn');
}

function unlock(dest) {
    State.locked = false;
    State.elapsed = 0;
    $('#guard-overlay').classList.add('hidden');
    $('#lock-badge').classList.add('hidden');
    updateMeter();
    log('redirect_success · guard released', 'log-sys');
}

function handleBot() {
    const input = $('#user-input');
    const display = $('#chat-display');
    const val = input.value.toLowerCase();
    if (!val) return;

    const uMsg = document.createElement('div');
    uMsg.className = 'user-msg';
    uMsg.textContent = input.value;
    display.appendChild(uMsg);
    input.value = '';
    display.scrollTop = display.scrollHeight;

    setTimeout(() => {
        let reply = BotResponses.default;
        if (val.includes("bore")) reply = BotResponses.bored;
        if (val.includes("anx") || val.includes("stress")) reply = BotResponses.anxious;
        if (val.includes("lost")) reply = BotResponses.lost;
        if (val.includes("help")) reply = BotResponses.help;

        const bMsg = document.createElement('div');
        bMsg.className = 'bot-msg';
        bMsg.textContent = reply;
        display.appendChild(bMsg);
        display.scrollTop = display.scrollHeight;
    }, 800);
}

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.go)));
$('#send-btn').addEventListener('click', handleBot);
$('#user-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') handleBot(); });
