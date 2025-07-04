# Workout Lifecycle Machine Completion - Kickoff Prompt

## Task Summary

Fix the workoutLifecycleMachine to properly invoke the workoutSetupMachine instead of bypassing it with simplified inline logic. The current implementation auto-selects the first template and ignores user choice. We need to follow the exact NOGA roundLifecycleMachine pattern: replace the entire setup state with a single invoke of the real setupMachine. Additionally, implement proper UI integration in WorkoutsTab and verify machine compatibility.

## Key Files to Review

1. **Task Document**: `docs/tasks/workout-lifecycle-machine-completion-task.md` - Complete implementation plan with UI integration details
2. **Current Problem**: `src/lib/machines/workout/workoutLifecycleMachine.ts` - Setup state bypasses real setupMachine
3. **UI Integration**: `src/components/tabs/WorkoutsTab.tsx` - Needs machine integration for "Start Workout" button
4. **NOGA Reference**: `/Users/danielwyler/noga/state/machines/round/roundLifecycleMachine.ts` - Exact invoke pattern to follow
5. **Target Machine**: `src/lib/machines/workout/workoutSetupMachine.ts` - Real setup machine to use
6. **Type Definitions**: `src/lib/machines/workout/types/workoutLifecycleTypes.ts` - Verify interface compatibility
7. **Relevant Rules**: `.clinerules/xstate-anti-pattern-prevention.md` - Use proper invoke, avoid workarounds

## Starting Point

The fix involves three main areas:
1. **Machine Architecture**: Replace setup state inline logic with proper setupMachine invoke (following NOGA pattern)
2. **UI Integration**: Add workoutLifecycleMachine integration to WorkoutsTab's "Start Workout" button
3. **Interface Compatibility**: Verify input/output types match between workoutLifecycleMachine ↔ setupMachine ↔ activeWorkoutMachine

The core architectural fix is straightforward, but proper UI integration and type verification are essential for a complete solution.

## Dependencies

- workoutSetupMachine exists and works
- DependencyResolutionService proven (697ms performance)
- CompleteWorkoutFlowTest ready for validation
- NOGA patterns documented and working
- UI integration points identified in WorkoutsTab
