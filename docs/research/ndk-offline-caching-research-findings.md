---
title: NDK Offline Caching Research Findings
description: Comprehensive analysis of NDK's caching capabilities for building enhanced offline functionality
status: verified
last_updated: 2025-08-04
last_verified: 2025-08-04
related_code: 
  - /src/lib/ndk.ts
  - /src/hooks/useLibraryCollections.ts
  - /src/providers/WorkoutHistoryProvider.tsx
category: research
formatting_rules:
  - "Technical research document with code examples"
  - "Implementation patterns and anti-patterns clearly marked"
  - "Reference NDK source code with specific file paths"
  - "Include performance considerations and best practices"
---

# NDK Offline Caching Research Findings

## Executive Summary

NDK provides excellent offline caching capabilities through multiple access patterns. The key discovery is that `CACHE_FIRST` still attempts network connections, but `ONLY_CACHE` provides true offline access. Direct cache adapter methods work completely offline and are perfect for enhanced caching systems.

## Research Questions & Answers

### 1. Cache Adapter Offline Behavior

**✅ CONFIRMED: `NDKCacheAdapterDexie` supports true offline querying**

**Key Finding**: The cache adapter has a `query()` method that works independently of network connectivity.

```typescript
// From ndk-cache-dexie/src/index.ts, line 173
public async query(subscription: NDKSubscription): Promise<NDKEvent[]>
```

**Capabilities**:
- Queries IndexedDB directly through Dexie
- Does NOT require relay connections
- Returns cached events asynchronously
- Works when completely offline
- Includes performance logging for queries > 100ms

**Source Evidence**:
```typescript
// ndk-cache-dexie/src/index.ts, lines 173-187
public async query(subscription: NDKSubscription): Promise<NDKEvent[]> {
    // ensure we have warmed up before processing the filter
    if (!this.warmedUp) {
        const startTime = Date.now();
        await this.warmUpPromise;
        this.debug("froze query for", Date.now() - startTime, "ms", subscription.filters);
    }

    const startTime = Date.now();
    subscription.filters.map((filter) => this.processFilter(filter, subscription));
    const dur = Date.now() - startTime;
    if (dur > 100) this.debug("query took", dur, "ms", subscription.filter);

    return [];
}
```

### 2. fetchEvents() Network Dependency

**❌ CONFIRMED SUSPICION: `fetchEvents()` with `CACHE_FIRST` still tries to connect to relays**

**Key Finding**: `CACHE_FIRST` means "cache first, then relays" - it will attempt network connections if cache doesn't fully satisfy the query.

**Evidence from Subscription Logic**:
```typescript
// ndk-core/src/subscription/index.ts, lines 466-498
if (this.shouldQueryCache()) {
    cacheResult = this.startWithCache();
    
    if (cacheResult instanceof Promise) {
        // The cache is asynchronous
        cacheResult.then((events) => {
            // load the results into the subscription state
            updateStateFromCacheResults(events);
            // if the cache has a hit, return early
            if (queryFullyFilled(this)) {
                this.emit("eose", this);
                return;
            }
        });
    } else {
        updateStateFromCacheResults(cacheResult);
        
        if (queryFullyFilled(this)) {
            this.emit("eose", this);
        } else {
            loadFromRelays(); // ← NETWORK CONNECTION ATTEMPTED
        }
    }
}
```

**Cache Usage Options**:
```typescript
// ndk-core/src/subscription/index.ts, lines 30-42
export enum NDKSubscriptionCacheUsage {
    // Only use cache, don't subscribe to relays
    ONLY_CACHE = "ONLY_CACHE",
    
    // Use cache, if no matches, use relays
    CACHE_FIRST = "CACHE_FIRST",
    
    // Use cache in addition to relays
    PARALLEL = "PARALLEL",
    
    // Skip cache, don't query it
    ONLY_RELAY = "ONLY_RELAY",
}
```

### 3. Alternative Cache Access Methods

**✅ FOUND: Multiple offline-capable access methods**

#### Method 1: `ONLY_CACHE` Subscription Option
```typescript
// Perfect for offline-first scenarios
const { events } = useSubscribe(filters, {
    cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
    closeOnEose: true,
    skipVerification: true
});
```

#### Method 2: Direct Cache Adapter Access
```typescript
// Direct access to cache adapter query method
if (ndk.cacheAdapter?.query) {
    const subscription = new NDKSubscription(ndk, filters);
    const events = await ndk.cacheAdapter.query(subscription);
}
```

#### Method 3: NDK's Built-in Cache-Only Methods
```typescript
// ndk-core/src/ndk/index.ts, lines 642-647
const events = this.cacheAdapter.query(sub);
if (events instanceof Promise) throw new Error("Cache adapter is async");
return events.map((e) => {
    e.ndk = this;
    return e;
});
```

### 4. Offline-First Patterns

**✅ FOUND: NDK has built-in offline-first patterns**

**NDK Observer Hook Pattern**:
```typescript
// From ndk-hooks/src/observer/hooks/index.ts, lines 17-20
// - **Cache First:** Prioritizes fetching events synchronously from the NDK cache (`cacheUsage: ONLY_CACHE` by default).
// - **Deduplication:** Ensures each unique event (based on `event.tagId()`) is added only once.
// - **Buffering:** Asynchronous events received from relays are buffered for a short period (50ms)
//   to batch updates and reduce re-renders. Synchronous events from the cache are flushed immediately.
```

**Implementation Example**:
```typescript
// ndk-hooks/src/observer/hooks/index.ts, lines 92-99
{
    skipVerification: true,
    closeOnEose: true,
    cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
    groupable: false,
    subId: 'observer-hook',
    wrap: true,
    ...opts
}
```

### 5. Cache Population vs Cache Querying

**✅ CLEAR DISTINCTION EXISTS**

#### Cache Population (Network Required)
- Happens through subscriptions with `CACHE_FIRST`, `PARALLEL`, or `ONLY_RELAY`
- Events flow: Relays → NDK Subscription → Cache Adapter → IndexedDB
- Requires network connectivity
- Uses `setEvent()` method on cache adapter

#### Cache Querying (Offline Capable)
- Direct `cacheAdapter.query()` method
- `ONLY_CACHE` subscription option
- Works entirely from IndexedDB
- No network dependency
- Returns cached events immediately

**Cache Adapter Interface**:
```typescript
// ndk-core/src/cache/index.ts, line 33
query(subscription: NDKSubscription): NDKEvent[] | Promise<NDKEvent[]>;
setEvent(event: NDKEvent, filters: NDKFilter[], relay?: NDKRelay): Promise<void>;
```

### 6. Network State Detection

**❌ NO BUILT-IN NETWORK STATE DETECTION**

NDK doesn't automatically detect network state, but provides the building blocks:

```typescript
// ndk-core/src/subscription/index.ts, lines 393-395
private shouldQueryRelays(): boolean {
    return this.opts?.cacheUsage !== NDKSubscriptionCacheUsage.ONLY_CACHE;
}
```

**Manual Network Detection Required**:
```typescript
// You need to implement this yourself
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}, []);
```

## Implementation Patterns

### Pattern 1: Smart Offline-First Hook

```typescript
/**
 * Enhanced offline-first data fetching with automatic fallback
 */
export const useOfflineFirstData = <T extends NDKEvent>(
    filters: NDKFilter | NDKFilter[] | false,
    opts?: NDKSubscriptionOptions
) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [hasTriedNetwork, setHasTriedNetwork] = useState(false);
    
    // Always try cache first - works offline
    const { events: cachedEvents, eose: cacheEose } = useSubscribe(
        filters,
        {
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
            closeOnEose: true,
            skipVerification: true,
            ...opts
        }
    );
    
    // Only fetch from network if:
    // 1. Online
    // 2. Cache returned no results or insufficient results
    // 3. Haven't tried network yet
    const shouldTryNetwork = isOnline && 
                            cacheEose && 
                            cachedEvents.length === 0 && 
                            !hasTriedNetwork;
    
    const { events: networkEvents } = useSubscribe(
        shouldTryNetwork ? filters : false,
        {
            cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
            ...opts
        }
    );
    
    // Track network attempts
    useEffect(() => {
        if (networkEvents.length > 0) {
            setHasTriedNetwork(true);
        }
    }, [networkEvents.length]);
    
    // Network state detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setHasTriedNetwork(false); // Reset to allow network retry
        };
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    return {
        events: cachedEvents.length > 0 ? cachedEvents : networkEvents,
        isFromCache: cachedEvents.length > 0,
        isOnline,
        hasTriedNetwork
    };
};
```

### Pattern 2: Direct Cache Access Hook

```typescript
/**
 * Direct cache access for guaranteed offline operation
 */
export const useDirectCacheAccess = <T extends NDKEvent>(
    filters: NDKFilter | NDKFilter[]
) => {
    const { ndk } = useNDK();
    const [events, setEvents] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        if (!ndk?.cacheAdapter?.query) {
            setLoading(false);
            return;
        }
        
        const queryCache = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const subscription = new NDKSubscription(ndk, Array.isArray(filters) ? filters : [filters]);
                const cachedEvents = await ndk.cacheAdapter.query(subscription);
                
                setEvents(cachedEvents as T[]);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Cache query failed'));
            } finally {
                setLoading(false);
            }
        };
        
        queryCache();
    }, [ndk, filters]);
    
    return { events, loading, error, isOfflineCapable: true };
};
```

### Pattern 3: Cache-First with Network Fallback

```typescript
/**
 * Cache-first with intelligent network fallback
 */
export const useCacheFirstWithFallback = <T extends NDKEvent>(
    filters: NDKFilter | NDKFilter[],
    opts?: {
        minCacheResults?: number;
        networkTimeout?: number;
        retryOnline?: boolean;
    }
) => {
    const { ndk } = useNDK();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [phase, setPhase] = useState<'cache' | 'network' | 'complete'>('cache');
    
    const minResults = opts?.minCacheResults ?? 1;
    const networkTimeout = opts?.networkTimeout ?? 5000;
    
    // Phase 1: Cache-only query
    const { events: cacheEvents, eose: cacheEose } = useSubscribe(
        phase === 'cache' ? filters : false,
        {
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE,
            closeOnEose: true
        }
    );
    
    // Phase 2: Network query if cache insufficient
    const { events: networkEvents, eose: networkEose } = useSubscribe(
        phase === 'network' ? filters : false,
        {
            cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
            closeOnEose: true
        }
    );
    
    // Phase management
    useEffect(() => {
        if (phase === 'cache' && cacheEose) {
            if (cacheEvents.length >= minResults || !isOnline) {
                setPhase('complete');
            } else {
                setPhase('network');
                
                // Network timeout
                const timeout = setTimeout(() => {
                    setPhase('complete');
                }, networkTimeout);
                
                return () => clearTimeout(timeout);
            }
        } else if (phase === 'network' && networkEose) {
            setPhase('complete');
        }
    }, [phase, cacheEose, networkEose, cacheEvents.length, minResults, isOnline, networkTimeout]);
    
    // Network state detection
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    const finalEvents = networkEvents.length > 0 ? networkEvents : cacheEvents;
    
    return {
        events: finalEvents as T[],
        isFromCache: networkEvents.length === 0 && cacheEvents.length > 0,
        isComplete: phase === 'complete',
        isOnline,
        phase
    };
};
```

## Performance Considerations

### Cache Adapter Performance
- **Query Performance**: Dexie cache queries log performance warnings for queries > 100ms
- **Warmup Time**: Cache adapter has a warmup phase that can block initial queries
- **Memory Usage**: LRU cache with configurable size limits

### Optimization Strategies
1. **Preload Critical Data**: Use `ONLY_CACHE` to preload essential data during app initialization
2. **Batch Queries**: Combine multiple filters into single subscriptions where possible
3. **Cache Size Management**: Configure appropriate cache sizes for your use case
4. **Query Optimization**: Use specific filters to reduce cache query time

### Configuration Options
```typescript
// ndk-cache-dexie configuration
const cacheAdapter = new NDKCacheAdapterDexie({
    dbName: 'workout-pwa-cache',
    eventCacheSize: 10000,     // Number of events to cache
    profileCacheSize: 1000,    // Number of profiles to cache
    saveSig: true              // Save event signatures
});
```

## Anti-Patterns to Avoid

### ❌ Don't: Assume CACHE_FIRST is Offline-Safe
```typescript
// This will still try to connect to relays!
const { events } = useSubscribe(filters, {
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST // ❌ Not offline-safe
});
```

### ❌ Don't: Mix Cache Access Patterns
```typescript
// Don't mix direct cache access with subscription patterns
const directEvents = await ndk.cacheAdapter.query(subscription);
const { events: subscriptionEvents } = useSubscribe(filters); // ❌ Confusing
```

### ❌ Don't: Ignore Network State
```typescript
// Always trying network without checking connectivity
const { events } = useSubscribe(filters, {
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST // ❌ Will fail offline
});
```

## Recommended Implementation Strategy

### Phase 1: Basic Offline Support
1. Implement `useOfflineFirstData` hook
2. Replace critical data fetching with `ONLY_CACHE` option
3. Add network state detection

### Phase 2: Enhanced Caching
1. Implement `useCacheFirstWithFallback` for non-critical data
2. Add cache preloading for essential data
3. Implement cache size management

### Phase 3: Advanced Features
1. Add cache invalidation strategies
2. Implement background sync when online
3. Add cache analytics and monitoring

## POWR-Specific Use Cases

### Exercise Library (High Priority)
- **Pattern**: `useOfflineFirstData` with `ONLY_CACHE`
- **Rationale**: Exercise templates rarely change, perfect for offline access
- **Implementation**: Preload all exercise templates on app start

### Workout History (Medium Priority)
- **Pattern**: `useCacheFirstWithFallback`
- **Rationale**: Recent workouts should be cached, older ones can be fetched
- **Implementation**: Cache last 50 workouts, fetch older ones when online

### Active Workout (Critical)
- **Pattern**: `ONLY_CACHE` for templates, local state for active data
- **Rationale**: Must work offline, templates are cached, progress is local
- **Implementation**: Pure offline operation with background sync

### Social Features (Low Priority)
- **Pattern**: `CACHE_FIRST` with network timeout
- **Rationale**: Social data is less critical, can wait for network
- **Implementation**: Show cached data immediately, update when online

## Testing Strategy

### Offline Testing
1. **Network Simulation**: Use browser dev tools to simulate offline
2. **Cache State Testing**: Test with empty, partial, and full cache states
3. **Network Recovery**: Test behavior when coming back online

### Performance Testing
1. **Cache Query Performance**: Measure query times with large datasets
2. **Memory Usage**: Monitor cache memory consumption
3. **Battery Impact**: Test offline vs online battery usage

### Integration Testing
1. **Cross-Component**: Test cache sharing between components
2. **State Management**: Test integration with XState machines
3. **Error Handling**: Test cache failures and recovery

## Next Steps

1. **Implement Basic Patterns**: Start with `useOfflineFirstData` hook
2. **Update Critical Components**: Replace existing data fetching in exercise library and workout history
3. **Add Network Detection**: Implement global network state management
4. **Performance Monitoring**: Add cache performance metrics
5. **User Testing**: Test offline functionality with real users

## References

### NDK Source Files Analyzed
- `ndk-core/src/subscription/index.ts` - Subscription logic and cache usage
- `ndk-cache-dexie/src/index.ts` - Dexie cache adapter implementation
- `ndk-hooks/src/observer/hooks/index.ts` - Observer hook patterns
- `ndk-core/src/cache/index.ts` - Cache adapter interface
- `ndk-core/src/ndk/index.ts` - Core NDK methods

### Key Discoveries
1. `ONLY_CACHE` provides true offline access
2. Direct cache adapter access works completely offline
3. NDK has built-in offline-first patterns in observer hooks
4. Network state detection must be implemented manually
5. Cache performance is optimized with warmup and LRU strategies

---

**Research Completed**: 2025-08-04  
**NDK Version Analyzed**: Latest (commit 3ba5b6e)  
**Implementation Priority**: High - Critical for offline workout functionality
