# Weight Conversion System Fix Task

## Objective
Fix the weight conversion system in the POWR Workout PWA to properly handle kg/lbs conversion without infinite re-renders, stale closures, or conversion errors.

## Current Issues Identified

### 1. **SetRow Component Issues**
- **Infinite Re-renders**: The `useEffect` dependencies cause unnecessary re-renders
- **Stale Closures**: The `getDisplayWeight` function creates stale closures
- **Weight Unit Conversion Logic**: Flawed logic when switching between kg and lbs
- **State Management**: Complex state tracking causing race conditions

### 2. **Toast Import Errors**
- `WorkoutHistoryDetailModal.tsx` has import errors for `showSuccessToast` and `showErrorToast`
- These functions are not exported from the Toast component
- Causing compilation warnings throughout the app

### 3. **Weight Unit Toggle Location**
- Weight unit toggle is correctly placed in `WorkoutMenuDropdown.tsx`
- This is the appropriate location as it's contextually related to workout data
- No changes needed for toggle location

## Technical Analysis

### Root Cause: SetRow Component Architecture
The current SetRow component has several architectural issues:

1. **Closure Problem**: `getDisplayWeight` function is defined inside component but used in `useEffect` dependencies
2. **State Synchronization**: Multiple state variables tracking the same concept
3. **Conversion Timing**: Weight conversion happens at wrong times in the component lifecycle
4. **Unit Change Handling**: Complex logic for handling weight unit changes

### Current Problematic Code Pattern
```typescript
// PROBLEMATIC: Function defined inside component, used in useEffect
const getDisplayWeight = (weightInKg: number): string => {
  if (weightInKg === 0) return '';
  return convertWeightForDisplay(weightInKg, weightUnit).toString();
};

// PROBLEMATIC: Complex useEffect with function dependency
useEffect(() => {
  // Complex logic that causes re-renders
}, [setNumber, lastInitializedSetNumber, defaultData, previousSetData, isCompleted, getDisplayWeight]);
```

## Implementation Plan

### Phase 1: Fix SetRow Weight Conversion (High Priority)

#### Step 1: Simplify State Management
- Remove complex state tracking (`lastInitializedSetNumber`, `lastWeightUnit`)
- Use simpler, more predictable state updates
- Separate concerns: display vs storage conversion

#### Step 2: Fix useEffect Dependencies
- Remove function dependencies from useEffect
- Use `useCallback` for stable function references
- Simplify dependency arrays

#### Step 3: Improve Weight Conversion Logic
- Convert weights only when necessary (not on every render)
- Handle edge cases (empty values, zero weights, bodyweight)
- Ensure proper kg ↔ lbs conversion

#### Step 4: Test Weight Conversion Flow
- Test kg to lbs conversion
- Test lbs to kg conversion
- Test bodyweight exercises (0 weight)
- Test negative weights (assisted exercises)

### Phase 2: Fix Toast Import Errors (Medium Priority)

#### Step 1: Audit Toast Component Exports
- Check what functions are actually exported from `Toast.tsx`
- Identify missing exports (`showSuccessToast`, `showErrorToast`)
- fix missing "x" in top right of toast on mobile (not visible)

#### Step 2: Fix Import Errors
- Either add missing exports to Toast component
- Or update imports to use correct function names
- Fix all files importing from Toast component

#### Step 3: Test Toast Functionality
- Verify toast notifications work correctly
- Test success and error toast variants

### Phase 3: Verify Weight Unit Toggle (Low Priority)

#### Step 1: Verify Current Implementation
- Confirm weight unit toggle in WorkoutMenuDropdown works correctly
- Test that weight unit changes affect all components properly
- Ensure weight unit preference persists across sessions

#### Step 2: Test Weight Unit Integration
- Test that changing units in WorkoutMenuDropdown affects all components
- Verify weight values convert correctly across the app
- Confirm toggle is easily accessible during workouts

## Success Criteria

### Phase 1 Success Criteria
- [ ] SetRow component renders without infinite re-renders
- [ ] Weight conversion works correctly when switching between kg and lbs
- [ ] Previous set data displays in correct units
- [ ] Completed sets display in correct units
- [ ] No console errors related to weight conversion
- [ ] Weight values persist correctly when switching units

### Phase 2 Success Criteria
- [ ] No import errors in development console
- [ ] Toast notifications work correctly
- [ ] Success and error toasts display properly
- [ ] No compilation warnings related to Toast imports

### Phase 3 Success Criteria
- [ ] Weight unit toggle in WorkoutMenuDropdown works correctly
- [ ] Weight unit changes affect all components properly
- [ ] Weight unit preference persists across app sessions
- [ ] Toggle is easily accessible during workouts

## Testing Checklist

### Weight Conversion Testing
- [ ] Start workout with kg units, enter weights, complete sets
- [ ] Switch to lbs units, verify weights convert correctly
- [ ] Switch back to kg units, verify weights convert correctly
- [ ] Test bodyweight exercises (0 weight) with unit switching
- [ ] Test negative weights (assisted exercises) with unit switching
- [ ] Test decimal weights (e.g., 2.5 kg) with unit switching

### Component Integration Testing
- [ ] Test SetRow in ActiveWorkoutInterface
- [ ] Test weight display in WorkoutCard components
- [ ] Test weight display in ExerciseCard components
- [ ] Test weight display in workout history
- [ ] Test weight display in saved templates

### User Experience Testing
- [ ] Weight unit toggle is easily accessible
- [ ] Weight conversion happens smoothly without UI glitches
- [ ] Weight values are displayed with appropriate precision
- [ ] Unit labels are clear and consistent

## Implementation Notes

### Key Files to Modify
- `src/components/powr-ui/workout/SetRow.tsx` - Main weight conversion logic
- `src/components/powr-ui/primitives/Toast.tsx` - Fix exports
- `src/components/powr-ui/workout/WorkoutHistoryDetailModal.tsx` - Fix imports
- `src/components/powr-ui/layout/AppHeader.tsx` - Add weight unit toggle
- `src/hooks/useWeightUnits.ts` - Verify hook implementation
- `src/lib/utils/weightConversion.ts` - Verify conversion utilities

### Architecture Principles
- **Simple State Management**: Avoid complex state tracking
- **Predictable Conversions**: Weight conversion should be deterministic
- **Performance**: Minimize unnecessary re-renders
- **User Experience**: Smooth, responsive weight unit switching

### Error Handling
- Handle invalid weight inputs gracefully
- Provide clear feedback for conversion errors
- Maintain data integrity during unit switching
- Fallback to default values when conversion fails

## Risk Assessment

### High Risk
- **Data Loss**: Incorrect weight conversion could lose user data
- **Performance**: Infinite re-renders could make app unusable
- **User Confusion**: Inconsistent weight displays could confuse users

### Medium Risk
- **Toast Functionality**: Import errors could break user feedback
- **Component Integration**: Changes could break other components

### Low Risk
- **UI Polish**: Weight unit toggle placement is cosmetic

## Dependencies

### Required Knowledge
- React hooks (`useState`, `useEffect`, `useCallback`)
- Weight conversion mathematics (kg ↔ lbs)
- Component lifecycle and re-rendering patterns
- TypeScript import/export patterns

### External Dependencies
- No new dependencies required
- Uses existing `useWeightUnits` hook
- Uses existing weight conversion utilities

## Completion Timeline

### Phase 1: 2-3 hours
- SetRow component refactoring and testing

### Phase 2: 1 hour
- Toast import fixes

### Phase 3: 1 hour
- Global weight unit toggle

### Total Estimated Time: 4-5 hours

## Post-Implementation

### Documentation Updates
- Update component documentation for SetRow
- Document weight conversion patterns for future components
- Update user guide for weight unit switching

### Code Review Focus
- Weight conversion accuracy
- Performance (no infinite re-renders)
- User experience consistency
- Error handling robustness

---

**Created**: 2025-08-13
**Priority**: High (Phase 1), Medium (Phase 2), Low (Phase 3)
**Complexity**: Medium-High
**Impact**: High (affects core workout functionality)
