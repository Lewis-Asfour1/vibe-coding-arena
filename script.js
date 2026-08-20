/* FOCUS GUARD ENGINE */

const State = {
    currentTab: 'feed',
    limit: 7, 
    elapsed: 0,
    locked: false,
    ticker: null
};

const BotResponses = {
    "bored": "Boredom is the gateway to creativity. Try putting the phone down and just staring at a wall for 2 minutes. See what ideas come.",
    "anxious": "Scrolling triggers high-alert in your brain. Close your eyes and name 3 things you can hear right now.",
    "lost": "The loop makes us lose our sense of time. What is one tiny task you can finish in the next 10 minutes?",
    "help": "I am here to guide you back to focus. Tell me how your body feels after scrolling.",
    "default": "I understand. Breaking the habit is hard, but you just did the hardest part: stopping. What's one thing you're grateful for today?"
};

const $ = (s) => document.querySelector(s);

/* Tab Switching Logic */
function switchTab(name) {
    if (State.locked && name === 'reels') {
        $('.guard-inner').animate([
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' }
        ], { duration: 100, iterations: 3 });
        return;
    }

    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${name}`).classList.add('active');
    
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === name);
    });

    if (name === 'reels') {
        startTimer();
    } else {
        stopTimer();
        if (State.locked) unlock(name);
    }
}

/* Timer Logic */
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
}

function unlock(dest) {
    State.locked = false;
    State.elapsed = 0;
    $('#guard-overlay').classList.add('hidden');
    $('#lock-badge').classList.add('hidden');
    updateMeter();
}

/* Compass Chat Logic */
function handleBot() {
    const input = $('#user-input');
    const display = $('#chat-display');
    const val = input.value.toLowerCase();
    if (!val) return;

    // Add User Message
    const uMsg = document.createElement('div');
    uMsg.className = 'user-msg';
    uMsg.textContent = input.value;
    display.appendChild(uMsg);
    input.value = '';
    display.scrollTop = display.scrollHeight;

    // Bot Response
    setTimeout(() => {
        let reply = BotResponses.default;
        if (val.includes("bore")) reply = BotResponses.bored;
        if (val.includes("anx") || val.includes("stress")) reply = BotResponses.anxious;
        if (val.includes("lost") || val.includes("help")) reply = BotResponses.lost;

        const bMsg = document.createElement('div');
        bMsg.className = 'bot-msg';
        bMsg.textContent = reply;
        display.appendChild(bMsg);
        display.scrollTop = display.scrollHeight;
    }, 700);
}

/* Listeners */
document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
});

document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.go));
});

$('#send-btn').addEventListener('click', handleBot);
$('#user-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') handleBot(); });
