# Universal NDK Caching Architecture Implementation Task

## Objective
Fix critical `CACHE_FIRST` vs `ONLY_CACHE` issue in DependencyResolutionService and implement a service-oriented caching architecture that optimizes Library Tab performance while creating reusable patterns for History, Discovery, and other tabs.

## Research Foundation

Based on comprehensive analysis of existing services and new NDK caching patterns research documented in `docs/research/ndk-caching-patterns-research-findings.md`, this task leverages proven NDK patterns for optimal implementation.

### Key NDK Research Insights
- **NDK Cache Strategy Enum**: NDK provides `NDKSubscriptionCacheUsage` with `ONLY_CACHE`, `CACHE_FIRST`, `PARALLEL`, `ONLY_RELAY`
- **NDK Decision Logic**: Simple boolean methods (`shouldQueryCache`, `shouldQueryRelays`, `shouldWaitForCache`)
- **NDK Execution Flow**: Cache-then-relay pattern with graceful sync/async handling
- **useObserver Pattern**: Defaults to `ONLY_CACHE` for cache-first scenarios - exactly what we need
- **NDK Default Strategy**: `CACHE_FIRST` by default, explaining our current network connection attempts

### Current State Analysis

#### ✅ What Works Well (Keep This)
- **DependencyResolutionService Architecture**: Excellent batching patterns, NIP-101e validation, service layer compliance
- **WorkoutDataProvider Real-time**: Perfect NDK subscription patterns for social feed with proper deduplication
- **Library Management**: `useSimpleLibraryOnboarding` and `libraryManagementService` work perfectly
- **Service Layer Patterns**: All services follow `.clinerules/service-layer-architecture.md` correctly

#### 🚨 Critical Issue Identified
**Problem**: `DependencyResolutionService.fetchEventsOptimized()` hardcodes `CACHE_FIRST` which still attempts network connections

```typescript
// CURRENT - PROBLEMATIC (line ~165 in dependencyResolution.ts)
const events = await ndk.fetchEvents(filter, {
  cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,  // Still tries network!
  closeOnEose: true
});
```

**Root Cause**: Based on NDK source code research:
- `CACHE_FIRST` = "Use cache, if no matches, use relays" - attempts network if cache doesn't fully satisfy query
- `ONLY_CACHE` = "Only use cache, don't subscribe to relays" - true offline access

**Impact**: 
- No true offline capability for dependency resolution
- Unnecessary network requests even when cache has data
- Performance degradation from network timeouts

## Technical Approach

### Three-Layer Enhancement Strategy

#### **Layer 1: Fix Core Issue** (DependencyResolutionService)
- **KEEP**: All existing batching logic, validation, and parsing integration
- **ADD**: Cache strategy options to `fetchEventsOptimized` method
- **ENHANCE**: Support both `ONLY_CACHE` and `CACHE_FIRST` based on context

#### **Layer 2: Universal Cache Service** (Strategy Controller)
- **CREATE**: `NDKCacheService` for cache strategy selection and network detection
- **CREATE**: Tab-specific cache services (`LibraryCacheService`, `HistoryCacheService`, etc.)
- **INTEGRATE**: Works WITH existing DependencyResolutionService, not replacing it

#### **Layer 3: Component Integration** (Selective Enhancement)
- **KEEP**: WorkoutDataProvider real-time social subscriptions (no changes)
- **ENHANCE**: Discovery tab with cache-first loading
- **CREATE**: Offline-first hooks for components that need them

## Implementation Steps

### Phase 1: Fix DependencyResolutionService Cache Issue (1-2 hours)

#### 1.1 Enhanced fetchEventsOptimized Method
- [ ] Update `src/lib/services/dependencyResolution.ts`
- [ ] Add cache strategy parameter to `fetchEventsOptimized` method
- [ ] Support both `ONLY_CACHE` and `CACHE_FIRST` modes
- [ ] Maintain all existing batching and validation logic

```typescript
// Enhanced method signature
private async fetchEventsOptimized(
  filter: NDKFilter,
  options: {
    cacheStrategy?: 'ONLY_CACHE' | 'CACHE_FIRST';
    forceOffline?: boolean;
  } = {}
): Promise<Set<NDKEvent>> {
  // Determine cache strategy
  let cacheUsage: NDKSubscriptionCacheUsage;
  if (options.forceOffline || options.cacheStrategy === 'ONLY_CACHE') {
    cacheUsage = NDKSubscriptionCacheUsage.ONLY_CACHE;  // True offline
  } else {
    cacheUsage = NDKSubscriptionCacheUsage.CACHE_FIRST; // Network fallback
  }
  
  console.log('[DependencyResolutionService] Using cache strategy:', cacheUsage);
  
  // Rest of existing logic unchanged
  const events = await ndk.fetchEvents(filter, {
    cacheUsage,
    closeOnEose: true
  });
  
  return events;
}
```

#### 1.2 Add Cache Strategy Methods
- [ ] Add offline-first methods to DependencyResolutionService
- [ ] `resolveTemplateDependenciesOffline()` - Uses `ONLY_CACHE` exclusively
- [ ] `resolveExerciseReferencesOffline()` - Offline-first exercise resolution
- [ ] Update existing methods to accept strategy parameters

#### 1.3 Test Offline Dependency Resolution
- [ ] Create test scenarios for pure offline dependency resolution
- [ ] Verify no network requests with `ONLY_CACHE`
- [ ] Ensure complete dependency chains resolve from cache only

### Phase 2: Universal Cache Service Architecture (2-3 hours)

#### 2.1 Core NDK Cache Service
- [ ] Create `src/lib/services/ndkCacheService.ts`
- [ ] Cache strategy registry (LIVE, CACHE_FIRST, CACHE_ONLY)
- [ ] Network state detection and strategy selection
- [ ] Integration with enhanced DependencyResolutionService

```typescript
// Core service structure
export class NDKCacheService {
  private static cacheStrategies = {
    LIVE: 'LIVE_SUBSCRIPTION',           // Social tab - always live
    CACHE_FIRST: 'CACHE_FIRST',         // Hybrid - cache then network
    CACHE_ONLY: 'ONLY_CACHE'            // Offline-first - cache only
  };

  private static cacheFreshness = {
    EXERCISE_DATABASE: 7 * 24 * 60 * 60 * 1000,  // 7 days
    LIBRARY_COLLECTIONS: 24 * 60 * 60 * 1000,    // 24 hours  
    DISCOVERY_TEMPLATES: 6 * 60 * 60 * 1000,     // 6 hours
    WORKOUT_HISTORY: 1 * 60 * 60 * 1000          // 1 hour
  };

  static async getDataWithCaching<T>(
    filters: NDKFilter[],
    options: {
      cacheKey: string;
      cacheFreshnessType: keyof typeof NDKCacheService.cacheFreshness;
      resolveFunction: (filters: NDKFilter[], cacheOptions?: any) => Promise<T[]>;
    }
  ): Promise<{ data: T[]; isFromCache: boolean; cacheAge: number }> {
    // Strategy decision logic using network state and cache age
  }
}
```

#### 2.2 Tab-Specific Cache Services
- [ ] Create `src/lib/services/libraryCacheService.ts`
  - Library collections with 24h cache freshness
  - Integration with existing `libraryManagementService`
  - Uses enhanced DependencyResolutionService for resolution

- [ ] Create `src/lib/services/historyCacheService.ts`
  - Workout history (Kind 1301) with 1h cache freshness
  - Integration with `workoutAnalyticsService` parsing
  - User-specific history cache management

- [ ] Create `src/lib/services/exerciseCacheService.ts`
  - Exercise definitions (Kind 33401) with 7-day cache
  - Offline-first using `ONLY_CACHE`
  - Global exercise cache shared across tabs

#### 2.3 Universal Cache Hook
- [ ] Create `src/hooks/useNDKDataWithCaching.ts`
- [ ] Generic hook that works with any cache service
- [ ] Automatic strategy selection based on data type and network state
- [ ] Loading states and error management

### Phase 3: Integration and Enhancement (1-2 hours)

#### 3.1 WorkoutDataProvider Cache Integration
- [ ] Update `src/providers/WorkoutDataProvider.tsx`
- [ ] **KEEP**: Social tab real-time WebSocket subscriptions (no changes)
- [ ] **ENHANCE**: Discovery tab with cache service for initial load
- [ ] **ADD**: Cache-first loading for discovery templates
- [ ] **MAINTAIN**: Existing live update functionality

```typescript
// Enhanced discovery subscription setup
const setupDiscoverySubscription = useCallback((limit: number) => {
  const loadDiscoveryData = async () => {
    try {
      // Try cache first for instant loading
      const cached = await discoveryCacheService.getTemplates();
      if (cached.isFromCache && cached.data.length > 0) {
        setDiscoveryEvents(cached.data);
        console.log('[WorkoutDataProvider] Loaded discovery from cache');
      }
    } catch (error) {
      console.warn('[WorkoutDataProvider] Cache failed, using live subscription');
    }

    // Always setup live subscription for updates (existing logic unchanged)
    const subscription = ndk.subscribe(filters);
    // ... existing live update logic
  };

  loadDiscoveryData();
});
```

#### 3.2 Library Tab Cache Service Integration
- [ ] Update `src/hooks/useLibraryCollections.ts`
- [ ] Integrate `libraryCacheService` for collection loading
- [ ] Use enhanced DependencyResolutionService for resolution
- [ ] **MAINTAIN**: Existing onboarding behavior for first-time users

#### 3.3 Cross-Tab Cache Coordination
- [ ] Implement shared exercise definition cache across all tabs
- [ ] Cross-tab cache invalidation when user makes changes
- [ ] Memory-efficient cache management

### Phase 4: Testing and Validation (1-2 hours)

#### 4.1 Offline Functionality Testing
- [ ] Test complete offline dependency resolution
- [ ] Verify `ONLY_CACHE` prevents network requests
- [ ] Test cache hit performance (target: sub-100ms)
- [ ] Validate offline workout template loading

#### 4.2 Integration Testing
- [ ] Test Library onboarding with cache integration
- [ ] Verify Discovery tab cache + live updates
- [ ] Test cross-tab cache sharing
- [ ] Validate WorkoutDataProvider social feed unchanged

#### 4.3 Performance Monitoring
- [ ] Implement cache hit rate tracking
- [ ] Monitor load time improvements
- [ ] Validate network request reduction
- [ ] Test memory usage efficiency

## Service Architecture Examples

### Enhanced DependencyResolutionService
```typescript
// src/lib/services/dependencyResolution.ts - Enhanced
export class DependencyResolutionService {
  // New offline-first methods
  async resolveTemplateDependenciesOffline(templateRefs: string[]): Promise<WorkoutTemplate[]> {
    console.log('[DependencyResolutionService] Resolving templates offline-first');
    return this.resolveTemplateDependenciesWithStrategy(templateRefs, { forceOffline: true });
  }

  async resolveTemplateDependenciesHybrid(templateRefs: string[]): Promise<WorkoutTemplate[]> {
    console.log('[DependencyResolutionService] Resolving templates with network fallback');
    return this.resolveTemplateDependenciesWithStrategy(templateRefs, { cacheStrategy: 'CACHE_FIRST' });
  }

  private async resolveTemplateDependenciesWithStrategy(
    templateRefs: string[], 
    options: { forceOffline?: boolean; cacheStrategy?: string } = {}
  ): Promise<WorkoutTemplate[]> {
    // Use enhanced fetchEventsOptimized with strategy options
    // All existing batching logic preserved
  }
}
```

### Tab-Specific Cache Service
```typescript
// src/lib/services/libraryCacheService.ts
export class LibraryCacheService {
  static async getCollections(userPubkey: string) {
    return NDKCacheService.getDataWithCaching(
      [{ kinds: [30003], authors: [userPubkey] }],
      {
        cacheKey: `library-${userPubkey}`,
        cacheFreshnessType: 'LIBRARY_COLLECTIONS',
        resolveFunction: async (filters, cacheOptions) => {
          // Use enhanced DependencyResolutionService
          return dependencyResolutionService.resolveCollectionsWithStrategy(filters, cacheOptions);
        }
      }
    );
  }
}
```

## Success Criteria

### Functional Requirements
- [ ] **DependencyResolutionService Fixed**: Uses proper NDK cache modes (`ONLY_CACHE` vs `CACHE_FIRST`)
- [ ] **True Offline Capability**: All cached tabs work completely offline with `ONLY_CACHE`
- [ ] **Library Onboarding Unchanged**: Existing onboarding flow works identically
- [ ] **Social Tab Performance**: Real-time social feed maintains current performance
- [ ] **Cross-Tab Cache Sharing**: Exercise definitions cached once, used everywhere

### Performance Requirements
- [ ] **Offline Dependency Resolution**: Sub-100ms for cached dependency chains
- [ ] **Cache Hit Performance**: Sub-100ms load times for cached content
- [ ] **Network Reduction**: 70%+ reduction in network requests for returning users
- [ ] **Memory Efficiency**: No significant memory usage increase

### Architecture Requirements
- [ ] **Service Layer Compliance**: Follows `.clinerules/service-layer-architecture.md` patterns
- [ ] **NDK Cache Modes**: Proper use of `ONLY_CACHE` for offline, `CACHE_FIRST` for hybrid
- [ ] **Integration Pattern**: Universal cache service works WITH DependencyResolutionService
- [ ] **Error Handling**: Graceful degradation when cache fails

## Critical Issues Addressed

### **🔧 DependencyResolutionService Cache Mode Fix**
- **Problem**: Using `CACHE_FIRST` which still attempts network connections
- **Solution**: Add `ONLY_CACHE` support for true offline dependency resolution
- **Impact**: True offline capability, reduced network requests, better performance

### **🔗 Service Integration Strategy**  
- **Problem**: Risk of duplicating or replacing existing proven batching logic
- **Solution**: Universal cache service ENHANCES DependencyResolutionService, doesn't replace it
- **Impact**: Keeps proven patterns while adding intelligent caching layer

### **⚡ WorkoutDataProvider Coordination**
- **Problem**: Risk of conflicting with existing real-time social features
- **Solution**: Social stays real-time, Discovery gets cache enhancement, clear separation
- **Impact**: Best of both worlds - real-time social + fast cached content

## Timeline and Priority

**Total Estimated Effort**: 6-9 hours (reduced from original 9-12 hours)
**Priority**: High - Fixes critical cache issues and establishes universal patterns

### Phase 1: Fix Core Issue (1-2 hours)
- DependencyResolutionService cache mode fixes
- Offline dependency resolution testing

### Phase 2: Universal Service (2-3 hours)  
- Universal cache service and tab-specific adapters
- Integration with enhanced dependency resolution

### Phase 3: Integration (1-2 hours)
- WorkoutDataProvider Discovery tab enhancement
- Library tab cache service integration

### Phase 4: Testing (1-2 hours)
- Comprehensive offline capability testing
- Performance validation and optimization

## References

### Key Files to Review
- `docs/research/ndk-caching-patterns-research-findings.md` - **NEW**: NDK source code patterns and proven strategies
- `docs/research/ndk-offline-caching-research-findings.md` - Critical NDK cache behavior insights
- `src/lib/services/dependencyResolution.ts` - Current implementation to enhance (line ~165)
- `src/providers/WorkoutDataProvider.tsx` - Integration point for Discovery tab
- `.clinerules/service-layer-architecture.md` - Service layer patterns to follow

### Related .clinerules
- **service-layer-architecture.md**: Service patterns and NDK integration
- **simple-solutions-first.md**: Enhance existing patterns vs rebuilding
- **research-before-implementation.md**: NDK research findings validation

---

## Task Kickoff Prompt

**Summary**: Fix critical `CACHE_FIRST` vs `ONLY_CACHE` issue in DependencyResolutionService and implement universal service-oriented caching architecture that enhances existing proven patterns.

**Critical Fix**: DependencyResolutionService `fetchEventsOptimized` method hardcodes `CACHE_FIRST` which still attempts network connections. Need to add `ONLY_CACHE` support for true offline dependency resolution.

**Key Technical Approach**: 
1. **Enhance** existing DependencyResolutionService with cache strategy options (keep all batching logic)
2. **Create** Universal NDKCacheService that works WITH existing services
3. **Maintain** WorkoutDataProvider real-time social features while adding Discovery tab cache optimization
4. **Follow** service layer architecture patterns from `.clinerules/service-layer-architecture.md`

**Starting Point**: Update `fetchEventsOptimized` method in `src/lib/services/dependencyResolution.ts` to support both `ONLY_CACHE` and `CACHE_FIRST` modes, then test offline dependency resolution before building universal cache service.

**Key Files to Start With**:
- `src/lib/services/dependencyResolution.ts` - Line ~165, `fetchEventsOptimized` method
- `docs/research/ndk-offline-caching-research-findings.md` - Cache behavior reference
- `.clinerules/service-layer-architecture.md` - Service patterns to follow

---

**Last Updated**: 2025-08-04
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Priority**: High - Critical cache issue fix + universal patterns
