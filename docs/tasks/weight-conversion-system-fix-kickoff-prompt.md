# Weight Conversion System Fix - Implementation Kickoff Prompt

## Task Summary
Fix the weight conversion system in the POWR Workout PWA to eliminate infinite re-renders, stale closures, and conversion errors when switching between kg and lbs units. Also resolve Toast import errors causing compilation warnings.

## Key Technical Approach
- **Phase 1**: Refactor SetRow component to fix weight conversion logic and eliminate infinite re-renders
- **Phase 2**: Fix Toast component import/export issues
- **Phase 3**: Verify weight unit toggle functionality works correctly
- **Architecture Focus**: Simplify state management, use proper React hooks patterns, ensure predictable weight conversions

## Critical Files to Review
1. **Task Document**: `docs/tasks/weight-conversion-system-fix-task.md` - Complete implementation plan with 3 phases
2. **SetRow Component**: `src/components/powr-ui/workout/SetRow.tsx` - Main component with weight conversion issues
3. **Weight Conversion Utils**: `src/lib/utils/weightConversion.ts` - Conversion logic utilities
4. **Weight Units Hook**: `src/hooks/useWeightUnits.ts` - Weight unit preference management
5. **Toast Component**: `src/components/powr-ui/primitives/Toast.tsx` - Missing export functions
6. **WorkoutHistoryDetailModal**: `src/components/powr-ui/workout/WorkoutHistoryDetailModal.tsx` - Import errors

## Starting Point
**Begin with Phase 1: Fix SetRow Weight Conversion**

The SetRow component has critical architectural issues:
- **Infinite Re-renders**: `useEffect` dependencies cause render loops
- **Stale Closures**: `getDisplayWeight` function creates closure issues
- **Complex State Tracking**: Multiple state variables tracking same concepts
- **Weight Unit Conversion**: Flawed logic when switching between kg/lbs

**Root Problem**: The component uses a function (`getDisplayWeight`) defined inside the component as a dependency in `useEffect`, causing stale closures and infinite re-renders.

## Implementation Workflow
1. **Read the complete task document** to understand all 3 phases
2. **Start with SetRow component refactoring** - this is the highest priority
3. **Test weight conversion thoroughly** after each change
4. **Fix Toast import errors** once SetRow is stable
5. **Verify weight unit toggle** works correctly across the app

## Current Issues Observed
- Development server shows infinite re-render warnings
- Weight conversion doesn't work properly when switching units
- Toast import errors causing compilation warnings
- SetRow component has complex, problematic state management

## Success Criteria for Phase 1
- [ ] SetRow component renders without infinite re-renders
- [ ] Weight conversion works correctly when switching between kg and lbs
- [ ] Previous set data displays in correct units
- [ ] Completed sets display in correct units
- [ ] No console errors related to weight conversion
- [ ] Weight values persist correctly when switching units

## Testing Requirements
After implementing Phase 1 fixes:
- [ ] Start workout with kg units, enter weights, complete sets
- [ ] Switch to lbs units via WorkoutMenuDropdown, verify weights convert correctly
- [ ] Switch back to kg units, verify weights convert correctly
- [ ] Test bodyweight exercises (0 weight) with unit switching
- [ ] Test decimal weights (e.g., 2.5 kg) with unit switching
- [ ] Verify no infinite re-renders in browser dev tools

## Key Architecture Principles
- **Simple State Management**: Avoid complex state tracking
- **Predictable Conversions**: Weight conversion should be deterministic
- **Performance**: Minimize unnecessary re-renders
- **User Experience**: Smooth, responsive weight unit switching

## Expected Outcome
After completing all 3 phases:
- SetRow component works smoothly without performance issues
- Weight conversion is accurate and responsive
- No compilation warnings or import errors
- Weight unit toggle works correctly across all components
- Users can seamlessly switch between kg and lbs during workouts

---

**Next Step**: Begin with Phase 1 (SetRow component refactoring) from the task document. Focus on eliminating the infinite re-render issue first, then improve the weight conversion logic.
