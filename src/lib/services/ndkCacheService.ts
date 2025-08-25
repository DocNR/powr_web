/**
 * Universal NDK Cache Service
 * 
 * Provides a unified interface for NDK caching strategies following proven patterns
 * from NDK source code research. This service acts as a thin wrapper around NDK's
 * existing caching architecture, providing convenience methods while maintaining
 * full compatibility with NDK's battle-tested patterns.
 * 
 * Based on research findings from docs/research/ndk-caching-patterns-research-findings.md
 */

import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import type { NDKEvent, NDKFilter, NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

/**
 * Cache strategy options following NDK's proven patterns
 */
export interface CacheOptions {
  /** Cache strategy - defaults to CACHE_FIRST for backward compatibility */
  cacheUsage?: NDKSubscriptionCacheUsage;
  /** Maximum number of results to return */
  maxResults?: number;
  /** Timeout for operations in milliseconds */
  timeout?: number;
  /** Whether to close subscription on EOSE */
  closeOnEose?: boolean;
}

/**
 * Universal NDK Cache Service
 * 
 * Mirrors NDK's internal decision logic and execution flow patterns
 * while providing convenient methods for different caching scenarios.
 */
export class UniversalNDKCacheService {
  
  /**
   * NDK decision logic patterns (mirrored from NDK source)
   */
  private shouldQueryCache(strategy: NDKSubscriptionCacheUsage): boolean {
    return strategy !== NDKSubscriptionCacheUsage.ONLY_RELAY;
  }

  private shouldQueryRelays(strategy: NDKSubscriptionCacheUsage): boolean {
    return strategy !== NDKSubscriptionCacheUsage.ONLY_CACHE;
  }

  private shouldWaitForCache(strategy: NDKSubscriptionCacheUsage): boolean {
    return strategy === NDKSubscriptionCacheUsage.CACHE_FIRST;
  }

  /**
   * Core fetch method following NDK's execution flow patterns
   */
  async fetchEvents(
    filters: NDKFilter[],
    options: CacheOptions = {}
  ): Promise<NDKEvent[]> {
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    const {
      cacheUsage = NDKSubscriptionCacheUsage.CACHE_FIRST,
      maxResults,
      timeout = 10000,
      closeOnEose = true
    } = options;

    const startTime = Date.now();
    console.log(`[UniversalNDKCacheService] Fetching events with ${cacheUsage} strategy:`, {
      filters: filters.length,
      maxResults,
      timeout
    });

    // Use NDK's proven fetchEvents method with our options
    const subscriptionOptions: NDKSubscriptionOptions = {
      cacheUsage,
      closeOnEose,
      ...(maxResults && { limit: maxResults })
    };

    try {
      const events = await Promise.race([
        ndk.fetchEvents(filters, subscriptionOptions),
        new Promise<Set<NDKEvent>>((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout')), timeout)
        )
      ]);

      const fetchTime = Date.now() - startTime;
      const eventsArray = Array.from(events);
      
      console.log(`[UniversalNDKCacheService] ✅ Fetched ${eventsArray.length} events in ${fetchTime}ms using ${cacheUsage}`);
      
      return eventsArray;
    } catch (error) {
      const fetchTime = Date.now() - startTime;
      console.error(`[UniversalNDKCacheService] ❌ Fetch failed after ${fetchTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Fetch from cache only (true offline functionality)
   * Uses NDK's ONLY_CACHE strategy
   */
  async fetchFromCacheOnly(
    filters: NDKFilter[],
    options: Omit<CacheOptions, 'cacheUsage'> = {}
  ): Promise<NDKEvent[]> {
    console.log('[UniversalNDKCacheService] 🔌 Fetching from cache only (offline mode)');
    return this.fetchEvents(filters, {
      ...options,
      cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE
    });
  }

  /**
   * Fetch cache-first with network fallback
   * Uses NDK's CACHE_FIRST strategy (default behavior)
   */
  async fetchCacheFirst(
    filters: NDKFilter[],
    options: Omit<CacheOptions, 'cacheUsage'> = {}
  ): Promise<NDKEvent[]> {
    console.log('[UniversalNDKCacheService] 📦 Fetching cache-first with network fallback');
    return this.fetchEvents(filters, {
      ...options,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    });
  }

  /**
   * Fetch from cache and relays in parallel
   * Uses NDK's PARALLEL strategy for maximum freshness
   */
  async fetchParallel(
    filters: NDKFilter[],
    options: Omit<CacheOptions, 'cacheUsage'> = {}
  ): Promise<NDKEvent[]> {
    console.log('[UniversalNDKCacheService] 🔄 Fetching from cache and relays in parallel');
    return this.fetchEvents(filters, {
      ...options,
      cacheUsage: NDKSubscriptionCacheUsage.PARALLEL
    });
  }

  /**
   * Fetch from relays only (bypass cache)
   * Uses NDK's ONLY_RELAY strategy
   */
  async fetchFromRelaysOnly(
    filters: NDKFilter[],
    options: Omit<CacheOptions, 'cacheUsage'> = {}
  ): Promise<NDKEvent[]> {
    console.log('[UniversalNDKCacheService] 🌐 Fetching from relays only (bypass cache)');
    return this.fetchEvents(filters, {
      ...options,
      cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY
    });
  }

  /**
   * Check if events exist in cache without network requests
   * Useful for determining offline availability
   */
  async checkCacheAvailability(filters: NDKFilter[]): Promise<{
    available: boolean;
    count: number;
    events: NDKEvent[];
  }> {
    try {
      const events = await this.fetchFromCacheOnly(filters, { timeout: 1000 });
      return {
        available: events.length > 0,
        count: events.length,
        events
      };
    } catch (error) {
      console.warn('[UniversalNDKCacheService] Cache availability check failed:', error);
      return {
        available: false,
        count: 0,
        events: []
      };
    }
  }

  /**
   * Smart fetch that adapts strategy based on network conditions
   * Uses cache-first when offline, parallel when online
   */
  async fetchSmart(
    filters: NDKFilter[],
    options: Omit<CacheOptions, 'cacheUsage'> = {}
  ): Promise<NDKEvent[]> {
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      console.log('[UniversalNDKCacheService] 🔌 Network offline - using cache only');
      return this.fetchFromCacheOnly(filters, options);
    }

    // Check cache availability first
    const cacheCheck = await this.checkCacheAvailability(filters);
    
    if (cacheCheck.available) {
      console.log('[UniversalNDKCacheService] 📦 Cache available - using cache-first strategy');
      return this.fetchCacheFirst(filters, options);
    } else {
      console.log('[UniversalNDKCacheService] 🌐 No cache - fetching from relays');
      return this.fetchFromRelaysOnly(filters, options);
    }
  }

  /**
   * Batch fetch multiple filter sets efficiently
   * Useful for resolving complex dependency chains
   */
  async fetchBatch(
    filterSets: NDKFilter[][],
    options: CacheOptions = {}
  ): Promise<NDKEvent[][]> {
    console.log(`[UniversalNDKCacheService] 📦 Batch fetching ${filterSets.length} filter sets`);
    
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(
        filterSets.map(filters => this.fetchEvents(filters, options))
      );
      
      const totalTime = Date.now() - startTime;
      const totalEvents = results.reduce((sum, events) => sum + events.length, 0);
      
      console.log(`[UniversalNDKCacheService] ✅ Batch fetch completed: ${totalEvents} events in ${totalTime}ms`);
      
      return results;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[UniversalNDKCacheService] ❌ Batch fetch failed after ${totalTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics and health information
   * Useful for debugging and monitoring
   */
  async getCacheStats(): Promise<{
    adapterType: string;
    isHealthy: boolean;
    supportsLocking: boolean;
    estimatedSize?: number;
  }> {
    const ndk = getNDKInstance();
    if (!ndk || !ndk.cacheAdapter) {
      return {
        adapterType: 'none',
        isHealthy: false,
        supportsLocking: false
      };
    }

    return {
      adapterType: ndk.cacheAdapter.constructor.name,
      isHealthy: true,
      supportsLocking: !!ndk.cacheAdapter.locking,
      // Note: NDK doesn't expose cache size directly
      estimatedSize: undefined
    };
  }
}

// Export singleton instance
export const universalNDKCacheService = new UniversalNDKCacheService();

/**
 * Tab-specific cache services for organized usage
 */

/**
 * Library Cache Service
 * Optimized for exercise and template browsing with offline-first approach
 */
export class LibraryCacheService {
  private cacheService = universalNDKCacheService;

  /**
   * Load library content with offline-first strategy
   */
  async loadLibraryContent(filters: NDKFilter[]): Promise<NDKEvent[]> {
    console.log('[LibraryCacheService] Loading library content with offline-first strategy');
    
    // Try cache first, then network if needed
    try {
      const cacheResults = await this.cacheService.fetchFromCacheOnly(filters, { timeout: 2000 });
      
      if (cacheResults.length > 0) {
        console.log(`[LibraryCacheService] ✅ Loaded ${cacheResults.length} items from cache`);
        return cacheResults;
      }
      
      // Cache miss - fetch from network
      console.log('[LibraryCacheService] Cache miss - fetching from network');
      return await this.cacheService.fetchFromRelaysOnly(filters);
      
    } catch (error) {
      console.warn('[LibraryCacheService] Offline fetch failed, trying network:', error);
      return await this.cacheService.fetchFromRelaysOnly(filters);
    }
  }

  /**
   * Check what's available offline
   */
  async getOfflineAvailability(filters: NDKFilter[]): Promise<{
    exerciseTemplates: number;
    workoutTemplates: number;
    collections: number;
  }> {
    const [exercises, templates, collections] = await Promise.all([
      this.cacheService.checkCacheAvailability([{ ...filters[0], kinds: [WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE as number] }]),
      this.cacheService.checkCacheAvailability([{ ...filters[0], kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number] }]),
      this.cacheService.checkCacheAvailability([{ ...filters[0], kinds: [30003 as number] }])
    ]);

    return {
      exerciseTemplates: exercises.count,
      workoutTemplates: templates.count,
      collections: collections.count
    };
  }
}

/**
 * History Cache Service
 * Optimized for workout history with cache-first approach
 */
export class HistoryCacheService {
  private cacheService = universalNDKCacheService;

  /**
   * Load workout history with cache-first strategy
   */
  async loadWorkoutHistory(userPubkey: string, limit: number = 50): Promise<NDKEvent[]> {
    console.log('[HistoryCacheService] Loading workout history with cache-first strategy');
    
    const filters: NDKFilter[] = [{
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number], // Workout records
      authors: [userPubkey],
      limit
    }];

    return this.cacheService.fetchCacheFirst(filters, { timeout: 5000 });
  }

  /**
   * Get offline workout count
   */
  async getOfflineWorkoutCount(userPubkey: string): Promise<number> {
    const availability = await this.cacheService.checkCacheAvailability([{
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number],
      authors: [userPubkey]
    }]);

    return availability.count;
  }
}

/**
 * Discovery Cache Service
 * Optimized for social discovery with parallel fetching
 */
export class DiscoveryCacheService {
  private cacheService = universalNDKCacheService;

  /**
   * Load discovery content with parallel strategy for freshness
   */
  async loadDiscoveryContent(filters: NDKFilter[]): Promise<NDKEvent[]> {
    console.log('[DiscoveryCacheService] Loading discovery content with parallel strategy');
    
    // Use parallel strategy to get both cached and fresh content
    return this.cacheService.fetchParallel(filters, { timeout: 8000 });
  }

  /**
   * Load social feed with smart strategy
   */
  async loadSocialFeed(filters: NDKFilter[]): Promise<NDKEvent[]> {
    console.log('[DiscoveryCacheService] Loading social feed with smart strategy');
    
    return this.cacheService.fetchSmart(filters, { timeout: 6000 });
  }
}

/**
 * NADDR Resolution Service
 * Handles addressable event fetching using NDK's built-in NADDR capabilities
 * Following .clinerules/ndk-best-practices.md - direct NDK methods through service layer
 */
export class NDDRResolutionService {
  private cacheService = universalNDKCacheService;

  /**
   * Fetch event by NADDR string using NDK's built-in parsing
   * NDK handles NADDR parsing and relay hints automatically
   */
  async fetchByNaddr(
    naddr: string, 
    options: CacheOptions = {}
  ): Promise<NDKEvent | null> {
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    const startTime = Date.now();
    console.log(`[NDDRResolutionService] Fetching event by NADDR: ${naddr.substring(0, 20)}...`);

    try {
      const {
        cacheUsage = NDKSubscriptionCacheUsage.CACHE_FIRST,
        timeout = 10000
      } = options;

      // Use NDK's built-in fetchEvent method - handles NADDR parsing internally
      const eventPromise = ndk.fetchEvent(naddr, { cacheUsage });
      
      const event = await Promise.race([
        eventPromise,
        new Promise<NDKEvent | null>((_, reject) => 
          setTimeout(() => reject(new Error('NADDR fetch timeout')), timeout)
        )
      ]);

      const fetchTime = Date.now() - startTime;
      
      if (event) {
        console.log(`[NDDRResolutionService] ✅ Resolved NADDR in ${fetchTime}ms - Kind: ${event.kind}, ID: ${event.id?.substring(0, 8)}...`);
      } else {
        console.log(`[NDDRResolutionService] ⚠️ NADDR not found after ${fetchTime}ms`);
      }
      
      return event;
    } catch (error) {
      const fetchTime = Date.now() - startTime;
      console.error(`[NDDRResolutionService] ❌ NADDR fetch failed after ${fetchTime}ms:`, error);
      return null;
    }
  }

  /**
   * Batch resolve multiple NADDR references efficiently
   * Useful for resolving exercise references in workout templates
   */
  async batchResolveNaddrs(
    naddrs: string[],
    options: CacheOptions = {}
  ): Promise<(NDKEvent | null)[]> {
    if (naddrs.length === 0) return [];
    
    console.log(`[NDDRResolutionService] Batch resolving ${naddrs.length} NADDR references`);
    
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(
        naddrs.map(naddr => this.fetchByNaddr(naddr, options))
      );
      
      const totalTime = Date.now() - startTime;
      const successCount = results.filter(result => result !== null).length;
      
      console.log(`[NDDRResolutionService] ✅ Batch resolved ${successCount}/${naddrs.length} NADDRs in ${totalTime}ms`);
      
      return results;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[NDDRResolutionService] ❌ Batch NADDR resolution failed after ${totalTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Resolve exercise template by NADDR with cache-first strategy
   * Optimized for exercise library browsing
   */
  async resolveExerciseTemplate(naddr: string): Promise<NDKEvent | null> {
    console.log(`[NDDRResolutionService] Resolving exercise template: ${naddr.substring(0, 20)}...`);
    
    return this.fetchByNaddr(naddr, { 
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      timeout: 8000
    });
  }

  /**
   * Resolve workout template by NADDR with cache-first strategy
   * Optimized for workout template browsing
   */
  async resolveWorkoutTemplate(naddr: string): Promise<NDKEvent | null> {
    console.log(`[NDDRResolutionService] Resolving workout template: ${naddr.substring(0, 20)}...`);
    
    return this.fetchByNaddr(naddr, { 
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      timeout: 8000
    });
  }

  /**
   * Resolve collection item by NADDR with parallel strategy
   * Optimized for collection browsing with real-time updates
   */
  async resolveCollectionItem(naddr: string): Promise<NDKEvent | null> {
    console.log(`[NDDRResolutionService] Resolving collection item: ${naddr.substring(0, 20)}...`);
    
    return this.fetchByNaddr(naddr, { 
      cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
      timeout: 6000
    });
  }

  /**
   * Check if NADDR is available in cache without network request
   * Useful for determining offline availability
   */
  async checkNaddrCacheAvailability(naddr: string): Promise<{
    available: boolean;
    event: NDKEvent | null;
  }> {
    try {
      const event = await this.fetchByNaddr(naddr, { 
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
        timeout: 1000
      });
      
      return {
        available: event !== null,
        event
      };
    } catch (error) {
      console.warn(`[NDDRResolutionService] Cache availability check failed for NADDR:`, error);
      return {
        available: false,
        event: null
      };
    }
  }

  /**
   * Smart NADDR resolution that adapts to network conditions
   * Uses cache-first when offline, parallel when online
   */
  async resolveNaddrSmart(naddr: string): Promise<NDKEvent | null> {
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      console.log(`[NDDRResolutionService] 🔌 Network offline - using cache only for NADDR`);
      return this.fetchByNaddr(naddr, { 
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE 
      });
    }

    // Check cache availability first
    const cacheCheck = await this.checkNaddrCacheAvailability(naddr);
    
    if (cacheCheck.available) {
      console.log(`[NDDRResolutionService] 📦 NADDR cached - using cache-first strategy`);
      return this.fetchByNaddr(naddr, { 
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST 
      });
    } else {
      console.log(`[NDDRResolutionService] 🌐 NADDR not cached - fetching from relays`);
      return this.fetchByNaddr(naddr, { 
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY 
      });
    }
  }
}

// Export NADDR resolution service singleton
export const naddrResolutionService = new NDDRResolutionService();

// Export tab-specific services
export const libraryCacheService = new LibraryCacheService();
export const historyCacheService = new HistoryCacheService();
export const discoveryCacheService = new DiscoveryCacheService();
