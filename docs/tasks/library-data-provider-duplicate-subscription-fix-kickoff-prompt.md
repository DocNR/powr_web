# Library Data Provider Duplicate Subscription Fix - Kickoff Prompt

## Task Summary
Eliminate duplicate NDK subscriptions by implementing a centralized LibraryDataProvider that shares `useLibraryDataWithCollections` data across all components. Currently 4-5 components independently call the same hook, causing duplicate network requests and poor cache performance. The solution uses React Context to share a single hook call, reducing network requests by 70%+ while maintaining all existing functionality.

## Key Technical Approach
**React Context Pattern**: Create LibraryDataProvider that calls `useLibraryDataWithCollections` once and shares the result via context. This follows `.clinerules/simple-solutions-first.md` (Context is simpler than complex state management) and `.clinerules/ndk-best-practices.md` (maintains custom hook patterns). No prop drilling - components access data directly via `useLibraryData()` hook.

## Primary Goal
Transform multiple independent hook calls into a single shared data source, eliminating duplicate subscriptions while preserving offline functionality and improving cache hit rates from ~50% to 90%+.

## Key Files to Review

### Critical References
- **`docs/tasks/library-data-provider-duplicate-subscription-fix-task.md`** - **MAIN TASK DOCUMENT** with complete implementation plan
- **`src/hooks/useLibraryDataWithCollections.ts`** - Hook being centralized (already built)
- **`src/components/tabs/LibraryTab.tsx`** - Primary component with 3 duplicate hook calls
- **`.clinerules/simple-solutions-first.md`** - Why React Context over complex state management
- **`.clinerules/ndk-best-practices.md`** - NDK patterns and custom hook requirements

### Components to Migrate
- **`src/components/powr-ui/workout/ExercisePicker.tsx`** - Independent hook call to replace
- **`src/components/library/WorkoutLibrary.tsx`** - Independent hook call to replace
- **`src/components/library/ExerciseLibrary.tsx`** - Independent hook call to replace
- **`src/providers/WorkoutUIProvider.tsx`** - Example provider pattern to follow

### Architecture Context
- **`src/hooks/useNDKDataWithCaching.ts`** - Underlying caching service (no changes needed)
- **`src/lib/services/ndkCacheService.ts`** - NDK operations layer (no changes needed)

## Starting Point
Begin by examining the main task document to understand the 4-phase approach. The foundation (`useLibraryDataWithCollections`) is complete - this is about creating a React Context provider to share the hook result across components, eliminating the duplicate calls visible in console logs.

**First Step**: Create `src/providers/LibraryDataProvider.tsx` with React Context that calls `useLibraryDataWithCollections` once and provides the result to all child components.

## Timeline
**Total**: 3 hours
- **Phase 1**: 30 minutes (provider creation)
- **Phase 2**: 15 minutes (integration)  
- **Phase 3**: 90 minutes (component migration)
- **Phase 4**: 45 minutes (validation & cleanup)

## Success Indicators
- Console logs show single subscription instead of 4-5 duplicates
- Network requests reduced by 70%+ for library content
- All existing functionality preserved with zero regressions
- Cache hit rates improve from ~50% to 90%+

---

**Priority**: High - Performance and Architecture Optimization
**Complexity**: Medium - Clean refactoring of existing working code  
**Risk**: Low - Backward compatible React Context pattern
**Foundation**: Complete - All hooks and services built and ready
