# Workout UI Architecture Separation Cleanup - Kickoff Prompt

## Task Summary

Clean up the architectural confusion between WorkoutsTab, WorkoutDetailModal, ActiveWorkoutInterface, and WorkoutUIProvider by establishing clear separation of concerns. The core issue is that WorkoutDetailModal currently handles both template preview AND active workout interface rendering, causing the minimize functionality to break when the modal closes. The solution is to move ALL workout interface rendering to WorkoutUIProvider and make WorkoutDetailModal a pure template preview component.

**Key Technical Approach**: Separate template preview (modal) from workout interface (global), move ActiveWorkoutInterface rendering to WorkoutUIProvider using portal rendering, and ensure minimize/expand works through global state machine events only.

**Primary Goal**: Enable seamless workout state persistence across tab navigation with proper minimize/expand functionality while maintaining clean separation of concerns.

## Key Files to Review

### Critical Implementation Files
1. **`docs/tasks/workout-ui-architecture-separation-cleanup-task.md`** - Complete task specification and implementation plan
2. **`src/providers/WorkoutUIProvider.tsx`** - Current UI provider that needs enhancement
3. **`src/components/powr-ui/workout/WorkoutDetailModal.tsx`** - Modal that needs business logic removal
4. **`src/components/tabs/WorkoutsTab.tsx`** - Tab component that needs refactoring
5. **`src/components/powr-ui/workout/ActiveWorkoutInterface.tsx`** - Interface that needs modal independence

### Relevant .clinerules
- **`.clinerules/xstate-anti-pattern-prevention.md`** - Ensures proper XState patterns
- **`.clinerules/simple-solutions-first.md`** - Prevents over-engineering
- **`.clinerules/service-layer-architecture.md`** - Proper service integration

### Reference Files
- **`src/contexts/WorkoutContext.tsx`** - Global workout state management (already implemented)
- **`src/lib/machines/workout/workoutLifecycleMachine.ts`** - Core state machine (DO NOT MODIFY)

## Starting Point

**First Step**: Begin with Phase 1 - WorkoutDetailModal cleanup. Remove the ActiveWorkoutInterface rendering and minimize/expand business logic from WorkoutDetailModal, keeping only the template preview functionality.

**Dependencies to Check**: Ensure the global WorkoutContext is properly providing workout state and that WorkoutUIProvider is correctly integrated in the app layout.

## Implementation Phases

1. **Phase 1**: Clean up WorkoutDetailModal (remove business logic, keep template preview only)
2. **Phase 2**: Enhance WorkoutUIProvider (add ActiveWorkoutInterface rendering with portal)
3. **Phase 3**: Refactor WorkoutsTab (update modal conditions, clean event handling)
4. **Phase 4**: Make ActiveWorkoutInterface independent (remove modal dependencies)
5. **Phase 5**: Integration testing (verify complete workout flow works)

## Success Validation

After implementation, this should work from any tab:
- Start workout in WorkoutsTab → ActiveWorkoutInterface appears globally
- Minimize workout → WorkoutMiniBar appears on all tabs
- Navigate to Home/Progress/Profile tabs → Mini bar persists
- Expand from mini bar → ActiveWorkoutInterface returns
- Complete/cancel workout → Clean state reset

## Critical Architecture Fix

The core problem being solved:
```
❌ CURRENT: WorkoutDetailModal → ActiveWorkoutInterface (trapped in modal)
                ↓ (minimize calls onClose)
            Modal closes → State lost

✅ TARGET: WorkoutDetailModal (template preview only)
          WorkoutUIProvider → ActiveWorkoutInterface (global portal)
                ↓ (minimize sends MINIMIZE_INTERFACE event)
            Interface minimizes → State persists globally
```

---

**Ready to begin**: Start with Phase 1 - removing business logic from WorkoutDetailModal and making it a pure template preview component.
