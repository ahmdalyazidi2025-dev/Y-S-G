/**
 * Haptic Feedback Utility
 * Provides physical vibration patterns for a native-like experience on supported devices.
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export const hapticFeedback = (pattern: HapticPattern = 'light') => {
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
        return;
    }

    switch (pattern) {
        case 'light':
            // Fast, subtle tap (increased from 10 to 30)
            window.navigator.vibrate(30);
            break;
        case 'medium':
            // Noticeable tap (increased from 20 to 60)
            window.navigator.vibrate(60);
            break;
        case 'heavy':
            // Strong tap (increased from 35 to 120)
            window.navigator.vibrate(120);
            break;
        case 'success':
            // Two short pulses (more rhythmic and stronger)
            window.navigator.vibrate([40, 50, 60]);
            break;
        case 'warning':
            // One long pulse (increased from 50 to 150)
            window.navigator.vibrate(150);
            break;
        case 'error':
            // Three quick pulses (stronger SOS style)
            window.navigator.vibrate([60, 50, 60, 50, 100]);
            break;
        default:
            window.navigator.vibrate(30);
    }
};
