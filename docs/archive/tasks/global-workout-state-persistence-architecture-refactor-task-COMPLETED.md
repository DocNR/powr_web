# Global Workout State Persistence Architecture Refactor Task

## Status: COMPLETED ✅

## Objective

Refactor workout state management from component-level to app-level persistence, enabling features like mini playbar and seamless navigation during active workouts. This addresses the fundamental architectural limitation where tab navigation destroys active workout state.

## Current State Analysis

### Root Cause Identified
- **WorkoutsTab.tsx line 105**: `🧹 Component unmounting - resetting machine to idle state`
- **TabRouter component**: Mount/unmount cycle destroys machine actors on navigation
- **Modal lifecycle**: Tightly coupled to tab component lifecycle
- **Three competing cleanup mechanisms**: `handleCloseModal`, component unmount, and workout completion
- **Mini playbar limitation**: Cannot access workout state from other tabs

### Existing Architecture
```
Current: AppLayout → WorkoutDataProvider → TabRouter → WorkoutsTab → workoutLifecycleMachine
Problem: Machine destroyed on tab navigation
```

### Target Architecture
```
Target: AppLayout → GlobalWorkoutProvider → WorkoutDataProvider → TabRouter → WorkoutsTab (uses global context)
Result: Machine persists across all navigation
```

## Technical Approach

### XState Context Pattern (Refinement 1)
Following official XState v5 patterns, use `createActorContext` instead of manual context creation:

```typescript
// src/contexts/WorkoutContext.tsx
import { createActorContext } from '@xstate/react';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';

export const WorkoutContext = createActorContext(workoutLifecycleMachine);

// Usage becomes cleaner and more idiomatic
const workoutState = WorkoutContext.useSelector(state => state);
const workoutActorRef = WorkoutContext.useActorRef();
```

### Modal State Strategy (Refinement 2)
Separate global workout state from local modal state for maximum flexibility:

**Global State**: Active workout state, timer, exercise progression, workout data
**Local State**: Modal open/closed state (each tab can have its own modal state)

```typescript
// Global: Workout lifecycle state
const { workoutState, workoutSend } = useWorkoutContext();

// Local: Modal state per component
const [isModalOpen, setIsModalOpen] = useState(false);
```

### Migration Strategy (Refinement 3)
Implement feature flag approach for safe transition:

```typescript
// Allows testing both architectures during transition
const USE_GLOBAL_WORKOUT = process.env.NODE_ENV === 'development' || featureFlag.globalWorkout;

// Conditional provider wrapping
{USE_GLOBAL_WORKOUT ? (
  <WorkoutContext.Provider>
    <TabRouter />
  </WorkoutContext.Provider>
) : (
  <TabRouter />
)}
```

### Cleanup Strategy Specifics (Refinement 4)
**Keep**: Cleanup on actual app close, user logout, explicit workout cancellation
**Remove**: Cleanup on tab navigation, component unmount during active workouts

```typescript
// ✅ KEEP: Essential cleanup
useEffect(() => {
  const handleBeforeUnload = () => {
    // Only cleanup on actual app close
    if (workoutState.matches('active')) {
      localStorage.setItem('pendingWorkout', JSON.stringify(workoutState.context));
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [workoutState]);

// ❌ REMOVE: Aggressive tab navigation cleanup
useEffect(() => {
  return () => {
    console.log('🧹 Component unmounting - resetting machine to idle state');
    workoutSend({ type: 'RESET_LIFECYCLE' }); // REMOVE THIS
  };
}, []);
```

## Implementation Steps

### Phase 1: Create Global Workout Context (2-3 hours)
1. [ ] Create `src/contexts/WorkoutContext.tsx` using `createActorContext`
2. [ ] Add context provider to `AppLayout.tsx`
3. [ ] Create `useWorkoutContext` hook for easy access
4. [ ] Test basic machine creation and state access

### Phase 2: Refactor WorkoutsTab (3-4 hours)
1. [ ] Remove `useMachine(workoutLifecycleMachine)` from `WorkoutsTab`
2. [ ] Replace with `WorkoutContext.useSelector()` and `WorkoutContext.useActorRef()`
3. [ ] Remove aggressive cleanup effects from component unmount
4. [ ] Keep local modal state management in component
5. [ ] Test workout initiation still works identically

### Phase 3: Update Modal Architecture (2-3 hours)
1. [ ] Keep modal state local to components (per refinement 2)
2. [ ] Update `WorkoutDetailModal` to use global workout state but local modal state
3. [ ] Test modal behavior across tab navigation
4. [ ] Ensure each tab can have independent modal state

### Phase 4: Enable Mini Playbar (2-3 hours)
1. [ ] Update `WorkoutMiniBar` to use global workout context
2. [ ] Add mini playbar to `AppLayout` for global visibility
3. [ ] Implement navigation to WorkoutsTab from mini playbar
4. [ ] Test mini playbar functionality from all tabs

### Phase 5: Validation & Testing (2-3 hours)
1. [ ] Run complete test suite - all tests must pass
2. [ ] Verify no XState machine functionality lost
3. [ ] Test across all authentication methods
4. [ ] Performance benchmark validation (272ms template loading)
5. [ ] Test feature flag toggle between old and new architecture

## Success Criteria

- [ ] Active workouts persist across all tab navigation (Home, Progress, Profile, etc.)
- [ ] Mini playbar functionality works from any tab when workout is active
- [ ] No workout state loss when switching between tabs during active workouts
- [ ] All existing XState machine functionality preserved exactly
- [ ] NDK integration and authentication flows remain intact
- [ ] 272ms template loading performance maintained or improved
- [ ] All existing tests pass without modification
- [ ] `WorkflowValidationTest` component continues to function identically
- [ ] Feature flag allows safe rollback to previous architecture

## Critical Preservation Requirements

### Maintain Exactly
- All XState machine logic and state transitions (zero changes to machine files)
- NDK integration patterns and authentication flows
- NIP-101e event publishing/reading functionality
- Template loading performance (272ms benchmark)
- `WorkflowValidationTest` component functionality
- All existing component behavior and user flows

### Component Behavior Preservation
- Workout setup flow must remain identical
- Active workout interface must function exactly the same
- Workout completion and publishing flows unchanged
- Error handling patterns maintained
- Modal behavior identical (just managed with global state + local modal state)

## Architecture Changes Required

### New Files
- `src/contexts/WorkoutContext.tsx` - XState createActorContext implementation
- `src/hooks/useWorkoutContext.tsx` - Convenience hook for context access

### Primary Files
- `src/components/layout/AppLayout.tsx` - Add WorkoutContext.Provider wrapper
- `src/components/tabs/WorkoutsTab.tsx` - Remove machine creation, use global context
- `src/components/powr-ui/workout/WorkoutDetailModal.tsx` - Use global workout state + local modal state
- `src/components/powr-ui/workout/WorkoutMiniBar.tsx` - Enable from global state

### Secondary Files
- `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - Update to use global state
- Any components that need to access active workout state

## Testing Strategy

### Regression Testing
1. **Complete Workout Flow**: Setup → Active → Completion → Publishing
2. **Tab Navigation During Workout**: Start workout, navigate to all tabs, verify persistence
3. **Authentication Integration**: Verify all auth methods (NIP-07, NIP-46, Amber) work
4. **Template Loading Performance**: Maintain 272ms benchmark
5. **Error Recovery**: Test error states and recovery flows
6. **Existing Tests**: All current tests must pass without modification

### New Functionality Testing
1. **Workout Persistence**: Verify active workouts survive app navigation
2. **Global State Access**: Multiple components can access workout state
3. **Memory Management**: No machine accumulation or memory leaks
4. **Mini Playbar**: Works from any tab when workout is active
5. **Feature Flag**: Toggle between architectures works correctly

### XState Integration Testing
1. **createActorContext Pattern**: Verify official XState React integration works
2. **useSelector Performance**: Ensure minimal re-renders with proper selectors
3. **Actor Reference Stability**: Verify actorRef doesn't change unnecessarily

## Success Validation

### Mini Playbar Test
After refactor, this should work from any tab:

```typescript
const MiniPlaybar = () => {
  const workoutState = WorkoutContext.useSelector(state => state);
  const workoutActorRef = WorkoutContext.useActorRef();
  
  if (!workoutState.matches('active')) return null;
  
  return (
    <WorkoutMiniBar 
      workoutTitle={workoutState.context.workoutData.title}
      elapsedTime={Date.now() - workoutState.context.workoutData.startTime}
      onExpand={() => {
        // Navigate to WorkoutsTab and open modal
        router.push('/workouts');
      }}
      onTogglePause={() => {
        workoutActorRef.send({ type: 'TOGGLE_PAUSE' });
      }}
    />
  );
};
```

### Navigation Test
1. Start workout in WorkoutsTab  
2. Navigate to Home tab → Workout state persists, mini playbar visible
3. Navigate to Progress tab → Workout state persists, mini playbar visible
4. Return to WorkoutsTab → Workout still active and accessible
5. **Success**: No state loss, mini playbar visible on all tabs

## Business Impact

- **Immediate**: Eliminates user frustration from workout state loss during navigation
- **Feature Enabling**: Unlocks mini playbar, notification integration, background tracking
- **User Experience**: Professional app behavior matching user expectations
- **Technical Debt**: Resolves fundamental architectural limitation blocking advanced features

## Estimated Timeline

- **Phase 1**: Global Context Setup (2-3 hours)
- **Phase 2**: WorkoutsTab Refactor (3-4 hours)
- **Phase 3**: Modal Architecture (2-3 hours)
- **Phase 4**: Mini Playbar Implementation (2-3 hours)
- **Phase 5**: Testing & Validation (2-3 hours)

**Total Estimated Time**: 11-16 hours over 2-3 days

## References

### .clinerules Compliance
- **xstate-anti-pattern-prevention.md**: Ensures we follow XState best practices
- **simple-solutions-first.md**: Validates we're not over-engineering the solution
- **task-creation-process.md**: This document follows the standardized task format
- **web-ndk-actor-integration.md**: Maintains NDK integration patterns
- **nip-101e-standards.md**: Preserves workout event compliance

### XState Documentation
- **createActorContext**: Official React integration pattern from XState v5
- **useSelector**: Performance-optimized state selection
- **useActorRef**: Direct actor reference access

### Architecture References
- `src/lib/machines/workout/workoutLifecycleMachine.ts` - Core machine (unchanged)
- `src/components/test/WorkflowValidationTest.tsx` - Must continue working
- `src/components/tabs/WorkoutsTab.tsx` - Primary refactor target

---

This refactor resolves the architectural limitation discovered during mini playbar development and enables a new class of user experience features while preserving all existing functionality and following official XState patterns.

**Last Updated**: 2025-07-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
**XState Version**: v5 with official React integration patterns
