import { $ } from './utils.js';
import { playTap } from './audio.js';

/**
 * Show the results screen generically for all games
 * @param {Object} options Options for rendering
 * @param {number|string} options.score The final score
 * @param {boolean} options.isNewRecord Whether it's a new record
 * @param {string} options.detailsHTML HTML string for the detailed stats
 * @param {Function} options.onReplay Callback when "Play Again" is clicked
 * @param {Function} options.onMenu Callback when "Menu" is clicked
 * @param {string} options.prefix Prefix for element IDs (e.g., 'schulte')
 */
export function renderGameResults({ score, isNewRecord, detailsHTML, onReplay, onMenu, prefix }) {
    $('#game-play-area').style.display = 'none';
    $('#game-setup-area').style.display = 'none';
    $('#btn-game-pause').style.display = 'none';
    
    const resultsArea = $('#game-results-area');
    resultsArea.style.display = 'block';
    
    resultsArea.innerHTML = `
        <div class="glass-card anim-pop-in" style="text-align: center;">
            <h3>Kết quả</h3>
            ${isNewRecord ? '<div style="color: var(--clr-accent); font-weight: bold; margin-top: -10px;">Kỷ lục mới!</div>' : ''}
            
            <div class="result-score">${score}</div>
            
            <div class="result-details" style="display: flex; flex-wrap: wrap; justify-content: center; gap: var(--spacing-md); margin-bottom: var(--spacing-xl);">
                ${detailsHTML}
            </div>
            
            <div class="action-buttons">
                <button id="${prefix}-btn-replay" class="btn btn-primary btn-large">Chơi lại</button>
                <button id="${prefix}-btn-menu" class="btn btn-secondary btn-large">Tùy chỉnh</button>
            </div>
        </div>
    `;
    
    $(`#${prefix}-btn-replay`).addEventListener('click', () => {
        playTap();
        if (onReplay) onReplay();
    });
    
    $(`#${prefix}-btn-menu`).addEventListener('click', () => {
        playTap();
        
        // Chuyển lại về màn hình setup
        $('#game-results-area').style.display = 'none';
        $('#game-setup-area').style.display = 'block';
        
        if (onMenu) onMenu();
    });
}
