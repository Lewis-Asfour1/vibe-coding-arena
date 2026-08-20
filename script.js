/* Checkpoint 1 Engine — Working Timer + Bot */

const State = {
    currentTab: 'feed',
    limit: 7,
    elapsed: 0,
    locked: false,
    ticker: null
};

const $ = (sel) => document.querySelector(sel);

/* Navigation */
window.switchTab = function(name) {
    if (State.locked && name === 'reels') {
        // Shake effect if trying to stay in reels
        const inner = $('.overlay-content');
        if (inner) {
            inner.style.animation = 'none';
            setTimeout(() => { inner.style.animation = 'shake 0.3s'; }, 10);
        }
        return;
    }

    State.currentTab = name;

    // Hide all views
    document.querySelectorAll('.view').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden'); // ensure hidden via CSS too
    });

    // Show selected
    const target = document.getElementById(name + '-view');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // Reset timer if leaving reels
    if (name !== 'reels') {
        stopTimer();
        if (State.locked && name !== 'reels') {
            unlock(name);
        }
    }

    // Start timer if entering reels
    if (name === 'reels') {
        startTimer();
    }
};

/* Timer Logic */
function startTimer() {
    if (State.locked) return;
    clearInterval(State.ticker);
    State.ticker = setInterval(() => {
        State.elapsed += 0.1;
        updateMeter();
        if (State.elapsed >= State.limit) {
            triggerGuard();
        }
    }, 100);
}

function stopTimer() {
    clearInterval(State.ticker);
}

function updateMeter() {
    const pct = Math.min(State.elapsed / State.limit, 1);
    const offset = 97.4 * (1 - pct);
    if ($('#ring-fill')) $('#ring-fill').style.strokeDashoffset = offset;
    if ($('#meter-text')) $('#meter-text').textContent = Math.floor(State.elapsed) + 's';
}

function triggerGuard() {
    stopTimer();
    State.locked = true;
    if ($('#guard-overlay')) $('#guard-overlay').classList.remove('hidden');
    if ($('#lock-badge')) $('#lock-badge').classList.remove('hidden');
    log('Guard engaged at ' + State.limit + 's');
}

/* Unlock when switching away */
function unlock(dest) {
    State.locked = false;
    State.elapsed = 0;
    if ($('#guard-overlay')) $('#guard-overlay').classList.add('hidden');
    if ($('#lock-badge')) $('#lock-badge').classList.add('hidden');
    updateMeter();
}

/* Bot Function */
window.sendBot = function() {
    const input = document.getElementById('user-msg');
    const box = document.getElementById('chat-box');
    if (!input || !box) return;

    const text = input.value.trim();
    if (!text) return;

    // User message
    const u = document.createElement('div');
    u.className = 'chat-bubble user';
    u.textContent = text;
    box.appendChild(u);
    input.value = '';
    box.scrollTop = box.scrollHeight;

    // Bot reply
    setTimeout(() => {
        const responses = [
            "That takes courage. The loop was designed to fill the gap. What small action can you take right now?",
            "You are not broken; the system is just loud. Try writing one sentence about how you feel.",
            "Focus returns when the noise stops. Take a deep breath and tell me: what's one thing you care about today?",
            "You just reclaimed your time. That's a real win. What's next?"
        ];
        const reply = responses[Math.floor(Math.random() * responses.length)];
        const b = document.createElement('div');
        b.className = 'chat-bubble bot';
        b.textContent = reply;
        box.appendChild(b);
        box.scrollTop = box.scrollHeight;
    }, 600);
};

/* Local Log */
function log(msg) {
    const body = document.getElementById('console-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'log log-warn';
    div.innerHTML = '<span style="opacity:0.6">[' + new Date().toLocaleTimeString() + ']</span> ' + msg;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

/* Init */
window.addEventListener('DOMContentLoaded', () => {
    log('daemon started · storage=device · network=disabled');
});
