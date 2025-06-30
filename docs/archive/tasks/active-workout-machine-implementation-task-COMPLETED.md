---
status: completed
completed_date: 2025-06-29
completion_notes: "Successfully implemented complete XState v5 activeWorkoutMachine following Noga patterns. Created setTrackingActor, activeWorkoutGuards, and integrated with existing workoutLifecycleMachine. Discovered and fixed NDK deduplication issue during implementation."
---

# Active Workout Machine Implementation Task

## Objective

Create a complete `activeWorkoutMachine` following proven Noga patterns to handle real-time workout execution, set tracking, and NDK publishing. This machine will replace the UI-based workout logic currently in `WorkflowValidationTest.tsx` and complete our XState architecture.

## Current State Analysis

### What Exists
- **workoutLifecycleMachine**: Parent orchestrator with placeholder `activeWorkoutMachine` actor
- **workoutSetupMachine**: Template selection and loading (working)
- **WorkflowValidationTest**: UI component handling active workout logic (needs extraction)
- **activeWorkoutTypes.ts**: Complete type definitions ready for use
- **publishWorkoutActor**: Working NDK publishing (ready for integration)

### What's Missing
- **activeWorkoutMachine.ts**: Core machine for workout execution
- **activeWorkoutGuards.ts**: Guard functions for state transitions
- **setTrackingActor.ts**: Individual set completion persistence
- **Proper parent-child integration**: Replace `fromPromise` with `spawnChild`

### Architecture Gap
```
Current (Broken):
workoutSetupMachine → WorkflowValidationTest (UI) → publishWorkoutActor

Target (Clean):
workoutSetupMachine → activeWorkoutMachine → publishWorkoutActor
```

## Technical Approach

### Domain Mapping: Golf → Workout
Following Noga's `activeRoundMachine.ts` patterns exactly:

| **Noga (Golf)** | **POWR (Workout)** |
|---|---|
| `currentHole: 1-18` | `currentExerciseIndex: 0-N` |
| `scores[playerId][hole]` | `completedSets[exerciseIndex][]` |
| `ScoreValue{strokes,putts}` | `CompletedSet{reps,weight,rpe}` |
| `CourseData{holes,par}` | `WorkoutTemplate{exercises}` |
| `RECORD_SCORE` | `COMPLETE_SET` |
| `NEXT_HOLE` | `NEXT_EXERCISE` |
| `NAVIGATE_TO_HOLE` | `NAVIGATE_TO_EXERCISE` |

### XState v5 Compliance
Based on `../ReferenceRepos/state-management/xstate/xstate-react.mdx`:
- Use `setup({ actors })` pattern with inline actors
- `fromPromise` for async operations
- `spawnChild` for parent-child communication
- `useMachine` hook for React integration
- `useSelector` for optimized re-renders

## Implementation Steps

### Phase 1: Foundation Files (Day 1)

#### Step 1.1: Create Guards File
**File**: `src/lib/machines/workout/guards/activeWorkoutGuards.ts`

**Pattern**: Follow `../noga/state/machines/round/guards/activeRoundGuards.ts`

**Required Guards**:
```typescript
export const activeWorkoutGuards = {
  // Exercise navigation (adapted from hole navigation)
  canGoToNextExercise: ({ context }) => context.currentExerciseIndex < context.totalExercises - 1,
  canGoToPreviousExercise: ({ context }) => context.currentExerciseIndex > 0,
  isValidExerciseIndex: ({ event }) => event.exerciseIndex >= 0 && event.exerciseIndex < context.totalExercises,
  
  // Set progression (adapted from score validation)
  hasMoreSets: ({ context }) => context.currentSetNumber < context.plannedSets,
  canCompleteSet: ({ context }) => !!context.currentSetData,
  isLastSet: ({ context }) => context.currentSetNumber >= context.plannedSets,
  isLastExercise: ({ context }) => context.currentExerciseIndex >= context.totalExercises - 1,
  
  // Completion validation (adapted from round completion)
  hasAllRequiredSets: ({ context }) => /* Validate all exercises have minimum sets */,
  canCompleteWorkout: ({ context }) => /* Check workout completion criteria */,
  
  // Publishing guards
  canPublish: ({ context }) => context.completedSets.length > 0,
  canRetryPublish: ({ context }) => !!context.error && context.publishingStatus.publishAttempts < 3
};
```

#### Step 1.2: Create Set Tracking Actor
**File**: `src/lib/machines/workout/actors/setTrackingActor.ts`

**Pattern**: Follow Noga's score persistence actors

**Purpose**: Handle individual set completion and NDK persistence
```typescript
export const setTrackingActor = fromPromise(async ({ input }: {
  input: { setData: CompletedSet; workoutId: string; userPubkey: string }
}) => {
  // Persist set to NDK cache immediately (optimistic)
  // Return success/failure for machine state updates
});
```

#### Step 1.3: Create Core Machine File
**File**: `src/lib/machines/workout/activeWorkoutMachine.ts`

**Pattern**: Follow `../noga/state/machines/round/activeRoundMachine.ts` structure exactly

**Key States** (adapted from Noga):
```typescript
states: {
  loadingTemplate: { /* Load exercise data like Noga loads course data */ },
  exercising: {
    initial: 'performingSet',
    states: {
      performingSet: { /* Active set execution */ },
      restPeriod: { /* Between sets like Noga's UI states */ },
      betweenExercises: { /* Exercise transition */ }
    }
  },
  paused: { /* Workout paused like round paused */ },
  completed: { /* All exercises done */ },
  saving: { /* Persist to NDK like Noga saves to database */ },
  showingSummary: { /* Display results */ },
  final: { /* Cleanup */ }
}
```

**Key Events** (adapted from Noga):
```typescript
export type ActiveWorkoutEvent =
  // Exercise navigation (like hole navigation)
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'NAVIGATE_TO_EXERCISE'; exerciseIndex: number }
  
  // Set completion (like score recording)
  | { type: 'START_SET'; setNumber: number }
  | { type: 'COMPLETE_SET'; setData: CompletedSet }
  | { type: 'START_REST_PERIOD'; duration: number }
  | { type: 'END_REST_PERIOD' }
  
  // Workout control (like round control)
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'CANCEL_WORKOUT' }
  
  // Publishing (like Noga's save events)
  | { type: 'PUBLISH_WORKOUT' }
  | { type: 'DISMISS_SUMMARY' };
```

**Inline Actors** (following XState v5 patterns):
```typescript
actors: {
  // Load template data (like Noga's loadCourseData)
  loadTemplateData: fromPromise(async ({ input }) => {
    // Load exercise details from NDK cache
    // Return structured template data
  }),
  
  // Track individual sets (like Noga's processPendingScores)
  trackCompletedSet: fromPromise(async ({ input }) => {
    // Persist set to NDK cache
    // Update workout progression
  }),
  
  // Save completed workout (like Noga's saveCompletedRound)
  saveCompletedWorkout: fromPromise(async ({ input }) => {
    // Use existing publishWorkoutActor
    // Generate NIP-101e event
  }),
  
  // Rest timer (new for workout domain)
  restTimer: fromPromise(async ({ input }) => {
    // Handle rest period timing
    // Return when rest is complete
  })
}
```

### Phase 2: Integration & Testing (Day 2)

#### Step 2.1: Update Lifecycle Machine
**File**: `src/lib/machines/workout/workoutLifecycleMachine.ts`

**Changes Required**:
1. Replace placeholder `activeWorkoutMachine` actor:
```typescript
// REMOVE this fromPromise placeholder:
activeWorkoutMachine: fromPromise(async ({ input }) => { /* placeholder */ })

// REPLACE with proper spawnChild:
spawnActiveWorkout: spawnChild('activeWorkoutMachine', {
  id: 'activeWorkout',
  input: ({ context }) => ({
    userInfo: context.userInfo,
    workoutData: context.workoutData!,
    templateSelection: context.templateSelection
  })
})
```

2. Import real machine:
```typescript
import { activeWorkoutMachine } from './activeWorkoutMachine';

// Add to actors:
actors: {
  activeWorkoutMachine, // Real machine, not fromPromise
  // ... other actors
}
```

#### Step 2.2: Create Test Component
**File**: `src/components/test/ActiveWorkoutMachineTest.tsx`

**Purpose**: Test machine in isolation following XState React patterns

**Pattern**: Use `useMachine` hook from XState React docs
```typescript
import { useMachine } from '@xstate/react';
import { activeWorkoutMachine } from '@/lib/machines/workout/activeWorkoutMachine';

export default function ActiveWorkoutMachineTest() {
  const [state, send] = useMachine(activeWorkoutMachine, {
    input: {
      userInfo: { pubkey: 'test-pubkey' },
      workoutData: { /* test data */ },
      templateSelection: { /* test template */ }
    }
  });

  // Test all state transitions and events
  // Validate set completion tracking
  // Test pause/resume functionality
}
```

#### Step 2.3: Update WorkflowValidationTest
**File**: `src/components/test/WorkflowValidationTest.tsx`

**Changes Required**:
1. Remove active workout logic from UI component
2. Use proper `workoutLifecycleMachine` integration
3. Keep only UI presentation logic

**Before** (UI handling active workout):
```typescript
const simulateWorkoutCompletion = () => {
  // Complex workout logic in UI component
};
```

**After** (Machine handling active workout):
```typescript
const [lifecycleState, lifecycleSend] = useMachine(workoutLifecycleMachine);
// UI only displays state, machine handles logic
```

### Phase 3: Architecture Compliance (Day 3)

#### Step 3.1: Service Layer Integration
**Follow**: `.clinerules/service-layer-architecture.md`

**Requirements**:
- Use `workoutAnalyticsService` for business logic only
- No NDK operations in machine (use actors)
- Pure functions for calculations
- Direct service calls (no injection)

**Example Integration**:
```typescript
// In machine actions:
actions: {
  calculateWorkoutStats: assign({
    workoutStats: ({ context }) => {
      // Use service for business logic
      return workoutAnalyticsService.calculateWorkoutStats(context.completedSets);
    }
  })
}
```

#### Step 3.2: NDK Integration
**Follow**: `.clinerules/web-ndk-actor-integration.md`

**Requirements**:
- Use Global NDK Actor for publishing
- Real-time set persistence through NDK cache
- Optimistic updates in context
- Error handling for network issues

**Integration Pattern**:
```typescript
// In machine actors:
saveCompletedWorkout: fromPromise(async ({ input }) => {
  // Use existing publishWorkoutActor
  const eventData = workoutAnalyticsService.generateNIP101eEvent(input.workoutData, input.userPubkey);
  
  // Publish via Global NDK Actor
  const result = await publishWorkoutActor({ input: { workoutData: eventData, userPubkey: input.userPubkey } });
  return result;
})
```

#### Step 3.3: NIP-101e Compliance
**Follow**: `.clinerules/nip-101e-standards.md`

**Requirements**:
- Proper workout record events (Kind 1301)
- Exercise references in correct format
- Set data with reps/weight/RPE/setType
- Event validation before publishing

**Event Structure**:
```typescript
// Generated by workoutAnalyticsService:
const workoutEvent = {
  kind: 1301,
  tags: [
    ['d', workoutId],
    ['title', workoutTitle],
    ['start', startTimestamp],
    ['end', endTimestamp],
    ['completed', 'true'],
    // Each completed set as exercise tag
    ['exercise', exerciseRef, '', weight.toString(), reps.toString(), rpe.toString(), setType]
  ]
};
```

## Success Criteria

### Functional Requirements
- [ ] Exercise progression (next/previous/navigate) working
- [ ] Set completion tracking (reps/weight/RPE) working
- [ ] Rest period management working
- [ ] Pause/resume functionality working
- [ ] Workout completion validation working
- [ ] Real-time NDK persistence working
- [ ] NIP-101e event publishing working

### Architecture Requirements
- [ ] Follows Noga patterns exactly (no reinvention)
- [ ] Complies with all .clinerules
- [ ] Clean separation: UI ↔ Machine ↔ Services
- [ ] XState v5 compliance (setup, fromPromise, spawnChild)
- [ ] NDK-first data flow (no custom database)
- [ ] Proper React integration (useMachine, useSelector)

### Integration Requirements
- [ ] Works with existing `workoutLifecycleMachine`
- [ ] Uses existing types from `activeWorkoutTypes.ts`
- [ ] Integrates with `workoutAnalyticsService`
- [ ] Publishes via `publishWorkoutActor`
- [ ] Replaces UI logic in `WorkflowValidationTest`

### Performance Requirements
- [ ] Set completion under 100ms (optimistic updates)
- [ ] Exercise navigation under 50ms
- [ ] Workout publishing under 2 seconds
- [ ] Memory usage stable (no leaks)

## References

### Noga Patterns (CRITICAL - Follow Exactly)
- `../noga/state/machines/round/activeRoundMachine.ts` - Core machine structure
- `../noga/state/machines/round/guards/activeRoundGuards.ts` - Guard patterns
- `../noga/state/machines/round/roundLifecycleMachine.ts` - Parent-child integration

### XState Documentation
- `../ReferenceRepos/state-management/xstate/xstate-react.mdx` - React integration patterns
- Official XState v5 docs for `setup`, `fromPromise`, `spawnChild`

### Project .clinerules (MANDATORY)
- `.clinerules/xstate-anti-pattern-prevention.md` - Prevent expensive workarounds
- `.clinerules/service-layer-architecture.md` - NDK-first service patterns
- `.clinerules/web-ndk-actor-integration.md` - Global NDK Actor usage
- `.clinerules/nip-101e-standards.md` - Event structure compliance
- `.clinerules/simple-solutions-first.md` - Avoid over-engineering

### Existing Code
- `src/lib/machines/workout/types/activeWorkoutTypes.ts` - Complete type definitions
- `src/lib/machines/workout/actors/publishWorkoutActor.ts` - Working publishing
- `src/lib/services/workoutAnalytics.ts` - Business logic service
- `src/components/test/WorkflowValidationTest.tsx` - Current UI logic to extract

## Risk Mitigation

### Technical Risks
- **Complex State Transitions**: Follow Noga patterns exactly (proven working)
- **Parent-Child Communication**: Use `spawnChild` pattern from Noga
- **NDK Integration**: Use existing working `publishWorkoutActor`
- **Type Safety**: Use existing `activeWorkoutTypes.ts` (already complete)

### Architecture Risks
- **Over-Engineering**: Follow `.clinerules/simple-solutions-first.md`
- **XState Anti-Patterns**: Follow `.clinerules/xstate-anti-pattern-prevention.md`
- **Service Injection**: Use direct calls per `.clinerules/service-layer-architecture.md`

### Integration Risks
- **Breaking Existing Flow**: Test with `WorkflowValidationTest` integration
- **Performance Regression**: Maintain optimistic updates and caching
- **Type Mismatches**: Use existing type definitions throughout

## Timeline

### Day 1: Foundation (6 hours)
- **Morning**: Create guards and set tracking actor (2 hours)
- **Afternoon**: Create core machine file following Noga patterns (4 hours)

### Day 2: Integration (4 hours)
- **Morning**: Update lifecycle machine and create test component (2 hours)
- **Afternoon**: Update WorkflowValidationTest integration (2 hours)

### Day 3: Compliance (4 hours)
- **Morning**: Service layer and NDK integration (2 hours)
- **Afternoon**: NIP-101e compliance and final testing (2 hours)

**Total Estimate**: 14 hours over 3 days

## Validation Plan

### Unit Testing
- [ ] Test all guards with various context states
- [ ] Test all state transitions with proper events
- [ ] Test actor inputs/outputs with mock data
- [ ] Test error handling and recovery

### Integration Testing
- [ ] Test with real NDK cache operations
- [ ] Test with actual workout templates
- [ ] Test parent-child machine communication
- [ ] Test React component integration

### End-to-End Testing
- [ ] Complete workout flow: setup → active → publish
- [ ] Real set completion with NDK persistence
- [ ] Pause/resume functionality
- [ ] Error scenarios and recovery

This implementation will complete our XState architecture and provide a production-ready active workout machine that follows all established patterns and compliance requirements.

---

**Last Updated**: 2025-06-28
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Estimated Effort**: 14 hours over 3 days
**Risk Level**: Low (following proven patterns)
