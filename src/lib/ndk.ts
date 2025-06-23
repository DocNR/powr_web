/**
 * NDK Configuration for Workout PWA
 * 
 * Browser-specific NDK setup with IndexedDB cache adapter.
 * This is the core of our NDK-first architecture experiment.
 */

import NDK from '@nostr-dev-kit/ndk';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';

// Public relays for testing - proven reliable for fitness content
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',      // Reliable, fast
  'wss://nos.lol',             // Good performance  
  'wss://relay.primal.net',    // Nostr-native
  'wss://relay.nostr.band',    // Good search capabilities
];

// Global NDK instance for authentication integration
let globalNDK: NDK | null = null;

/**
 * Initialize NDK instance with IndexedDB cache adapter
 * 
 * Key architectural decision: Using ONLY NDK cache for persistence.
 * No custom database, no field mapping, no sync complexity.
 */
export const initializeNDK = async (): Promise<NDK> => {
  console.log('[NDK] Initializing NDK with IndexedDB cache...');
  
  try {
    // Create IndexedDB cache adapter for browser persistence
    const cacheAdapter = new NDKCacheAdapterDexie({
      dbName: 'workout-pwa-cache',
      // Cache sizes optimized for workout data
      eventCacheSize: 10000,        // Workout events (templates + records)
      profileCacheSize: 1000,       // User profiles
      eventTagsCacheSize: 20000,    // Event tags for filtering
      saveSig: true,                // Save signatures for verification
    });
    
    console.log('[NDK] IndexedDB cache adapter created');
    
    // Create NDK instance with browser-optimized settings
    const ndk = new NDK({
      cacheAdapter,
      explicitRelayUrls: DEFAULT_RELAYS,
      enableOutboxModel: true,      // Enable outbox model for better relay discovery
      autoConnectUserRelays: true,  // Connect to user's preferred relays
      autoFetchUserMutelist: false, // Don't auto-fetch mute lists (not needed for MVP)
      clientName: 'workout-pwa',
    });
    
    // Connect to relays
    console.log('[NDK] Connecting to relays...');
    await ndk.connect();
    
    console.log('[NDK] Successfully connected to relays');
    
    // Store global reference for authentication integration
    globalNDK = ndk;
    
    return ndk;
    
  } catch (error) {
    console.error('[NDK] Failed to initialize:', error);
    throw error;
  }
};

/**
 * Get the global NDK instance (for authentication integration)
 */
export const getNDKInstance = (): NDK | null => {
  return globalNDK;
};

/**
 * Set the global NDK instance (for testing or manual setup)
 */
export const setNDKInstance = (ndk: NDK): void => {
  globalNDK = ndk;
};

/**
 * Validate relay URLs
 */
const isValidRelayUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol.startsWith('ws');
  } catch {
    return false;
  }
};

/**
 * Get filtered list of valid relay URLs
 */
export const getValidRelays = (relays: string[] = DEFAULT_RELAYS): string[] => {
  return relays.filter(isValidRelayUrl);
};

/**
 * Default relay configuration
 */
export { DEFAULT_RELAYS };

/**
 * NIP-101e Event Kinds
 */
export const WORKOUT_EVENT_KINDS = {
  EXERCISE_TEMPLATE: 33401,
  WORKOUT_TEMPLATE: 33402,
  WORKOUT_RECORD: 1301,
} as const;

/**
 * Type definitions for workout events
 */
export type WorkoutEventKind = typeof WORKOUT_EVENT_KINDS[keyof typeof WORKOUT_EVENT_KINDS];
