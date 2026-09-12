import { $, $$, sleep, showToast, triggerHaptic } from '../utils.js';
import * as Storage from '../storage.js';
import { playTap, playCorrect, playError, playCompletion, playCountdown } from '../audio.js';

const GAME_ID = 'sequence';
let state = 'idle'; // idle, preparing, playing, paused, answering
let config = {};

let currentRound = 0;
let currentLength = 3;
let targetSequence = [];
let userAnswer = [];
let results = []; // round results
let activeTimeout = null;
let isPresenting = false;
let adaptiveHistory = []; // track recent correctness for adaptive mode (true/false)
let currentItemIndex = 0;

export function init() {
    state = 'idle';
    loadConfig();
    renderSetup();
    $('#active-game-title').textContent = 'Ghi nhớ chuỗi';
}

function loadConfig() {
    const data = Storage.getData();
    config = Object.assign({
        length: 5,
        itemDuration: 1000,
        gapDuration: 200,
        recallDelay: 1000,
        rounds: 5,
        adaptive: false,
        type: 'numbers', // numbers, letters, mixed
        reverse: false
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
            <h3>Tùy chỉnh Ghi nhớ chuỗi</h3>
            
            <div class="setting-item">
                <label>Loại chuỗi</label>
                <select id="seq-type" class="form-control">
                    <option value="numbers" ${config.type == 'numbers' ? 'selected' : ''}>Số (0-9)</option>
                    <option value="letters" ${config.type == 'letters' ? 'selected' : ''}>Chữ cái (A-Z)</option>
                    <option value="mixed" ${config.type == 'mixed' ? 'selected' : ''}>Hỗn hợp</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Nhớ ngược (Reverse)</label>
                <label class="switch">
                    <input type="checkbox" id="seq-reverse" ${config.reverse ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <label>Độ khó tự động</label>
                <label class="switch">
                    <input type="checkbox" id="seq-adaptive" ${config.adaptive ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item" id="seq-length-group" style="display: ${config.adaptive ? 'none' : 'flex'}">
                <label>Độ dài chuỗi</label>
                <select id="seq-length" class="form-control">
                    ${[3,4,5,6,7,8,9,10,11,12,13,14,15].map(v => `<option value="${v}" ${config.length == v ? 'selected' : ''}>${v} ký tự</option>`).join('')}
                </select>
            </div>
            
            <div class="setting-item">
                <label>Số lượt chơi</label>
                <select id="seq-rounds" class="form-control">
                    <option value="5" ${config.rounds == 5 ? 'selected' : ''}>5 lượt</option>
                    <option value="10" ${config.rounds == 10 ? 'selected' : ''}>10 lượt</option>
                    <option value="15" ${config.rounds == 15 ? 'selected' : ''}>15 lượt</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Thời gian hiện 1 mục</label>
                <select id="seq-item-dur" class="form-control">
                    <option value="2000" ${config.itemDuration == 2000 ? 'selected' : ''}>2s</option>
                    <option value="1500" ${config.itemDuration == 1500 ? 'selected' : ''}>1.5s</option>
                    <option value="1000" ${config.itemDuration == 1000 ? 'selected' : ''}>1s</option>
                    <option value="700" ${config.itemDuration == 700 ? 'selected' : ''}>0.7s</option>
                    <option value="500" ${config.itemDuration == 500 ? 'selected' : ''}>0.5s</option>
                </select>
            </div>
            
            <button id="seq-btn-start" class="btn btn-primary btn-large mt-4">Bắt đầu</button>
        </div>
    `;

    $('#seq-adaptive').addEventListener('change', (e) => {
        $('#seq-length-group').style.display = e.target.checked ? 'none' : 'flex';
    });

    $('#seq-btn-start').addEventListener('click', () => {
        playTap();
        config.type = $('#seq-type').value;
        config.reverse = $('#seq-reverse').checked;
        config.adaptive = $('#seq-adaptive').checked;
        config.length = parseInt($('#seq-length').value);
        config.rounds = parseInt($('#seq-rounds').value);
        config.itemDuration = parseInt($('#seq-item-dur').value);
        // hardcode reasonable gaps
        config.gapDuration = 200;
        config.recallDelay = 1000;
        saveConfig();
        start();
    });
}

function generateSequence(length, type) {
    let seq = [];
    for (let i = 0; i < length; i++) {
        if (type === 'numbers') {
            seq.push(Math.floor(Math.random() * 10).toString());
        } else if (type === 'letters') {
            seq.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
        } else {
            if (Math.random() > 0.5) {
                seq.push(Math.floor(Math.random() * 10).toString());
            } else {
                seq.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
            }
        }
    }
    return seq;
}

export function start() {
    cleanup();
    
    currentRound = 0;
    currentLength = config.adaptive ? 3 : config.length;
    results = [];
    adaptiveHistory = [];
    
    $('#game-setup-area').style.display = 'none';
    $('#game-results-area').style.display = 'none';
    $('#game-play-area').style.display = 'flex';
    
    startRound();
}

async function startRound() {
    state = 'preparing';
    $('#btn-game-pause').style.display = 'inline-flex';
    
    targetSequence = generateSequence(currentLength, config.type);
    userAnswer = [];
    
    renderPlayAreaForPresentation();
    
    // Countdown
    const display = $('#seq-display');
    display.textContent = '3';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return; // handles early pause/exit
    
    display.textContent = '2';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    display.textContent = '1';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    display.textContent = 'BẮT ĐẦU';
    playCountdown(true);
    await sleep(800);
    if (state !== 'preparing') return;
    
    presentSequence();
}

function renderPlayAreaForPresentation() {
    const playArea = $('#game-play-area');
    playArea.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <div>Lượt: ${currentRound + 1}/${config.rounds}</div>
            <div>Độ dài: ${currentLength}</div>
        </div>
        ${config.reverse ? '<div class="text-center" style="color: var(--clr-magenta); font-weight: bold;">NHỚ NGƯỢC LẠI</div>' : ''}
        <div class="sequence-container">
            <div id="seq-display" class="sequence-display"></div>
        </div>
    `;
}

async function presentSequence() {
    state = 'playing';
    isPresenting = true;
    
    const display = $('#seq-display');
    display.textContent = '';
    
    for (let i = 0; i < targetSequence.length; i++) {
        if (state !== 'playing') {
            isPresenting = false;
            return; // interrupted
        }
        
        display.style.opacity = '1';
        display.style.transform = 'scale(1)';
        display.textContent = targetSequence[i];
        
        await sleep(config.itemDuration);
        if (state !== 'playing') { isPresenting = false; return; }
        
        display.style.opacity = '0';
        display.style.transform = 'scale(0.8)';
        
        if (i < targetSequence.length - 1) {
            await sleep(config.gapDuration);
        }
    }
    
    isPresenting = false;
    
    if (state === 'playing') {
        state = 'preparing';
        await sleep(config.recallDelay);
        if (state === 'preparing') {
            startAnswering();
        }
    }
}

function startAnswering() {
    state = 'answering';
    $('#btn-game-pause').style.display = 'inline-flex'; // Can pause while answering
    
    const playArea = $('#game-play-area');
    
    // Build Keypad based on type
    let keys = [];
    if (config.type === 'numbers') {
        keys = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];
    } else {
        // Just use a native text input for letters/mixed to rely on OS keyboard
        // or a simplified alphanumeric keypad
        // Let's rely on native input but styled well
    }
    
    playArea.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <div>Lượt: ${currentRound + 1}/${config.rounds}</div>
            <div>${config.reverse ? 'Ghi ngược lại' : 'Ghi đúng thứ tự'}</div>
        </div>
        
        <div class="sequence-container">
            <div class="sequence-input-area" style="margin-top: 20px;">
                <div id="seq-answer-box" class="sequence-answer-box allow-select"></div>
                
                ${config.type === 'numbers' ? `
                    <div class="keypad">
                        ${keys.map(k => `<button class="keypad-btn" data-key="${k}">${k}</button>`).join('')}
                    </div>
                ` : `
                    <input type="text" id="seq-native-input" class="form-control" style="font-size: 2rem; text-align: center; margin-bottom: 20px; text-transform: uppercase;" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false">
                `}
                
                <button id="seq-btn-confirm" class="btn btn-primary btn-large mt-4" disabled>Xác nhận</button>
            </div>
        </div>
    `;
    
    if (config.type === 'numbers') {
        $$('.keypad-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const k = e.target.dataset.key;
                if (k === 'C') {
                    userAnswer = [];
                    playTap();
                } else if (k === '⌫') {
                    userAnswer.pop();
                    playTap();
                } else {
                    if (userAnswer.length < currentLength + 5) {
                        userAnswer.push(k);
                        playTap();
                    }
                }
                updateAnswerBox();
            });
        });
    } else {
        const input = $('#seq-native-input');
        input.focus();
        input.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            e.target.value = val;
            userAnswer = val.split('');
            updateAnswerBox();
        });
    }
    
    $('#seq-btn-confirm').addEventListener('click', () => {
        playTap();
        checkAnswer();
    });
}

function updateAnswerBox() {
    const box = $('#seq-answer-box');
    if (box) box.textContent = userAnswer.join('');
    
    const confirmBtn = $('#seq-btn-confirm');
    if (confirmBtn) {
        confirmBtn.disabled = userAnswer.length === 0;
    }
}

async function checkAnswer() {
    state = 'preparing';
    
    let expected = [...targetSequence];
    if (config.reverse) expected.reverse();
    
    let correctPos = 0;
    let maxLen = Math.max(expected.length, userAnswer.length);
    
    for (let i = 0; i < maxLen; i++) {
        if (expected[i] === userAnswer[i]) {
            correctPos++;
        }
    }
    
    const isExact = expected.join('') === userAnswer.join('');
    
    results.push({
        length: currentLength,
        target: expected.join(''),
        user: userAnswer.join(''),
        isExact,
        correctPos,
        accuracy: expected.length > 0 ? (correctPos / expected.length) : 0
    });
    
    const box = $('#seq-answer-box');
    if (box) {
        if (isExact) {
            box.classList.add('anim-correct');
            playCorrect();
            triggerHaptic('light');
        } else {
            box.classList.add('anim-error');
            box.innerHTML = `
                <div style="text-decoration: line-through; color: var(--clr-error); font-size: 1.2rem">${userAnswer.join('')}</div>
                <div style="color: var(--clr-success); font-weight: bold">${expected.join('')}</div>
            `;
            playError();
            triggerHaptic('heavy');
        }
    }
    
    await sleep(1500);
    
    // Adaptive logic
    if (config.adaptive) {
        adaptiveHistory.push(isExact);
        if (adaptiveHistory.length >= 2) {
            const lastTwo = adaptiveHistory.slice(-2);
            if (lastTwo[0] && lastTwo[1]) {
                currentLength = Math.min(15, currentLength + 1);
                showToast(`Tuyệt vời! Tăng độ dài lên ${currentLength}`);
                adaptiveHistory = [];
            } else if (!lastTwo[0] && !lastTwo[1]) {
                currentLength = Math.max(3, currentLength - 1);
                showToast(`Giảm độ dài xuống ${currentLength}`);
                adaptiveHistory = [];
            }
        }
    }
    
    currentRound++;
    if (currentRound >= config.rounds) {
        finish();
    } else {
        startRound();
    }
}

export function pause() {
    if (state === 'playing') {
        // Pausing during presentation forces restart of round to prevent cheating
        state = 'paused';
        showToast("Đã tạm dừng. Ván hiện tại sẽ được tải lại.");
    } else if (state === 'answering') {
        state = 'paused';
    }
}

export function resume() {
    if (state === 'paused') {
        // If we paused during presentation, restart the round
        if (isPresenting || !targetSequence.length || userAnswer.length === 0 && !$('#seq-native-input')) {
            startRound();
        } else {
            state = 'answering';
        }
    }
}

export function reset() {
    cleanup();
    start();
}

export function finish() {
    state = 'completed';
    
    let totalScore = 0;
    let exactCount = 0;
    let sumLength = 0;
    let maxLenReached = 0;
    let totalPositions = 0;
    let correctPositions = 0;
    
    results.forEach(r => {
        if (r.isExact) exactCount++;
        sumLength += r.length;
        if (r.length > maxLenReached && r.isExact) maxLenReached = r.length;
        
        totalPositions += r.target.length;
        correctPositions += r.correctPos;
        
        // Base score per round = length * 10
        let roundScore = (r.correctPos / r.target.length) * (r.length * 10);
        if (r.isExact) roundScore += 20; // Bonus for exact
        if (config.reverse) roundScore *= 1.2;
        
        totalScore += roundScore;
    });
    
    // Normalize to 1000 max broadly
    const theoreticalMax = config.rounds * (15 * 10 + 20) * (config.reverse ? 1.2 : 1);
    let normalizedScore = Math.floor((totalScore / theoreticalMax) * 1000 * (config.adaptive ? 1.5 : 1)); // bonus for adaptive
    if (normalizedScore > 1000) normalizedScore = 1000;
    
    const overallAcc = totalPositions > 0 ? (correctPositions / totalPositions) : 0;
    
    const resultInfo = {
        score: normalizedScore,
        accuracy: Math.round(overallAcc * 100),
        exactCount,
        maxLenReached,
        avgLength: sumLength / results.length
    };
    
    const modeKey = `${config.type}_${config.adaptive ? 'adapt' : config.length}_${config.reverse ? 'rev' : 'fwd'}`;
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
                    <div class="stat-value" style="color: var(--clr-success)">${res.exactCount}/${config.rounds}</div>
                    <div class="stat-label">Hoàn toàn chính xác</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${res.accuracy}%</div>
                    <div class="stat-label">Độ chính xác vị trí</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${res.maxLenReached}</div>
                    <div class="stat-label">Chuỗi dài nhất đạt được</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(res.avgLength).toFixed(1)}</div>
                    <div class="stat-label">Độ dài TB</div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button id="seq-btn-replay" class="btn btn-primary btn-large">Chơi lại</button>
                <button id="seq-btn-menu" class="btn btn-secondary btn-large">Tùy chỉnh</button>
            </div>
        </div>
    `;
    
    $('#seq-btn-replay').addEventListener('click', () => {
        playTap();
        start();
    });
    
    $('#seq-btn-menu').addEventListener('click', () => {
        playTap();
        init();
    });
}

export function cleanup() {
    clearTimeout(activeTimeout);
    state = 'idle';
    isPresenting = false;
}
