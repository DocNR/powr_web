# WorkoutDataProvider Simplification - Task Kickoff Prompt

## Task Summary

Simplify the WorkoutDataProvider by eliminating complex data transformation, filtering, and redundant functionality while relying on NDK's built-in capabilities. Keep all existing UI components (calendar, hero card, social feed, discovery cards) completely unchanged and maintain the exact same user experience with 70% less data layer complexity.

## Key Files to Review

1. **Task Document**: `docs/tasks/workout-data-provider-simplification-task.md` - Complete implementation plan focused on data layer only
2. **Target File**: `src/providers/WorkoutDataProvider.tsx` - The 800+ line file to simplify
3. **UI Consumer**: `src/components/tabs/WorkoutsTab.tsx` - UI components that should work unchanged
4. **NDK Best Practices**: `.clinerules/ndk-best-practices.md` - Simple subscription patterns to use
5. **Simple Solutions Rule**: `.clinerules/simple-solutions-first.md` - "Let NDK Do Everything" principle

## Starting Point

Begin with **Phase 1: Analyze Current Data Interface** by reviewing what data structure the WorkoutsTab and its UI components (CalendarBar, WorkoutCard, SearchableWorkoutDiscovery) actually expect from useWorkoutData(). The goal is to maintain the exact same data interface while dramatically simplifying how that data is populated using simple NDK subscriptions instead of complex transformation logic.

## Dependencies to Check

- ✅ Existing UI components (calendar, hero, social, discovery) should remain completely unchanged
- ✅ Data interface (socialWorkouts, discoveryTemplates, workoutIndicators) should be preserved
- ✅ XState integration and modal workflow should continue working
- ✅ User experience should be identical before and after simplification
- ✅ NDK subscriptions are providing the raw event data needed

---

**Implementation Goal**: 70% reduction in WorkoutDataProvider complexity while keeping UI unchanged
**Timeline**: 2 hours across 4 phases
**Scope**: Data layer only - zero UI component changes
**User Experience**: Identical functionality with much simpler data logic
