# Library Data Provider Duplicate Subscription Fix Implementation Task

## Objective
Eliminate duplicate NDK subscriptions and improve performance by implementing a centralized LibraryDataProvider that shares `useLibraryDataWithCollections` data across all components, reducing network requests by 70%+ and achieving sub-100ms cache performance.

## Current State Analysis

### Problem: Multiple Independent Hook Calls
Currently, **5 components independently call `useLibraryDataWithCollections`** simultaneously:

1. **LibraryTab.tsx** - Calls the hook **3 times** (once in each sub-view: ExercisesView, WorkoutsView, CollectionsView)
2. **ExercisePicker.tsx** - ✅ **CONFIRMED**: Independent hook call for exercise data (`const { exerciseLibrary } = useLibraryDataWithCollections(userPubkey);` on line 45)
3. **WorkoutLibrary.tsx** - Independent hook call for workout templates  
4. **ExerciseLibrary.tsx** - Independent hook call for exercise data

**Total: 5 duplicate subscriptions** creating significant performance overhead.

### Performance Impact
- **Duplicate NDK subscriptions** for identical data
- **Cache thrashing** with poor hit rates (~50%)
- **Multiple network requests** for the same content
- **Console log spam** with duplicate loading states
- **Unnecessary re-renders** across components

### Console Evidence
```
[SimpleOnboarding] User authenticated, checking if modal should show... (appears twice)
[LibraryManagementService] Fetching EXERCISE_LIBRARY collection (multiple times)
Cache miss followed immediately by cache hit (inefficient pattern)
```

## Technical Approach

### Architecture: React Context Pattern (Not Zustand/Jotai)
Following `.clinerules/simple-solutions-first.md` and `.clinerules/ndk-best-practices.md`:

- **React Context** is perfect for **data source sharing** (not complex state management)
- **Single hook call** shared across all components via context
- **No prop drilling** - components access data directly via context
- **Lifecycle alignment** with user authentication
- **Consistent with existing provider patterns** (WorkoutUIProvider, etc.)

### NDK Best Practices Compliance
- **✅ Custom Hook Pattern**: Maintains `useNDKDataWithCaching` wrapper
- **✅ Service Layer**: No changes to underlying NDK operations
- **✅ Single Data Source**: Eliminates duplicate subscriptions
- **✅ Cache-First Strategy**: Preserves offline-first functionality

## Prerequisites
**⚠️ EXECUTION ORDER**: This task should be executed **AFTER** the "Library Service Layer Integration Implementation Task" to ensure the hook is properly architected with all services before optimizing component usage.

## Implementation Steps

### Phase 0: Component Usage Verification (COMPLETED)
✅ **ExercisePicker.tsx Confirmed**: Uses `useLibraryDataWithCollections(userPubkey)` on line 45
✅ **Component Count Verified**: 5 total components with duplicate subscriptions
✅ **Migration Scope Confirmed**: All identified components need migration

### Phase 1: Create LibraryDataProvider (30 minutes)
1. [ ] Create `src/providers/LibraryDataProvider.tsx` with React Context
2. [ ] Create `src/hooks/useLibraryData.ts` for context access
3. [ ] Add TypeScript interfaces for shared data structure
4. [ ] Include error boundaries and loading state management

### Phase 2: Integrate Provider (15 minutes)
1. [ ] Add LibraryDataProvider to app layout at optimal level
2. [ ] Wrap components that need library data access
3. [ ] Ensure provider placement after authentication context

### Phase 3: Migrate Components (90 minutes)
1. [ ] **LibraryTab.tsx**: Remove 3 duplicate hook calls, let sub-views use context directly
   - Remove `useLibraryDataWithCollections` from ExercisesView, WorkoutsView, CollectionsView
   - Each sub-view will use `useLibraryData()` context access directly (no prop drilling)
2. [ ] **ExercisePicker.tsx**: Replace independent hook with context
   - Remove `const { exerciseLibrary } = useLibraryDataWithCollections(userPubkey);` from line 45
   - Replace with `const { exerciseLibrary } = useLibraryData();`
   - Verify exercise filtering and selection still works
3. [ ] **WorkoutLibrary.tsx**: Replace independent hook with context access
   - Remove `useLibraryDataWithCollections` call
   - Replace with `useLibraryData()` context access
4. [ ] **ExerciseLibrary.tsx**: Replace independent hook with context access
   - Remove `useLibraryDataWithCollections` call
   - Replace with `useLibraryData()` context access
5. [ ] Test each component migration individually

### Phase 4: Validation & Cleanup (45 minutes)
1. [ ] Verify no duplicate subscriptions in console logs
2. [ ] Test offline functionality preservation
3. [ ] Validate cache hit rates improvement
4. [ ] Remove any unused imports or dead code
5. [ ] Performance benchmarking vs baseline

## Success Criteria

### Performance Metrics
- [ ] **70%+ network request reduction** for cached library content
- [ ] **Sub-100ms loading times** for previously viewed content
- [ ] **Single subscription paths** - no duplicate websockets in console
- [ ] **90%+ cache hit rates** (up from ~50%)

### Functionality Preservation
- [ ] **All existing features work** - zero regressions
- [ ] **Offline functionality maintained** for Library and History tabs
- [ ] **Real-time updates preserved** where appropriate
- [ ] **Loading states work correctly** across all components

### Code Quality
- [ ] **Clean console logs** - no duplicate loading messages
- [ ] **Single data source** - one `useLibraryDataWithCollections` call
- [ ] **No prop drilling** - components access data via context
- [ ] **TypeScript compliance** - proper typing throughout

### Service Integration Preservation
- [ ] **All service integrations maintained** from previous Service Layer Integration task
- [ ] **Data accuracy preserved** (correct set counts still working)
- [ ] **Offline functionality maintained** through service layer methods
- [ ] **No regression in service usage** (all 5 services still integrated)

## Technical Implementation Details

### LibraryDataProvider Structure
```typescript
// src/providers/LibraryDataProvider.tsx
interface LibraryDataContextType {
  exerciseLibrary: {
    isLoading: boolean;
    isResolving: boolean;
    content: ExerciseLibraryItem[];
    error?: string;
    checkOfflineAvailability?: () => Promise<boolean>;
  };
  workoutLibrary: {
    isLoading: boolean;
    isResolving: boolean;
    content: WorkoutLibraryItem[];
    error?: string;
    checkOfflineAvailability?: () => Promise<boolean>;
  };
  collectionSubscriptions: {
    isLoading: boolean;
    isResolving: boolean;
    content: CollectionSubscription[];
    error?: string;
    checkOfflineAvailability?: () => Promise<boolean>;
  };
  error?: string;
}

export const LibraryDataProvider = ({ children }) => {
  const userPubkey = usePubkey();
  const libraryData = useLibraryDataWithCollections(userPubkey); // Single call
  
  return (
    <LibraryDataContext.Provider value={libraryData}>
      {children}
    </LibraryDataContext.Provider>
  );
};
```

### Component Migration Pattern
```typescript
// BEFORE (multiple independent calls)
function LibraryTab() {
  const { exerciseLibrary } = useLibraryDataWithCollections(userPubkey); // Call 1
}

function ExercisePicker() {
  const { exerciseLibrary } = useLibraryDataWithCollections(userPubkey); // Call 2 (duplicate!)
}

// AFTER (shared context access)
function LibraryTab() {
  const { exerciseLibrary } = useLibraryData(); // Context access
}

function ExercisePicker() {
  const { exerciseLibrary } = useLibraryData(); // Same context, no duplication
}
```

### Provider Placement Strategy
```typescript
// Optimal provider hierarchy
<AuthProvider>
  <LibraryDataProvider>     {/* Add here - after auth, before components */}
    <WorkoutUIProvider>     {/* Existing providers */}
      <SubNavigationProvider>
        <AppLayout>
          <LibraryTab />      {/* All components access shared data */}
          <ExercisePicker />
          <WorkoutLibrary />
        </AppLayout>
      </SubNavigationProvider>
    </WorkoutUIProvider>
  </LibraryDataProvider>
</AuthProvider>
```

## Risk Mitigation

### Low Risk Assessment
- **Backward Compatible**: Context pattern doesn't break existing functionality
- **Incremental Migration**: Components migrated one-by-one with testing
- **Proven Pattern**: React Context is standard for data sharing
- **Existing Architecture**: Follows established provider patterns in codebase

### Rollback Strategy
- **Simple Revert**: Remove provider, restore individual hook calls
- **Component-Level**: Can rollback individual components if issues arise
- **No Data Loss**: No changes to underlying data structures or NDK operations

## Testing Strategy

### Unit Testing
- [ ] Test LibraryDataProvider with mock data
- [ ] Test useLibraryData hook error handling
- [ ] Test component behavior with context data

### Integration Testing
- [ ] Test provider integration with authentication flow
- [ ] Test offline functionality with provider
- [ ] Test real-time updates through provider

### Performance Testing
- [ ] Benchmark network requests before/after
- [ ] Measure cache hit rates improvement
- [ ] Test loading times for cached content

## References

### .clinerules Compliance
- **[simple-solutions-first.md](.clinerules/simple-solutions-first.md)** - React Context is simpler than complex state management
- **[ndk-best-practices.md](.clinerules/ndk-best-practices.md)** - Maintains custom hook patterns and service layer
- **[task-creation-process.md](.clinerules/task-creation-process.md)** - Follows standardized task structure

### Technical Documentation
- **[useLibraryDataWithCollections.ts](src/hooks/useLibraryDataWithCollections.ts)** - Hook being centralized
- **[useNDKDataWithCaching.ts](src/hooks/useNDKDataWithCaching.ts)** - Underlying caching service
- **[LibraryTab.tsx](src/components/tabs/LibraryTab.tsx)** - Primary component to migrate

### Architecture Context
- **NDK-First Architecture**: Validates single data source patterns for golf app migration
- **Performance Optimization**: Demonstrates cache efficiency improvements
- **React Patterns**: Establishes provider patterns for complex data sharing

## Golf App Migration Insights

### Patterns Established
- **Centralized Data Providers**: Pattern for sharing expensive data operations
- **Context vs State Management**: When to use React Context vs Zustand/Jotai
- **NDK Optimization**: Single subscription patterns for mobile performance

### Performance Baselines
- **Network Reduction**: 70%+ improvement target for mobile data usage
- **Cache Efficiency**: 90%+ hit rates for offline-first mobile experience
- **Loading Performance**: Sub-100ms for cached content on mobile devices

## Timeline Estimate
**Total: 3 hours**
- **Phase 1**: 30 minutes (provider creation)
- **Phase 2**: 15 minutes (integration)
- **Phase 3**: 90 minutes (component migration)
- **Phase 4**: 45 minutes (validation & cleanup)

## Definition of Done
- [ ] Single `useLibraryDataWithCollections` call across entire app
- [ ] All components access library data via LibraryDataProvider context
- [ ] Console logs show no duplicate subscriptions or loading states
- [ ] Performance metrics meet 70%+ network reduction target
- [ ] All existing functionality preserved with zero regressions
- [ ] TypeScript compilation passes without errors
- [ ] Code review completed with .clinerules compliance verification

---

**Created**: 2025-08-05
**Priority**: High - Performance and Architecture Optimization
**Complexity**: Medium - Clean refactoring of existing working code
**Risk**: Low - Backward compatible context pattern
**Architecture Impact**: Establishes data sharing patterns for golf app migration
