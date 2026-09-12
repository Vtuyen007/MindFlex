import { $, $$, shuffleArray, triggerHaptic, sleep } from '../utils.js';
import * as Storage from '../storage.js';
import { playTap, playCorrect, playError, playCompletion } from '../audio.js';

const GAME_ID = 'stroop';
let state = 'idle';
let config = {};

const COLOR_MAP = {
    'red': { text: 'ĐỎ', hex: '#ef4444' },
    'blue': { text: 'XANH DƯƠNG', hex: '#3b82f6' },
    'green': { text: 'XANH LÁ', hex: '#10b981' },
    'yellow': { text: 'VÀNG', hex: '#eab308' },
    'purple': { text: 'TÍM', hex: '#a855f7' },
    'orange': { text: 'CAM', hex: '#f97316' }
};

let trials = [];
let currentTrialIndex = 0;
let trialStartTime = 0;
let trialTimeout = null;
let currentRule = 'color'; // 'color' or 'meaning'
let results = [];
let activeColors = [];
let pauseTime = 0;
let remainingTrialTime = 0;

export function init() {
    state = 'idle';
    loadConfig();
    renderSetup();
    $('#active-game-title').textContent = 'Thử thách Stroop';
}

function loadConfig() {
    const data = Storage.getData();
    config = Object.assign({
        questions: 20,
        timePerQuestion: 2000, // 0 for untimed
        colors: 4, // 4 or 6
        mode: 'switch_random', // color, meaning, switch_group, switch_random
        immediateFeedback: true
    }, data.games[GAME_ID].lastSetup);
}

function saveConfig() {
    const data = Storage.getData();
    data.games[GAME_ID].lastSetup = config;
    Storage.saveData();
}

function renderSetup() {
    const setupArea = $('#game-setup-area');
    setupArea.innerHTML = `
        <div class="setup-form glass-card">
            <h3>Tùy chỉnh Thử thách Stroop</h3>
            
            <div class="setting-item">
                <label>Số lượng câu hỏi</label>
                <select id="stroop-questions" class="form-control">
                    <option value="10" ${config.questions == 10 ? 'selected' : ''}>10</option>
                    <option value="20" ${config.questions == 20 ? 'selected' : ''}>20</option>
                    <option value="30" ${config.questions == 30 ? 'selected' : ''}>30</option>
                    <option value="50" ${config.questions == 50 ? 'selected' : ''}>50</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Thời gian / câu</label>
                <select id="stroop-time" class="form-control">
                    <option value="0" ${config.timePerQuestion == 0 ? 'selected' : ''}>Không giới hạn</option>
                    <option value="2000" ${config.timePerQuestion == 2000 ? 'selected' : ''}>2 giây</option>
                    <option value="1000" ${config.timePerQuestion == 1000 ? 'selected' : ''}>1 giây</option>
                    <option value="700" ${config.timePerQuestion == 700 ? 'selected' : ''}>0.7 giây</option>
                    <option value="500" ${config.timePerQuestion == 500 ? 'selected' : ''}>0.5 giây</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Số lượng màu</label>
                <select id="stroop-colors" class="form-control">
                    <option value="4" ${config.colors == 4 ? 'selected' : ''}>4 Màu cơ bản</option>
                    <option value="6" ${config.colors == 6 ? 'selected' : ''}>6 Màu mở rộng</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Luật chơi</label>
                <select id="stroop-mode" class="form-control">
                    <option value="color" ${config.mode == 'color' ? 'selected' : ''}>Chỉ chọn màu mực</option>
                    <option value="meaning" ${config.mode == 'meaning' ? 'selected' : ''}>Chỉ chọn nghĩa từ</option>
                    <option value="switch_group" ${config.mode == 'switch_group' ? 'selected' : ''}>Đổi luật theo cụm</option>
                    <option value="switch_random" ${config.mode == 'switch_random' ? 'selected' : ''}>Đổi luật ngẫu nhiên</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Hiện kết quả tức thì</label>
                <label class="switch">
                    <input type="checkbox" id="stroop-feedback" ${config.immediateFeedback ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <button id="stroop-btn-start" class="btn btn-primary btn-large mt-4">Bắt đầu</button>
        </div>
    `;

    $('#stroop-btn-start').addEventListener('click', () => {
        playTap();
        config.questions = parseInt($('#stroop-questions').value);
        config.timePerQuestion = parseInt($('#stroop-time').value);
        config.colors = parseInt($('#stroop-colors').value);
        config.mode = $('#stroop-mode').value;
        config.immediateFeedback = $('#stroop-feedback').checked;
        saveConfig();
        start();
    });
}

function generateTrials() {
    activeColors = ['red', 'blue', 'green', 'yellow'];
    if (config.colors === 6) {
        activeColors.push('purple', 'orange');
    }
    
    let generated = [];
    
    // Distribute rule types for switch_group and switch_random
    let currentBlockRule = 'color';
    
    for (let i = 0; i < config.questions; i++) {
        // Determine rule
        let rule = config.mode;
        if (config.mode === 'switch_group') {
            // switch every 5 questions
            if (i % 5 === 0 && i !== 0) {
                currentBlockRule = currentBlockRule === 'color' ? 'meaning' : 'color';
            }
            rule = currentBlockRule;
        } else if (config.mode === 'switch_random') {
            rule = Math.random() > 0.5 ? 'color' : 'meaning';
        }
        
        // Determine congruence (1/3 congruent, 2/3 incongruent)
        const isCongruent = Math.random() < 0.33;
        
        let wordKey = activeColors[Math.floor(Math.random() * activeColors.length)];
        let colorKey = wordKey;
        
        if (!isCongruent) {
            let possibleColors = activeColors.filter(c => c !== wordKey);
            colorKey = possibleColors[Math.floor(Math.random() * possibleColors.length)];
        }
        
        generated.push({
            rule: rule,
            wordKey: wordKey,
            colorKey: colorKey,
            type: isCongruent ? 'congruent' : 'incongruent',
            correctAnswer: rule === 'color' ? colorKey : wordKey
        });
    }
    
    return generated;
}

export function start() {
    cleanup();
    state = 'playing';
    $('#game-setup-area').style.display = 'none';
    $('#game-results-area').style.display = 'none';
    $('#game-play-area').style.display = 'flex';
    $('#btn-game-pause').style.display = 'inline-flex';
    
    trials = generateTrials();
    currentTrialIndex = 0;
    results = [];
    
    renderPlayArea();
    showNextTrial();
}

function renderPlayArea() {
    const playArea = $('#game-play-area');
    
    // Create answer buttons based on activeColors
    const answerButtonsHTML = activeColors.map(c => 
        `<button class="btn btn-secondary stroop-btn" data-color="${c}" style="font-size: 1.1rem">${COLOR_MAP[c].text}</button>`
    ).join('');
    
    playArea.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
            <div id="stroop-progress">1 / ${config.questions}</div>
            ${config.timePerQuestion > 0 ? '<div id="stroop-timer-bar" class="progress-bar-container" style="width: 150px; margin: 0;"><div class="progress-bar" style="width: 100%"></div></div>' : ''}
        </div>
        
        <div class="stroop-container">
            <div id="stroop-rule-display" class="stroop-rule">CHỌN MÀU MỰC</div>
            
            <div id="stroop-word-display" class="stroop-word">ĐỎ</div>
            
            <div class="stroop-answers" id="stroop-answers-area">
                ${answerButtonsHTML}
            </div>
        </div>
    `;
    
    $$('.stroop-btn').forEach(btn => {
        btn.addEventListener('click', handleAnswerClick);
    });
}

function showNextTrial() {
    if (currentTrialIndex >= trials.length) {
        finish();
        return;
    }
    
    state = 'answering';
    const trial = trials[currentTrialIndex];
    
    $('#stroop-progress').textContent = `${currentTrialIndex + 1} / ${config.questions}`;
    
    const ruleDisplay = $('#stroop-rule-display');
    if (trial.rule === 'color') {
        ruleDisplay.textContent = 'CHỌN MÀU MỰC';
        ruleDisplay.style.color = 'var(--clr-primary)';
    } else {
        ruleDisplay.textContent = 'CHỌN NGHĨA TỪ';
        ruleDisplay.style.color = 'var(--clr-magenta)';
    }
    
    const wordDisplay = $('#stroop-word-display');
    wordDisplay.textContent = COLOR_MAP[trial.wordKey].text;
    wordDisplay.style.color = COLOR_MAP[trial.colorKey].hex;
    wordDisplay.style.visibility = 'visible';
    
    // Shuffle answer buttons
    const answersArea = $('#stroop-answers-area');
    const buttons = Array.from(answersArea.children);
    shuffleArray(buttons);
    buttons.forEach(btn => answersArea.appendChild(btn));
    
    // Reset buttons visual state
    $$('.stroop-btn').forEach(btn => {
        btn.classList.remove('anim-correct', 'anim-error');
        btn.disabled = false;
    });
    
    trialStartTime = performance.now();
    remainingTrialTime = config.timePerQuestion;
    
    if (config.timePerQuestion > 0) {
        // Start visual timer
        const timerBar = $('#stroop-timer-bar .progress-bar');
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        void timerBar.offsetWidth; // force reflow
        timerBar.style.transition = `width ${config.timePerQuestion}ms linear`;
        timerBar.style.width = '0%';
        
        clearTimeout(trialTimeout);
        trialTimeout = setTimeout(() => handleAnswerTimeout(), config.timePerQuestion);
    }
}

async function handleAnswerTimeout() {
    if (state !== 'answering') return;
    state = 'waiting';
    
    playError();
    
    results.push({
        ...trials[currentTrialIndex],
        answered: null,
        isCorrect: false,
        skipped: true,
        reactionTime: config.timePerQuestion
    });
    
    const wordDisplay = $('#stroop-word-display');
    wordDisplay.style.visibility = 'hidden';
    
    await sleep(200);
    currentTrialIndex++;
    showNextTrial();
}

async function handleAnswerClick(e) {
    if (state !== 'answering') return;
    
    const btn = e.target.closest('.stroop-btn');
    if (!btn) return;
    
    state = 'waiting'; // lock input
    clearTimeout(trialTimeout);
    
    const answeredColor = btn.dataset.color;
    const trial = trials[currentTrialIndex];
    const rt = performance.now() - trialStartTime;
    
    const isCorrect = answeredColor === trial.correctAnswer;
    
    results.push({
        ...trial,
        answered: answeredColor,
        isCorrect: isCorrect,
        skipped: false,
        reactionTime: rt
    });
    
    // Feedback
    if (config.immediateFeedback) {
        if (isCorrect) {
            playCorrect();
            triggerHaptic('light');
            btn.classList.add('anim-correct');
        } else {
            playError();
            triggerHaptic('heavy');
            btn.classList.add('anim-error');
            
            // Highlight correct answer
            const correctBtn = $(`#stroop-answers-area .stroop-btn[data-color="${trial.correctAnswer}"]`);
            if (correctBtn) correctBtn.classList.add('anim-correct');
        }
    } else {
        playTap();
    }
    
    // Stop visual timer
    if (config.timePerQuestion > 0) {
        const timerBar = $('#stroop-timer-bar .progress-bar');
        const computedWidth = window.getComputedStyle(timerBar).width;
        timerBar.style.transition = 'none';
        timerBar.style.width = computedWidth;
    }
    
    $$('.stroop-btn').forEach(b => b.disabled = true);
    
    await sleep(config.immediateFeedback ? 400 : 100);
    
    currentTrialIndex++;
    showNextTrial();
}

export function pause() {
    if (state === 'answering') {
        state = 'paused';
        pauseTime = performance.now();
        clearTimeout(trialTimeout);
        if (config.timePerQuestion > 0) {
            remainingTrialTime -= (pauseTime - trialStartTime);
            
            // Freeze timer bar
            const timerBar = $('#stroop-timer-bar .progress-bar');
            const computedWidth = window.getComputedStyle(timerBar).width;
            timerBar.style.transition = 'none';
            timerBar.style.width = computedWidth;
        }
    }
}

export function resume() {
    if (state === 'paused') {
        state = 'answering';
        if (config.timePerQuestion > 0 && remainingTrialTime > 0) {
            // Resume timer visual
            const timerBar = $('#stroop-timer-bar .progress-bar');
            timerBar.style.transition = `width ${remainingTrialTime}ms linear`;
            timerBar.style.width = '0%';
            
            trialStartTime = performance.now() - (config.timePerQuestion - remainingTrialTime);
            trialTimeout = setTimeout(() => handleAnswerTimeout(), remainingTrialTime);
        } else {
            trialStartTime = performance.now() - (performance.now() - pauseTime);
        }
    }
}

export function reset() {
    cleanup();
    start();
}

export function finish() {
    state = 'completed';
    clearTimeout(trialTimeout);
    
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    let totalCorrectRt = 0;
    let fastestCorrectRt = Infinity;
    
    let congruentCorrect = 0;
    let congruentTotal = 0;
    let incongruentCorrect = 0;
    let incongruentTotal = 0;
    
    results.forEach(r => {
        if (r.skipped) {
            skipped++;
        } else if (r.isCorrect) {
            correct++;
            totalCorrectRt += r.reactionTime;
            if (r.reactionTime < fastestCorrectRt) fastestCorrectRt = r.reactionTime;
        } else {
            incorrect++;
        }
        
        if (r.type === 'congruent') {
            congruentTotal++;
            if (r.isCorrect) congruentCorrect++;
        } else {
            incongruentTotal++;
            if (r.isCorrect) incongruentCorrect++;
        }
    });
    
    const accuracy = results.length > 0 ? correct / results.length : 0;
    const avgRt = correct > 0 ? totalCorrectRt / correct : 0;
    
    // Scoring Formula
    // Base 500 for accuracy
    let accScore = accuracy * 500;
    
    // Base 500 for speed, relative to 1500ms max scale
    let speedScore = 0;
    if (correct > 0) {
        speedScore = Math.max(0, 500 * (1 - (avgRt / 1500)));
    }
    
    let finalScore = Math.floor(accScore + speedScore);
    if (finalScore < 0) finalScore = 0;
    if (config.timePerQuestion === 0) finalScore = Math.floor(finalScore * 0.7); // Penalty for untimed
    
    const resultInfo = {
        score: finalScore,
        accuracy: Math.round(accuracy * 100),
        correct,
        incorrect,
        skipped,
        avgTime: avgRt,
        fastest: fastestCorrectRt === Infinity ? 0 : fastestCorrectRt,
        duration: results.reduce((acc, r) => acc + r.reactionTime, 0)
    };
    
    const modeKey = `${config.questions}_${config.mode}_${config.timePerQuestion}`;
    const isNewRecord = Storage.saveGameRecord(GAME_ID, modeKey, resultInfo);
    Storage.addSessionResult(GAME_ID, resultInfo);
    
    playCompletion();
    renderResults(resultInfo, isNewRecord);
}

function renderResults(res, isNewRecord) {
    $('#game-play-area').style.display = 'none';
    $('#game-setup-area').style.display = 'none';
    $('#btn-game-pause').style.display = 'none';
    
    const resultsArea = $('#game-results-area');
    resultsArea.style.display = 'block';
    
    resultsArea.innerHTML = `
        <div class="glass-card anim-pop-in" style="text-align: center;">
            <h3>Kết quả</h3>
            ${isNewRecord ? '<div style="color: var(--clr-accent); font-weight: bold; margin-top: -10px;">Kỷ lục mới!</div>' : ''}
            
            <div class="result-score">${res.score}</div>
            
            <div class="result-details">
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--clr-success)">${res.correct}</div>
                    <div class="stat-label">Đúng</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--clr-error)">${res.incorrect}</div>
                    <div class="stat-label">Sai</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--clr-warning)">${res.skipped}</div>
                    <div class="stat-label">Bỏ qua</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${res.accuracy}%</div>
                    <div class="stat-label">Chính xác</div>
                </div>
            </div>
            
            <div class="stat-card" style="margin-bottom: var(--spacing-lg)">
                <div class="stat-value">${res.correct > 0 ? (res.avgTime).toFixed(0) : 0}ms</div>
                <div class="stat-label">Thời gian phản hồi trung bình</div>
            </div>
            
            <div class="action-buttons">
                <button id="stroop-btn-replay" class="btn btn-primary btn-large">Chơi lại</button>
                <button id="stroop-btn-menu" class="btn btn-secondary btn-large">Tùy chỉnh</button>
            </div>
        </div>
    `;
    
    $('#stroop-btn-replay').addEventListener('click', () => {
        playTap();
        start();
    });
    
    $('#stroop-btn-menu').addEventListener('click', () => {
        playTap();
        init();
    });
}

export function cleanup() {
    clearTimeout(trialTimeout);
    state = 'idle';
}
