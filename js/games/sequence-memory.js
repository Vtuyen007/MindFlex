import { $, $$, sleep, showToast, triggerHaptic } from '../utils.js';
import * as Storage from '../storage.js';
import { playTap, playSimonTone, playCorrect, playError, playCompletion, playCountdown } from '../audio.js';
import { renderGameResults } from '../game-ui.js';

const GAME_ID = 'sequence';
let state = 'idle'; 
let config = {};

let currentRound = 0;
let currentLength = 3;
let targetSequence = [];
let userStep = 0; // tracking how many steps the user has successfully clicked in current round
let results = []; 
let activeTimeout = null;
let isPresenting = false;
let adaptiveHistory = []; 

export function init() {
    state = 'idle';
    loadConfig();
    renderSetup();
    $('#active-game-title').textContent = 'Ghi nhớ chuỗi (Simon)';
}

function loadConfig() {
    const data = Storage.getData();
    config = Object.assign({
        length: 4,
        speed: 800, // ms per flash
        rounds: 5,
        adaptive: true,
        reverse: false
    }, data.games[GAME_ID]?.lastSetup || {});
}

function saveConfig() {
    const data = Storage.getData();
    if (!data.games[GAME_ID]) data.games[GAME_ID] = {};
    data.games[GAME_ID].lastSetup = config;
    Storage.saveData();
}

function renderSetup() {
    const setupArea = $('#game-setup-area');
    setupArea.innerHTML = `
        <div class="setup-form glass-card">
            <h3>Tùy chỉnh Ghi nhớ chuỗi</h3>
            
            <div class="setting-item">
                <label>Nhớ ngược (Reverse)</label>
                <label class="switch">
                    <input type="checkbox" id="seq-reverse" ${config.reverse ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <label>Độ khó tự động tăng dần</label>
                <label class="switch">
                    <input type="checkbox" id="seq-adaptive" ${config.adaptive ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item" id="seq-length-group" style="display: ${config.adaptive ? 'none' : 'flex'}">
                <label>Độ dài chuỗi</label>
                <select id="seq-length" class="form-control">
                    ${[3,4,5,6,7,8,9,10,12,15].map(v => `<option value="${v}" ${config.length == v ? 'selected' : ''}>${v} bước</option>`).join('')}
                </select>
            </div>
            
            <div class="setting-item">
                <label>Số lượt chơi</label>
                <select id="seq-rounds" class="form-control">
                    <option value="3" ${config.rounds == 3 ? 'selected' : ''}>3 lượt</option>
                    <option value="5" ${config.rounds == 5 ? 'selected' : ''}>5 lượt</option>
                    <option value="10" ${config.rounds == 10 ? 'selected' : ''}>10 lượt</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Tốc độ hiển thị</label>
                <select id="seq-speed" class="form-control">
                    <option value="1200" ${config.speed == 1200 ? 'selected' : ''}>Chậm</option>
                    <option value="800" ${config.speed == 800 ? 'selected' : ''}>Bình thường</option>
                    <option value="400" ${config.speed == 400 ? 'selected' : ''}>Nhanh</option>
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
        config.reverse = $('#seq-reverse').checked;
        config.adaptive = $('#seq-adaptive').checked;
        config.length = parseInt($('#seq-length').value);
        config.rounds = parseInt($('#seq-rounds').value);
        config.speed = parseInt($('#seq-speed').value);
        saveConfig();
        start();
    });
}

function generateSequence(length) {
    let seq = [];
    for (let i = 0; i < length; i++) {
        seq.push(Math.floor(Math.random() * 4)); // 0, 1, 2, 3
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
    
    targetSequence = generateSequence(currentLength);
    userStep = 0;
    
    renderPlayArea();
    
    const statusText = $('#seq-status-text');
    
    statusText.textContent = '3';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    statusText.textContent = '2';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    statusText.textContent = '1';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    statusText.textContent = 'GHI NHỚ...';
    playCountdown(true);
    await sleep(800);
    if (state !== 'preparing') return;
    
    presentSequence();
}

function renderPlayArea() {
    const playArea = $('#game-play-area');
    playArea.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <div>Lượt: ${currentRound + 1}/${config.rounds}</div>
            <div>Độ dài: ${currentLength}</div>
        </div>
        
        <div id="seq-status-text" class="text-center" style="font-size: 1.5rem; font-weight: bold; margin: var(--spacing-md) 0; min-height: 36px; color: var(--clr-primary);"></div>
        
        ${config.reverse ? '<div class="text-center" style="color: var(--clr-magenta); font-weight: bold;">NHỚ NGƯỢC LẠI</div>' : ''}
        
        <div class="simon-grid">
            <div class="simon-btn simon-0" data-idx="0"></div>
            <div class="simon-btn simon-1" data-idx="1"></div>
            <div class="simon-btn simon-2" data-idx="2"></div>
            <div class="simon-btn simon-3" data-idx="3"></div>
        </div>
    `;
    
    $$('.simon-btn').forEach(btn => {
        btn.addEventListener('click', handleSimonClick);
    });
}

async function presentSequence() {
    state = 'playing';
    isPresenting = true;
    
    // Make sure buttons aren't clickable during presentation
    $$('.simon-btn').forEach(btn => btn.style.pointerEvents = 'none');
    
    for (let i = 0; i < targetSequence.length; i++) {
        if (state !== 'playing') {
            isPresenting = false;
            return; 
        }
        
        const idx = targetSequence[i];
        const btn = $('.simon-btn[data-idx="' + idx + '"]');
        
        if (btn) {
            btn.classList.add('simon-flash');
            playSimonTone(idx);
        }
        
        await sleep(config.speed * 0.6); // flash duration
        if (btn) btn.classList.remove('simon-flash');
        
        if (state !== 'playing') { isPresenting = false; return; }
        
        await sleep(config.speed * 0.4); // gap duration
    }
    
    isPresenting = false;
    
    if (state === 'playing') {
        state = 'answering';
        $('#seq-status-text').textContent = 'ĐẾN LƯỢT BẠN!';
        $('#seq-status-text').style.color = 'var(--clr-success)';
        $$('.simon-btn').forEach(btn => btn.style.pointerEvents = 'auto');
    }
}

async function handleSimonClick(e) {
    if (state !== 'answering') return;
    
    const idx = parseInt(e.target.dataset.idx);
    e.target.classList.add('simon-flash');
    playSimonTone(idx);
    
    setTimeout(() => {
        e.target.classList.remove('simon-flash');
    }, 200);
    
    const expectedSequence = config.reverse ? [...targetSequence].reverse() : targetSequence;
    const expectedIdx = expectedSequence[userStep];
    
    if (idx === expectedIdx) {
        userStep++;
        if (userStep === expectedSequence.length) {
            // Round passed completely
            handleRoundEnd(true);
        }
    } else {
        // Wrong click
        triggerHaptic('heavy');
        playError();
        handleRoundEnd(false);
    }
}

async function handleRoundEnd(isSuccess) {
    state = 'preparing';
    $$('.simon-btn').forEach(btn => btn.style.pointerEvents = 'none');
    
    const statusText = $('#seq-status-text');
    
    if (isSuccess) {
        statusText.textContent = 'CHÍNH XÁC!';
        statusText.style.color = 'var(--clr-success)';
        playCorrect();
        triggerHaptic('light');
    } else {
        statusText.textContent = 'SAI RỒI!';
        statusText.style.color = 'var(--clr-error)';
    }
    
    results.push({
        length: currentLength,
        isExact: isSuccess,
        stepsCompleted: userStep
    });
    
    await sleep(1500);
    
    if (config.adaptive) {
        adaptiveHistory.push(isSuccess);
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
        state = 'paused';
        showToast("Đã tạm dừng. Ván hiện tại sẽ được tải lại.");
    } else if (state === 'answering') {
        state = 'paused';
    }
}

export function resume() {
    if (state === 'paused') {
        if (isPresenting || userStep === 0) {
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
    
    results.forEach(r => {
        if (r.isExact) exactCount++;
        sumLength += r.length;
        if (r.length > maxLenReached && r.isExact) maxLenReached = r.length;
        
        let roundScore = r.isExact ? (r.length * 20) : (r.stepsCompleted * 5);
        if (config.reverse) roundScore *= 1.2;
        
        totalScore += roundScore;
    });
    
    const theoreticalMax = config.rounds * (15 * 20) * (config.reverse ? 1.2 : 1);
    let normalizedScore = Math.floor((totalScore / (theoreticalMax || 1)) * 1000 * (config.adaptive ? 1.2 : 1));
    if (normalizedScore > 1000) normalizedScore = 1000;
    
    const overallAcc = results.length > 0 ? (exactCount / results.length) : 0;
    
    const resultInfo = {
        score: normalizedScore,
        accuracy: Math.round(overallAcc * 100),
        exactCount,
        maxLenReached,
        avgLength: results.length > 0 ? sumLength / results.length : 0
    };
    
    const modeKey = `simon_${config.adaptive ? 'adapt' : config.length}_${config.reverse ? 'rev' : 'fwd'}`;
    const isNewRecord = Storage.saveGameRecord(GAME_ID, modeKey, resultInfo);
    Storage.addSessionResult(GAME_ID, resultInfo);
    
    playCompletion();
    renderResults(resultInfo, isNewRecord);
}

function renderResults(res, isNewRecord) {
    const detailsHTML = `
        <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div class="stat-value" style="color: var(--clr-success)">${res.exactCount}/${config.rounds}</div>
            <div class="stat-label">Hoàn thành</div>
        </div>
        <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div class="stat-value">${res.accuracy}%</div>
            <div class="stat-label">Tỉ lệ đúng</div>
        </div>
        <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div class="stat-value">${res.maxLenReached}</div>
            <div class="stat-label">Chuỗi dài nhất</div>
        </div>
        <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div class="stat-value">${(res.avgLength).toFixed(1)}</div>
            <div class="stat-label">Độ dài TB</div>
        </div>
    `;

    renderGameResults({
        score: res.score,
        isNewRecord: isNewRecord,
        detailsHTML: detailsHTML,
        prefix: 'seq',
        onReplay: () => start(),
        onMenu: () => init()
    });
}

export function cleanup() {
    clearTimeout(activeTimeout);
    state = 'idle';
    isPresenting = false;
}
