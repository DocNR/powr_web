/**
 * Universal NDK Data Hook with Caching
 * 
 * Provides a unified React interface for NDK data fetching with configurable
 * caching strategies. This hook follows NDK's proven patterns while providing
 * convenient React integration for different use cases.
 * 
 * Based on research findings and the Universal NDK Cache Service architecture.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { 
  universalNDKCacheService,
  libraryCacheService,
  historyCacheService,
  type CacheOptions 
} from '@/lib/services/ndkCacheService';

/**
 * Hook options for different caching strategies
 */
export interface UseNDKDataOptions extends Omit<CacheOptions, 'cacheUsage'> {
  /** Cache strategy to use */
  strategy?: 'cache-first' | 'cache-only' | 'parallel' | 'relay-only' | 'smart';
  /** Whether to automatically refetch when filters change */
  autoRefetch?: boolean;
  /** Whether to start fetching immediately */
  enabled?: boolean;
  /** Callback when data is successfully fetched */
  onSuccess?: (events: NDKEvent[]) => void;
  /** Callback when fetch fails */
  onError?: (error: Error) => void;
}

/**
 * Hook return type
 */
export interface UseNDKDataResult {
  /** Fetched events */
  events: NDKEvent[];
  /** Whether currently fetching */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Whether data is available (events.length > 0) */
  hasData: boolean;
  /** Manual refetch function */
  refetch: () => Promise<void>;
  /** Clear current data */
  clear: () => void;
  /** Last fetch timestamp */
  lastFetched: number | null;
}

/**
 * Universal NDK Data Hook with Caching
 * 
 * Provides flexible data fetching with different caching strategies:
 * - cache-first: Try cache first, then network (default)
 * - cache-only: Only use cache (offline mode)
 * - parallel: Fetch from cache and network simultaneously
 * - relay-only: Bypass cache entirely
 * - smart: Adapt based on network conditions
 */
export function useNDKDataWithCaching(
  filters: NDKFilter[],
  options: UseNDKDataOptions = {}
): UseNDKDataResult {
  const {
    strategy = 'cache-first',
    autoRefetch = true,
    enabled = true,
    timeout = 10000,
    maxResults,
    closeOnEose = true,
    onSuccess,
    onError
  } = options;

  // State
  const [events, setEvents] = useState<NDKEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Refs for stable references
  const filtersRef = useRef<NDKFilter[]>(filters);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // Fetch function
  const fetchData = useCallback(async () => {
    if (!enabled || filters.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cacheOptions: CacheOptions = {
        timeout,
        maxResults,
        closeOnEose
      };

      let fetchedEvents: NDKEvent[];

      // Use appropriate strategy
      switch (strategy) {
        case 'cache-only':
          fetchedEvents = await universalNDKCacheService.fetchFromCacheOnly(filters, cacheOptions);
          break;
        case 'parallel':
          fetchedEvents = await universalNDKCacheService.fetchParallel(filters, cacheOptions);
          break;
        case 'relay-only':
          fetchedEvents = await universalNDKCacheService.fetchFromRelaysOnly(filters, cacheOptions);
          break;
        case 'smart':
          fetchedEvents = await universalNDKCacheService.fetchSmart(filters, cacheOptions);
          break;
        case 'cache-first':
        default:
          fetchedEvents = await universalNDKCacheService.fetchCacheFirst(filters, cacheOptions);
          break;
      }

      setEvents(fetchedEvents);
      setLastFetched(Date.now());
      onSuccessRef.current?.(fetchedEvents);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown fetch error');
      setError(error);
      onErrorRef.current?.(error);
      console.error('[useNDKDataWithCaching] Fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, strategy, enabled, timeout, maxResults, closeOnEose]);

  // Auto-refetch when filters change
  useEffect(() => {
    if (autoRefetch) {
      // Check if filters actually changed
      const filtersChanged = JSON.stringify(filtersRef.current) !== JSON.stringify(filters);
      if (filtersChanged) {
        filtersRef.current = filters;
        fetchData();
      }
    }
  }, [filters, autoRefetch, fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Manual refetch
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Clear data
  const clear = useCallback(() => {
    setEvents([]);
    setError(null);
    setLastFetched(null);
  }, []);

  return {
    events,
    isLoading,
    error,
    hasData: events.length > 0,
    refetch,
    clear,
    lastFetched
  };
}

/**
 * Specialized hook for library content (offline-first)
 */
export function useLibraryData(
  filters: NDKFilter[],
  options: Omit<UseNDKDataOptions, 'strategy'> = {}
): UseNDKDataResult & {
  /** Check what's available offline */
  checkOfflineAvailability: () => Promise<{
    exerciseTemplates: number;
    workoutTemplates: number;
    collections: number;
  }>;
} {
  const result = useNDKDataWithCaching(filters, {
    ...options,
    strategy: 'cache-only' // Library prioritizes offline-first
  });

  const checkOfflineAvailability = useCallback(async () => {
    return await libraryCacheService.getOfflineAvailability(filters);
  }, [filters]);

  return {
    ...result,
    checkOfflineAvailability
  };
}

/**
 * Specialized hook for workout history (cache-first)
 */
export function useWorkoutHistory(
  userPubkey: string,
  limit: number = 50,
  options: Omit<UseNDKDataOptions, 'strategy'> = {}
): UseNDKDataResult & {
  /** Get offline workout count */
  getOfflineCount: () => Promise<number>;
} {
  const filters: NDKFilter[] = userPubkey ? [{
    kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number], // Workout records
    authors: [userPubkey],
    limit
  }] : [];

  const result = useNDKDataWithCaching(filters, {
    ...options,
    strategy: 'cache-first',
    enabled: !!userPubkey
  });

  const getOfflineCount = useCallback(async () => {
    if (!userPubkey) return 0;
    return await historyCacheService.getOfflineWorkoutCount(userPubkey);
  }, [userPubkey]);

  return {
    ...result,
    getOfflineCount
  };
}

/**
 * Specialized hook for social discovery (parallel fetching)
 */
export function useDiscoveryData(
  filters: NDKFilter[],
  options: Omit<UseNDKDataOptions, 'strategy'> = {}
): UseNDKDataResult {
  return useNDKDataWithCaching(filters, {
    ...options,
    strategy: 'parallel', // Discovery prioritizes freshness
    timeout: 8000 // Longer timeout for social content
  });
}

/**
 * Hook for checking cache availability without fetching
 */
export function useCacheAvailability(filters: NDKFilter[]) {
  const [availability, setAvailability] = useState<{
    available: boolean;
    count: number;
    events: NDKEvent[];
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAvailability = useCallback(async () => {
    if (filters.length === 0) {
      setAvailability({ available: false, count: 0, events: [] });
      return;
    }

    setIsChecking(true);
    try {
      const result = await universalNDKCacheService.checkCacheAvailability(filters);
      setAvailability(result);
    } catch (error) {
      console.error('[useCacheAvailability] Check failed:', error);
      setAvailability({ available: false, count: 0, events: [] });
    } finally {
      setIsChecking(false);
    }
  }, [filters]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    availability,
    isChecking,
    refetch: checkAvailability
  };
}

/**
 * Hook for batch fetching multiple filter sets
 */
export function useBatchNDKData(
  filterSets: NDKFilter[][],
  options: UseNDKDataOptions = {}
): {
  results: NDKEvent[][];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [results, setResults] = useState<NDKEvent[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBatch = useCallback(async () => {
    if (filterSets.length === 0) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cacheOptions: CacheOptions = {
        cacheUsage: options.strategy === 'cache-only' 
          ? NDKSubscriptionCacheUsage.ONLY_CACHE 
          : NDKSubscriptionCacheUsage.CACHE_FIRST,
        timeout: options.timeout,
        maxResults: options.maxResults,
        closeOnEose: options.closeOnEose
      };

      const batchResults = await universalNDKCacheService.fetchBatch(filterSets, cacheOptions);
      setResults(batchResults);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch fetch failed');
      setError(error);
      console.error('[useBatchNDKData] Batch fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterSets, options]);

  useEffect(() => {
    if (options.enabled !== false) {
      fetchBatch();
    }
  }, [fetchBatch, options.enabled]);

  return {
    results,
    isLoading,
    error,
    refetch: fetchBatch
  };
}
