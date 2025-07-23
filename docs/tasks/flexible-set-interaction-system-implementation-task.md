# Flexible Set Interaction System Implementation Task

## Objective

Transform the POWR Workout PWA from rigid, machine-centric set interaction to a flexible, user-centric system that supports professional-grade fitness training methodologies. This addresses the critical "wrong set completion bug" where clicking any checkbox completes the "current set" instead of the clicked set, and enables advanced training patterns like supersets, circuits, and non-linear progression.

**Core Principle**: "The app follows what the user is working on, not the other way around"

## Current State Analysis

### Existing Architecture Issues
- **Machine-Centric Design**: Current system built around `currentExerciseIndex` and `currentSetNumber` progression from golf app patterns
- **Wrong Set Completion Bug**: Clicking any set checkbox triggers `COMPLETE_SET` event which completes the machine's "current set" rather than the clicked set
- **Rigid Progression**: Linear exercise-by-exercise flow doesn't support supersets, circuits, or flexible training
- **Limited Editing**: No ability to edit completed sets or uncomplete them for corrections
- **Poor Mobile UX**: Users cannot naturally switch focus between exercises during complex workouts

### Current Implementation
- **XState Machine**: `activeWorkoutMachine.ts` uses linear progression with auto-generated set data
- **UI Component**: `SetRow.tsx` only allows editing when `isActive={true}` 
- **Event System**: Single `COMPLETE_SET` event with machine context dependency
- **Data Structure**: `CompletedSet` interface with unique `setNumber` for NDK deduplication

### Working Elements to Preserve
- **NDK Integration**: Unique set numbers for deduplication prevention
- **NIP-101e Compliance**: Event structure and tagging standards
- **XState v5 Patterns**: Proper actor setup and event handling
- **Data Persistence**: NDK cache-first architecture

## Technical Approach

### Phase 1: Enhanced Event System (Incremental)
**Goal**: Add flexible set interaction events alongside existing patterns
**Duration**: 4-6 days
**Approach**: Additive enhancement - no breaking changes

#### A. New Event Types
Following existing naming conventions (`COMPLETE_SET`, `NAVIGATE_TO_EXERCISE`):

```typescript
export type ActiveWorkoutEvent = 
  // Existing events (preserved)
  | { type: 'COMPLETE_SET'; setData?: Partial<CompletedSet> }
  | { type: 'NAVIGATE_TO_EXERCISE'; exerciseIndex: number }
  
  // New flexible interaction events
  | { type: 'COMPLETE_SPECIFIC_SET'; exerciseRef: string; setNumber: number; setData: SetData }
  | { type: 'UNCOMPLETE_SPECIFIC_SET'; exerciseRef: string; setNumber: number }
  | { type: 'EDIT_COMPLETED_SET'; exerciseRef: string; setNumber: number; field: string; value: any }
  | { type: 'SELECT_SET'; exerciseIndex: number; setIndex: number }
```

#### B. Unified Active State System
**Key Innovation**: Active Set = Active Exercise (simplified mental model)

```typescript
// When user interacts with any set, that exercise becomes fully active
SELECT_SET: {
  actions: assign({
    exerciseProgression: ({ context, event }) => ({
      ...context.exerciseProgression,
      currentExerciseIndex: event.exerciseIndex,  // Exercise follows selection
      currentSetNumber: event.setIndex + 1        // Set follows selection
    })
  })
}
```

#### C. Machine Handler Updates
```typescript
COMPLETE_SPECIFIC_SET: {
  actions: assign({
    workoutData: ({ context, event }) => {
      const setData = {
        exerciseRef: event.exerciseRef,
        setNumber: event.setNumber, // Use provided setNumber (technical ID)
        reps: event.setData.reps,
        weight: event.setData.weight,
        rpe: event.setData.rpe,
        setType: event.setData.setType,
        completedAt: Date.now()
      };
      
      return {
        ...context.workoutData,
        completedSets: [...context.workoutData.completedSets, setData]
      };
    }
  })
},

EDIT_COMPLETED_SET: {
  actions: assign({
    workoutData: ({ context, event }) => ({
      ...context.workoutData,
      completedSets: context.workoutData.completedSets.map(set =>
        set.exerciseRef === event.exerciseRef && set.setNumber === event.setNumber
          ? { ...set, [event.field]: event.value }
          : set
      )
    })
  })
}
```

### Phase 2: Enhanced UI/UX Implementation
**Goal**: Flexible input system with direct editing capabilities
**Duration**: 3-4 days
**Approach**: Progressive enhancement of existing components

#### A. SetRow Component Enhancement
```typescript
// Support both completed and incomplete set editing
{isSetCompleted ? (
  // EDITABLE completed state (not just display)
  <Input
    type="number"
    value={set.weight}
    onChange={(e) => handleDirectEdit('weight', parseFloat(e.target.value))}
    onFocus={() => handleSetSelection(exerciseRef, setIndex)}
    className="h-10 text-center bg-green-50 border-green-200 text-green-800"
  />
) : (
  // Regular incomplete input with auto-selection
  <Input
    type="number"
    value={weight}
    onChange={(e) => setWeight(e.target.value)}
    onFocus={() => handleSetSelection(exerciseRef, setIndex)}
    className="h-10 text-center"
  />
)}
```

#### B. Input Focus Auto-Selection
```typescript
// All input interactions trigger unified set selection
const handleSetSelection = (exerciseRef: string, setIndex: number) => {
  const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseRef);
  
  // Single event updates both exercise and set focus
  actorSend({
    type: 'SELECT_SET',
    exerciseIndex,    // This exercise becomes active
    setIndex          // This set becomes highlighted
  });
};
```

#### C. Context-Aware Display Logic
```typescript
// Different contexts require different information presentation
const getDisplayInfo = (context: 'workout' | 'summary' | 'social') => {
  const completedSets = getCompletedSetsForExercise(exerciseRef);
  
  switch (context) {
    case 'workout':
      // Show actual set numbers during workout for editing
      return completedSets.map(set => ({
        display: `Set ${set.setNumber}`,
        weight: set.weight,
        reps: set.reps
      }));
      
    case 'summary':
      // Show volume statistics
      return {
        totalSets: completedSets.length,  // Count, not numbers
        totalReps: completedSets.reduce((sum, set) => sum + set.reps, 0),
        totalVolume: completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0)
      };
      
    case 'social':
      // Show achievement format
      return {
        setsCompleted: completedSets.length,
        exercise: exerciseName,
        highlight: getBestSet(completedSets)
      };
  }
};
```

### Phase 3: Advanced Workout Support
**Goal**: Enable supersets, circuits, EMOM, AMRAP, and complex training methodologies
**Duration**: 2-3 days
**Approach**: Leverage flexible foundation for advanced patterns

#### A. Cross-Exercise Interaction
```typescript
// Seamless exercise switching for complex workouts
const handleCrossExerciseInteraction = (exerciseRef: string, setIndex: number) => {
  // Switch active exercise instantly
  handleSetSelection(exerciseRef, setIndex);
  
  // Maintain progression context for current exercise
  // Update timers and UI to follow new context
  // No navigation overhead
};
```

#### B. Smart Progression Logic
```typescript
// Enhanced progression with flexible interaction
const calculateCurrentSetIndex = (exerciseIndex: number): number => {
  if (exerciseIndex !== currentExerciseIndex) return -1;
  
  const currentExercise = exercises[exerciseIndex];
  if (!currentExercise) return -1;
  
  // Find first incomplete set for UI highlighting
  const nextEmptySetIndex = currentExercise.sets.findIndex(set => !set.completed);
  
  if (nextEmptySetIndex >= 0) {
    return nextEmptySetIndex; // Highlight next empty set
  }
  
  return -2; // All complete - highlight "Add Set" button
};
```

### Phase 4: Performance & Polish
**Goal**: Production-ready performance and mobile optimization
**Duration**: 1-2 days
**Approach**: Optimization and edge case handling

#### A. Performance Safeguards
```typescript
// Debouncing strategy for rapid editing
const debouncedEdit = useMemo(
  () => debounce((exerciseRef, setNumber, field, value) => {
    onEditSet(exerciseRef, setNumber, field, value);
  }, 300), // 300ms feels responsive but prevents spam
  [onEditSet]
);

// Additional performance safeguards
- Input validation before sending events
- Optimistic UI updates with rollback on error
- Rate limiting for rapid-fire interactions
```

#### B. Mobile UX Optimization
```typescript
// Touch-friendly interactions for gym environment
- Appropriate touch targets (minimum 44px)
- Subtle completed set styling (not overwhelming)
- Clear visual feedback for active states
- Seamless focus switching between exercises
```

## Implementation Steps

### Sprint 1: Enhanced Event System (4-6 days)
1. [ ] Add new event types to `activeWorkoutTypes.ts`
2. [ ] Implement machine handlers in `activeWorkoutMachine.ts`
3. [ ] Add unified active state system with `SELECT_SET` event
4. [ ] Update guards to support flexible interaction patterns
5. [ ] Preserve existing `COMPLETE_SET` flow for backward compatibility
6. [ ] Test event system with existing UI components

### Sprint 2: UI/UX Enhancement (3-4 days)
1. [ ] Enhance `SetRow.tsx` with direct editing capabilities
2. [ ] Implement input focus auto-selection system
3. [ ] Add context-aware display logic (workout/summary/social)
4. [ ] Update visual states for completed set editing
5. [ ] Implement debounced editing with performance safeguards
6. [ ] Test cross-exercise interaction patterns

### Sprint 3: Advanced Workout Support (2-3 days)
1. [ ] Implement seamless exercise switching for supersets
2. [ ] Add smart progression logic for complex workflows
3. [ ] Support circuit training with rapid exercise rotation
4. [ ] Enable EMOM/AMRAP time-based exercise switching
5. [ ] Test advanced training methodologies end-to-end
6. [ ] Validate performance with complex workouts

### Sprint 4: Performance & Polish (1-2 days)
1. [ ] Mobile UX refinements and touch target optimization
2. [ ] Edge case handling and error recovery
3. [ ] Performance monitoring and optimization
4. [ ] Comprehensive testing across all workout types
5. [ ] Final validation and bug fixes
6. [ ] Documentation updates

## Success Criteria

### Functional Requirements
- [ ] Users can click any set input to make it active (auto-selection)
- [ ] Users can edit completed sets directly without uncompleting
- [ ] Users can toggle set completion by clicking checkboxes
- [ ] UI shows actual set numbers during workout (may have gaps after deletions)
- [ ] Workout summaries show set counts and volume, not set numbering
- [ ] Smart progression highlights next logical set or "Add Set" button
- [ ] Seamless switching between exercises during supersets/circuits
- [ ] No "wrong set gets completed" bugs
- [ ] Clear visual distinction between set numbers (editing) and set counts (volume)

### Advanced Workflow Requirements
- [ ] Superset training: rapid back-and-forth between exercises
- [ ] Circuit training: smooth rotation through multiple exercises
- [ ] EMOM/AMRAP: time-based exercise switching
- [ ] Mid-workout corrections: edit any previous set without disruption
- [ ] Cross-exercise editing: fix mistakes in any exercise while working on another

### Technical Requirements
- [ ] All published Nostr events have unique setNumbers per exercise
- [ ] No NDK deduplication conflicts
- [ ] No data loss during edit/uncomplete operations
- [ ] Race condition protection for rapid interactions
- [ ] Backward compatibility with existing workout data
- [ ] Direct editing maintains data integrity

### Performance Requirements
- [ ] Set selection response time < 100ms
- [ ] Direct editing updates < 50ms
- [ ] No UI lag during rapid cross-exercise switching
- [ ] Memory usage stable during long, complex workouts
- [ ] Offline functionality preserved for all interactions

## Standards Compliance

### XState Anti-Pattern Prevention (`.clinerules/xstate-anti-pattern-prevention.md`)
- ✅ **Event-Driven Architecture**: Using explicit events instead of complex `always` transitions
- ✅ **Simple Guards**: Clear validation without defensive programming
- ✅ **No Complex Workarounds**: Building on XState strengths, not fighting them
- ✅ **Unified State Management**: Single source of truth for active exercise/set

### NIP-101e Standards (`.clinerules/nip-101e-standards.md`)
- ✅ **Event Structure Compliance**: Maintaining required tag formats
- ✅ **Unique Set Numbers**: Preserving NDK deduplication prevention
- ✅ **Parameter Array Structure**: Each parameter as separate array element
- ✅ **Validation First**: Strict compliance without workarounds

### Radix UI Component Library (`.clinerules/radix-ui-component-library.md`)
- ✅ **POWR Design System**: Using established component patterns
- ✅ **Touch-Friendly Design**: Mobile-optimized for gym environments
- ✅ **Semantic Styling**: Clear visual hierarchy and interaction states
- ✅ **Accessibility Compliance**: Built-in WCAG 2.1 AA support

### NDK Best Practices (`.clinerules/ndk-best-practices.md`)
- ✅ **Component-Level Subscriptions**: Data fetching where it's used
- ✅ **Optimistic Publishing**: No awaiting for responsive UI
- ✅ **Singleton Pattern**: Proper NDK instance management
- ✅ **Cache-First Strategy**: Leveraging NDK's built-in optimizations

## Data Integrity Safeguards

### Unique Set Number Generation
```typescript
const generateUniqueSetNumber = (): number => {
  // Timestamp-based (simple, collision-resistant)
  return Date.now() + Math.floor(Math.random() * 1000);
};
```

### Edit History and Validation
```typescript
const trackSetEdit = (setNumber: number, field: string, oldValue: any, newValue: any) => {
  console.log(`Set ${setNumber} edited: ${field} changed from ${oldValue} to ${newValue}`);
  
  // Optional: Track edit history for analytics
  // Optional: Validate value ranges (weight > 0, reps > 0, etc.)
};
```

### Concurrent Edit Protection
```typescript
const debouncedEdit = useMemo(
  () => debounce((exerciseRef, setNumber, field, value) => {
    onEditSet(exerciseRef, setNumber, field, value);
  }, 300),
  [onEditSet]
);
```

## Supported Workout Methodologies

### Traditional Linear Progression
```
Set 1 → Set 2 → Set 3 → Next Exercise
```

### Supersets (Back-to-Back Exercises)
```
Bench Press Set 1 → Pull-ups Set 1 → Bench Press Set 2 → Pull-ups Set 2
```

### Circuit Training (Multi-Exercise Rotation)
```
Squats → Push-ups → Burpees → Pull-ups → Repeat
```

### Time-Based Training (EMOM/AMRAP)
```
Minute 1: Burpees → Minute 2: Mountain Climbers → Minute 3: Jump Squats
```

### Advanced Techniques
```
Drop sets, rest-pause, pyramid training - all supported through flexible interaction
```

## Risk Mitigation

### Technical Risks
- **Race Conditions**: Implement debouncing, UI state locking, and edit queuing
- **Data Corruption**: Comprehensive validation, edit history tracking
- **Performance**: Optimize for mobile devices, complex workouts, and rapid interactions
- **State Complexity**: Unified active state prevents multi-state confusion

### User Experience Risks
- **Confusion**: Clear visual feedback, intuitive interaction patterns
- **Accidental Edits**: Appropriate touch targets, subtle completed set styling
- **Feature Discovery**: Natural interaction patterns that don't require explanation
- **Workflow Disruption**: Non-disruptive editing, seamless focus switching

### Business Risks
- **Scope Creep**: Strict adherence to defined feature boundaries
- **Testing Gaps**: Comprehensive automated and manual testing across all workout types
- **Rollback Plan**: Feature flags for safe deployment and quick rollback
- **User Adoption**: Clear migration path from current system

## References

### Core Documentation
- **Draft Design**: `../noga claude docs/powr/flexible_set_interaction_system.md`
- **Current Machine**: `src/lib/machines/workout/activeWorkoutMachine.ts`
- **Current UI**: `src/components/powr-ui/workout/SetRow.tsx`
- **Type Definitions**: `src/lib/machines/workout/types/activeWorkoutTypes.ts`

### Standards Compliance
- **Task Creation**: `.clinerules/task-creation-process.md`
- **XState Patterns**: `.clinerules/xstate-anti-pattern-prevention.md`
- **NIP-101e Events**: `.clinerules/nip-101e-standards.md`
- **UI Components**: `.clinerules/radix-ui-component-library.md`
- **NDK Integration**: `.clinerules/ndk-best-practices.md`

### Architecture Context
- **Project Goals**: `docs/project-kickoff.md`
- **NIP-101e Spec**: `docs/nip-101e-specification.md`
- **Working Examples**: `src/components/test/`

## Future Enhancements (Out of Scope)

- Set timing and rest period tracking with auto-progression
- Advanced set types with custom parameters (drop sets, cluster sets)
- Bulk operations (complete multiple sets, copy set data)
- Set notes and detailed RPE tracking with history
- Workout analytics based on set completion and editing patterns
- Template generation from workout history
- Social features for set sharing and comparison

---

**This flexible set interaction system transforms the app from a basic workout logger into a professional-grade fitness companion that adapts to how people actually train, supporting everything from beginner linear progression to advanced competitive training methodologies.**

---

**Last Updated**: 2025-07-22
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Compliance**: XState v5, NIP-101e, NDK-First, Radix UI
