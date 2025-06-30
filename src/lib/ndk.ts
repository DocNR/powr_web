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

// Global NDK instance - initialized immediately (official NDK pattern)
let globalNDK: NDK | null = null;
let initializationPromise: Promise<NDK> | null = null;

/**
 * Initialize NDK singleton immediately (official NDK pattern)
 * 
 * Key architectural decision: Using ONLY NDK cache for persistence.
 * No custom database, no field mapping, no sync complexity.
 */
const createNDKSingleton = async (): Promise<NDK> => {
  console.log('[NDK] Initializing NDK singleton with IndexedDB cache...');
  
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
    
    // Create NDK instance with browser-optimized settings (based on noga app)
    const ndk = new NDK({
      cacheAdapter,
      explicitRelayUrls: DEFAULT_RELAYS,
      enableOutboxModel: true,      // Enable outbox model for better relay discovery
      // CRITICAL: These validation ratio settings from noga app fix connection issues
      initialValidationRatio: 0.0,  // Don't wait for multiple relays to validate
      lowestValidationRatio: 0.0,   // Accept events from first responding relay
      autoConnectUserRelays: false, // Prevent auto connections that block
      autoFetchUserMutelist: false, // Prevent auto fetches that block
      clientName: 'POWR Web',
    });
    
    // Connect to relays with timeout to prevent hanging
    console.log('[NDK] Connecting to relays...');
    await connectWithTimeout(ndk, 10000); // 10 second timeout
    
    console.log('[NDK] Successfully connected to relays');
    
    // Store global reference
    globalNDK = ndk;
    
    return ndk;
    
  } catch (error) {
    console.error('[NDK] Failed to initialize:', error);
    throw error;
  }
};

/**
 * Connect to NDK with timeout to prevent hanging on slow/down relays
 */
const connectWithTimeout = async (ndk: NDK, timeoutMs: number): Promise<void> => {
  return new Promise((resolve) => {
    // Set up timeout
    const timeout = setTimeout(() => {
      console.warn(`[NDK] Connection timeout after ${timeoutMs}ms - proceeding with available relays`);
      resolve(); // Resolve anyway - NDK can work with partial connections
    }, timeoutMs);

    // Attempt connection
    ndk.connect()
      .then(() => {
        clearTimeout(timeout);
        resolve();
      })
      .catch((error) => {
        clearTimeout(timeout);
        console.warn('[NDK] Connection error - proceeding with available relays:', error);
        resolve(); // Resolve anyway - NDK can work with partial connections
      });
  });
};

/**
 * Get the global NDK instance (official NDK pattern)
 * Initializes on first access if not already initialized
 */
export const getNDKInstance = (): NDK | null => {
  // If in browser and not initialized, start initialization
  if (typeof window !== 'undefined' && !globalNDK && !initializationPromise) {
    initializationPromise = createNDKSingleton();
    initializationPromise.catch(console.error);
  }
  
  return globalNDK;
};

/**
 * Ensure NDK is initialized (for authentication hooks)
 */
export const ensureNDKInitialized = async (): Promise<NDK> => {
  if (globalNDK) {
    return globalNDK;
  }
  
  if (!initializationPromise) {
    initializationPromise = createNDKSingleton();
  }
  
  return await initializationPromise;
};

/**
 * Legacy function for compatibility
 */
export const initializeNDK = ensureNDKInitialized;

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
