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
            // Fast, subtle tap
            window.navigator.vibrate(10);
            break;
        case 'medium':
            // Noticeable tap
            window.navigator.vibrate(20);
            break;
        case 'heavy':
            // Strong tap
            window.navigator.vibrate(35);
            break;
        case 'success':
            // Two short pulses
            window.navigator.vibrate([10, 30, 20]);
            break;
        case 'warning':
            // One long pulse
            window.navigator.vibrate(50);
            break;
        case 'error':
            // Three quick pulses (SOS style)
            window.navigator.vibrate([20, 40, 20, 40, 20]);
            break;
        default:
            window.navigator.vibrate(10);
    }
};
