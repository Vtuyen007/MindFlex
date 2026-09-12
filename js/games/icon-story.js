import { $, $$, triggerHaptic } from '../utils.js';
import * as Storage from '../storage.js';
import { playTap } from '../audio.js';

const GAME_ID = 'icon-story';
let state = 'idle'; 
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

let currentIcons = [];

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
        categoryMode: 'random'
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
            <h3>Tùy chỉnh Câu chuyện biểu tượng</h3>
            <p style="color: var(--clr-text-muted); margin-bottom: var(--spacing-md); line-height: 1.5;">
                Đây là bài tập giúp rèn luyện trí tưởng tượng và khả năng liên kết. Hệ thống sẽ tạo ra các biểu tượng ngẫu nhiên, nhiệm vụ của bạn là tưởng tượng ra một câu chuyện sáng tạo để kết nối chúng lại với nhau.
            </p>
            
            <div class="setting-item">
                <label>Số lượng biểu tượng</label>
                <select id="story-length" class="form-control">
                    ${[3,4,5,6,7,8,9,10,11,12].map(v => `<option value="${v}" ${config.length == v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
            </div>
            
            <div class="setting-item">
                <label>Chủ đề biểu tượng</label>
                <select id="story-category" class="form-control">
                    <option value="random" ${config.categoryMode == 'random' ? 'selected' : ''}>Hoàn toàn ngẫu nhiên</option>
                    <option value="same" ${config.categoryMode == 'same' ? 'selected' : ''}>Cùng một chủ đề</option>
                </select>
            </div>
            
            <button id="story-btn-start" class="btn btn-primary btn-large mt-4">Tạo Biểu Tượng</button>
        </div>
    `;

    $('#story-btn-start').addEventListener('click', () => {
        playTap();
        config.length = parseInt($('#story-length').value);
        config.categoryMode = $('#story-category').value;
        saveConfig();
        start();
    });
}

function getRandomIcon(categories, excludeList = []) {
    let cat = categories[Math.floor(Math.random() * categories.length)];
    let pool = EMOJI_DB[cat];
    let icon = pool[Math.floor(Math.random() * pool.length)];
    
    // Đảm bảo không bị lặp lại quá nhiều
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
    currentIcons = [];
    const allCats = Object.keys(EMOJI_DB);
    let chosenCats = allCats;
    
    if (config.categoryMode === 'same') {
        chosenCats = [allCats[Math.floor(Math.random() * allCats.length)]];
    }
    
    for (let i = 0; i < config.length; i++) {
        currentIcons.push(getRandomIcon(chosenCats, currentIcons));
    }
}

export function start() {
    cleanup();
    state = 'playing';
    
    $('#game-setup-area').style.display = 'none';
    $('#game-results-area').style.display = 'none';
    $('#game-play-area').style.display = 'flex';
    $('#btn-game-pause').style.display = 'none'; // Không cần nút pause cho trò này
    
    generateAndRender();
    
    // Ghi nhận như 1 lượt chơi (session) để tăng Thống Kê nhưng không lưu kỷ lục
    Storage.addSessionResult(GAME_ID, { score: 0 });
}

function generateAndRender() {
    generateTargetIcons();
    const playArea = $('#game-play-area');
    
    playArea.innerHTML = `
        <div style="text-align: center; margin-bottom: var(--spacing-xl)">
            <h3 style="color: var(--clr-primary); margin-bottom: var(--spacing-xs)">Hãy kể một câu chuyện liên kết các biểu tượng này:</h3>
        </div>
        
        <div class="icon-story-container">
            <div class="icon-display-grid" style="margin-bottom: var(--spacing-xl); justify-content: center; min-height: 200px;">
                ${currentIcons.map((icon, idx) => `
                    <div class="icon-item anim-pop-in" style="animation-delay: ${idx * 0.05}s; opacity: 1; transform: scale(1);">
                        ${icon}
                        <div class="icon-order">${idx + 1}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="action-buttons" style="display: flex; gap: var(--spacing-md); justify-content: center;">
                <button id="story-btn-regen" class="btn btn-primary btn-large">Tạo Mới</button>
                <button id="story-btn-menu" class="btn btn-secondary btn-large">Tùy Chỉnh</button>
            </div>
        </div>
    `;
    
    $('#story-btn-regen').addEventListener('click', () => {
        playTap();
        triggerHaptic('light');
        generateAndRender();
    });
    
    $('#story-btn-menu').addEventListener('click', () => {
        playTap();
        // Hiển thị lại setup
        $('#game-play-area').style.display = 'none';
        $('#game-setup-area').style.display = 'block';
        init();
    });
}

export function pause() { }
export function resume() { }
export function reset() { }

export function cleanup() {
    state = 'idle';
    $('#btn-game-pause').style.display = 'inline-flex'; // Khôi phục lại cho các game khác
}
