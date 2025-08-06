# Manual Superset Functionality Implementation - Kickoff Prompt

## Task Summary
Implement manual superset functionality in the active workout interface, allowing users to create supersets through the exercise context menu with streamlined exercise selection (titles only), exercise ordering control, and support for 2+ exercises per superset. The implementation includes visual grouping, XState integration, and NIP-101e compliant event generation.

## Key Technical Approach
- **Streamlined UI**: Exercise selection shows titles only, no sets/reps/weight details
- **Exercise Ordering**: Drag-and-drop or arrow controls for superset exercise order
- **Multi-Exercise Support**: Support for tri-sets, giant sets (2+ exercises)
- **XState Integration**: Add superset events to existing `activeWorkoutMachine`
- **NIP-101e Compliance**: Use matching set numbers for superset patterns in workout records

## Key Files to Review
1. **Task Document**: `docs/tasks/manual-superset-functionality-implementation-task.md` - Complete implementation plan
2. **Exercise Menu**: `src/components/powr-ui/workout/ExerciseMenuDropdown.tsx` - Already has `onCreateSuperset` placeholder
3. **Active Workout**: `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - Main integration point with CRUD handlers
4. **XState Patterns**: `.clinerules/xstate-anti-pattern-prevention.md` - Event-driven architecture guidelines
5. **UI Components**: `.clinerules/radix-ui-component-library.md` - POWR Design System for modal components

## Starting Point
Begin with Phase 1: Update the `ExerciseMenuDropdown` component to show the "Create Superset" option with a chain icon. The component already has the `onCreateSuperset` prop defined but commented out - uncomment and connect it to trigger the superset modal.

## Dependencies to Check
- Verify `@radix-ui/react-dialog` is available for SupersetCreationModal
- Confirm existing XState machine supports adding new events and context properties
- Check that template modification system can handle new superset modification types

**Total Estimated Time**: 3.5-4 hours across 5 phases
**Next Step**: Start with ExerciseMenuDropdown integration (30 minutes)
