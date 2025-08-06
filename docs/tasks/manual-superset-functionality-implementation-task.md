# Manual Superset Functionality Implementation Task

## Objective
Implement simple, manual superset functionality in the active workout interface, allowing users to intentionally create supersets by selecting exercises through a menu-driven interface with visual grouping, exercise ordering control, and NIP-101e compliant event generation.

## Current State Analysis
- `ExerciseMenuDropdown` has placeholder `onCreateSuperset` prop ready for implementation
- `ActiveWorkoutInterface` has complete CRUD operation handlers for exercise management
- XState `activeWorkoutMachine` supports template modifications through existing tracking system
- NIP-101e event generation supports matching set numbers for superset patterns
- POWR UI components (Radix Dialog, Button, etc.) available for modal interfaces

## Technical Approach
- **XState Integration**: Add superset events (`CREATE_SUPERSET`, `REMOVE_SUPERSET`) to existing machine
- **Template Modification**: Track superset creation as template modifications for universal save system
- **NIP-101e Compliance**: Use matching set numbers to create superset patterns in workout records
- **UI Components**: Build SupersetCreationModal using POWR UI Radix Dialog primitives
- **Visual Indicators**: Create SupersetGroup component with visual grouping and chain icons
- **Exercise Ordering**: Allow drag-and-drop or up/down arrows to control superset exercise order
- **Multi-Exercise Support**: Support 2+ exercises in a single superset (tri-sets, giant sets, etc.)

## Implementation Steps

### Phase 1: Exercise Menu Integration (30 minutes)
1. [ ] Update `ExerciseMenuDropdown` to show "Create Superset" option with chain icon
2. [ ] Connect `onCreateSuperset` prop to trigger superset modal
3. [ ] Test menu item appears and triggers correctly
4. [ ] Ensure proper accessibility (keyboard navigation, screen reader support)

### Phase 2: Superset Selection Modal (1.5 hours)
1. [ ] Create `SupersetCreationModal` component using Radix Dialog
2. [ ] Implement streamlined exercise selection interface:
   - [ ] Show exercise titles only (no sets/reps/weight details)
   - [ ] Use checkboxes for multi-select
   - [ ] Pre-select the exercise that triggered the menu
3. [ ] Add exercise ordering controls:
   - [ ] Drag-and-drop reordering of selected exercises
   - [ ] Up/down arrow buttons as fallback for accessibility
   - [ ] Visual preview showing superset order (e.g., "Pushups → Squats → Lunges")
4. [ ] Add validation:
   - [ ] Minimum 2 exercises requirement
   - [ ] Maximum reasonable limit (e.g., 6 exercises)
   - [ ] Clear error messages for invalid selections
5. [ ] Test modal functionality, ordering, and validation

### Phase 3: Visual Superset Indicators (1 hour)
1. [ ] Create `SupersetGroup` component with:
   - [ ] Colored left border for visual grouping
   - [ ] Superset header with chain icon and ordered exercise names
   - [ ] Support for 2+ exercises display (e.g., "Superset: Exercise A → Exercise B → Exercise C")
   - [ ] Remove superset button with unlink icon
2. [ ] Implement grouped exercise display:
   - [ ] Show all exercises in superset group
   - [ ] Maintain individual exercise functionality (set completion, etc.)
   - [ ] Add subtle dividers between exercises in group
3. [ ] Add instructional text for user flexibility
4. [ ] Test visual grouping, ungrouping, and multi-exercise display

### Phase 4: XState Integration (45 minutes)
1. [ ] Add superset events to `activeWorkoutMachine` types:
   - [ ] `CREATE_SUPERSET` with `selectedExercises` and `exerciseOrder` arrays
   - [ ] `REMOVE_SUPERSET` with `groupId`
   - [ ] `SHOW_SUPERSET_MODAL` and `CANCEL_SUPERSET_CREATION`
2. [ ] Add superset state to machine context:
   - [ ] `supersetGroups` array with group metadata
   - [ ] `showSupersetModal` boolean
   - [ ] `supersetModalData` with current exercise and available exercises
3. [ ] Implement XState actions:
   - [ ] `createSuperset` - creates group with ordered exercises
   - [ ] `removeSuperset` - removes group and updates template modifications
   - [ ] `showSupersetModal` and `hideSupersetModal`
4. [ ] Test state management and persistence

### Phase 5: NIP-101e Compliance & Template Integration (30 minutes)
1. [ ] Update workout record generation:
   - [ ] Assign matching set numbers to exercises in same superset
   - [ ] Preserve exercise order within superset groups
   - [ ] Ensure proper NIP-101e event structure
2. [ ] Integrate with template modification system:
   - [ ] Track superset creation as `create_superset` modification
   - [ ] Include ordered exercise list in modification metadata
   - [ ] Generate human-readable descriptions for save dialog
3. [ ] Test event generation and template saving
4. [ ] Validate with existing NIP-101e verification commands

## Success Criteria
- [ ] User can create supersets through exercise context menu
- [ ] Superset selection modal shows streamlined exercise titles only
- [ ] User can reorder exercises within superset before creation
- [ ] Support for 2+ exercises in a single superset (tri-sets, giant sets)
- [ ] Visual grouping clearly shows superset relationships with exercise order
- [ ] Superset creation tracked in template modifications with proper descriptions
- [ ] Generated workout records follow NIP-101e with matching set numbers
- [ ] User can remove superset grouping easily
- [ ] All components follow POWR UI design system standards
- [ ] Accessibility requirements met (keyboard navigation, screen readers, drag-and-drop alternatives)

## Data Models

### Enhanced SupersetGroup Interface
```typescript
interface SupersetGroup {
  id: string;
  exercises: string[]; // Exercise references in desired order
  exerciseNames: string[]; // Exercise names in same order for display
  setNumber: number; // Shared set number for NIP-101e compliance
  createdAt: number;
  // Optional metadata
  restBetweenExercises?: number; // Seconds between exercises in superset
  restAfterSuperset?: number; // Seconds after completing full superset
}
```

### Template Modification for Supersets
```typescript
interface SupersetModification extends TemplateModification {
  type: 'create_superset' | 'remove_superset';
  supersetData: {
    groupId: string;
    exerciseRefs: string[]; // Ordered exercise references
    exerciseNames: string[]; // Ordered exercise names
    exerciseOrder: number[]; // Original exercise indices for reference
  };
}
```

## References
- **Task Draft**: `/Users/danielwyler/Downloads/scratchpad.txt` - Original comprehensive implementation plan
- **XState Patterns**: `.clinerules/xstate-anti-pattern-prevention.md` - Event-driven architecture
- **NIP-101e Standards**: `.clinerules/nip-101e-standards.md` - Event generation compliance
- **UI Components**: `.clinerules/radix-ui-component-library.md` - POWR Design System
- **Simple Solutions**: `.clinerules/simple-solutions-first.md` - Manual-only approach validation
- **Existing Components**: 
  - `src/components/powr-ui/workout/ExerciseMenuDropdown.tsx` - Menu integration point
  - `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - Main interface

## Testing Strategy
- **Unit Tests**: SupersetCreationModal component with various exercise selections
- **Integration Tests**: End-to-end superset creation from menu to template saving
- **User Testing**: Multi-exercise superset creation and exercise reordering
- **Accessibility Testing**: Keyboard navigation, screen reader compatibility, drag-and-drop alternatives

---

**Estimated Time**: 3.5-4 hours total
**Priority**: Medium - Enhances workout flexibility without breaking existing functionality
**Dependencies**: None - builds on existing active workout infrastructure
