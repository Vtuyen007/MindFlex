import { getSettings, saveSettings } from './storage.js';

let audioCtx = null;
let isInitialized = false;

// Simple oscillators for synthesized UI sounds
const frequencies = {
    tap: 400,
    correct: 880, // A5
    correctChord: [880, 1108.73, 1318.51], // A Major chord
    error: 150,
    countdown: 660, // E5
    countdownGo: 880 // A5
};

export function initAudio() {
    if (isInitialized) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        isInitialized = true;
        
        // Listen to global clicks to resume if suspended
        document.addEventListener('click', resumeAudio, { once: false });
        document.addEventListener('touchstart', resumeAudio, { once: false });
    } catch (e) {
        console.warn("Web Audio API not supported", e);
    }
}

function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function toggleGlobalSound() {
    const settings = getSettings();
    settings.soundEnabled = !settings.soundEnabled;
    saveSettings(settings);
    return settings.soundEnabled;
}

function playTone(freq, type, duration, volMod = 1) {
    const settings = getSettings();
    if (!settings.soundEnabled || !audioCtx) return;
    
    resumeAudio();
    
    const masterVolume = (settings.masterVolume / 100) * volMod;
    if (masterVolume <= 0) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    
    if (Array.isArray(freq)) {
        // Simplified chord, just use first for playTone or implement multi-osc
        osc.frequency.setValueAtTime(freq[0], audioCtx.currentTime);
    } else {
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    }
    
    // Envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(masterVolume, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

export function playTap() {
    playTone(frequencies.tap, 'sine', 0.1, 0.5);
}

export function playCorrect() {
    playTone(frequencies.correct, 'sine', 0.3, 0.6);
}

export function playError() {
    playTone(frequencies.error, 'sawtooth', 0.4, 0.3);
}

export function playCountdown(isGo = false) {
    playTone(isGo ? frequencies.countdownGo : frequencies.countdown, 'sine', 0.2, 0.5);
}

export function playCompletion() {
    const settings = getSettings();
    if (!settings.soundEnabled || !audioCtx) return;
    resumeAudio();
    const masterVolume = (settings.masterVolume / 100) * 0.6;
    if (masterVolume <= 0) return;

    frequencies.correctChord.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(masterVolume / 3, audioCtx.currentTime + (i * 0.1) + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0 + (i * 0.1));
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + (i * 0.1));
        osc.stop(audioCtx.currentTime + 1.5);
    });
}
