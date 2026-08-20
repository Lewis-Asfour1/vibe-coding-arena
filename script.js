/* FOCUS GUARD ENGINE */

const State = {
    currentTab: 'feed',
    limit: 7,
    elapsed: 0,
    locked: false,
    ticker: null
};

const BotResponses = {
    bored: "Boredom is just your brain asking for real stimulation. Try drinking some water or walking for 2 minutes.",
    anxious: "When we scroll fast, our heart rate goes up. Take three deep breaths right now. I'm here.",
    lost: "It's okay to feel lost. The loop is designed to make you forget your goals. What is ONE thing you wanted to do today?",
    help: "I'm here. You've already done the hardest part: putting the scroll down. How does your body feel?",
    default: "I hear you. Breaking the digital loop is tough, but you're back in control now. What's one small thing you can do off-screen?"
};

const $ = (s) => document.querySelector(s);

function switchTab(name) {
    if (State.locked && name === 'reels') {
        const guardInner = $('.guard-inner');
        if (guardInner && typeof guardInner.animate === 'function') {
            guardInner.animate([
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' }
            ], { duration: 150, direction: 'alternate', iterations: 2 });
        }
        return;
    }

    State.currentTab = name;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = $(`#view-${name}`);
    if (view) view.classList.add('active');

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

function startTimer() {
    if (State.locked) return;
    if (State.ticker) clearInterval(State.ticker);
    State.ticker = setInterval(() => {
        // increase elapsed in tenths of a second
        State.elapsed = Math.min(State.limit, +(State.elapsed + 0.1).toFixed(1));
        updateMeter();
        if (State.elapsed >= State.limit) lock();
    }, 100);
}

function stopTimer() {
    if (State.ticker) {
        clearInterval(State.ticker);
        State.ticker = null;
    }
}

function updateMeter() {
    const pct = Math.min(State.elapsed / State.limit, 1);
    const offset = 97.4 * (1 - pct);
    const ring = $('#ring-fill');
    if (ring && typeof ring.setAttribute === 'function') {
        ring.setAttribute('stroke-dashoffset', offset);
    }
    const meter = $('#meter-text');
    if (meter) meter.textContent = Math.floor(State.elapsed) + 's';
}

function lock() {
    stopTimer();
    State.locked = true;
    const overlay = $('#guard-overlay');
    const badge = $('#lock-badge');
    if (overlay) overlay.classList.remove('hidden');
    if (badge) badge.classList.remove('hidden');
}

function unlock(dest) {
    State.locked = false;
    State.elapsed = 0;
    const overlay = $('#guard-overlay');
    const badge = $('#lock-badge');
    if (overlay) overlay.classList.add('hidden');
    if (badge) badge.classList.add('hidden');
    updateMeter();
}

function handleBot() {
    const input = $('#user-input');
    const display = $('#chat-display');
    if (!input || !display) return;

    const val = input.value.trim().toLowerCase();
    if (!val) return;

    const uMsg = document.createElement('div');
    uMsg.className = 'user-msg';
    uMsg.textContent = input.value;
    display.appendChild(uMsg);
    input.value = '';
    display.scrollTop = display.scrollHeight;

    setTimeout(() => {
        let reply = BotResponses.default;
        if (val.includes('bore')) reply = BotResponses.bored;
        if (val.includes('anx') || val.includes('stress')) reply = BotResponses.anxious;
        if (val.includes('lost')) reply = BotResponses.lost;
        if (val.includes('help')) reply = BotResponses.help;

        const bMsg = document.createElement('div');
        bMsg.className = 'bot-msg';
        bMsg.textContent = reply;
        display.appendChild(bMsg);
        display.scrollTop = display.scrollHeight;
    }, 800);
}

// Initialize once DOM is ready and wire up controls
document.addEventListener('DOMContentLoaded', () => {
    // ensure initial meter state
    updateMeter();

    const tabs = document.querySelectorAll('.tab');
    if (tabs) tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

    const goBtns = document.querySelectorAll('[data-go]');
    if (goBtns) goBtns.forEach(b => b.addEventListener('click', () => switchTab(b.dataset.go)));

    const sendBtn = $('#send-btn');
    if (sendBtn) sendBtn.addEventListener('click', handleBot);

    const userInput = $('#user-input');
    if (userInput) userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleBot(); });

    // set initial active tab based on markup
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) switchTab(activeTab.dataset.tab || 'feed');
});
