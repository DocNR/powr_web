# UI Data Mapping Service Implementation Task

## Objective
Create a centralized UI Data Mapping Service to standardize data transformation between parsed Nostr events and UI components, eliminating inconsistent fallback values and ensuring all workout-related components display accurate set/rep information.

## Current State Analysis

### Problem Identified
- **WorkoutDetailModal** was showing incorrect fallback values (3x12) instead of actual template data (1x100)
- **Root Cause**: Inconsistent data mapping between parsed template data and UI component interfaces
- **Scope**: Multiple components (WorkoutCard, WorkoutDetailModal, GlobalWorkoutSearch, WorkoutsTab) handle data mapping differently

### Working Components
- **WorkoutCard** correctly displays set/rep data using dynamic calculation:
  ```typescript
  workout.exercises.reduce((total, ex) => {
    const setCount = Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 0);
    return total + setCount;
  }, 0)
  ```

### Data Flow Analysis
1. **DataParsingService** ✅ Correctly parses Nostr events (verified in console logs)
2. **Component Data Mapping** ❌ Inconsistent transformation to UI interfaces
3. **UI Components** ❌ Rely on hardcoded fallbacks when mapping fails

## Technical Approach

### Architecture Pattern
Follow `.clinerules/service-layer-architecture.md` NDK-first patterns:
- **Pure Business Logic**: Service handles data transformation only, no NDK operations
- **Singleton Pattern**: `export const uiDataMappingService = new UIDataMappingService()`
- **Type Safety**: Centralized interface definitions for UI data structures

### Service Structure
```typescript
// src/lib/services/uiDataMappingService.ts
export class UIDataMappingService {
  // Core transformation methods
  mapTemplateToExercises(resolvedTemplate: ResolvedTemplate, resolvedExercises?: Exercise[]): UIExercise[]
  mapWorkoutForCard(workoutData: any): WorkoutCardData
  mapWorkoutForModal(templateData: any): WorkoutModalData
  mapWorkoutForSearch(searchResult: any): SearchResultData
  
  // Helper methods
  private getExerciseDetails(exerciseRef: string, resolvedExercises?: Exercise[]): ExerciseDetails
  private calculateTotalSets(exercises: TemplateExercise[]): number
  private formatDuration(minutes: number): string
}
```

### UI Interface Standardization
```typescript
// Standardized interfaces for UI components
export interface UIExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  description?: string;
  equipment?: string;
  difficulty?: string;
  muscleGroups?: string[];
}

export interface WorkoutCardData {
  id: string;
  title: string;
  exercises: UIExercise[];
  totalSets: number;
  duration: number;
  difficulty?: string;
  author?: AuthorData;
}
```

## Implementation Steps

### Phase 1: Service Creation (Day 1)
1. [ ] Create `src/lib/services/uiDataMappingService.ts`
2. [ ] Define standardized UI interfaces
3. [ ] Implement core transformation methods
4. [ ] Add comprehensive unit tests
5. [ ] Export singleton instance

### Phase 2: Component Integration (Day 2)
1. [ ] Update **WorkoutDetailModal** to use service (replace quick fix)
2. [ ] Refactor **WorkoutCard** to use service (consolidate existing logic)
3. [ ] Update **GlobalWorkoutSearch** component
4. [ ] Update **WorkoutsTab** component
5. [ ] Update any other components with workout data mapping

### Phase 3: Validation & Testing (Day 3)
1. [ ] Test all components show consistent data
2. [ ] Verify edge cases and fallback scenarios
3. [ ] Performance testing (ensure minimal impact)
4. [ ] Integration testing with real Nostr data
5. [ ] Update component documentation

## Success Criteria

### Functional Requirements
- [ ] All workout components display accurate set/rep information
- [ ] No hardcoded fallback values (3x12) in UI components
- [ ] Consistent data format across all workout-related components
- [ ] Proper handling of edge cases (missing data, malformed events)

### Technical Requirements
- [ ] Service follows NDK-first architecture patterns
- [ ] Comprehensive TypeScript interfaces
- [ ] 100% unit test coverage for transformation methods
- [ ] Zero performance regression
- [ ] Follows `.clinerules/service-layer-architecture.md` patterns

### Quality Gates
- [ ] All existing functionality preserved
- [ ] No console errors or warnings
- [ ] Consistent data display across components
- [ ] Service is easily extensible for future UI components

## Components to Review and Update

### Primary Components (Confirmed workout data usage)
1. **WorkoutDetailModal** (`src/components/powr-ui/workout/WorkoutDetailModal.tsx`)
   - Current: Quick fix implemented
   - Target: Use service for proper data mapping

2. **WorkoutCard** (`src/components/powr-ui/workout/WorkoutCard.tsx`)
   - Current: Has working set calculation logic
   - Target: Refactor to use centralized service

3. **GlobalWorkoutSearch** (`src/components/search/GlobalWorkoutSearch.tsx`)
   - Current: Unknown data mapping approach
   - Target: Standardize with service

4. **WorkoutsTab** (`src/components/tabs/WorkoutsTab.tsx`)
   - Current: Unknown data mapping approach
   - Target: Standardize with service

### Secondary Components (Potential workout data usage)
5. **ExpandableExerciseCard** (`src/components/powr-ui/workout/ExpandableExerciseCard.tsx`)
   - Current: Uses hardcoded fallbacks (3x12)
   - Target: Receive properly mapped data from parent components

6. **Recent Workouts** (`src/components/dashboard/recent-workouts.tsx`)
   - Current: Unknown data mapping approach
   - Target: Review and standardize if needed

## Risk Mitigation

### Technical Risks
- **Breaking Changes**: Implement service alongside existing logic, then gradually migrate
- **Performance Impact**: Use memoization and efficient transformation algorithms
- **Type Safety**: Comprehensive TypeScript interfaces prevent runtime errors

### Rollback Strategy
- Keep existing component logic during migration
- Feature flag new service usage
- Comprehensive testing before removing old code

## References

### .clinerules Compliance
- **service-layer-architecture.md**: NDK-first service patterns
- **simple-solutions-first.md**: Avoid over-engineering
- **task-creation-process.md**: Standardized task format

### Related Files
- `src/lib/services/dataParsingService.ts` - Data parsing layer
- `src/components/powr-ui/workout/WorkoutCard.tsx` - Working implementation reference
- `src/components/powr-ui/workout/WorkoutDetailModal.tsx` - Quick fix applied

## When to Apply This Rule

### Always Apply For
- New workout-related UI components
- Data transformation between services and UI
- Standardizing existing component data handling
- Preventing hardcoded fallback values

### Success Metrics
- **Zero hardcoded fallbacks** in UI components
- **Consistent data display** across all workout components
- **Single source of truth** for UI data transformation
- **Easy extensibility** for new UI components

---

**Last Updated**: 2025-07-28
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Quick Fix Applied**: WorkoutDetailModal now shows correct set/rep data
