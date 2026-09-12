import { $, $$, shuffleArray, sleep, triggerHaptic } from '../utils.js';
import * as Storage from '../storage.js';
import { playTap, playCorrect, playError, playCompletion, playCountdown } from '../audio.js';

const GAME_ID = 'icon-story';
let state = 'idle'; // preparing, memorizing, answering, completed
let config = {};

const EMOJI_DB = {
    animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️'],
    food: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','☕','🍵','🧃','🥤','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️','🥣','🥡','🥢'],
    vehicles: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️'],
    nature: ['🌲','🌳','🌴','🌵','🌾','🌿','☘️','🍀','🍁','🍂','🍃','🍄','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💧','💦','☔️','☂️','🌊','🌫'],
    objects: ['⌚️','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛️','⏳','📡','🔋','🔌','💡','🔦','🕯','🪔','🧯','🛢','💸','💵','💴','💶','💷','💰','💳','💎','⚖️','🧰','🔧','🔨','⚒','🛠','⛏','🔩','⚙️','🧱','⛓','🧲','🔫','💣','🧨','🪓','🔪','🗡','⚔️','🛡','🚬','⚰️','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡','🧹','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪒','🧽','🧴','🛎','🔑','🗝','🚪','🪑','🛋','🛏','🛌','🧸','🖼','🛍','🛒','🎁','🎈','🎏','🎀','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒','🗓','📆','📅','🗑','📇','🗃','🗳','🗄','📋','📁','📂','🗂','🗞','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇','📐','📏','🧮','📌','📍','✂️','🖊','🖋','✒️','🖌','🖍','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'],
    emotions: ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃'],
    activities: ['⚽️','🏀','🏈','⚾️','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳️','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️‍♀️','🏋️','🏋️‍♂️','🤼‍♀️','🤼','🤼‍♂️','🤸‍♀️','🤸','🤸‍♂️','⛹️‍♀️','⛹️','⛹️‍♂️','🤺','🤾‍♀️','🤾','🤾‍♂️','🏌️‍♀️','🏌️','🏌️‍♂️','🏇','🧘‍♀️','🧘','🧘‍♂️','🏄‍♀️','🏄','🏄‍♂️','🏊‍♀️','🏊','🏊‍♂️','🤽‍♀️','🤽','🤽‍♂️','🚣‍♀️','🚣','🚣‍♂️','🧗‍♀️','🧗','🧗‍♂️','🚵‍♀️','🚵','🚵‍♂️','🚴‍♀️','🚴','🚴‍♂️','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹‍♀️','🤹','🤹‍♂️','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩']
};

let targetIcons = [];
let answerPool = [];
let currentAnswer = [];
let timerTimeout = null;
let memorizationStartTime = 0;
let pauseTime = 0;
let remainingMemoTime = 0;

export function init() {
    state = 'idle';
    loadConfig();
    renderSetup();
    $('#active-game-title').textContent = 'Câu chuyện biểu tượng';
}

function loadConfig() {
    const data = Storage.getData();
    config = Object.assign({
        length: 5,
        memoTime: 20, // 0 for unlimited
        categoryMode: 'random', // same, different, random
        distractors: 4,
        repeated: false,
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
            <h3>Tùy chỉnh Câu chuyện biểu tượng</h3>
            
            <div class="setting-item">
                <label>Số lượng biểu tượng</label>
                <select id="story-length" class="form-control">
                    ${[3,4,5,6,7,8,9,10,11,12].map(v => `<option value="${v}" ${config.length == v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
            </div>
            
            <div class="setting-item">
                <label>Thời gian ghi nhớ</label>
                <select id="story-time" class="form-control">
                    <option value="0" ${config.memoTime == 0 ? 'selected' : ''}>Không giới hạn</option>
                    <option value="10" ${config.memoTime == 10 ? 'selected' : ''}>10 giây</option>
                    <option value="15" ${config.memoTime == 15 ? 'selected' : ''}>15 giây</option>
                    <option value="20" ${config.memoTime == 20 ? 'selected' : ''}>20 giây</option>
                    <option value="30" ${config.memoTime == 30 ? 'selected' : ''}>30 giây</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Chủ đề biểu tượng</label>
                <select id="story-category" class="form-control">
                    <option value="random" ${config.categoryMode == 'random' ? 'selected' : ''}>Hoàn toàn ngẫu nhiên</option>
                    <option value="same" ${config.categoryMode == 'same' ? 'selected' : ''}>Cùng một chủ đề</option>
                    <option value="different" ${config.categoryMode == 'different' ? 'selected' : ''}>Mỗi icon một chủ đề</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Biểu tượng nhiễu (Distractors)</label>
                <select id="story-distractors" class="form-control">
                    <option value="0" ${config.distractors == 0 ? 'selected' : ''}>Không có</option>
                    <option value="2" ${config.distractors == 2 ? 'selected' : ''}>2 icon</option>
                    <option value="4" ${config.distractors == 4 ? 'selected' : ''}>4 icon</option>
                    <option value="6" ${config.distractors == 6 ? 'selected' : ''}>6 icon</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Cho phép icon lặp lại</label>
                <label class="switch">
                    <input type="checkbox" id="story-repeated" ${config.repeated ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <label>Nhớ ngược thứ tự</label>
                <label class="switch">
                    <input type="checkbox" id="story-reverse" ${config.reverse ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <button id="story-btn-start" class="btn btn-primary btn-large mt-4">Bắt đầu</button>
        </div>
    `;

    $('#story-btn-start').addEventListener('click', () => {
        playTap();
        config.length = parseInt($('#story-length').value);
        config.memoTime = parseInt($('#story-time').value);
        config.categoryMode = $('#story-category').value;
        config.distractors = parseInt($('#story-distractors').value);
        config.repeated = $('#story-repeated').checked;
        config.reverse = $('#story-reverse').checked;
        saveConfig();
        start();
    });
}

function getRandomIcon(categories, excludeList = []) {
    let cat = categories[Math.floor(Math.random() * categories.length)];
    let pool = EMOJI_DB[cat];
    let icon = pool[Math.floor(Math.random() * pool.length)];
    
    // Fallback if we accidentally hit a loop, though rare with large pools
    let attempts = 0;
    while (excludeList.includes(icon) && attempts < 50) {
        cat = categories[Math.floor(Math.random() * categories.length)];
        pool = EMOJI_DB[cat];
        icon = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
    }
    return icon;
}

function generateTargetIcons() {
    targetIcons = [];
    const allCats = Object.keys(EMOJI_DB);
    let chosenCats = allCats;
    
    if (config.categoryMode === 'same') {
        chosenCats = [allCats[Math.floor(Math.random() * allCats.length)]];
    } else if (config.categoryMode === 'different') {
        // We'll just randomly pick a category each time, but try to avoid duplicates if possible
    }
    
    let catsUsed = [];
    
    for (let i = 0; i < config.length; i++) {
        let activeCats = chosenCats;
        if (config.categoryMode === 'different') {
            const availCats = allCats.filter(c => !catsUsed.includes(c));
            if (availCats.length > 0) {
                const c = availCats[Math.floor(Math.random() * availCats.length)];
                catsUsed.push(c);
                activeCats = [c];
            } else {
                activeCats = allCats; // fallback if more icons than categories
            }
        }
        
        let exclude = config.repeated ? [] : targetIcons;
        targetIcons.push(getRandomIcon(activeCats, exclude));
    }
}

export function start() {
    cleanup();
    state = 'preparing';
    
    $('#game-setup-area').style.display = 'none';
    $('#game-results-area').style.display = 'none';
    $('#game-play-area').style.display = 'flex';
    $('#btn-game-pause').style.display = 'inline-flex';
    
    generateTargetIcons();
    startMemorization();
}

async function startMemorization() {
    renderMemorizationArea();
    
    // Countdown
    const timerDisplay = $('#story-timer');
    timerDisplay.textContent = '3';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    timerDisplay.textContent = '2';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    timerDisplay.textContent = '1';
    playCountdown(false);
    await sleep(800);
    if (state !== 'preparing') return;
    
    state = 'memorizing';
    playCountdown(true);
    
    $$('.icon-item').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
    });
    
    if (config.memoTime > 0) {
        remainingMemoTime = config.memoTime;
        memorizationStartTime = performance.now();
        updateMemoTimer();
    } else {
        timerDisplay.textContent = '∞';
        const btnReady = document.createElement('button');
        btnReady.className = 'btn btn-primary btn-large mt-4';
        btnReady.textContent = 'Tôi đã nhớ xong';
        btnReady.onclick = () => { playTap(); startAnswering(); };
        $('#game-play-area').appendChild(btnReady);
    }
}

function renderMemorizationArea() {
    const playArea = $('#game-play-area');
    
    playArea.innerHTML = `
        <div style="text-align: center; margin-bottom: var(--spacing-md)">
            <h3 style="color: var(--clr-primary); margin-bottom: var(--spacing-xs)">Hãy nối các biểu tượng thành một câu chuyện có hành động.</h3>
            <div id="story-timer" style="font-size: 2rem; font-weight: bold;"></div>
            ${config.reverse ? '<div style="color: var(--clr-magenta); font-weight: bold; margin-top: var(--spacing-xs)">LƯU Ý: Lát nữa phải xếp ngược lại!</div>' : ''}
        </div>
        
        <div class="icon-story-container">
            <div class="icon-display-grid">
                ${targetIcons.map((icon, idx) => `
                    <div class="icon-item" style="opacity: 0; transform: scale(0.8); transition: all var(--anim-normal)">
                        ${icon}
                        <div class="icon-order">${idx + 1}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function updateMemoTimer() {
    if (state !== 'memorizing') return;
    
    const now = performance.now();
    const elapsed = Math.floor((now - memorizationStartTime) / 1000);
    const left = remainingMemoTime - elapsed;
    
    if (left <= 0) {
        $('#story-timer').textContent = "0";
        startAnswering();
        return;
    }
    
    $('#story-timer').textContent = left;
    timerTimeout = setTimeout(updateMemoTimer, 200); // Check multiple times a second for precision
}

function startAnswering() {
    state = 'answering';
    clearTimeout(timerTimeout);
    
    currentAnswer = [];
    
    // Generate pool (targets + distractors)
    answerPool = [...targetIcons];
    if (!config.repeated) {
        // Unique target icons in pool
        answerPool = [...new Set(targetIcons)];
    }
    
    const allCats = Object.keys(EMOJI_DB);
    for (let i = 0; i < config.distractors; i++) {
        answerPool.push(getRandomIcon(allCats, answerPool));
    }
    
    shuffleArray(answerPool);
    
    renderAnsweringArea();
}

function renderAnsweringArea() {
    const playArea = $('#game-play-area');
    
    playArea.innerHTML = `
        <div style="text-align: center; margin-bottom: var(--spacing-md)">
            <h3 style="color: var(--clr-primary)">Sắp xếp lại các biểu tượng</h3>
            ${config.reverse ? '<div style="color: var(--clr-magenta); font-weight: bold;">Nhớ xếp theo thứ tự NGƯỢC LẠI</div>' : ''}
        </div>
        
        <div class="icon-story-container">
            <!-- Answer slot area -->
            <div class="icon-display-grid" id="story-answer-area" style="min-height: 100px; padding: var(--spacing-md); background: var(--clr-bg-card); border-radius: var(--radius-md); border: 2px dashed var(--clr-border);">
                <!-- Slots populated dynamically -->
            </div>
            
            <!-- Controls -->
            <div style="display: flex; justify-content: center; gap: var(--spacing-md); margin-top: var(--spacing-md)">
                <button id="story-btn-undo" class="btn btn-secondary">Hoàn tác</button>
                <button id="story-btn-clear" class="btn btn-secondary">Xóa hết</button>
            </div>
            
            <!-- Icon Pool -->
            <div class="icon-pool" id="story-pool-area">
                ${answerPool.map((icon, idx) => `
                    <div class="pool-icon" data-id="pool-${idx}" data-icon="${icon}">${icon}</div>
                `).join('')}
            </div>
            
            <button id="story-btn-confirm" class="btn btn-primary btn-large mt-4" disabled>Xác nhận</button>
        </div>
    `;
    
    $$('.pool-icon').forEach(el => {
        el.addEventListener('click', handlePoolClick);
    });
    
    $('#story-btn-undo').addEventListener('click', () => {
        playTap();
        if (currentAnswer.length > 0) {
            const removed = currentAnswer.pop();
            // Restore visual in pool if we aren't allowing repeats
            if (!config.repeated && removed.poolId) {
                const poolEl = $(`[data-id="${removed.poolId}"]`);
                if (poolEl) poolEl.classList.remove('selected');
            }
            updateAnswerVisuals();
        }
    });
    
    $('#story-btn-clear').addEventListener('click', () => {
        playTap();
        currentAnswer = [];
        $$('.pool-icon').forEach(el => el.classList.remove('selected'));
        updateAnswerVisuals();
    });
    
    $('#story-btn-confirm').addEventListener('click', () => {
        playTap();
        checkAnswer();
    });
    
    updateAnswerVisuals();
}

function handlePoolClick(e) {
    if (state !== 'answering') return;
    
    const el = e.currentTarget;
    
    // If not allowing repeats and already selected, ignore
    if (!config.repeated && el.classList.contains('selected')) {
        return;
    }
    
    playTap();
    const icon = el.dataset.icon;
    const poolId = el.dataset.id;
    
    if (currentAnswer.length < targetIcons.length) {
        currentAnswer.push({ icon, poolId });
        if (!config.repeated) {
            el.classList.add('selected');
        }
        updateAnswerVisuals();
    }
}

function handleAnswerClick(e) {
    if (state !== 'answering') return;
    const index = parseInt(e.currentTarget.dataset.index);
    if (!isNaN(index)) {
        playTap();
        const removed = currentAnswer.splice(index, 1)[0];
        if (!config.repeated && removed.poolId) {
            const poolEl = $(`[data-id="${removed.poolId}"]`);
            if (poolEl) poolEl.classList.remove('selected');
        }
        updateAnswerVisuals();
    }
}

function updateAnswerVisuals() {
    const area = $('#story-answer-area');
    area.innerHTML = '';
    
    for (let i = 0; i < targetIcons.length; i++) {
        const item = document.createElement('div');
        item.className = 'icon-item';
        
        if (i < currentAnswer.length) {
            item.textContent = currentAnswer[i].icon;
            item.style.cursor = 'pointer';
            item.dataset.index = i;
            item.addEventListener('click', handleAnswerClick);
        } else {
            item.style.opacity = '0.3';
            item.style.borderStyle = 'dashed';
        }
        
        area.appendChild(item);
    }
    
    $('#story-btn-confirm').disabled = currentAnswer.length < targetIcons.length;
}

function checkAnswer() {
    state = 'completed';
    
    let expected = [...targetIcons];
    if (config.reverse) expected.reverse();
    
    let correctPos = 0;
    let missingCount = 0;
    let distractorCount = 0;
    
    const userIcons = currentAnswer.map(a => a.icon);
    
    // Calculate positional correctness
    for (let i = 0; i < targetIcons.length; i++) {
        if (expected[i] === userIcons[i]) {
            correctPos++;
        }
    }
    
    // Calculate missing / distractors (bag of words comparison)
    let expectedMap = {};
    let userMap = {};
    expected.forEach(i => expectedMap[i] = (expectedMap[i] || 0) + 1);
    userIcons.forEach(i => userMap[i] = (userMap[i] || 0) + 1);
    
    for (let icon in expectedMap) {
        const eCount = expectedMap[icon];
        const uCount = userMap[icon] || 0;
        if (eCount > uCount) missingCount += (eCount - uCount);
    }
    
    for (let icon in userMap) {
        const uCount = userMap[icon];
        const eCount = expectedMap[icon] || 0;
        if (uCount > eCount) distractorCount += (uCount - eCount);
    }
    
    const accuracy = correctPos / targetIcons.length;
    
    let score = accuracy * 1000;
    score -= (missingCount * 50);
    score -= (distractorCount * 50);
    if (score < 0) score = 0;
    if (config.reverse) score = Math.min(1000, score * 1.2);
    
    const isExact = correctPos === targetIcons.length;
    
    const resultInfo = {
        score: Math.floor(score),
        accuracy: Math.round(accuracy * 100),
        correctPos,
        missing: missingCount,
        distractors: distractorCount,
        isExact,
        target: expected,
        user: userIcons
    };
    
    const modeKey = `${config.length}_${config.memoTime}_${config.distractors}_${config.categoryMode}_${config.reverse ? 'rev' : 'fwd'}`;
    const isNewRecord = Storage.saveGameRecord(GAME_ID, modeKey, resultInfo);
    Storage.addSessionResult(GAME_ID, resultInfo);
    
    if (isExact) {
        playCompletion();
        triggerHaptic('light');
    } else {
        playError();
        triggerHaptic('heavy');
    }
    
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
                    <div class="stat-value" style="color: var(--clr-success)">${res.correctPos}/${targetIcons.length}</div>
                    <div class="stat-label">Đúng vị trí</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--clr-error)">${res.missing}</div>
                    <div class="stat-label">Bị thiếu</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--clr-warning)">${res.distractors}</div>
                    <div class="stat-label">Bị nhiễu</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${res.accuracy}%</div>
                    <div class="stat-label">Độ chính xác</div>
                </div>
            </div>
            
            <div style="margin: var(--spacing-xl) 0">
                <h4 style="margin-bottom: var(--spacing-sm)">Đáp án chuẩn:</h4>
                <div style="display: flex; justify-content: center; gap: 5px; font-size: 1.5rem">
                    ${res.target.join(' ')}
                </div>
                
                <h4 style="margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm)">Câu trả lời của bạn:</h4>
                <div style="display: flex; justify-content: center; gap: 5px; font-size: 1.5rem">
                    ${res.user.map((u, i) => `<span style="color: ${u === res.target[i] ? 'inherit' : 'var(--clr-error)'}; text-decoration: ${u === res.target[i] ? 'none' : 'line-through'}">${u}</span>`).join(' ')}
                </div>
            </div>
            
            <div class="action-buttons">
                <button id="story-btn-replay" class="btn btn-primary btn-large">Chơi lại</button>
                <button id="story-btn-menu" class="btn btn-secondary btn-large">Tùy chỉnh</button>
            </div>
        </div>
    `;
    
    $('#story-btn-replay').addEventListener('click', () => {
        playTap();
        start();
    });
    
    $('#story-btn-menu').addEventListener('click', () => {
        playTap();
        init();
    });
}

export function pause() {
    if (state === 'memorizing') {
        state = 'paused';
        clearTimeout(timerTimeout);
        pauseTime = performance.now();
        
        // Hide icons strictly
        $$('.icon-item').forEach(el => {
            el.style.opacity = '0';
        });
        
        if (config.memoTime > 0) {
            remainingMemoTime -= Math.floor((pauseTime - memorizationStartTime) / 1000);
        }
    } else if (state === 'answering') {
        state = 'paused';
    }
}

export function resume() {
    if (state === 'paused') {
        if ($('#story-answer-area')) { // We are in answering state conceptually
            state = 'answering';
        } else {
            state = 'memorizing';
            $$('.icon-item').forEach(el => {
                el.style.opacity = '1';
            });
            
            if (config.memoTime > 0) {
                memorizationStartTime = performance.now();
                updateMemoTimer();
            }
        }
    }
}

export function reset() {
    cleanup();
    start();
}

export function cleanup() {
    clearTimeout(timerTimeout);
    state = 'idle';
}
