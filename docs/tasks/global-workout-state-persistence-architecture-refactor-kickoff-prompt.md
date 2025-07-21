# Global Workout State Persistence Architecture Refactor - Kickoff Prompt

## Task Summary

Refactor workout state management from component-level to app-level persistence using XState's official `createActorContext` pattern. This resolves the fundamental architectural limitation where tab navigation destroys active workout state, enabling features like mini playbar and seamless cross-tab navigation during active workouts.

**Key Technical Approach**: Replace manual context creation with XState v5's `createActorContext`, separate global workout state from local modal state, and implement feature flag for safe migration.

**Primary Goal**: Enable persistent workout state across all app navigation while preserving 100% of existing functionality and following official XState patterns.

## Key Files to Review

### Critical Reference Files
1. **`docs/tasks/global-workout-state-persistence-architecture-refactor-task.md`** - Complete task specification with all refinements
2. **`src/components/tabs/WorkoutsTab.tsx`** - Primary refactor target (remove machine creation)
3. **`src/lib/machines/workout/workoutLifecycleMachine.ts`** - Core machine (DO NOT MODIFY)
4. **`src/components/layout/AppLayout.tsx`** - Where global provider will be added
5. **`../ReferenceRepos/state-management/xstate/xstate-react.mdx`** - Official XState React patterns

### Relevant .clinerules
- **`.clinerules/xstate-anti-pattern-prevention.md`** - Ensures we follow XState best practices
- **`.clinerules/simple-solutions-first.md`** - Validates we're not over-engineering
- **`.clinerules/web-ndk-actor-integration.md`** - Maintains NDK integration patterns

## Starting Point

**First Step**: Create `src/contexts/WorkoutContext.tsx` using XState's official `createActorContext` pattern:

```typescript
import { createActorContext } from '@xstate/react';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';

export const WorkoutContext = createActorContext(workoutLifecycleMachine);
```

**Dependencies to Check**: Ensure `@xstate/react` package is installed and verify the `createActorContext` import works correctly.

## Implementation Phases

1. **Phase 1**: Create global context using official XState patterns
2. **Phase 2**: Refactor WorkoutsTab to use global context instead of local machine
3. **Phase 3**: Separate global workout state from local modal state
4. **Phase 4**: Enable mini playbar with global state access
5. **Phase 5**: Comprehensive testing and validation

## Success Validation

After implementation, this should work from any tab:
- Start workout in WorkoutsTab
- Navigate to Home/Progress/Profile tabs
- Workout state persists and mini playbar is visible
- Return to WorkoutsTab and workout is still active

## Critical Preservation

- **Zero changes** to machine files (`workoutLifecycleMachine.ts`, etc.)
- **All existing tests** must pass without modification
- **272ms template loading** performance maintained
- **NDK integration** and authentication flows preserved
- **WorkflowValidationTest** component continues working

---

**Ready to begin**: Start with Phase 1 - creating the global workout context using XState's official `createActorContext` pattern.
