import { $ } from './utils.js';
import * as Storage from './storage.js';
import { initTheme, toggleTheme, updateRGBBackground, updateThemeSegmentUI } from './theme.js';
import { initAudio, playTap, toggleGlobalSound } from './audio.js';
import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Storage
    Storage.loadData();
    const settings = Storage.getSettings();

    // 2. Init UI/Theme
    initTheme();
    
    // 3. Bind Global Controls
    
    // Header controls
    $('#btn-theme-toggle').addEventListener('click', () => {
        playTap();
        toggleTheme();
    });
    
    $('#btn-sound-toggle').addEventListener('click', () => {
        const isEnabled = toggleGlobalSound();
        playTap(); // play if newly enabled
        updateSoundButtonUI(isEnabled);
    });
    updateSoundButtonUI(settings.soundEnabled);

    // 4. Bind Settings UI
    $$('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            playTap();
            const theme = e.target.dataset.theme;
            settings.theme = theme;
            Storage.saveSettings(settings);
            initTheme(); // re-apply
            updateThemeSegmentUI(theme);
        });
    });
    updateThemeSegmentUI(settings.theme);
    
    const rgbToggle = $('#rgb-bg-toggle');
    rgbToggle.checked = settings.rgbBackground;
    rgbToggle.addEventListener('change', (e) => {
        playTap();
        settings.rgbBackground = e.target.checked;
        Storage.saveSettings(settings);
        updateRGBBackground(settings.rgbBackground, settings.rgbSpeed);
    });
    
    const rgbSpeedSelect = $('#rgb-speed-select');
    rgbSpeedSelect.value = settings.rgbSpeed || 'normal';
    rgbSpeedSelect.addEventListener('change', (e) => {
        playTap();
        settings.rgbSpeed = e.target.value;
        Storage.saveSettings(settings);
        updateRGBBackground(settings.rgbBackground, settings.rgbSpeed);
    });

    const reducedMotionToggle = $('#reduced-motion-toggle');
    reducedMotionToggle.checked = settings.reducedMotion;
    reducedMotionToggle.addEventListener('change', (e) => {
        playTap();
        settings.reducedMotion = e.target.checked;
        Storage.saveSettings(settings);
        // Reload is simplest way to ensure CSS changes fully apply to running animations
        setTimeout(() => window.location.reload(), 300);
    });
    
    const soundToggle = $('#sound-toggle');
    soundToggle.checked = settings.soundEnabled;
    soundToggle.addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        Storage.saveSettings(settings);
        updateSoundButtonUI(settings.soundEnabled);
        if (settings.soundEnabled) playTap();
    });

    const volSlider = $('#volume-slider');
    volSlider.value = settings.masterVolume;
    volSlider.addEventListener('change', (e) => {
        settings.masterVolume = parseInt(e.target.value);
        Storage.saveSettings(settings);
        playTap();
    });

    const hapticsToggle = $('#haptics-toggle');
    hapticsToggle.checked = settings.hapticsEnabled;
    hapticsToggle.addEventListener('change', (e) => {
        playTap();
        settings.hapticsEnabled = e.target.checked;
        Storage.saveSettings(settings);
    });

    // Data Management
    $('#btn-export-data').addEventListener('click', () => {
        playTap();
        Storage.exportData();
    });

    $('#file-import-data').addEventListener('change', (e) => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
            Storage.importData(evt.target.result);
        };
        reader.readAsText(file);
    });

    $('#btn-reset-data').addEventListener('click', () => {
        playTap();
        Storage.resetData();
    });

    // 5. User interaction bootstrap for Audio API
    document.body.addEventListener('click', () => {
        initAudio();
    }, { once: true });
    document.body.addEventListener('touchstart', () => {
        initAudio();
    }, { once: true });

    // 6. Init Router and remove splash
    setTimeout(() => {
        initRouter();
        $('#view-splash').classList.remove('view-active');
    }, 500); // Small delay to show splash
});

function updateSoundButtonUI(isEnabled) {
    const btn = $('#btn-sound-toggle');
    if (isEnabled) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
    } else {
        btn.innerHTML = '<svg viewBox="0 0 24 24" class="icon"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
    }
}
