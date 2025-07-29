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
let relayConnectionPromise: Promise<void> | null = null;

/**
 * Initialize NDK singleton with lazy relay connection (optimized for fast auth)
 * 
 * Key architectural decision: Using ONLY NDK cache for persistence.
 * No custom database, no field mapping, no sync complexity.
 */
const createNDKSingleton = async (connectRelays: boolean = false): Promise<NDK> => {
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
      clientName: 'POWR',
    });
    
    // Store global reference immediately (before relay connection)
    globalNDK = ndk;
    
    if (connectRelays) {
      // Connect to relays with reduced timeout for faster auth
      console.log('[NDK] Connecting to relays...');
      await connectWithTimeout(ndk, 2000); // Reduced from 10s to 2s
      console.log('[NDK] Successfully connected to relays');
    } else {
      // Start relay connection in background without blocking
      console.log('[NDK] Starting background relay connection...');
      relayConnectionPromise = connectWithTimeout(ndk, 3000).then(() => {
        console.log('[NDK] Background relay connection completed');
      }).catch((error) => {
        console.warn('[NDK] Background relay connection failed:', error);
      });
    }
    
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
        console.log(`[NDK] Connected to relays in ${timeoutMs}ms or less`);
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
 * Ensure relays are connected before publishing (lazy connection)
 */
export const ensureRelaysConnected = async (): Promise<void> => {
  if (!globalNDK) {
    throw new Error('NDK not initialized');
  }

  // If background connection is still in progress, wait for it
  if (relayConnectionPromise) {
    console.log('[NDK] Waiting for background relay connection...');
    await relayConnectionPromise;
    relayConnectionPromise = null; // Clear after completion
    return;
  }

  // Check if we already have relay connections
  const connectedRelays = Array.from(globalNDK.pool.relays.values())
    .filter(relay => relay.connectivity.status === 1); // 1 = connected

  if (connectedRelays.length > 0) {
    console.log(`[NDK] Already connected to ${connectedRelays.length} relays`);
    return;
  }

  // Force connection if not connected
  console.log('[NDK] No relay connections found, connecting now...');
  await connectWithTimeout(globalNDK, 3000);
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
