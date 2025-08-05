# Universal NDK Caching Architecture Implementation - Kickoff Prompt

## Task Summary
Fix critical `CACHE_FIRST` vs `ONLY_CACHE` issue in DependencyResolutionService using proven NDK patterns. Research shows this is much simpler than originally planned - we leverage NDK's existing battle-tested caching architecture instead of building custom solutions.

## 🎯 Research-Backed Simplified Approach
**Key Discovery**: NDK already provides comprehensive caching patterns. We just need to use them correctly instead of hardcoding `CACHE_FIRST`.

**NDK Research Insights** (from `docs/research/ndk-caching-patterns-research-findings.md`):
- NDK provides `NDKSubscriptionCacheUsage` enum with `ONLY_CACHE`, `CACHE_FIRST`, `PARALLEL`, `ONLY_RELAY`
- NDK's `useObserver` hook defaults to `ONLY_CACHE` for cache-first scenarios
- NDK has proven boolean decision logic and cache-then-relay execution flow
- We can adopt NDK's patterns directly instead of reinventing

## Critical Issue to Fix First
**Problem**: `DependencyResolutionService.fetchEventsOptimized()` hardcodes `CACHE_FIRST` which still attempts network connections, preventing true offline capability.

**Location**: `src/lib/services/dependencyResolution.ts`, line ~165

**Current Code**:
```typescript
const events = await ndk.fetchEvents(filter, {
  cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,  // Still tries network!
  closeOnEose: true
});
```

**Simple Fix**: Add cache strategy parameter using NDK's existing enum - no custom logic needed!

## Key Technical Approach

### Phase 1: Fix Core Issue (Start Here)
1. **Enhance `fetchEventsOptimized` method** with cache strategy parameter
2. **Add offline-first methods** to DependencyResolutionService
3. **Test offline dependency resolution** to verify `ONLY_CACHE` works

### Phase 2: Universal Cache Service
1. **Create `NDKCacheService`** for cache strategy coordination
2. **Create tab-specific services** (`LibraryCacheService`, `HistoryCacheService`, etc.)
3. **Create universal hook** `useNDKDataWithCaching`

### Phase 3: Integration
1. **Enhance WorkoutDataProvider** Discovery tab with cache-first loading
2. **Integrate Library tab** with cache service
3. **Maintain all existing functionality** (especially real-time social feed)

### Phase 4: Testing
1. **Test offline functionality** with `ONLY_CACHE`
2. **Validate performance improvements** (sub-100ms cache hits)
3. **Ensure no regressions** in existing features

## What to Keep (Don't Change)
- ✅ **DependencyResolutionService batching logic** - it's excellent
- ✅ **WorkoutDataProvider real-time social** - perfect for social features  
- ✅ **Library onboarding flow** - works perfectly for first-time users
- ✅ **Service layer architecture** - follows patterns correctly

## What to Enhance
- 🔧 **Add cache strategy options** to `fetchEventsOptimized`
- 🔧 **Create universal cache service** for strategy coordination
- 🔧 **Add Discovery tab cache optimization** while keeping live updates
- 🔧 **Create offline-first hooks** for components that need them

## Key Files to Review Before Starting

### Critical References
- **`docs/research/ndk-caching-patterns-research-findings.md`** - **NEW**: NDK source code patterns and proven strategies
- **`docs/research/ndk-offline-caching-research-findings.md`** - NDK cache behavior insights
- **`src/lib/services/dependencyResolution.ts`** - Current implementation to enhance (line ~165)
- **`.clinerules/service-layer-architecture.md`** - Service patterns to follow

### Integration Points
- **`src/providers/WorkoutDataProvider.tsx`** - Discovery tab enhancement point
- **`src/hooks/useLibraryCollections.ts`** - Library tab integration point
- **`src/lib/services/libraryManagement.ts`** - Existing library service patterns

## Success Criteria
- [ ] **True offline capability** - dependency resolution works with `ONLY_CACHE`
- [ ] **Performance improvement** - sub-100ms cache hits, 70%+ network reduction
- [ ] **No functionality loss** - all existing features work identically
- [ ] **Service layer compliance** - follows established patterns

## 🚀 Simplified Timeline (Research-Backed)
**Total Reduced from 6-9 hours to 2-4 hours** due to leveraging NDK's proven patterns!

- **Phase 1**: 30 minutes (simple parameter addition)
- **Phase 2**: 1 hour (convenience methods using NDK patterns)
- **Phase 3**: 1-2 hours (integration and testing)
- **Total**: 2.5-3.5 hours

### Why So Much Faster?
- ✅ **No custom enums** - use NDK's `NDKSubscriptionCacheUsage`
- ✅ **No custom logic** - follow NDK's boolean decision patterns  
- ✅ **No reinventing** - leverage NDK's battle-tested architecture
- ✅ **Simple parameter addition** - core fix is just adding `cacheUsage` parameter

## Starting Command
Begin by examining the current `fetchEventsOptimized` method and understanding how to add cache strategy options while preserving all existing batching and validation logic.

---

**Priority**: High - Critical cache issue fix
**Complexity**: Medium - Enhancement of existing proven patterns
**Risk**: Low - Additive changes that preserve existing functionality
