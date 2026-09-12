export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Wait for a specific duration
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Format time in milliseconds to MM:SS.ms
 */
export function formatTime(ms) {
    if (!ms || isNaN(ms)) return "00:00.0";
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const deci = Math.floor((ms % 1000) / 100);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deci}`;
}

/**
 * Create a simple toast notification
 */
export function showToast(message, duration = 3000) {
    const container = $('#toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, duration);
}

/**
 * Vibrate if supported and enabled
 */
export function triggerHaptic(type = 'light', isEnabled = true) {
    if (!isEnabled || !navigator.vibrate) return;
    
    // Check if user prefers reduced motion (often correlates with disabling haptics as well)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (type === 'light') {
        navigator.vibrate(10); // short tick for correct
    } else if (type === 'heavy') {
        navigator.vibrate([20, 30, 20]); // error vibration
    }
}
