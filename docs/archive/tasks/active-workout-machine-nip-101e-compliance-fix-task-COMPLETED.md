---
status: completed
completed_date: 2025-07-09
completion_notes: "Successfully fixed activeWorkoutMachine to use actual 33402 template data instead of hardcoded progressive set generation. Fixed template loading actor input mapping and implemented template-driven set completion with prescribed parameters."
---

# Active Workout Machine NIP-101e Compliance Fix Task

## Objective
Fix the activeWorkoutMachine to properly use data from 33402 workout template events instead of generating hardcoded progressive set data, ensuring full NIP-101e compliance and proper template-driven workout execution.

## Current State Analysis

### What Exists Now
- **activeWorkoutMachine.ts**: Complete XState v5 implementation with working state management
- **loadTemplateActor**: Successfully loads 33402 workout template events from NDK
- **setTrackingActor**: Handles set completion and publishing
- **publishWorkoutActor**: Publishes completed workouts as 1301 events
- **NDK deduplication fix**: Per-exercise set counters already implemented

### Critical Issue Identified
The machine currently uses a `generateProgressiveSet` function that creates hardcoded progressive data (decreasing reps, increasing RPE, varying set types) instead of using the actual prescribed parameters from the 33402 workout template event.

### NIP-101e Specification Requirements
According to `docs/nip-101e-specification.md`, 33402 workout templates contain exercise tags with prescribed parameters:
```
["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-url>", "<weight>", "<reps>", "<rpe>", "<set_type>"]
```

Example from spec:
```
["exercise", "33401:<pubkey>:<UUID-squat>", "<relay-url>", "", "5", "7", "normal"]
["exercise", "33401:<pubkey>:<UUID-deadlift>", "<relay-url>", "", "4", "7", "normal"]
```

### Mock Data vs Real Template Data
The machine currently generates mock progressive data instead of using the actual template parameters loaded by `loadTemplateActor`.

## Technical Approach

### Core Fix Strategy
1. **Remove hardcoded generation**: Eliminate `generateProgressiveSet` function
2. **Parse template data**: Extract prescribed parameters from loaded 33402 template
3. **Use template defaults**: Apply prescribed values as defaults for set completion
4. **Allow user modification**: Enable UI to override template defaults during workout
5. **Maintain NDK deduplication fix**: Keep per-exercise set counters

### XState Integration Requirements
- **No breaking changes** to the machine's public interface
- **Preserve existing state flow**: loadingTemplate → exercising → completed → publishing
- **Maintain event structure**: `COMPLETE_SET` event should work with UI
- **Keep NDK integration**: Publishing and caching should remain unchanged

### Web Browser Optimizations
- **Template parsing performance**: Efficient extraction of exercise parameters
- **Memory management**: Store parsed template data in context efficiently
- **Error handling**: Graceful fallbacks for malformed template data

## Implementation Steps

### Step 1: Remove Hardcoded Generation
- [ ] Delete `generateProgressiveSet` function from activeWorkoutMachine.ts
- [ ] Remove all references to progressive set generation
- [ ] Clean up related console.log statements about progressive testing

### Step 2: Enhance Template Data Structure
- [ ] Update `ActiveWorkoutContext` to include parsed exercise parameters
- [ ] Add `templateExercises` field with prescribed values per exercise
- [ ] Ensure type safety for template parameter access

### Step 3: Parse 33402 Template Data
- [ ] Modify template loading logic to extract exercise tag parameters
- [ ] Parse weight, reps, rpe, set_type from each exercise tag
- [ ] Store parsed data in machine context for easy access

### Step 4: Update COMPLETE_SET Event Handler
- [ ] Use template prescribed values as defaults
- [ ] Allow event data to override template defaults
- [ ] Maintain per-exercise set counter for NDK deduplication
- [ ] Preserve existing event structure for UI compatibility

### Step 5: Add Template Validation
- [ ] Validate 33402 template structure on load
- [ ] Handle missing or malformed exercise parameters
- [ ] Provide sensible fallbacks for incomplete template data

### Step 6: Update Type Definitions
- [ ] Add types for parsed template exercise data
- [ ] Update context types to include template parameters
- [ ] Ensure type safety throughout the machine

### Step 7: Testing and Validation
- [ ] Test with real 33402 template events
- [ ] Verify prescribed parameters are used correctly
- [ ] Validate NIP-101e compliance of generated 1301 events
- [ ] Test fallback behavior for malformed templates

## Success Criteria

### Primary Success Criteria (80% minimum)
- [ ] Machine uses actual 33402 template parameters instead of hardcoded data
- [ ] Prescribed weight, reps, rpe, set_type from template are applied as defaults
- [ ] User can still modify template values during workout (via UI)
- [ ] Generated 1301 workout records contain actual workout data, not mock progressions
- [ ] NDK deduplication fix (per-exercise set counters) remains functional

### NIP-101e Compliance Criteria
- [ ] All exercise references follow "kind:pubkey:d-tag" format
- [ ] Template parameters are correctly parsed from 33402 events
- [ ] Published 1301 events contain accurate set data
- [ ] Template reference is properly included in workout records

### Architecture Validation Criteria
- [ ] No breaking changes to machine's public interface
- [ ] XState v5 patterns maintained throughout
- [ ] UI integration points remain unchanged
- [ ] Performance impact is minimal (template parsing < 50ms)

### Testing Criteria
- [ ] Machine works with various 33402 template formats
- [ ] Graceful handling of malformed template data
- [ ] Proper fallback behavior when template parameters are missing
- [ ] Integration tests pass with real NDK data

## Technical Implementation Details

### Template Data Parsing Logic
```typescript
// Parse exercise parameters from 33402 template
const parseTemplateExercises = (template: WorkoutTemplate) => {
  return template.exercises.map(exercise => ({
    exerciseRef: exercise.exerciseRef,
    prescribedWeight: exercise.weight || 0,
    prescribedReps: exercise.reps || 10,
    prescribedRPE: exercise.rpe || 7,
    prescribedSetType: exercise.setType || 'normal',
    plannedSets: exercise.sets || 3
  }));
};
```

### Updated COMPLETE_SET Handler
```typescript
// Use template data with user overrides
COMPLETE_SET: {
  target: 'restPeriod',
  actions: [
    assign({
      workoutData: ({ context, event }) => {
        const currentExercise = context.templateExercises[context.exerciseProgression.currentExerciseIndex];
        
        // Use template defaults with user overrides
        const setData = {
          exerciseRef: currentExercise.exerciseRef,
          setNumber: getPerExerciseSetNumber(context, currentExercise.exerciseRef),
          reps: event.setData?.reps ?? currentExercise.prescribedReps,
          weight: event.setData?.weight ?? currentExercise.prescribedWeight,
          rpe: event.setData?.rpe ?? currentExercise.prescribedRPE,
          setType: event.setData?.setType ?? currentExercise.prescribedSetType,
          completedAt: Date.now()
        };
        
        return {
          ...context.workoutData,
          completedSets: [...context.workoutData.completedSets, setData]
        };
      }
    })
  ]
}
```

### Context Type Updates
```typescript
interface ActiveWorkoutContext {
  // ... existing fields
  templateExercises: Array<{
    exerciseRef: string;
    prescribedWeight: number;
    prescribedReps: number;
    prescribedRPE: number;
    prescribedSetType: 'warmup' | 'normal' | 'drop' | 'failure';
    plannedSets: number;
  }>;
}
```

## References

### Required Documentation Review
- **docs/nip-101e-specification.md** - Workout event specifications and 33402 format
- **.clinerules/nip-101e-standards.md** - Event generation and parsing standards
- **.clinerules/xstate-anti-pattern-prevention.md** - XState best practices
- **src/lib/machines/workout/activeWorkoutMachine.ts** - Current implementation
- **src/lib/machines/workout/actors/loadTemplateActor.ts** - Template loading logic

### Related Files
- **src/lib/machines/workout/types/activeWorkoutTypes.ts** - Type definitions
- **src/lib/machines/workout/workoutLifecycleMachine.ts** - Parent machine integration
- **src/components/powr-ui/workout/WorkoutDetailModal.tsx** - UI integration point
- **src/lib/services/workoutAnalytics.ts** - Event generation utilities

### Testing Files
- **src/components/test/WorkoutLifecycleMachineIntegrationTest.tsx** - Integration testing
- **src/components/test/CompleteWorkoutFlowTest.tsx** - End-to-end workflow testing

## Risk Assessment

### Low Risk Areas
- **Type definitions**: Additive changes only
- **Template parsing**: Isolated logic with clear inputs/outputs
- **NDK integration**: No changes to publishing or caching logic

### Medium Risk Areas
- **Context structure changes**: May require careful migration
- **Event handler modifications**: Core machine logic changes
- **Template validation**: Need robust error handling

### Mitigation Strategies
- **Incremental implementation**: Make changes in small, testable steps
- **Comprehensive testing**: Test with various template formats
- **Fallback mechanisms**: Ensure graceful degradation for edge cases
- **Type safety**: Use TypeScript to catch integration issues early

## Timeline Estimate

### Day 1: Core Implementation (4-5 hours)
- Remove `generateProgressiveSet` function
- Update context types and template parsing
- Modify `COMPLETE_SET` event handler

### Day 2: Testing and Validation (3-4 hours)
- Test with real 33402 template data
- Validate NIP-101e compliance
- Integration testing with UI components

### Day 3: Polish and Documentation (2-3 hours)
- Error handling and edge cases
- Update documentation
- Final validation and cleanup

**Total Estimated Time: 9-12 hours over 3 days**

## Dependencies

### Prerequisites
- **33402 template events**: Need real template data for testing
- **loadTemplateActor**: Must be working correctly (currently is)
- **NDK integration**: Publishing and caching must be functional (currently is)

### Blocking Issues
- None identified - all dependencies are currently satisfied

### Integration Points
- **UI components**: Must work with updated machine (no breaking changes planned)
- **Parent machines**: workoutLifecycleMachine integration must be preserved
- **Publishing actors**: Must continue to work with updated context structure

## Post-Implementation

### Documentation Updates
- Update machine documentation with template parsing details
- Document new context structure and type definitions
- Add examples of proper 33402 template usage

### Testing Strategy
- Create test cases for various template formats
- Validate against NIP-101e specification compliance
- Integration testing with real NDK data

### Architecture Validation
- Confirm NDK-first architecture benefits are maintained
- Validate performance characteristics
- Document patterns for golf app migration

## Success Metrics

### Functional Metrics
- **100% NIP-101e compliance**: All generated events follow specification
- **Template parameter usage**: Prescribed values used as defaults
- **User override capability**: UI can modify template defaults
- **NDK deduplication**: Per-exercise set counters working correctly

### Performance Metrics
- **Template parsing**: < 50ms for typical templates
- **Memory usage**: No significant increase in context size
- **Machine responsiveness**: No noticeable delay in state transitions

### Quality Metrics
- **Type safety**: No TypeScript errors or warnings
- **Test coverage**: All new logic covered by tests
- **Error handling**: Graceful degradation for edge cases
- **Code clarity**: Clear, maintainable implementation

---

**Created**: 2025-07-09
**Priority**: High (blocks Active Workout UI implementation)
**Estimated Effort**: 9-12 hours over 3 days
**Dependencies**: None (all prerequisites satisfied)
**Risk Level**: Medium (core machine logic changes)
