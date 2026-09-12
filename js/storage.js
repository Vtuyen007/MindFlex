import { showToast, showConfirmModal } from './utils.js';

const STORAGE_KEY = 'mindflex_data_v1';

const defaultData = {
    version: 1,
    settings: {
        theme: 'system',
        soundEnabled: true,
        masterVolume: 80,
        hapticsEnabled: true,
        reducedMotion: false,
        rgbBackground: true,
        rgbSpeed: 'normal'
    },
    state: {
        lastPlayedGame: null,
        currentStreak: 0,
        longestStreak: 0,
        lastPlayDate: null,
        dailyGoalProgress: 0, // Number of games played today
        dailyGoalDate: null
    },
    stats: {
        totalSessions: 0,
        totalTrainingTime: 0,
        sessions: [] // Keep max 50 recent
    },
    games: {
        schulte: { lastSetup: {}, records: {} },
        stroop: { lastSetup: {}, records: {} },
        sequence: { lastSetup: {}, records: {} },
        iconStory: { lastSetup: {}, records: {} }
    }
};

let appData = null;

export function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Deep merge to ensure new defaults are added to older save data
            appData = { ...defaultData, ...parsed, settings: { ...defaultData.settings, ...parsed.settings }, state: { ...defaultData.state, ...parsed.state }, stats: { ...defaultData.stats, ...parsed.stats }, games: { ...defaultData.games, ...parsed.games } };
        } else {
            appData = JSON.parse(JSON.stringify(defaultData));
        }
    } catch (e) {
        console.error("Storage load failed, using defaults");
        appData = JSON.parse(JSON.stringify(defaultData));
    }
    
    checkDailyReset();
    return appData;
}

export function saveData() {
    if (!appData) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error("Storage save failed", e);
    }
}

export function getData() {
    if (!appData) loadData();
    return appData;
}

export function getSettings() {
    return getData().settings;
}

export function saveSettings(newSettings) {
    getData().settings = { ...appData.settings, ...newSettings };
    saveData();
}

function checkDailyReset() {
    const today = new Date().toDateString();
    const state = appData.state;
    
    if (state.lastPlayDate) {
        const lastPlay = new Date(state.lastPlayDate);
        const diffTime = Math.abs(new Date() - lastPlay);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays > 1 && today !== new Date(state.lastPlayDate).toDateString()) {
            state.currentStreak = 0;
        }
    }

    if (state.dailyGoalDate !== today) {
        state.dailyGoalProgress = 0;
        state.dailyGoalDate = today;
        saveData();
    }
}

export function addSessionResult(gameId, result) {
    const data = getData();
    
    // Update daily streak
    const today = new Date().toDateString();
    if (data.state.lastPlayDate !== today) {
        data.state.currentStreak += 1;
        if (data.state.currentStreak > data.state.longestStreak) {
            data.state.longestStreak = data.state.currentStreak;
        }
        data.state.lastPlayDate = today;
    }
    
    // Daily progress
    data.state.dailyGoalProgress += 1;
    
    // Total stats
    data.stats.totalSessions += 1;
    data.stats.totalTrainingTime += (result.duration || 0);
    data.state.lastPlayedGame = gameId;
    
    // Append to history
    result.timestamp = Date.now();
    result.gameId = gameId;
    
    data.stats.sessions.unshift(result);
    if (data.stats.sessions.length > 50) {
        data.stats.sessions.pop();
    }
    
    saveData();
    return result;
}

export function saveGameRecord(gameId, modeKey, scoreInfo) {
    const data = getData();
    const gameRecords = data.games[gameId].records;
    
    let isNewRecord = false;
    
    if (!gameRecords[modeKey]) {
        gameRecords[modeKey] = scoreInfo;
        isNewRecord = true;
    } else {
        // Assume scoreInfo has a 'score' property where higher is better, or 'time' where lower is better
        if (scoreInfo.score !== undefined) {
            if (scoreInfo.score > gameRecords[modeKey].score) {
                gameRecords[modeKey] = scoreInfo;
                isNewRecord = true;
            }
        } else if (scoreInfo.time !== undefined) {
            if (scoreInfo.time < gameRecords[modeKey].time) {
                gameRecords[modeKey] = scoreInfo;
                isNewRecord = true;
            }
        }
    }
    
    saveData();
    return isNewRecord;
}

export function exportData() {
    const dataStr = JSON.stringify(getData(), null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mindflex_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

export function importData(fileStr) {
    try {
        const parsed = JSON.parse(fileStr);
        if (parsed.version && parsed.settings && parsed.games) {
            appData = { ...defaultData, ...parsed };
            saveData();
            showToast("Đã khôi phục dữ liệu thành công. Đang tải lại...", 2000);
            setTimeout(() => window.location.reload(), 2000);
            return true;
        } else {
            showToast("Tệp dữ liệu không hợp lệ.");
            return false;
        }
    } catch (e) {
        showToast("Lỗi khi đọc tệp dữ liệu.");
        return false;
    }
}

export function resetData() {
    showConfirmModal("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.", () => {
        localStorage.removeItem(STORAGE_KEY);
        appData = JSON.parse(JSON.stringify(defaultData));
        showToast("Đã xóa dữ liệu. Đang tải lại...", 2000);
        setTimeout(() => window.location.reload(), 2000);
    });
}
