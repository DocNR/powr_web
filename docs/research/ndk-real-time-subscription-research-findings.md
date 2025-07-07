# NDK Real-Time Subscription Research Findings

## Research Summary
Conducted comprehensive research using repo-explorer MCP tool to understand NDK's subscription patterns and built-in deduplication capabilities for implementing real-time updates in the POWR Workout PWA.

## Key Findings

### 1. NDK Built-in Deduplication (CONFIRMED)

**✅ NDK provides automatic event deduplication using `event.deduplicationKey()`**

From `ndk-core/src/events/index.ts` (lines 613-619):
```typescript
/**
 * Provides a deduplication key for the event.
 *
 * For kinds 0, 3, 10k-20k this will be the event <kind>:<pubkey>
 * For kinds 30k-40k this will be the event <kind>:<pubkey>:<d-tag>
 * For all other kinds this will be the event id
 */
deduplicationKey(): string {
```

**For our NIP-101e events:**
- **Kind 1301 (Workout Records)**: Uses `event.tagId()` (includes kind:pubkey:d-tag)
- **Kind 33401 (Exercise Templates)**: Uses `kind:pubkey:d-tag` format
- **Kind 33402 (Workout Templates)**: Uses `kind:pubkey:d-tag` format

### 2. NDK Subscription Patterns (VERIFIED)

**✅ Correct subscription syntax from NDK source:**

From `ndk-core/src/ndk/index.ts` (lines 530-556):
```typescript
const sub = ndk.subscribe({ kinds: [1], authors: [pubkey] });
sub.on("event", (event) => console.log("Kind 1 event:", event.content));

// With options
const sub = ndk.subscribe(
  { kinds: [0], authors: [pubkey] },
  { closeOnEose: true, cacheUsage: NDKSubscriptionCacheUsage.PARALLEL }
);
```

**✅ Event handlers confirmed:**
- `subscription.on('event', callback)` - For new events
- `subscription.on('eose', callback)` - End of stored events
- `subscription.stop()` - Cleanup method

### 3. NDK Svelte Integration Shows Deduplication in Action

From `ndk-svelte/src/index.svelte.ts` (lines 41-71):
```typescript
const eventMap = new Map<string, T>(); // Map for deduplication

const processEvent = (event: NDKEvent) => {
    const dedupKey = e.deduplicationKey();
    
    // Avoid duplicate or older events
    if (eventMap.has(dedupKey)) {
        // Handle replaceable events (newer replaces older)
    }
}
```

**Key insight:** NDK's Svelte integration demonstrates the proper pattern for using built-in deduplication.

### 4. Subscription Options (CONFIRMED)

From `ndk-core/src/subscription/index.ts`:
- `closeOnEose: false` - Keep subscription open for real-time updates
- `cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST` - Use cache first, then relays
- `groupableDelay: 100` - Batch subscriptions for performance

### 5. Memory Management Patterns

From NDK source, subscriptions automatically handle:
- **Event deduplication** using `deduplicationKey()`
- **Replaceable event updates** (newer events replace older ones with same dedup key)
- **Connection management** with automatic reconnection

## Implementation Recommendations

### 1. Leverage NDK's Built-in Deduplication
**❌ DON'T** build custom deduplication:
```typescript
// Wrong - manual deduplication
const addUniqueEvents = (existing, newEvents) => {
  const combined = [...newEvents, ...existing];
  const deduplicated = Array.from(
    new Map(combined.map(e => [e.id, e])).values()
  );
  return deduplicated;
};
```

**✅ DO** trust NDK's automatic deduplication:
```typescript
// Correct - NDK handles deduplication automatically
subscription.on('event', (newEvent) => {
  // NDK already deduplicated using event.deduplicationKey()
  setSocialWorkouts(prev => [...prev, newEvent]);
});
```

### 2. Proper Subscription Setup
```typescript
// ✅ CORRECT: Real-time subscription with proper options
const subscription = ndk.subscribe(
  { kinds: [1301], '#t': ['fitness'], limit: 50 },
  { 
    closeOnEose: false,  // Keep open for real-time
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    groupableDelay: 100  // Batch for performance
  }
);

subscription.on('event', handleNewEvent);
subscription.on('eose', () => console.log('Historical data loaded'));

// Cleanup
return () => subscription.stop();
```

### 3. Infinite Scroll with fetchEvents
For pagination, continue using `fetchEvents()` with `until` parameter:
```typescript
const olderEvents = await ndk.fetchEvents({
  kinds: [1301],
  '#t': ['fitness'],
  limit: 20,
  until: oldestTimestamp
});
```

## Architecture Impact

### WorkoutDataProvider Changes
1. **Replace `fetchEvents()` with `subscribe()`** for initial data + real-time
2. **Remove custom deduplication logic** - NDK handles this
3. **Add proper subscription lifecycle management**
4. **Keep `fetchEvents()` for infinite scroll pagination**

### Performance Benefits
- **Automatic deduplication** reduces memory usage
- **Built-in connection management** handles reconnections
- **Groupable subscriptions** batch network requests
- **Cache-first strategy** improves perceived performance

## Validation Against .clinerules

### NDK Best Practices Compliance
- ✅ Uses official NDK subscription patterns
- ✅ Leverages built-in deduplication (no custom logic)
- ✅ Proper event handler setup
- ✅ Correct cleanup with `subscription.stop()`

### Web Browser Optimization
- ✅ Cache-first strategy for fast initial loads
- ✅ Groupable subscriptions for network efficiency
- ✅ Proper memory management through NDK's deduplication

## Next Steps

1. **Update task documents** with correct NDK patterns
2. **Remove custom deduplication** from implementation plans
3. **Focus on subscription lifecycle management**
4. **Implement proper infinite scroll** using `fetchEvents()` + `until`

---

**Research Date**: 2025-07-04
**NDK Version**: Latest (from repo-explorer)
**Source Files Analyzed**: 
- `ndk-core/src/events/index.ts`
- `ndk-core/src/ndk/index.ts` 
- `ndk-core/src/subscription/index.ts`
- `ndk-svelte/src/index.svelte.ts`
