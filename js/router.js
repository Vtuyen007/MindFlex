import { $, $$ } from './utils.js';
import * as Storage from './storage.js';
import { playTap } from './audio.js';
import { renderStatistics } from './statistics.js';

// Import game controllers
import * as SchulteGame from './games/schulte.js';
import * as StroopGame from './games/stroop.js';
import * as SequenceGame from './games/sequence-memory.js';
import * as IconStoryGame from './games/icon-story.js';

const games = {
    'schulte': SchulteGame,
    'stroop': StroopGame,
    'sequence': SequenceGame,
    'icon-story': IconStoryGame
};

let currentRoute = '';
let activeGameId = null;

export function initRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    
    // Bind navigation links
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            playTap();
            if (activeGameId) {
                // If a game is active and we navigate away, we must prompt or cleanup
                e.preventDefault();
                handleGameExit(link.getAttribute('href'));
            }
        });
    });

    // Check initial route
    handleRouteChange();
}

function handleRouteChange() {
    if (activeGameId) {
        cleanupActiveGame();
    }

    const hash = window.location.hash || '#home';
    const route = hash.replace('#', '');
    
    // Validate route
    const validRoutes = ['home', 'games', 'statistics', 'settings', 'schulte', 'stroop', 'sequence', 'icon-story'];
    if (!validRoutes.includes(route)) {
        window.location.hash = '#home';
        return;
    }

    currentRoute = route;
    updateNavUI(route);
    
    // Hide all views
    $$('.view').forEach(view => {
        view.classList.remove('view-active');
    });

    if (games[route]) {
        // It's a game route
        $('#view-active-game').classList.add('view-active');
        activeGameId = route;
        initGame(route);
    } else {
        // Normal view
        $(`#view-${route}`).classList.add('view-active');
        
        if (route === 'statistics') {
            renderStatistics();
        } else if (route === 'home') {
            updateHomeUI();
        }
    }
}

function updateNavUI(route) {
    $$('.nav-link').forEach(link => {
        if (link.dataset.route === route || 
           (route !== 'home' && route !== 'statistics' && route !== 'settings' && link.dataset.route === 'games')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function initGame(gameId) {
    $('#game-setup-area').style.display = 'block';
    $('#game-play-area').style.display = 'none';
    $('#game-results-area').style.display = 'none';
    $('#game-pause-overlay').style.display = 'none';
    
    if (games[gameId] && typeof games[gameId].init === 'function') {
        games[gameId].init();
    }
}

function cleanupActiveGame() {
    if (activeGameId && games[activeGameId] && typeof games[activeGameId].cleanup === 'function') {
        games[activeGameId].cleanup();
    }
    activeGameId = null;
}

function handleGameExit(targetHash) {
    if (confirm("Bạn có chắc muốn rời khỏi trò chơi đang dang dở?")) {
        cleanupActiveGame();
        window.location.hash = targetHash;
    }
}

export function updateHomeUI() {
    const data = Storage.getData();
    
    // Greeting
    const hour = new Date().getHours();
    let greeting = 'Chào buổi sáng!';
    if (hour >= 12 && hour < 18) greeting = 'Chào buổi chiều!';
    else if (hour >= 18) greeting = 'Chào buổi tối!';
    $('#home-greeting').textContent = greeting;
    
    // Stats
    $('#home-streak').textContent = data.state.currentStreak;
    $('#home-sessions').textContent = data.stats.totalSessions;
    
    // Progress
    const goal = 3;
    const progress = Math.min(data.state.dailyGoalProgress, goal);
    const pct = (progress / goal) * 100;
    $('#daily-progress').style.width = `${pct}%`;
    $('#daily-progress-text').textContent = `${progress} / ${goal} trò chơi`;
    
    // Continue
    const btnContinue = $('#btn-continue-last');
    if (data.state.lastPlayedGame) {
        btnContinue.disabled = false;
        btnContinue.onclick = () => {
            playTap();
            window.location.hash = `#${data.state.lastPlayedGame}`;
        };
    } else {
        btnContinue.disabled = true;
    }
    
    // Recommendation (random for now)
    const gameKeys = Object.keys(games);
    const recGame = gameKeys[Math.floor(Math.random() * gameKeys.length)];
    const recCard = $('#recommended-game-card');
    
    const titles = {
        'schulte': 'Bảng Schulte',
        'stroop': 'Thử thách Stroop',
        'sequence': 'Ghi nhớ chuỗi',
        'icon-story': 'Câu chuyện biểu tượng'
    };
    
    const icons = {
        'schulte': 'S',
        'stroop': 'C',
        'sequence': 'M',
        'icon-story': 'I'
    };
    
    recCard.innerHTML = `
        <div class="game-icon">${icons[recGame]}</div>
        <div class="game-info">
            <h3>${titles[recGame]}</h3>
            <p>Đề xuất cho bạn hôm nay</p>
        </div>
        <a href="#${recGame}" class="btn btn-primary btn-play">Chơi ngay</a>
    `;
    
    recCard.querySelector('.btn-play').addEventListener('click', playTap);
}

// Setup common game header buttons
document.addEventListener('DOMContentLoaded', () => {
    $('#btn-game-back').addEventListener('click', () => {
        playTap();
        handleGameExit('#games');
    });
    
    $('#btn-game-pause').addEventListener('click', () => {
        playTap();
        if (activeGameId && games[activeGameId] && typeof games[activeGameId].pause === 'function') {
            games[activeGameId].pause();
            $('#game-pause-overlay').style.display = 'flex';
        }
    });
    
    $('#btn-resume-game').addEventListener('click', () => {
        playTap();
        $('#game-pause-overlay').style.display = 'none';
        if (activeGameId && games[activeGameId] && typeof games[activeGameId].resume === 'function') {
            games[activeGameId].resume();
        }
    });
    
    $('#btn-restart-game').addEventListener('click', () => {
        playTap();
        $('#game-pause-overlay').style.display = 'none';
        if (activeGameId && games[activeGameId] && typeof games[activeGameId].reset === 'function') {
            games[activeGameId].reset();
        }
    });
    
    $('#btn-quit-game').addEventListener('click', () => {
        playTap();
        $('#game-pause-overlay').style.display = 'none';
        handleGameExit('#games');
    });
});
