# Delete/Remove Set Functionality Implementation Task

## Objective
Implement comprehensive set removal functionality in active workouts with enhanced UX approach using selection mode and bulk delete actions, integrated with XState machine architecture.

## Current State Analysis
The active workout system currently supports adding sets and completing sets, but lacks the ability to remove sets once they've been added. Users need the ability to:
- Remove unwanted sets that were added by mistake
- Delete completed sets if they want to redo them
- Bulk remove multiple sets efficiently
- Maintain workout data integrity during set removal

## Technical Approach
Follow the established XState + POWR UI architecture while implementing set removal with professional UX patterns. Use selection mode interface similar to iOS/Android bulk selection patterns.

## Implementation Steps

### Phase 1: XState Machine Enhancement (30 minutes)
- [ ] **Add REMOVE_SET Event Handler**
  - Add `REMOVE_SET` event type to `ActiveWorkoutEvent` in `activeWorkoutTypes.ts`
  - Implement event handler in `activeWorkoutMachine.ts` with proper context updates
  - Update set counter logic for decreasing sets (handle edge cases)
  - Prevent deleting all sets (minimum 1 set required per exercise)

### Phase 2: Enhanced UX Selection Mode (45 minutes)
- [ ] **Add "Remove Sets" Option to ExerciseMenuDropdown**
  - Enhance `ExerciseMenuDropdown.tsx` with "Remove Sets" menu item
  - Add selection mode state management to parent component
  - Show selection mode only when exercise has multiple sets (>1)
  - Use existing dropdown patterns for consistency

- [ ] **Selection Mode UI Implementation**
  - Add selection state to `ActiveWorkoutInterface.tsx`
  - Show delete toggles on left side of set rows during selection mode
  - Use checkboxes or toggle buttons for set selection
  - Visual feedback for selected sets (highlight, different background)

### Phase 3: Bulk Delete Action (30 minutes)
- [ ] **Confirm Delete Sets Button**
  - Add "Confirm Delete Sets" button that appears during selection mode
  - Show count of selected sets ("Delete 3 sets")
  - Position button prominently but safely (avoid accidental clicks)
  - Use destructive styling (red/warning colors)

- [ ] **Confirmation Dialog Integration**
  - Use existing `ConfirmationDialog` component with destructive variant
  - Clear confirmation message: "Remove 3 sets from Push-ups?"
  - Show impact: "This will permanently remove the selected sets"
  - Cancel/Confirm buttons with proper focus management

### Phase 4: Edge Case Handling (15 minutes)
- [ ] **Minimum Set Protection**
  - Prevent deleting all sets (minimum 1 set per exercise)
  - Disable selection for last remaining set
  - Show helpful message: "Each exercise must have at least 1 set"

- [ ] **Completed Set Handling**
  - Allow deletion of completed sets (user wants to redo)
  - Update workout data context to remove completed set data
  - Maintain set numbering consistency after deletion

## Success Criteria
- [ ] Users can enter selection mode from exercise menu
- [ ] Multiple sets can be selected with visual feedback
- [ ] Bulk delete works with confirmation dialog
- [ ] Minimum 1 set per exercise is enforced
- [ ] Set numbering remains consistent after deletion
- [ ] No XState machine errors during set removal
- [ ] UI updates immediately after set removal

## Technical Implementation Details

### XState Event Structure
```typescript
// Add to activeWorkoutTypes.ts
export type ActiveWorkoutEvent = 
  | { type: 'REMOVE_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'REMOVE_SETS'; exerciseIndex: number; setIndices: number[] }
  // ... existing events
```

### Selection Mode State
```typescript
// Add to ActiveWorkoutInterface state
interface SelectionModeState {
  isActive: boolean;
  exerciseIndex: number | null;
  selectedSets: Set<number>;
}
```

### UI Component Updates
- **ExerciseMenuDropdown**: Add "Remove Sets" option
- **ActiveWorkoutInterface**: Manage selection mode state
- **SetRow**: Show selection checkbox when in selection mode
- **ExerciseSection**: Handle selection mode UI changes

## Edge Cases to Handle
1. **Last Set Protection**: Cannot delete the only remaining set
2. **Completed Sets**: Allow deletion but update workout data
3. **Set Renumbering**: Maintain consistent set numbering after deletion
4. **Selection Mode Exit**: Clear selection when switching exercises
5. **Machine State**: Ensure XState context stays consistent

## Testing Checklist
- [ ] Can enter selection mode from exercise menu
- [ ] Can select/deselect individual sets
- [ ] Confirmation dialog appears with correct count
- [ ] Cannot delete all sets (minimum 1 enforced)
- [ ] Set numbering updates correctly after deletion
- [ ] Completed set data is properly removed
- [ ] Selection mode exits cleanly
- [ ] No console errors during operation

## Files to Modify
- `src/lib/machines/workout/types/activeWorkoutTypes.ts` - Add REMOVE_SET events
- `src/lib/machines/workout/activeWorkoutMachine.ts` - Add event handlers
- `src/components/powr-ui/workout/ExerciseMenuDropdown.tsx` - Add menu option
- `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - Selection state
- `src/components/powr-ui/workout/SetRow.tsx` - Selection checkbox
- `src/components/powr-ui/workout/ExerciseSection.tsx` - Selection mode UI

## References
- `.clinerules/xstate-anti-pattern-prevention.md` - XState best practices
- `.clinerules/simple-solutions-first.md` - Avoid over-engineering
- Existing `ConfirmationDialog` component for consistent UX
- iOS/Android bulk selection patterns for UX inspiration

## Timeline
**Total Estimated Time: 2 hours**
- Phase 1 (XState): 30 minutes
- Phase 2 (Selection UI): 45 minutes  
- Phase 3 (Bulk Delete): 30 minutes
- Phase 4 (Edge Cases): 15 minutes

## Risk Assessment
**Low Risk** - Building on existing patterns:
- Uses established XState event patterns
- Leverages existing ConfirmationDialog component
- Follows POWR UI design system
- Similar to existing CRUD operations (add sets, complete sets)

---

**Last Updated**: 2025-08-17
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Priority**: Phase 3, Step 8 of Beta Release Cleanup
