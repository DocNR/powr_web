/**
 * NADDR Resolution Hook
 * 
 * Custom hook for resolving NADDR strings to NDK events following
 * .clinerules/ndk-best-practices.md - uses service layer abstraction
 * instead of official NDK hooks for full control and consistency.
 */

import { useState, useEffect, useCallback } from 'react';
import type { NDKEvent } from '@nostr-dev-kit/ndk';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { naddrResolutionService } from '@/lib/services/ndkCacheService';

/**
 * Hook options for NADDR resolution
 */
interface UseNDKNaddrResolutionOptions {
  /** Whether to automatically resolve when naddr changes */
  autoResolve?: boolean;
  /** Cache strategy to use for resolution */
  strategy?: 'cache-first' | 'parallel' | 'smart' | 'cache-only';
  /** Timeout for resolution in milliseconds */
  timeout?: number;
  /** Whether the hook is enabled (useful for conditional resolution) */
  enabled?: boolean;
}

/**
 * Hook return type
 */
interface UseNDKNaddrResolutionReturn {
  /** Resolved NDK event (null if not found or not resolved yet) */
  event: NDKEvent | null;
  /** Whether resolution is in progress */
  loading: boolean;
  /** Error message if resolution failed */
  error: string | null;
  /** Manual resolution function */
  resolve: () => Promise<void>;
  /** Reset the hook state */
  reset: () => void;
  /** Whether the event was resolved from cache */
  isFromCache: boolean;
}

/**
 * Custom hook for resolving NADDR strings to NDK events
 * 
 * Follows your architecture pattern:
 * - Uses service layer abstraction (naddrResolutionService)
 * - No direct NDK operations in components
 * - Full control over caching strategies
 * - Consistent with other custom hooks
 * 
 * @param naddr - NADDR string to resolve (null/undefined to skip resolution)
 * @param options - Resolution options
 * @returns Hook state and control functions
 */
export function useNDKNaddrResolution(
  naddr: string | null | undefined,
  options: UseNDKNaddrResolutionOptions = {}
): UseNDKNaddrResolutionReturn {
  const {
    autoResolve = true,
    strategy = 'cache-first',
    timeout = 10000,
    enabled = true
  } = options;

  // Hook state
  const [event, setEvent] = useState<NDKEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Manual resolution function
  const resolve = useCallback(async () => {
    if (!naddr || !enabled) {
      return;
    }

    setLoading(true);
    setError(null);
    setIsFromCache(false);

    try {
      console.log(`[useNDKNaddrResolution] Resolving NADDR with ${strategy} strategy:`, naddr.substring(0, 20) + '...');

      let resolvedEvent: NDKEvent | null = null;

      // Use appropriate service method based on strategy
      switch (strategy) {
        case 'cache-first':
          resolvedEvent = await naddrResolutionService.fetchByNaddr(naddr, { timeout });
          break;
        case 'parallel':
          resolvedEvent = await naddrResolutionService.fetchByNaddr(naddr, { 
            cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
            timeout 
          });
          break;
        case 'smart':
          resolvedEvent = await naddrResolutionService.resolveNaddrSmart(naddr);
          break;
        case 'cache-only':
          const cacheResult = await naddrResolutionService.checkNaddrCacheAvailability(naddr);
          resolvedEvent = cacheResult.event;
          setIsFromCache(cacheResult.available);
          break;
        default:
          resolvedEvent = await naddrResolutionService.fetchByNaddr(naddr, { timeout });
      }

      setEvent(resolvedEvent);
      
      if (resolvedEvent) {
        console.log(`[useNDKNaddrResolution] ✅ Successfully resolved NADDR - Kind: ${resolvedEvent.kind}`);
      } else {
        console.log(`[useNDKNaddrResolution] ⚠️ NADDR not found`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'NADDR resolution failed';
      setError(errorMessage);
      console.error(`[useNDKNaddrResolution] ❌ Resolution failed:`, err);
    } finally {
      setLoading(false);
    }
  }, [naddr, strategy, timeout, enabled]);

  // Reset function
  const reset = useCallback(() => {
    setEvent(null);
    setLoading(false);
    setError(null);
    setIsFromCache(false);
  }, []);

  // Auto-resolve effect
  useEffect(() => {
    if (autoResolve && naddr && enabled) {
      resolve();
    } else if (!naddr) {
      // Clear state when naddr becomes null/undefined
      reset();
    }
  }, [naddr, autoResolve, enabled, resolve, reset]);

  return {
    event,
    loading,
    error,
    resolve,
    reset,
    isFromCache
  };
}

/**
 * Specialized hook for resolving exercise templates by NADDR
 * Optimized for exercise library browsing with cache-first strategy
 */
export function useExerciseTemplateResolution(naddr: string | null | undefined) {
  return useNDKNaddrResolution(naddr, {
    strategy: 'cache-first',
    timeout: 8000
  });
}

/**
 * Specialized hook for resolving workout templates by NADDR
 * Optimized for workout template browsing with cache-first strategy
 */
export function useWorkoutTemplateResolution(naddr: string | null | undefined) {
  return useNDKNaddrResolution(naddr, {
    strategy: 'cache-first',
    timeout: 8000
  });
}

/**
 * Specialized hook for resolving collection items by NADDR
 * Optimized for collection browsing with parallel strategy for real-time updates
 */
export function useCollectionItemResolution(naddr: string | null | undefined) {
  return useNDKNaddrResolution(naddr, {
    strategy: 'parallel',
    timeout: 6000
  });
}

/**
 * Hook for batch resolving multiple NADDR references
 * Useful for resolving exercise references in workout templates
 */
export function useBatchNaddrResolution(
  naddrs: string[],
  options: Omit<UseNDKNaddrResolutionOptions, 'autoResolve'> = {}
) {
  const { strategy = 'cache-first', timeout = 10000, enabled = true } = options;

  const [events, setEvents] = useState<(NDKEvent | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async () => {
    if (naddrs.length === 0 || !enabled) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[useBatchNaddrResolution] Batch resolving ${naddrs.length} NADDRs with ${strategy} strategy`);

      const resolvedEvents = await naddrResolutionService.batchResolveNaddrs(naddrs, { timeout });
      setEvents(resolvedEvents);

      const successCount = resolvedEvents.filter(event => event !== null).length;
      console.log(`[useBatchNaddrResolution] ✅ Resolved ${successCount}/${naddrs.length} NADDRs`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch NADDR resolution failed';
      setError(errorMessage);
      console.error(`[useBatchNaddrResolution] ❌ Batch resolution failed:`, err);
    } finally {
      setLoading(false);
    }
  }, [naddrs, strategy, timeout, enabled]);

  const reset = useCallback(() => {
    setEvents([]);
    setLoading(false);
    setError(null);
  }, []);

  // Auto-resolve when naddrs change
  useEffect(() => {
    resolve();
  }, [resolve]);

  return {
    events,
    loading,
    error,
    resolve,
    reset
  };
}
