import { $ } from './utils.js';
import * as Storage from './storage.js';

export function renderStatistics() {
    const data = Storage.getData();
    
    $('#stat-total-sessions').textContent = data.stats.totalSessions;
    $('#stat-total-time').textContent = formatDuration(data.stats.totalTrainingTime);
    
    // Find favorite game
    const gameCounts = {};
    let favGame = '-';
    let maxCount = 0;
    
    let totalAcc = 0;
    let accCount = 0;
    
    data.stats.sessions.forEach(session => {
        gameCounts[session.gameId] = (gameCounts[session.gameId] || 0) + 1;
        if (gameCounts[session.gameId] > maxCount) {
            maxCount = gameCounts[session.gameId];
            favGame = session.gameId;
        }
        
        if (session.accuracy !== undefined) {
            totalAcc += session.accuracy;
            accCount++;
        }
    });
    
    const titles = {
        'schulte': 'Bảng Schulte',
        'stroop': 'Thử thách Stroop',
        'sequence': 'Ghi nhớ chuỗi',
        'icon-story': 'Câu chuyện biểu tượng'
    };
    
    $('#stat-favorite-game').textContent = favGame !== '-' ? titles[favGame] : '-';
    $('#stat-avg-accuracy').textContent = accCount > 0 ? Math.round(totalAcc / accCount) + '%' : '0%';
    
    // Render History
    const listEl = $('#stat-history-list');
    listEl.innerHTML = '';
    
    if (data.stats.sessions.length === 0) {
        listEl.innerHTML = '<p class="text-center mt-2">Chưa có dữ liệu. Hãy chơi một ván!</p>';
        return;
    }
    
    data.stats.sessions.slice(0, 10).forEach(session => {
        const date = new Date(session.timestamp);
        const dateStr = `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        let scoreText = '';
        if (session.score !== undefined) scoreText = `${session.score} điểm`;
        else if (session.accuracy !== undefined) scoreText = `${session.accuracy}%`;
        else if (session.timeStr) scoreText = session.timeStr;
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <strong>${titles[session.gameId]}</strong>
                <div style="font-size: 0.8rem; color: var(--clr-text-muted)">${dateStr}</div>
            </div>
            <div style="font-weight: 600; color: var(--clr-primary)">
                ${scoreText}
            </div>
        `;
        listEl.appendChild(item);
    });
}

function formatDuration(ms) {
    if (!ms) return '0m';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
}
