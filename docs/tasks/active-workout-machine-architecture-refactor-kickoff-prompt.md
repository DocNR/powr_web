# Active Workout Machine Architecture Refactor - Kickoff Prompt

## Task Summary
Fix the active workout machine data flow issue by implementing proper XState parent-child data flow patterns. The active machine is currently trying to re-resolve data that the setup machine already resolved, causing "Missing resolved data" errors and violating our new architecture patterns.

## Key Technical Approach
1. **Remove Duplicate Resolution**: Eliminate `initializeResolvedData` actor from active machine
2. **Trust Parent Data**: Active machine validates and uses resolved data from lifecycle machine
3. **Move Data Transformation**: Exercise name merging happens in setup machine, not active machine
4. **Simplify Architecture**: Active machine focuses only on workout execution logic

## Key Files to Review
1. **Task Document**: `docs/tasks/active-workout-machine-architecture-refactor-task.md` - Complete implementation plan
2. **New Rule**: `.clinerules/xstate-parent-child-data-flow.md` - Parent-child data flow patterns
3. **Console Evidence**: `../Downloads/console-export-2025-7-26_22-36-10.txt` - Current error logs
4. **Active Machine**: `src/lib/machines/workout/activeWorkoutMachine.ts` - Needs simplification
5. **Setup Machine**: `src/lib/machines/workout/workoutSetupMachine.ts` - Needs enhancement

## Starting Point
Begin by reading the task document to understand the complete architecture refactor plan. The core issue is that the active workout machine is not receiving resolved data properly from its parent machines, causing it to attempt duplicate data resolution. Follow the new XState parent-child data flow patterns to fix this architecture violation.

## Success Criteria
- No more "Missing resolved data" errors in console
- Active machine starts immediately without initialization phase
- Exercise names appear correctly in workout interface
- Cleaner, more predictable data flow between machines

## Architecture Context
This refactor validates our NDK-first architecture by proving that complex state machine hierarchies can work efficiently without duplicate service calls. The patterns established here will be crucial for the golf app React Native migration.
