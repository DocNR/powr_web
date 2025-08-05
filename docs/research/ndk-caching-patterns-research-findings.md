# NDK Caching Patterns Research Findings

## Overview
Research conducted on NDK source code to identify proven caching patterns that can inform our universal caching architecture implementation. This research focuses on how NDK internally handles different cache strategies and provides insights for our singleton-based approach.

## Key NDK Caching Patterns Discovered

### 1. **NDK Cache Strategy Enum (Core Pattern)**
```typescript
// From: ndk-core/src/subscription/index.ts
export enum NDKSubscriptionCacheUsage {
    // Only use cache, don't subscribe to relays
    ONLY_CACHE = "ONLY_CACHE",
    
    // Use cache, if no matches, use relays
    CACHE_FIRST = "CACHE_FIRST",
    
    // Use cache in addition to relays
    PARALLEL = "PARALLEL",
    
    // Only use relays, skip cache entirely
    ONLY_RELAY = "ONLY_RELAY"
}
```

**Key Insight**: NDK has a comprehensive cache strategy system that exactly matches our needs. The `ONLY_CACHE` vs `CACHE_FIRST` distinction is precisely what our task addresses.

### 2. **NDK Internal Cache Decision Logic**
```typescript
// From: ndk-core/src/subscription/index.ts
private shouldQueryCache(): boolean {
    if (this.opts.addSinceFromCache) return true;
    
    // explicitly told to not query the cache
    if (this.opts?.cacheUsage === NDKSubscriptionCacheUsage.ONLY_RELAY) return false;
    
    const hasNonEphemeralKind = this.filters.some((f) =>
        f.kinds?.some((k) => kindIsEphemeral(k))
    );
    
    return true;
}

private shouldQueryRelays(): boolean {
    return this.opts?.cacheUsage !== NDKSubscriptionCacheUsage.ONLY_CACHE;
}

private shouldWaitForCache(): boolean {
    if (this.opts.addSinceFromCache) return true;
    
    return (
        // If the cache adapter supports locking
        !!this.ndk.cacheAdapter?.locking &&
        // If explicitly told to run in parallel, then
        // we should not wait for the cache
        this.opts.cacheUsage !== NDKSubscriptionCacheUsage.PARALLEL
    );
}
```

**Key Insight**: NDK uses simple boolean logic to determine cache vs relay behavior. Our service can adopt this exact pattern.

### 3. **NDK Cache Execution Flow**
```typescript
// From: ndk-core/src/subscription/index.ts
const loadFromRelays = () => {
    if (this.shouldQueryRelays()) {
        this.startWithRelays();
        this.startPoolMonitor();
    } else {
        this.emit("eose");
    }
};

if (this.shouldQueryCache()) {
    cacheResult = this.startWithCache();
    
    if (cacheResult instanceof Promise) {
        // The cache is asynchronous
        if (this.shouldWaitForCache()) {
            // If we need to wait for it
            cacheResult.then((events) => {
                // load the results into the subscription state
                this.processEvents(events);
                loadFromRelays();
            });
        } else {
            // Load from relays in parallel
            loadFromRelays();
        }
    } else {
        // The cache is synchronous
        this.processEvents(cacheResult);
        loadFromRelays();
    }
} else {
    loadFromRelays();
}

private startWithCache(): NDKEvent[] | Promise<NDKEvent[]> {
    if (this.ndk.cacheAdapter?.query) {
        return this.ndk.cacheAdapter.query(this);
    }
}
```

**Key Insight**: NDK handles both sync and async cache operations gracefully, with clear separation between cache and relay phases.

### 4. **useObserver Hook Pattern (Most Relevant)**
```typescript
// From: ndk-hooks/src/observer/hooks/index.ts
/**
 * - **Cache First:** Prioritizes fetching events synchronously from the NDK cache (`cacheUsage: ONLY_CACHE` by default).
 * - **Deduplication:** Ensures each unique event (based on `event.tagId()`) is added only once.
 * - **Buffering:** Asynchronous events received from relays are buffered for a short period (50ms)
 *   to batch updates and reduce re-renders. Synchronous events from the cache are flushed immediately.
 */
export function useObserver<T extends NDKEvent>(
    filters: NDKFilter[] | false,
    opts: NDKSubscriptionOptions = {},
    dependencies: unknown[] = []
): T[] {
    // Default to ONLY_CACHE for observer pattern
    const defaultOpts = {
        skipVerification: true,
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
        groupable: false,
        subId: 'observer-hook',
        wrap: true,
        ...opts
    };
}
```

**Key Insight**: The `useObserver` hook defaults to `ONLY_CACHE` and is designed for cache-first scenarios - exactly what we need for offline-first functionality.

### 5. **NDK Default Cache Strategy**
```typescript
// From: ndk-core/src/subscription/index.ts
export const defaultOpts: NDKSubscriptionOptions = {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    dontSaveToCache: false,
    groupable: true,
    groupableDelay: 100,
};
```

**Key Insight**: NDK defaults to `CACHE_FIRST`, which explains why our `DependencyResolutionService.fetchEventsOptimized()` still attempts network connections.

## Patterns We Can Adopt

### 1. **Cache Strategy Parameter Pattern**
```typescript
// Adopt NDK's exact enum for consistency
export enum CacheStrategy {
    ONLY_CACHE = "ONLY_CACHE",
    CACHE_FIRST = "CACHE_FIRST", 
    PARALLEL = "PARALLEL",
    ONLY_RELAY = "ONLY_RELAY"
}

// Use in our service methods
async fetchEventsOptimized(
    filters: NDKFilter[],
    cacheStrategy: CacheStrategy = CacheStrategy.CACHE_FIRST
): Promise<NDKEvent[]> {
    // Implementation follows NDK patterns
}
```

### 2. **Decision Logic Pattern**
```typescript
// Adopt NDK's boolean decision methods
private shouldQueryCache(strategy: CacheStrategy): boolean {
    return strategy !== CacheStrategy.ONLY_RELAY;
}

private shouldQueryRelays(strategy: CacheStrategy): boolean {
    return strategy !== CacheStrategy.ONLY_CACHE;
}

private shouldWaitForCache(strategy: CacheStrategy): boolean {
    return strategy === CacheStrategy.CACHE_FIRST;
}
```

### 3. **Execution Flow Pattern**
```typescript
// Adopt NDK's cache-then-relay flow
async fetchWithStrategy(filters: NDKFilter[], strategy: CacheStrategy): Promise<NDKEvent[]> {
    let cacheResults: NDKEvent[] = [];
    
    if (this.shouldQueryCache(strategy)) {
        cacheResults = await this.queryCache(filters);
    }
    
    if (this.shouldQueryRelays(strategy)) {
        if (strategy === CacheStrategy.CACHE_FIRST && cacheResults.length > 0) {
            // Cache hit - return cache results
            return cacheResults;
        }
        
        // Query relays
        const relayResults = await this.queryRelays(filters);
        
        if (strategy === CacheStrategy.PARALLEL) {
            // Merge and deduplicate
            return this.mergeAndDeduplicate(cacheResults, relayResults);
        }
        
        return relayResults;
    }
    
    return cacheResults;
}
```

### 4. **Service Integration Pattern**
```typescript
// Create a universal cache service that mirrors NDK patterns
export class UniversalNDKCacheService {
    constructor(private ndk: NDK) {}
    
    // Mirror NDK's subscription options
    async fetchEvents(
        filters: NDKFilter[],
        options: {
            cacheStrategy?: CacheStrategy;
            timeout?: number;
            maxResults?: number;
        } = {}
    ): Promise<NDKEvent[]> {
        const strategy = options.cacheStrategy ?? CacheStrategy.CACHE_FIRST;
        return this.fetchWithStrategy(filters, strategy);
    }
    
    // Specific methods for common patterns
    async fetchFromCacheOnly(filters: NDKFilter[]): Promise<NDKEvent[]> {
        return this.fetchEvents(filters, { cacheStrategy: CacheStrategy.ONLY_CACHE });
    }
    
    async fetchCacheFirst(filters: NDKFilter[]): Promise<NDKEvent[]> {
        return this.fetchEvents(filters, { cacheStrategy: CacheStrategy.CACHE_FIRST });
    }
}
```

## Implementation Recommendations

### 1. **Leverage NDK's Proven Patterns**
- Use NDK's exact `NDKSubscriptionCacheUsage` enum instead of creating our own
- Adopt NDK's boolean decision logic (`shouldQueryCache`, `shouldQueryRelays`)
- Follow NDK's cache-then-relay execution flow

### 2. **Service Architecture Alignment**
- Create service methods that accept `cacheUsage` parameter
- Default to `CACHE_FIRST` for backward compatibility
- Provide convenience methods for `ONLY_CACHE` scenarios

### 3. **Integration Points**
- Update `DependencyResolutionService.fetchEventsOptimized()` to accept cache strategy
- Create wrapper methods for common offline-first patterns
- Maintain existing service interfaces while adding cache strategy options

### 4. **Performance Optimizations**
- Use NDK's deduplication patterns (`event.tagId()`)
- Implement NDK's buffering approach for batch updates
- Follow NDK's synchronous cache preference where possible

## Code Examples from NDK

### Cache Adapter Query Pattern
```typescript
// From: ndk-core/src/subscription/index.ts
private startWithCache(): NDKEvent[] | Promise<NDKEvent[]> {
    if (this.ndk.cacheAdapter?.query) {
        return this.ndk.cacheAdapter.query(this);
    }
}
```

### User Profile Cache Pattern
```typescript
// From: ndk-core/src/user/index.ts
// Default to ONLY_RELAY for profile fetching
opts.cacheUsage ??= NDKSubscriptionCacheUsage.ONLY_RELAY;
opts.closeOnEose ??= true;
opts.groupable ??= true;
opts.groupableDelay ??= 250;
```

### Relay List Cache Pattern
```typescript
// From: ndk-core/src/utils/get-users-relay-list.ts
if (ndk.cacheAdapter?.locking && !skipCache) {
    const cachedList = await ndk.fetchEvents(
        { kinds: [3, 10002], authors: Array.from(new Set(pubkeys)) },
        { cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE, subId: "ndk-relay-list-fetch" }
    );
}
```

## Conclusion

NDK provides a comprehensive, battle-tested caching architecture that perfectly aligns with our needs. The key insights are:

1. **Use NDK's existing `NDKSubscriptionCacheUsage` enum** - don't reinvent the wheel
2. **Follow NDK's boolean decision logic** - simple and effective
3. **Adopt NDK's cache-then-relay execution flow** - proven pattern
4. **Leverage NDK's deduplication and buffering strategies** - performance optimized

Our universal caching service should be a thin wrapper around NDK's existing patterns, providing convenience methods while maintaining full compatibility with NDK's proven architecture.

The critical fix for our `DependencyResolutionService.fetchEventsOptimized()` is simply changing the hardcoded `CACHE_FIRST` to accept a `cacheUsage` parameter, allowing callers to specify `ONLY_CACHE` for true offline functionality.

---

**Research Date**: 2025-08-04
**NDK Version**: Latest from repo-explorer
**Key Files Analyzed**:
- `ndk-core/src/subscription/index.ts` - Core cache logic
- `ndk-hooks/src/observer/hooks/index.ts` - Observer pattern
- `ndk-core/src/user/index.ts` - Profile caching
- `ndk-core/src/utils/get-users-relay-list.ts` - Relay list caching
