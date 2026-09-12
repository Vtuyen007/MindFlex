import * as Storage from './storage.js';
const $ = (selector) => document.querySelector(selector);

export function initTheme() {
    const settings = Storage.getSettings();
    applyTheme(settings.theme);
    
    // Listen for OS theme changes if on system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (Storage.getSettings().theme === 'system') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });

    // Apply RGB background state
    updateRGBBackground(settings.rgbBackground, settings.rgbSpeed);
    
    // Wait a tick to ensure transitions are bound after initial layout
    setTimeout(() => {
        document.body.style.transition = 'background-color var(--anim-normal), color var(--anim-normal)';
    }, 100);
}

export function toggleTheme() {
    const settings = Storage.getSettings();
    let nextTheme = 'system';
    
    if (settings.theme === 'system') {
        nextTheme = 'dark';
    } else if (settings.theme === 'dark') {
        nextTheme = 'light';
    } else {
        nextTheme = 'system';
    }
    
    applyTheme(nextTheme);
    settings.theme = nextTheme;
    Storage.saveSettings(settings);
    
    // Update select element if we are on settings page
    const themeSelect = $('#theme-select');
    if (themeSelect) themeSelect.value = nextTheme;
}

export function applyTheme(themeMode) {
    if (themeMode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', themeMode);
    }
}

export function updateRGBBackground(enabled, speed) {
    const rgbBg = $('#rgb-background');
    if (!rgbBg) return;
    
    if (enabled) {
        rgbBg.classList.remove('disabled');
        rgbBg.setAttribute('data-speed', speed);
    } else {
        rgbBg.classList.add('disabled');
    }
}
