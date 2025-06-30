---
status: completed
completed_date: 2025-06-29
completion_notes: "All implementation steps completed successfully. Live Nostr network verification confirms perfect functionality. Set number parameter successfully prevents unintended NDK deduplication while preserving intended deduplication behavior."
---

# NDK Deduplication Set Number Fix Implementation Task

## Objective
Implement set number parameter in NIP-101e exercise tags to fix NDK deduplication issue that silently drops identical workout sets, ensuring complete workout data integrity and enabling advanced training methodologies.

## Current State Analysis
- **Critical Issue**: NDK's `mergeTags()` deduplication drops identical exercise tags, causing silent data loss
- **Affected Systems**: `activeWorkoutMachine.ts`, `workoutAnalyticsService.ts`, `CompletedSet` interface
- **Current Format**: `["exercise", "ref", "", "weight", "reps", "rpe", "set_type"]`
- **Research Complete**: Comprehensive solution documented in `docs/research/ndk-tag-deduplication-solution.md`

## Technical Approach
- **Backward Compatible**: Add `set_number` as 8th parameter to maintain compatibility
- **Per-Exercise Numbering**: Track set numbers per exercise (not global) for superset/circuit support
- **Service Layer**: Update `workoutAnalyticsService.generateNIP101eEvent()` for business logic
- **Type Safety**: Update `CompletedSet` interface and related types
- **XState Integration**: Modify `activeWorkoutMachine` to track per-exercise set counters

## Implementation Steps

### Step 1: Update Type Definitions
- [ ] Add `setNumber: number` to `CompletedSet` interface in `workoutTypes.ts`
- [ ] Update `ActiveWorkoutContext` to include `exerciseSetCounters: Map<string, number>`
- [ ] Verify type compatibility across all workout-related files

### Step 2: Update Workout Analytics Service
- [ ] Modify `generateNIP101eEvent()` to include set number as 8th parameter
- [ ] Update exercise tag format: `["exercise", "ref", "", "weight", "reps", "rpe", "set_type", "set_number"]`
- [ ] Ensure backward compatibility for parsing existing events
- [ ] Add validation for set number parameter

### Step 3: Update Active Workout Machine
- [ ] Add `exerciseSetCounters` to machine context initialization
- [ ] Implement per-exercise set number tracking in `COMPLETE_SET` action
- [ ] Update `generateProgressiveSet()` to include set number
- [ ] Ensure set numbers reset properly when switching exercises

### Step 4: Update Related Components
- [ ] Update any components that create `CompletedSet` objects
- [ ] Verify `WorkflowValidationTest.tsx` handles new format
- [ ] Update test data to include set numbers

### Step 5: Testing & Validation
- [ ] Test with identical sets to verify deduplication bypass
- [ ] Validate superset scenarios (same set numbers across exercises)
- [ ] Test circuit training (round-based set numbering)
- [ ] Verify backward compatibility with existing events

## Success Criteria
- [ ] **Deduplication Fixed**: Multiple identical sets publish successfully without data loss
- [ ] **Backward Compatible**: Existing events parse correctly, new events include set numbers
- [ ] **Type Safety**: All TypeScript interfaces updated and compile without errors
- [ ] **Superset Support**: Same set numbers work across different exercises for paired training
- [ ] **Circuit Support**: Round-based numbering enables circuit training analytics
- [ ] **Real Workout Test**: Complete workout with multiple identical sets publishes all data

## Technical Details

### Updated Exercise Tag Format
```typescript
// Before (7 parameters)
["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal"]

// After (8 parameters - backward compatible)
["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal", "1"]
```

### Per-Exercise Set Counter Implementation
```typescript
// In activeWorkoutMachine context
exerciseSetCounters: new Map<string, number>()

// When completing a set
const exerciseRef = "33401:pubkey:exercise-d-tag";
const currentSetNumber = (context.exerciseSetCounters.get(exerciseRef) || 0) + 1;
context.exerciseSetCounters.set(exerciseRef, currentSetNumber);
```

### Service Layer Changes
```typescript
// In workoutAnalyticsService.generateNIP101eEvent()
workoutData.completedSets.forEach((set) => {
  const exerciseTag = [
    'exercise',
    set.exerciseRef,
    '', // relay-url
    set.weight.toString(),
    set.reps.toString(),
    (set.rpe || 7).toString(),
    set.setType,
    set.setNumber.toString() // NEW: 8th parameter
  ];
  tags.push(exerciseTag);
});
```

## References
- **Research Document**: `docs/research/ndk-tag-deduplication-solution.md` - Comprehensive analysis and solution
- **NDK Research**: `docs/research/ndk-tag-deduplication-research-findings.md` - Technical investigation
- **Service Architecture**: `.clinerules/service-layer-architecture.md` - Business logic patterns
- **NIP-101e Standards**: `.clinerules/nip-101e-standards.md` - Event format compliance
- **XState Patterns**: `.clinerules/xstate-anti-pattern-prevention.md` - State machine best practices

## Critical .clinerules Compliance
- **Simple Solutions First**: `.clinerules/simple-solutions-first.md` - Single parameter addition vs complex workarounds
- **Service Layer**: `.clinerules/service-layer-architecture.md` - Business logic in service, not machine
- **NIP-101e Standards**: `.clinerules/nip-101e-standards.md` - Maintain event format compliance
- **NDK Best Practices**: `.clinerules/ndk-best-practices.md` - Proper event publishing patterns

## Risk Mitigation
- **Breaking Change**: Mitigated by backward-compatible parameter order
- **Type Errors**: Update all interfaces before implementation
- **Data Loss**: Test thoroughly with identical sets before deployment
- **Performance**: Set counters are lightweight Map operations

## Future Benefits Enabled
- **Advanced Training**: Supersets, circuits, wave loading, pyramid training
- **Analytics**: Set-by-set progression tracking and fatigue analysis
- **Business Logic**: Workout flow control and template compliance
- **User Experience**: Clear progress indicators ("Set 2 of 4")

## Migration Strategy
1. **Phase 1**: Implement new format in current codebase
2. **Phase 2**: Test with real workout scenarios
3. **Phase 3**: Deploy and monitor for data integrity
4. **Phase 4**: Update documentation and examples

---

**Priority**: 🔴 **CRITICAL** - Blocking real workout usage
**Estimated Time**: 4-6 hours
**Dependencies**: None - self-contained fix
**Testing Required**: Extensive - data integrity critical
