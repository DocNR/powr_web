# Delete/Remove Set Functionality Implementation - Kickoff Prompt

## Task Summary
Implement comprehensive set removal functionality in active workouts with enhanced UX using selection mode and bulk delete actions. This is **Step 8** of **Phase 3** in the Beta Release Cleanup process.

## Key Technical Approach
- **Enhanced UX**: Selection mode with checkboxes (similar to iOS/Android bulk selection)
- **XState Integration**: New REMOVE_SET events with proper context updates
- **Safety Features**: Minimum 1 set per exercise protection
- **Professional UI**: Uses existing ConfirmationDialog component

## Primary Goal
Enable users to remove unwanted sets during active workouts with professional UX patterns and proper data integrity.

## Key Files to Review
1. **Task Document**: `docs/tasks/delete-remove-set-functionality-implementation-task.md` - Complete implementation plan
2. **XState Types**: `src/lib/machines/workout/types/activeWorkoutTypes.ts` - Event definitions
3. **Active Machine**: `src/lib/machines/workout/activeWorkoutMachine.ts` - State management
4. **Exercise Menu**: `src/components/powr-ui/workout/ExerciseMenuDropdown.tsx` - Menu trigger
5. **Active Interface**: `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - Selection state
6. **Set Row**: `src/components/powr-ui/workout/SetRow.tsx` - Selection checkbox

## Starting Point
Begin with **Phase 1: XState Machine Enhancement** (30 minutes):
1. Add `REMOVE_SET` and `REMOVE_SETS` event types to `activeWorkoutTypes.ts`
2. Implement event handlers in `activeWorkoutMachine.ts`
3. Add minimum set protection logic (prevent deleting all sets)

## Dependencies to Check
- Existing `ConfirmationDialog` component (already implemented)
- Current XState machine patterns (follow existing CRUD operations)
- POWR UI design system (use established patterns)

## Success Criteria
- Users can enter selection mode from exercise menu
- Multiple sets can be selected with visual feedback
- Bulk delete works with confirmation dialog
- Minimum 1 set per exercise is enforced
- Set numbering remains consistent after deletion

## Timeline
**Total: 2 hours** across 4 phases:
- Phase 1 (XState): 30 minutes
- Phase 2 (Selection UI): 45 minutes
- Phase 3 (Bulk Delete): 30 minutes
- Phase 4 (Edge Cases): 15 minutes

## Architecture Context
This builds on existing patterns:
- ✅ XState event-driven architecture (similar to ADD_SET, COMPLETE_SET)
- ✅ POWR UI component system (uses existing ConfirmationDialog)
- ✅ Professional mobile UX patterns (selection mode like iOS/Android)
- ✅ Safety-first approach (minimum set protection)

## Next Steps After Completion
After implementing Step 8, continue with **Step 9: Add Library Buttons to Detail Modals** in Phase 3 of the Beta Release Cleanup.

---

**Ready to start Step 8 implementation following the detailed task document.**
