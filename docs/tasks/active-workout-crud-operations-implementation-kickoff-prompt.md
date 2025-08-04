# Active Workout CRUD Operations Implementation - Kickoff Prompt

## Task Summary
Implement exercise-level CRUD operations during active workouts, enabling users to add, remove, and substitute exercises through a streamlined interface with NIP-51 library integration. This builds the foundation for Phase 1A of the workout enhancement roadmap, focusing on giving users full control over workout customization.

## Key Files to Review
1. **Task Document**: `docs/tasks/active-workout-crud-operations-implementation-task.md` - Complete implementation plan
2. **Active Workout Machine**: `src/lib/machines/workout/activeWorkoutMachine.ts` - Existing XState patterns to extend
3. **Active Workout Interface**: `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - UI integration points
4. **Library Collections Hook**: `src/hooks/useLibraryCollections.ts` - NIP-51 exercise library access
5. **Radix UI Standards**: `.clinerules/radix-ui-component-library.md` - Component architecture guidelines

## Starting Point
Begin by extending the `activeWorkoutMachine.ts` with new event types (`ADD_EXERCISES`, `REMOVE_EXERCISE`, `SUBSTITUTE_EXERCISE`) following the established patterns for `ADD_SET` and `COMPLETE_SPECIFIC_SET`. The machine already has solid foundations for workout state management and modification tracking.

## Architecture Context
This task implements Phase 1A from the comprehensive workout enhancement roadmap, specifically focusing on active workout modifications while skipping superset functionality for this sprint. The implementation prepares the foundation for Phase 1B template management by tracking all workout modifications for future template evolution analysis.
