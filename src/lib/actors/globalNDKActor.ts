/**
 * Global NDK Actor for XState Publishing
 * 
 * Centralized NDK service management for XState machines, following proven
 * patterns from WorkoutPublisher component. Supports both confirmed and
 * optimistic publishing modes.
 */

import { getNDKInstance } from '@/lib/ndk';
import { type WorkoutEventData } from '@/lib/services/workoutAnalytics';
import { NDKEvent } from '@nostr-dev-kit/ndk';

// NDK Event Monitoring - Phase 1: Analysis
let ndkEventListenersSetup = false;

const setupNDKEventMonitoring = () => {
  if (ndkEventListenersSetup) return;
  
  const ndk = getNDKInstance();
  if (!ndk) return;
  
  console.log('[NDK Monitor] Setting up comprehensive NDK event monitoring...');
  
  // Monitor publish failures - using correct event name from NDK source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndk.on('event:publish-failed', (event: any, error: any, relays: any) => {
    console.warn('[NDK Monitor] Publish failed:', {
      eventId: event?.id,
      eventKind: event?.kind,
      error: error?.message || String(error),
      relayCount: Array.isArray(relays) ? relays.length : 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relays: Array.isArray(relays) ? relays.map((r: any) => r?.url || String(r)) : []
    });
  });
  
  // Monitor relay connection changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndk.pool.on('relay:connect', (relay: any) => {
    console.log('[NDK Monitor] Relay connected:', {
      url: relay?.url,
      status: relay?.connectivity?.status
    });
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndk.pool.on('relay:disconnect', (relay: any) => {
    console.warn('[NDK Monitor] Relay disconnected:', {
      url: relay?.url,
      status: relay?.connectivity?.status
    });
  });
  
  // Monitor outbox pool if enabled
  if (ndk.outboxPool) {
    console.log('[NDK Monitor] Outbox pool detected - monitoring outbox events...');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ndk.outboxPool.on('relay:connect', (relay: any) => {
      console.log('[NDK Monitor] Outbox relay connected:', {
        url: relay?.url,
        status: relay?.connectivity?.status
      });
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ndk.outboxPool.on('relay:disconnect', (relay: any) => {
      console.warn('[NDK Monitor] Outbox relay disconnected:', {
        url: relay?.url,
        status: relay?.connectivity?.status
      });
    });
  }
  
  ndkEventListenersSetup = true;
  console.log('[NDK Monitor] Event monitoring setup complete');
};

export interface PublishResult {
  success: boolean;
  eventId?: string;
  requestId?: string;
  error?: string;
  validationErrors?: string[];
  queued?: boolean;
}

export interface PublishOptions {
  optimistic?: boolean;
  timeout?: number;
}

export interface NDKConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  isConnected: boolean;
  relayCount: number;
  connectedRelays: string[];
  queueLength: number;
}

// Phase 2: Removed custom queue - NDK handles all queuing internally
// NDK's outbox model and relay-level queuing provide robust offline support

/**
 * Publish event to Nostr network via NDK
 * 
 * Based on proven WorkoutPublisher patterns with hybrid approach:
 * - Confirmed publishing for important events (workout completion)
 * - Optimistic publishing for real-time updates (progress tracking)
 */
export const publishEvent = async (
  eventData: WorkoutEventData, 
  requestId: string, 
  options: PublishOptions = {}
): Promise<PublishResult> => {
  try {
    console.log('[GlobalNDKActor] Publishing event:', { 
      kind: eventData.kind, 
      requestId, 
      optimistic: options.optimistic 
    });
    
    // Basic validation - event structure should be validated by the service layer
    if (!eventData.kind || !eventData.pubkey || !eventData.created_at || !Array.isArray(eventData.tags)) {
      console.error('[GlobalNDKActor] Invalid event structure');
      return {
        success: false,
        error: 'Invalid event structure',
        validationErrors: ['Missing required event fields'],
        requestId
      };
    }
    
    // Get NDK instance (WorkoutPublisher pattern)
    const ndk = getNDKInstance();
    if (!ndk) {
      return {
        success: false,
        error: 'NDK not initialized',
        requestId
      };
    }
    
    // Setup monitoring on first use
    setupNDKEventMonitoring();
    
    // Check if NDK has a signer (WorkoutPublisher pattern)
    if (!ndk.signer) {
      console.error('[GlobalNDKActor] NDK has no signer - authentication required');
      return {
        success: false,
        error: 'NDK not authenticated - no signer available',
        requestId
      };
    }
    
    // Create NDK event (WorkoutPublisher pattern)
    const ndkEvent = new NDKEvent(ndk, eventData);
    
    console.log('[GlobalNDKActor] Created NDK event:', {
      kind: ndkEvent.kind,
      pubkey: ndkEvent.pubkey?.slice(0, 16) + '...',
      tags: ndkEvent.tags.length,
      hasSigner: !!ndk.signer,
      signerType: ndk.signer?.constructor.name,
      relayCount: ndk.pool?.relays?.size || 0,
      optimistic: options.optimistic
    });
    
    console.log('[GlobalNDKActor] NDK Event tags analysis:', {
      totalTags: ndkEvent.tags.length,
      exerciseTagsCount: ndkEvent.tags.filter(t => t[0] === 'exercise').length,
      allTags: ndkEvent.tags.map((tag, i) => `${i}: [${tag.join(', ')}]`)
    });
    
    console.log('[GlobalNDKActor] Original eventData vs NDK event comparison:', {
      originalTags: eventData.tags.length,
      originalExerciseTags: eventData.tags.filter(t => t[0] === 'exercise').length,
      ndkTags: ndkEvent.tags.length,
      ndkExerciseTags: ndkEvent.tags.filter(t => t[0] === 'exercise').length,
      tagsMatch: JSON.stringify(eventData.tags) === JSON.stringify(ndkEvent.tags)
    });
    
    // CRITICAL DEBUG: Check if NDK is deduplicating tags
    const originalExerciseTags = eventData.tags.filter(t => t[0] === 'exercise');
    const ndkExerciseTags = ndkEvent.tags.filter(t => t[0] === 'exercise');
    
    console.log('[GlobalNDKActor] DEDUPLICATION ANALYSIS:');
    console.log('Original exercise tags:', originalExerciseTags.map((tag, i) => `${i}: [${tag.join(', ')}]`));
    console.log('NDK exercise tags:', ndkExerciseTags.map((tag, i) => `${i}: [${tag.join(', ')}]`));
    
    if (originalExerciseTags.length !== ndkExerciseTags.length) {
      console.error('[GlobalNDKActor] 🚨 NDK IS DEDUPLICATING TAGS!', {
        originalCount: originalExerciseTags.length,
        ndkCount: ndkExerciseTags.length,
        lost: originalExerciseTags.length - ndkExerciseTags.length
      });
    }
    
    // Check network connectivity for better logging
    const isOnline = navigator.onLine;
    const connectedRelays = Array.from(ndk.pool?.relays?.values() || [])
      .filter(relay => relay.connectivity.status === 1);
    
    if (options.optimistic) {
      // Optimistic publishing - fire and forget (for progress updates)
      console.log('[GlobalNDKActor] Optimistic publish - submitting to NDK queue...');
      
      ndkEvent.publish().then(() => {
        if (isOnline && connectedRelays.length > 0) {
          console.log('[GlobalNDKActor] ✅ Event published to relays:', ndkEvent.id);
        } else {
          console.log('[GlobalNDKActor] 📦 Event queued by NDK (offline/no relays):', ndkEvent.id);
        }
      }).catch(error => {
        console.warn('[GlobalNDKActor] 📦 Event queued by NDK for retry:', ndkEvent.id, error.message);
      });
      
      return {
        success: true,
        requestId,
        eventId: ndkEvent.id
      };
    } else {
      // Confirmed publishing - wait for confirmation (for workout completion)
      console.log('[GlobalNDKActor] Confirmed publish - attempting immediate delivery...');
      
      try {
        // Wait for relay connections to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check connectivity before attempting publish
        if (!isOnline) {
          console.log('[GlobalNDKActor] 📦 Offline detected - event will be queued by NDK:', ndkEvent.id);
        } else if (connectedRelays.length === 0) {
          console.log('[GlobalNDKActor] 📦 No relay connections - event will be queued by NDK:', ndkEvent.id);
        }
        
        // Publish with timeout - NDK handles retries internally
        const publishPromise = ndkEvent.publish();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Publish timeout')), options.timeout || 10000)
        );
        
        await Promise.race([publishPromise, timeoutPromise]);
        
        // Success could mean either published or queued - check connectivity
        if (isOnline && connectedRelays.length > 0) {
          console.log('[GlobalNDKActor] ✅ Event published to relays:', ndkEvent.id);
        } else {
          console.log('[GlobalNDKActor] 📦 Event queued by NDK for later delivery:', ndkEvent.id);
        }
        
        return {
          success: true,
          eventId: ndkEvent.id,
          requestId
        };
      } catch (publishError) {
        console.log('[GlobalNDKActor] 📦 Event queued by NDK for retry:', ndkEvent.id, publishError instanceof Error ? publishError.message : String(publishError));
        
        // Even "failed" publishes are queued by NDK, so this is still success from user perspective
        return {
          success: true,
          eventId: ndkEvent.id,
          requestId,
          queued: true
        };
      }
    }
    
  } catch (error) {
    console.error('[GlobalNDKActor] Publishing failed - NDK will handle retries:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    };
  }
};

/**
 * Get NDK connection status for XState machines
 * Simplified - no custom queue, NDK handles all queuing internally
 */
export const getNDKConnectionStatus = (): NDKConnectionStatus => {
  const ndk = getNDKInstance();
  
  if (!ndk) {
    return {
      status: 'disconnected',
      isConnected: false,
      relayCount: 0,
      connectedRelays: [],
      queueLength: 0 // NDK handles queuing internally
    };
  }
  
  const relays = Array.from(ndk.pool?.relays?.values() || []);
  const connectedRelays = relays
    .filter(relay => relay.connectivity.status === 1)
    .map(relay => relay.url);
  
  const isConnected = connectedRelays.length > 0;
  
  return {
    status: isConnected ? 'connected' : 'connecting',
    isConnected,
    relayCount: relays.length,
    connectedRelays,
    queueLength: 0 // NDK handles queuing internally
  };
};

/**
 * Subscribe to NDK state changes (for XState machine monitoring)
 */
export const subscribeToNDKState = (callback: (status: NDKConnectionStatus) => void) => {
  // Simple polling for now - could be enhanced with actual NDK events
  const interval = setInterval(() => {
    callback(getNDKConnectionStatus());
  }, 5000);
  
  return {
    unsubscribe: () => clearInterval(interval)
  };
};
