/* FOCUS GUARD ENGINE */

const State = {
    currentTab: 'feed',
    limit: 7, 
    elapsed: 0,
    locked: false,
    ticker: null
};

const $ = (s) => document.querySelector(s);

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
}

function unlock(dest) {
    State.locked = false;
    State.elapsed = 0;
    $('#guard-overlay').classList.add('hidden');
    $('#lock-badge').classList.add('hidden');
    updateMeter();
}

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.go)));
