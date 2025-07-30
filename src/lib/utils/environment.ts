/**
 * Environment detection utilities for POWR Workout PWA
 * 
 * Helps distinguish between web browsers/PWA and native mobile environments
 * for conditional feature availability (e.g., Amber authentication)
 */

/**
 * Detect if we're running in a web environment (browser or PWA)
 * Returns true for both regular browsers and PWA installations
 * Returns false for native mobile apps (Capacitor, React Native, etc.)
 */
export function isWebEnvironment(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return true; // Assume web during SSR - will be corrected on client
  }

  // Check for Capacitor (native mobile app)
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    return false; // Running in Capacitor native app
  }

  // Check for React Native
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return false; // Running in React Native
  }

  // Default to web environment (browser or PWA)
  return true;
}

/**
 * Check if Amber authentication should be available
 * Amber only works in native Android environments, not in web browsers or PWAs
 * 
 * @deprecated Use useAmberAvailable() hook instead for React components
 */
export function isAmberAvailable(): boolean {
  // During SSR, assume web environment (no Amber)
  if (typeof window === 'undefined') {
    return false;
  }

  // Amber requires native Android environment
  // It doesn't work in web browsers or PWAs due to app-to-app communication requirements
  return !isWebEnvironment();
}

/**
 * Get environment type for debugging and analytics
 */
export function getEnvironmentType(): 'server' | 'web' | 'pwa' | 'capacitor' | 'react-native' {
  if (typeof window === 'undefined') {
    return 'server';
  }

  if ('Capacitor' in window) {
    return 'capacitor';
  }

  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'react-native';
  }

  // Check if running as PWA (installed web app)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return 'pwa';
  }

  return 'web';
}
