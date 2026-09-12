import { $, $$, formatTime, shuffleArray, triggerHaptic } from '../utils.js';
import * as Storage from '../storage.js';
import { playTap, playCorrect, playError, playCompletion } from '../audio.js';

const GAME_ID = 'schulte';
let state = 'idle'; // idle, playing, paused, completed
let config = {};
let board = [];
let targetSequence = [];
let currentTargetIndex = 0;
let startTime = 0;
let pauseTime = 0;
let totalPausedTime = 0;
let timerInterval = null;
let errors = 0;
let lastClickTime = 0;
let intervals = [];

export function init() {
    state = 'idle';
    loadConfig();
    renderSetup();
    $('#active-game-title').textContent = 'Bảng Schulte';
}

function loadConfig() {
    const data = Storage.getData();
    config = Object.assign({
        size: 5,
        mode: 'num_asc', // num_asc, num_desc, alpha_asc, alt
        timed: true,
        timeLimit: 60
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
            <h3>Tùy chỉnh Bảng Schulte</h3>
            
            <div class="setting-item">
                <label>Kích thước</label>
                <select id="schulte-size" class="form-control">
                    <option value="3" ${config.size == 3 ? 'selected' : ''}>3x3</option>
                    <option value="4" ${config.size == 4 ? 'selected' : ''}>4x4</option>
                    <option value="5" ${config.size == 5 ? 'selected' : ''}>5x5 (Tiêu chuẩn)</option>
                    <option value="6" ${config.size == 6 ? 'selected' : ''}>6x6</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Chế độ</label>
                <select id="schulte-mode" class="form-control">
                    <option value="num_asc" ${config.mode == 'num_asc' ? 'selected' : ''}>Số tăng dần</option>
                    <option value="num_desc" ${config.mode == 'num_desc' ? 'selected' : ''}>Số giảm dần</option>
                    <option value="alpha_asc" ${config.mode == 'alpha_asc' ? 'selected' : ''}>Chữ cái tăng dần</option>
                    <option value="alt" ${config.mode == 'alt' ? 'selected' : ''}>Số & Chữ luân phiên</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Bấm giờ</label>
                <label class="switch">
                    <input type="checkbox" id="schulte-timed" ${config.timed ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item" id="schulte-time-limit-group" style="display: ${config.timed ? 'flex' : 'none'}">
                <label>Giới hạn (giây)</label>
                <select id="schulte-time-limit" class="form-control">
                    <option value="30" ${config.timeLimit == 30 ? 'selected' : ''}>30s</option>
                    <option value="60" ${config.timeLimit == 60 ? 'selected' : ''}>60s</option>
                    <option value="120" ${config.timeLimit == 120 ? 'selected' : ''}>120s</option>
                    <option value="300" ${config.timeLimit == 300 ? 'selected' : ''}>5 phút</option>
                </select>
            </div>
            
            <button id="schulte-btn-start" class="btn btn-primary btn-large mt-4">Bắt đầu</button>
        </div>
    `;

    $('#schulte-timed').addEventListener('change', (e) => {
        $('#schulte-time-limit-group').style.display = e.target.checked ? 'flex' : 'none';
    });

    $('#schulte-btn-start').addEventListener('click', () => {
        playTap();
        config.size = parseInt($('#schulte-size').value);
        config.mode = $('#schulte-mode').value;
        config.timed = $('#schulte-timed').checked;
        config.timeLimit = parseInt($('#schulte-time-limit').value);
        saveConfig();
        start();
    });
}

function generateSequence(size, mode) {
    const total = size * size;
    let seq = [];
    
    if (mode === 'num_asc') {
        for (let i = 1; i <= total; i++) seq.push(i.toString());
    } else if (mode === 'num_desc') {
        for (let i = total; i >= 1; i--) seq.push(i.toString());
    } else if (mode === 'alpha_asc') {
        // A=65
        for (let i = 0; i < total; i++) {
            // If total > 26, it will continue to [ \ ] ^ _ ` a b ...
            seq.push(String.fromCharCode(65 + i));
        }
    } else if (mode === 'alt') {
        // 1, A, 2, B, 3, C...
        let num = 1;
        let alpha = 0;
        for (let i = 0; i < total; i++) {
            if (i % 2 === 0) {
                seq.push(num.toString());
                num++;
            } else {
                seq.push(String.fromCharCode(65 + alpha));
                alpha++;
            }
        }
    }
    return seq;
}

export function start() {
    cleanup();
    state = 'playing';
    $('#game-setup-area').style.display = 'none';
    $('#game-results-area').style.display = 'none';
    $('#game-play-area').style.display = 'flex';
    $('#btn-game-pause').style.display = 'inline-flex';
    
    const total = config.size * config.size;
    targetSequence = generateSequence(config.size, config.mode);
    board = [...targetSequence];
    shuffleArray(board);
    
    currentTargetIndex = 0;
    errors = 0;
    intervals = [];
    totalPausedTime = 0;
    
    renderBoard();
    
    startTime = performance.now();
    lastClickTime = startTime;
    
    if (config.timed) {
        timerInterval = setInterval(updateTimer, 50); // High frequency for smooth ms update
    } else {
        timerInterval = setInterval(updateTimer, 50);
    }
    updateInfo();
}

function renderBoard() {
    const playArea = $('#game-play-area');
    playArea.innerHTML = `
        <div class="schulte-info">
            <div>Mục tiêu: <span id="schulte-target" style="color: var(--clr-primary)">${targetSequence[0]}</span></div>
            <div id="schulte-timer">00:00.0</div>
        </div>
        <div class="progress-bar-container">
            <div id="schulte-progress" class="progress-bar" style="width: 0%"></div>
        </div>
        <div class="schulte-board" id="schulte-board" style="grid-template-columns: repeat(${config.size}, 1fr)">
            ${board.map((val, idx) => `<div class="schulte-cell" data-idx="${idx}">${val}</div>`).join('')}
        </div>
    `;
    
    const boardEl = $('#schulte-board');
    // Using event delegation
    boardEl.addEventListener('click', handleCellClick);
}

function handleCellClick(e) {
    if (state !== 'playing') return;
    
    const cell = e.target.closest('.schulte-cell');
    if (!cell) return;
    
    // Prevent double clicking already completed cells
    if (cell.classList.contains('completed')) return;
    
    const val = cell.textContent;
    const target = targetSequence[currentTargetIndex];
    
    const now = performance.now();
    const interval = now - lastClickTime;
    
    if (val === target) {
        // Correct
        playCorrect();
        triggerHaptic('light', Storage.getSettings().hapticsEnabled);
        
        cell.classList.add('completed', 'anim-correct');
        // cell.style.opacity = '0.3'; // fade out completed
        
        intervals.push(interval);
        lastClickTime = now;
        
        currentTargetIndex++;
        updateInfo();
        
        if (currentTargetIndex >= targetSequence.length) {
            finish(true);
        }
    } else {
        // Incorrect
        playError();
        triggerHaptic('heavy', Storage.getSettings().hapticsEnabled);
        errors++;
        
        // Remove and re-add class to restart animation if rapidly clicked
        cell.classList.remove('anim-error');
        void cell.offsetWidth; // trigger reflow
        cell.classList.add('anim-error');
    }
}

function updateTimer() {
    if (state !== 'playing') return;
    const now = performance.now();
    const elapsed = now - startTime - totalPausedTime;
    
    if (config.timed) {
        const remaining = (config.timeLimit * 1000) - elapsed;
        if (remaining <= 0) {
            $('#schulte-timer').textContent = "00:00.0";
            finish(false); // timeout
            return;
        }
        $('#schulte-timer').textContent = formatTime(remaining);
    } else {
        $('#schulte-timer').textContent = formatTime(elapsed);
    }
}

function updateInfo() {
    if (currentTargetIndex < targetSequence.length) {
        $('#schulte-target').textContent = targetSequence[currentTargetIndex];
    }
    const pct = (currentTargetIndex / targetSequence.length) * 100;
    $('#schulte-progress').style.width = `${pct}%`;
}

export function pause() {
    if (state === 'playing') {
        state = 'paused';
        pauseTime = performance.now();
        clearInterval(timerInterval);
    }
}

export function resume() {
    if (state === 'paused') {
        state = 'playing';
        totalPausedTime += (performance.now() - pauseTime);
        lastClickTime += (performance.now() - pauseTime); // Adjust last click so interval isn't huge
        timerInterval = setInterval(updateTimer, 50);
    }
}

export function reset() {
    cleanup();
    start();
}

export function finish(completed) {
    state = 'completed';
    clearInterval(timerInterval);
    
    const elapsed = performance.now() - startTime - totalPausedTime;
    
    // Calculate score
    // Max 1000. 
    // Accuracy = Correct / (Correct + Errors)
    const accuracy = targetSequence.length / (targetSequence.length + errors);
    let timeScore = 0;
    
    // Baseline time: 1.5s per cell is "okay", 0.5s is "perfect"
    const expectedTime = targetSequence.length * 1500; 
    if (completed) {
        timeScore = Math.max(0, 1000 * (1 - (elapsed / expectedTime)));
    }
    
    // Weight: 70% accuracy, 30% speed
    const finalScore = Math.floor((accuracy * 700) + (timeScore * 0.3));
    
    const avgTime = intervals.length > 0 ? elapsed / intervals.length : 0;
    
    const resultInfo = {
        score: completed ? finalScore : 0,
        accuracy: Math.round(accuracy * 100),
        duration: elapsed,
        errors: errors,
        avgTime: avgTime,
        completed: completed
    };
    
    const modeKey = `${config.size}x${config.size}_${config.mode}_${config.timed ? config.timeLimit : 'unlimited'}`;
    const isNewRecord = Storage.saveGameRecord(GAME_ID, modeKey, resultInfo);
    
    Storage.addSessionResult(GAME_ID, resultInfo);
    
    if (completed) playCompletion();
    else playError();

    renderResults(resultInfo, isNewRecord);
}

function renderResults(res, isNewRecord) {
    $('#game-play-area').style.display = 'none';
    $('#game-setup-area').style.display = 'none';
    $('#btn-game-pause').style.display = 'none';
    
    const resultsArea = $('#game-results-area');
    resultsArea.style.display = 'block';
    
    let fastest = intervals.length > 0 ? Math.min(...intervals) : 0;
    
    resultsArea.innerHTML = `
        <div class="glass-card anim-pop-in" style="text-align: center;">
            <h3>Kết quả</h3>
            ${isNewRecord ? '<div style="color: var(--clr-accent); font-weight: bold; margin-top: -10px;">Kỷ lục mới!</div>' : ''}
            
            <div class="result-score">${res.score}</div>
            
            <div class="result-details">
                <div class="stat-card">
                    <div class="stat-value">${res.accuracy}%</div>
                    <div class="stat-label">Chính xác</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${res.errors}</div>
                    <div class="stat-label">Lỗi</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatTime(res.duration)}</div>
                    <div class="stat-label">Thời gian</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(res.avgTime / 1000).toFixed(2)}s</div>
                    <div class="stat-label">TB / Ô</div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button id="schulte-btn-replay" class="btn btn-primary btn-large">Chơi lại</button>
                <button id="schulte-btn-menu" class="btn btn-secondary btn-large">Tùy chỉnh</button>
            </div>
        </div>
    `;
    
    $('#schulte-btn-replay').addEventListener('click', () => {
        playTap();
        start();
    });
    
    $('#schulte-btn-menu').addEventListener('click', () => {
        playTap();
        init();
    });
}

export function cleanup() {
    clearInterval(timerInterval);
    state = 'idle';
}
