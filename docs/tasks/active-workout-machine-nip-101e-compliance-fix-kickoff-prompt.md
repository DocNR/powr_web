# Active Workout Machine NIP-101e Compliance Fix - Kickoff Prompt

## Task Summary
Fix the activeWorkoutMachine to properly use data from 33402 workout template events instead of generating hardcoded progressive set data. The machine currently uses a `generateProgressiveSet` function that creates mock data (decreasing reps, increasing RPE, varying set types) instead of using the actual prescribed parameters from the loaded 33402 template. This fix ensures full NIP-101e compliance and proper template-driven workout execution.

## Key Technical Approach
- **Remove hardcoded generation**: Eliminate `generateProgressiveSet` function entirely
- **Parse template data**: Extract prescribed weight, reps, rpe, set_type from 33402 exercise tags
- **Use template defaults**: Apply prescribed values as defaults with user override capability
- **Maintain NDK deduplication**: Keep existing per-exercise set counters
- **Preserve machine interface**: No breaking changes to event structure or state flow

## Primary Goal/Outcome
Create a fully NIP-101e compliant activeWorkoutMachine that uses actual template data instead of hardcoded progressions, enabling proper template-driven workouts while maintaining all existing functionality and performance characteristics.

## Key Files to Review

### **Critical Task Document**
- `docs/tasks/active-workout-machine-nip-101e-compliance-fix-task.md` - Complete implementation requirements and success criteria

### **Core Implementation Files**
- `src/lib/machines/workout/activeWorkoutMachine.ts` - Main machine with `generateProgressiveSet` function to remove
- `src/lib/machines/workout/types/activeWorkoutTypes.ts` - Type definitions requiring updates
- `src/lib/machines/workout/actors/loadTemplateActor.ts` - Template loading logic (working correctly)

### **NIP-101e Specification**
- `docs/nip-101e-specification.md` - 33402 workout template format and requirements
- `.clinerules/nip-101e-standards.md` - Event generation and parsing standards

### **Architecture References**
- `.clinerules/xstate-anti-pattern-prevention.md` - XState best practices (MANDATORY)
- `src/lib/machines/workout/workoutLifecycleMachine.ts` - Parent machine integration
- `src/components/powr-ui/workout/WorkoutDetailModal.tsx` - UI integration point

## Starting Point
Begin with **Step 1: Remove Hardcoded Generation** from the task document:

1. **Locate and analyze** the `generateProgressiveSet` function in `activeWorkoutMachine.ts`
2. **Identify all references** to progressive set generation throughout the machine
3. **Remove the function** and clean up related console.log statements
4. **Update the COMPLETE_SET event handler** to prepare for template data usage

## Critical Implementation Requirements

### **✅ MUST PRESERVE**
```typescript
// Existing event structure must remain unchanged for UI compatibility
COMPLETE_SET: {
  target: 'restPeriod',
  actions: [
    assign({
      workoutData: ({ context, event }) => {
        // NEW: Use template data with user overrides
        // OLD: generateProgressiveSet(exercise, setNumber, totalSets)
      }
    })
  ]
}
```

### **✅ MUST IMPLEMENT**
```typescript
// Parse 33402 template exercise parameters
interface TemplateExercise {
  exerciseRef: string;
  prescribedWeight: number;
  prescribedReps: number;
  prescribedRPE: number;
  prescribedSetType: 'warmup' | 'normal' | 'drop' | 'failure';
  plannedSets: number;
}
```

### **❌ MUST REMOVE**
```typescript
// This entire function and all its calls
const generateProgressiveSet = (
  exercise: { reps: number; weight?: number; sets: number },
  setNumber: number,
  totalSets: number
) => {
  // All hardcoded progressive logic must be deleted
};
```

## Success Criteria Highlights (80% minimum)
- Machine uses actual 33402 template parameters instead of hardcoded data
- Prescribed weight, reps, rpe, set_type from template are applied as defaults
- User can still modify template values during workout (via UI)
- Generated 1301 workout records contain actual workout data, not mock progressions
- NDK deduplication fix (per-exercise set counters) remains functional
- No breaking changes to machine's public interface

## Dependencies Already Available
- ✅ `loadTemplateActor` - Successfully loads 33402 templates
- ✅ `setTrackingActor` - Handles set completion and publishing
- ✅ `publishWorkoutActor` - Publishes 1301 workout records
- ✅ NDK integration - Publishing and caching working correctly
- ✅ Type definitions - Base types exist, need enhancement

## Timeline
- **Day 1**: Core Implementation (4-5 hours) - Remove hardcoded generation, update context types, modify COMPLETE_SET handler
- **Day 2**: Testing and Validation (3-4 hours) - Test with real 33402 data, validate NIP-101e compliance
- **Day 3**: Polish and Documentation (2-3 hours) - Error handling, edge cases, final validation

## Important Notes
- **NIP-101e Compliance**: Critical for proper Nostr integration
- **No Breaking Changes**: UI integration must continue to work unchanged
- **Template-Driven**: All set data should come from 33402 template with user overrides
- **Performance**: Template parsing must be efficient (< 50ms)

## Risk Mitigation
- **Incremental changes**: Make small, testable modifications
- **Type safety**: Use TypeScript to catch integration issues
- **Fallback mechanisms**: Graceful degradation for malformed templates
- **Comprehensive testing**: Validate with various template formats

---

**Ready to implement! Start by examining the `generateProgressiveSet` function in activeWorkoutMachine.ts and understanding how it's currently used in the COMPLETE_SET event handler.**
