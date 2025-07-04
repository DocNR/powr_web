---
title: Workout Lifecycle Machine Completion Task
description: Complete the workout lifecycle machine implementation with real template data integration
status: completed
created_date: 2025-07-03
completed_date: 2025-07-03
priority: high
estimated_effort: 4-6 hours
category: xstate-integration
completion_notes: "Fixed XState output passing issue and replaced hardcoded values with real template data. Verified with NAK commands showing authentic exercise data from Nostr events."
related_files:
  - src/lib/machines/workout/workoutLifecycleMachine.ts
  - src/lib/machines/workout/workoutSetupMachine.ts
  - src/components/powr-ui/workout/WorkoutDetailModal.tsx
dependencies:
  - Phase 2 dependency resolution service
  - XState workout machines
  - WorkoutDetailModal component
---

# Workout Lifecycle Machine Completion Task

## Objective

Fix the XState invoke output passing between setupMachine and workoutLifecycleMachine. The setupMachine generates correct output but workoutLifecycleMachine receives `undefined` due to a type/interface mismatch in the invoke mechanism.

## CRITICAL UPDATE: Exact Problem Identified

### Console Evidence (2025-07-03 13:46:35)
```
[WorkoutSetupMachine] Generated output: 
Object { templateSelection: {…}, workoutData: {…} }

[WorkoutLifecycle] Setup machine output: undefined
[WorkoutLifecycle] Has workoutData: false
[WorkoutLifecycle] Has templateSelection: false
[WorkoutLifecycle] Guard result: false
```

**Root Cause:** XState invoke output passing failure - setupMachine output function returns data but parent machine receives `undefined`.

**Key Insight:** The machine integration is working perfectly. The issue is purely in the output function of setupMachine or type compatibility between machines.

## Current State Analysis

### ✅ What's Working Perfectly
- ✅ **Machine Integration**: All state transitions work correctly
- ✅ **Event Flow**: `START_SETUP` event sent correctly from WorkoutsTab
- ✅ **State Transitions**: Machine transitions to `setup` state properly
- ✅ **setupMachine Invoke**: setupMachine invoked with correct input
- ✅ **Dependency Resolution**: 855ms resolution with 3 exercises loaded
- ✅ **Data Loading**: Template and exercises loaded via DependencyResolutionService
- ✅ **Output Generation**: setupMachine creates output object correctly

### 🔍 The Exact Problem
- ❌ **Output Passing**: setupMachine generates output but workoutLifecycleMachine receives `undefined`
- ❌ **Type Mismatch**: Likely interface incompatibility between machines
- ❌ **Guard Failure**: Guard function fails because output is undefined

### Current Problematic Code
**Evidence from workoutLifecycleMachine.ts:**
```typescript
onDone: [
  {
    target: 'setupComplete',
    guard: ({ event }) => {
      const output = event.output as SetupMachineOutput | undefined;
      // This receives undefined even though setupMachine generates output
      return !!(output?.workoutData && output?.templateSelection);
    }
  }
]
```

**Evidence from setupMachine output function (lines 283-314):**
```typescript
output: ({ context }) => {
  console.log('[WorkoutSetupMachine] Generated output:', { templateSelection, workoutData });
  return { templateSelection, workoutData }; // This is generated but not received
}
```

## Critical User Flow Architecture Decision

### **IMPORTANT: Unified Dependency Resolution Strategy**

**Problem**: We currently have TWO separate dependency resolution systems:
1. **WorkoutDetailModal**: Uses `dependencyResolutionService` to resolve exercises for display
2. **Setup Machine**: Has its own dependency resolution logic

**Solution**: Eliminate duplication by using a single, clean architecture:

### **New User Flow Sequence (CRITICAL)**

1. **User clicks workout template in WorkoutsTab** → Start `workoutLifecycleMachine` with `preselectedTemplateId`
2. **Remove dependency resolution from WorkoutDetailModal** → Modal gets resolved data from machine state
3. **Setup machine handles ALL dependency resolution** → Single source of truth through proper XState invoke
4. **WorkoutDetailModal displays resolved data** → Shows exercise names, sets, reps from machine context

### **Architecture Benefits**
- ✅ **Single Dependency Resolution**: Only setup machine resolves dependencies
- ✅ **Proper XState Patterns**: Follow NOGA invoke pattern exactly
- ✅ **Cleaner UI Integration**: Modal gets data from machine state, not separate service
- ✅ **Better Performance**: No duplicate resolution calls
- ✅ **Easier Testing**: Single data flow path to validate

### **Implementation Sequence**
1. **Start machine when template clicked** (in `handleWorkoutSelect`)
2. **Remove `dependencyResolutionService` from WorkoutDetailModal**
3. **Setup machine resolves dependencies** via proper invoke pattern
4. **Modal displays machine state data** instead of separate resolution
5. **Handle modal cancellation** → Properly stop and clean up machine when user closes modal

### **Critical: Machine Cleanup on Modal Close**

**Problem**: If user closes the detail modal without starting the workout, the machine continues running in the background, wasting resources and potentially causing state conflicts.

**Solution**: Implement proper machine termination:

```typescript
const handleCloseModal = () => {
  // If machine is running (in setup state), stop it
  if (workoutState.matches('setup')) {
    workoutSend({ type: 'CANCEL_SETUP' });
  }
  
  setIsModalOpen(false);
  setSelectedWorkout(null);
  setModalError(undefined);
};
```

**Required Machine Events**:
- `CANCEL_SETUP` → Transition from setup state back to idle
- `RESET` → Clear all context and return to initial state
- Proper cleanup of any spawned actors or ongoing operations

This follows the NOGA pattern exactly and eliminates the architectural duplication we currently have.

## Technical Approach

### Follow NOGA Pattern Exactly

**NOGA roundLifecycleMachine setup state**:
```typescript
setup: {
  invoke: {
    src: 'setupMachine',
    input: ({ context }) => ({ /* input */ }),
    onDone: { target: 'active' }
  }
}
```

**Our workoutLifecycleMachine should be**:
```typescript
setup: {
  invoke: {
    src: 'setupMachine',  // Real workoutSetupMachine
    input: ({ context }) => ({
      userPubkey: context.userInfo.pubkey,
      preselectedTemplateId: context.preselectedTemplateId
    }),
    onDone: {
      target: 'active',
      actions: [
        assign({
          templateSelection: ({ event }) => event.output.templateSelection,
          workoutData: ({ event }) => event.output.workoutData
        }),
        'spawnActiveWorkout'
      ]
    }
  }
}
```

### UI Integration Strategy

**Current WorkoutsTab Integration Gap**:
The existing `handleWorkoutSelect` only opens a modal and doesn't connect to XState machines. We need to add proper machine integration.

**Required UI Changes**:

```typescript
// In WorkoutsTab - Add machine integration
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import { useActor } from '@xstate/react';

const WorkoutsTab = () => {
  const [state, send] = useActor(workoutLifecycleMachine);
  
  // Enhanced handleStartWorkout with machine integration
  const handleStartWorkout = (templateId: string) => {
    // Send event to lifecycle machine
    send({ 
      type: 'START_SETUP',
      preselectedTemplateId: templateId 
    });
    
    // Navigation strategy: Stay in WorkoutsTab but show setup UI
    // OR navigate to dedicated workout setup screen
    // Decision: Use modal overlay for setup to maintain context
    setShowWorkoutSetup(true);
  };
  
  // Handle machine state changes
  useEffect(() => {
    if (state.matches('setup')) {
      // Show setup UI (template loading, customization)
      setShowWorkoutSetup(true);
    } else if (state.matches('active')) {
      // Navigate to active workout screen
      navigate('/workout/active');
    } else if (state.matches('completed')) {
      // Show completion UI or navigate back
      setShowWorkoutSetup(false);
    }
  }, [state.value]);
};
```

**Complete UI Flow**:
1. **WorkoutsTab**: User browses templates, clicks "Start Workout" button
2. **Machine Event**: `handleStartWorkout` sends `START_SETUP` with `preselectedTemplateId`
3. **Setup UI**: Modal/overlay shows template loading and customization
4. **Setup Machine**: Handles dependency resolution (697ms) and user customization
5. **Confirmation**: User confirms workout setup
6. **Active Navigation**: Navigate to active workout screen
7. **Active Machine**: Spawned activeWorkoutMachine handles workout tracking

### Machine Compatibility Verification

**Required Interface Alignment**:

```typescript
// 1. workoutLifecycleMachine → workoutSetupMachine
interface SetupMachineInput {
  userPubkey: string;
  preselectedTemplateId?: string;
  // Verify these match workoutSetupMachine expectations
}

// 2. workoutSetupMachine → workoutLifecycleMachine  
interface SetupMachineOutput {
  templateSelection: {
    templateId: string;
    templatePubkey: string;
    templateReference: string;
    templateRelayUrl: string;
  };
  workoutData: {
    workoutId: string;
    title: string;
    exercises: Exercise[];
    workoutType: 'strength' | 'cardio' | 'flexibility';
  };
  // Verify these match workoutLifecycleMachine context expectations
}

// 3. workoutLifecycleMachine → activeWorkoutMachine
interface ActiveWorkoutMachineInput {
  userInfo: UserInfo;
  workoutData: WorkoutData;
  templateSelection: TemplateSelection;
  // Verify these match activeWorkoutMachine expectations
}
```

**Compatibility Verification Steps**:
- [ ] Verify `workoutSetupMachine.input` accepts `SetupMachineInput` format
- [ ] Verify `workoutSetupMachine.output` provides `SetupMachineOutput` format  
- [ ] Verify `activeWorkoutMachine.input` accepts `ActiveWorkoutMachineInput` format
- [ ] Check type definitions in `workoutLifecycleTypes.ts` for consistency
- [ ] Validate data flow through CompleteWorkoutFlowTest

## Implementation Steps

### Step 1: Fix workoutLifecycleMachine Setup State
- [ ] Replace inline setup states with proper setupMachine invoke
- [ ] Add preselectedTemplateId to context from START_SETUP event
- [ ] Handle setupMachine output properly

### Step 2: Enhance workoutSetupMachine Input/Output
- [ ] Accept preselectedTemplateId in input
- [ ] Auto-select template if preselected
- [ ] Return proper templateSelection and workoutData in output

### Step 3: Integrate DependencyResolutionService
- [ ] Replace loadTemplateActor with DependencyResolutionService in setupMachine
- [ ] Maintain 697ms performance we've already achieved
- [ ] Use proven dependency resolution patterns

### Step 4: UI Integration Implementation
- [ ] Add workoutLifecycleMachine integration to WorkoutsTab
- [ ] Start machine in `handleWorkoutSelect` (template preview click) 
- [ ] Remove dependency resolution from WorkoutDetailModal 
- [ ] Modal displays resolved data from machine state instead of separate service
- [ ] Implement `handleStartWorkout` to spawn active machine
- [ ] Add proper machine cleanup in `handleCloseModal`
- [ ] Add machine state-based UI updates with useEffect

### Step 5: Machine Compatibility Verification
- [ ] Verify input/output interfaces match between machines
- [ ] Test data flow: lifecycle → setup → active
- [ ] Validate type definitions in workoutLifecycleTypes.ts
- [ ] Ensure DependencyResolutionService integration works with setupMachine

### Step 6: Enhanced Testing Strategy
- [ ] Enhance CompleteWorkoutFlowTest to include UI integration
- [ ] Add specific tests for machine input/output compatibility
- [ ] Test template selection flow end-to-end
- [ ] Validate 697ms dependency resolution performance maintained

### Step 7: Clean up
- [ ] Clean up technical debt, update task document and changelog, confirm deliverables met

## Success Criteria

### Core Architecture
- [ ] workoutLifecycleMachine properly invokes setupMachine (no inline states)
- [ ] User's template selection is respected (no auto-selection of first template)
- [ ] DependencyResolutionService integrated with 697ms performance maintained
- [ ] NOGA pattern compliance: invoke setupMachine exactly like roundLifecycleMachine

### UI Integration
- [ ] WorkoutsTab "Start Workout" button sends START_SETUP event to machine
- [ ] Setup UI shows template loading and customization options
- [ ] Navigation strategy implemented (modal overlay or dedicated screen)
- [ ] Machine state changes drive UI updates correctly

### Machine Compatibility
- [ ] Input/output interfaces verified and compatible between all machines
- [ ] Data flows correctly: workoutLifecycleMachine → setupMachine → activeWorkoutMachine
- [ ] Type definitions consistent across workoutLifecycleTypes.ts

### Testing Validation
- [ ] CompleteWorkoutFlowTest validates complete parent-child architecture
- [ ] Enhanced test covers UI integration and machine compatibility
- [ ] End-to-end flow tested: Template click → Setup → Preview → Start → Active workout
- [ ] Performance maintained: 697ms dependency resolution, responsive UI updates

### User Experience
- [ ] Template selection respects user choice (specific template, not auto-selected)
- [ ] Setup flow allows customization before starting workout
- [ ] Smooth transitions between browsing, setup, and active workout states
- [ ] Error handling for failed dependency resolution or machine errors

## References

### NOGA Reference Patterns
- `/Users/danielwyler/noga/state/machines/round/roundLifecycleMachine.ts` - Exact invoke pattern to follow
- `/Users/danielwyler/noga/state/machines/round/setupMachine.ts` - Child machine structure

### Existing Working Components
- `src/lib/services/dependencyResolution.ts` - Proven 697ms performance
- `src/components/test/CompleteWorkoutFlowTest.tsx` - Architecture validation
- `src/lib/machines/workout/workoutSetupMachine.ts` - Real setup machine to use

### .clinerules Compliance
- `.clinerules/xstate-anti-pattern-prevention.md` - Avoid workarounds, use proper invoke
- `.clinerules/simple-solutions-first.md` - Use existing machines instead of bypassing
- `.clinerules/web-ndk-actor-integration.md` - Maintain spawn pattern for activeWorkoutMachine

## Key Insight

**The problem is simple**: We built a proper workoutSetupMachine but the workoutLifecycleMachine bypasses it with simplified inline logic. The fix is to use the machines we built properly, following the exact NOGA invoke pattern.

**One change needed**: Replace the entire setup state with a single invoke of the real setupMachine, just like NOGA does with roundLifecycleMachine → setupMachine.
