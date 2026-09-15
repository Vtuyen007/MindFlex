import { getSettings, saveSettings } from './storage.js';

let audioCtx = null;
let isInitialized = false;

// Premium tuned frequencies for UI
const frequencies = {
    tap: 659.25, // E5
    correct: [659.25, 880.00], // E5, A5
    correctChord: [523.25, 659.25, 783.99, 987.77], // C5, E5, G5, B5
    error: 220.00, // A3
    countdown: 440.00, // A4
    countdownGo: 880.00 // A5
};

// Piano Tones (C4 to C5 major scale)
const simonTones = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
    493.88, // B4
    523.25  // C5
];

export function initAudio() {
    if (isInitialized) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        isInitialized = true;
        
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

function playPremiumTone(freqs, type = 'sine', duration = 0.3, volMod = 1) {
    const settings = getSettings();
    if (!settings.soundEnabled || !audioCtx) return;
    
    resumeAudio();
    
    const masterVolume = (settings.masterVolume / 100) * volMod;
    if (masterVolume <= 0) return;

    const freqArray = Array.isArray(freqs) ? freqs : [freqs];
    
    freqArray.forEach(freq => {
        // Main oscillator
        const osc1 = audioCtx.createOscillator();
        // Layered oscillator for richness
        const osc2 = audioCtx.createOscillator();
        
        const gainNode = audioCtx.createGain();
        
        osc1.type = type;
        osc2.type = type === 'sine' ? 'triangle' : 'sine';
        
        osc1.frequency.setValueAtTime(freq, audioCtx.currentTime);
        // Slight detune for a chorus, premium effect
        osc2.frequency.setValueAtTime(freq * 1.006, audioCtx.currentTime);
        
        // Premium Envelope: Soft attack, smooth exponential decay
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(masterVolume / freqArray.length, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        const mixGain = audioCtx.createGain();
        mixGain.gain.value = 0.25; // mix osc2 slightly lower
        osc2.connect(mixGain);
        
        osc1.connect(gainNode);
        mixGain.connect(gainNode);
        
        gainNode.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + duration);
        osc2.stop(audioCtx.currentTime + duration);
    });
}

export function playTap() {
    // Làm tiếng tap nhẹ nhàng và ngắn hơn
    playPremiumTone(frequencies.tap, 'sine', 0.1, 0.2);
}

export function playSimonTone(idx) {
    const tone = simonTones[idx] || 400;
    playPremiumTone(tone, 'sine', 0.5, 0.7);
}

export function playCorrect() {
    playPremiumTone(frequencies.correct, 'sine', 0.4, 0.5);
}

export function playError() {
    // Dùng sóng sine với hợp âm thứ trầm để nghe nhẹ nhàng, không bị gắt
    playPremiumTone([220.00, 261.63], 'sine', 0.4, 0.3);
}

export function playCountdown(isGo = false) {
    playPremiumTone(isGo ? frequencies.countdownGo : frequencies.countdown, 'sine', 0.2, 0.5);
}

export function playCompletion() {
    const settings = getSettings();
    if (!settings.soundEnabled || !audioCtx) return;
    resumeAudio();
    
    // Play an arpeggiated Maj7 chord for a premium win sound
    const masterVolume = (settings.masterVolume / 100) * 0.5;
    if (masterVolume <= 0) return;

    frequencies.correctChord.forEach((f, i) => {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.value = f;
        osc2.frequency.value = f * 1.005; // detune
        
        const startTime = audioCtx.currentTime + (i * 0.1);
        const duration = 1.5;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(masterVolume / 3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc2.connect(gainNode);
        osc1.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
    });
}
