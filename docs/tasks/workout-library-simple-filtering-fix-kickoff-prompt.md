# Workout Library Simple Filtering Fix - Kickoff Prompt

## Task Summary
Apply the working ExerciseLibrary pattern to WorkoutLibrary to fix the issue where removed workout templates continue appearing in the UI despite successful NIP-51 collection updates. Both components use identical patterns, but WorkoutLibrary doesn't remove items as quickly as ExerciseLibrary. Use the simple solutions approach to identify and fix the difference.

## Key Technical Issue
**Mystery**: ExerciseLibrary and WorkoutLibrary use identical patterns but have different removal behavior:

**✅ ExerciseLibrary (Works Perfect)**:
- Uses `const { exerciseLibrary, error } = useLibraryData();`
- Pure local filtering with `processedExercises.filter()`
- No dependency resolution service calls
- Items disappear immediately on removal

**❌ WorkoutLibrary (Same Pattern, Different Behavior)**:
- Uses `const { workoutLibrary, error } = useLibraryData();` 
- Same local filtering with `processedWorkouts.filter()`
- Same removal service calls
- Items don't disappear as quickly (original issue symptoms)

## Key Files to Review
1. **Task Document**: `docs/tasks/workout-library-simple-filtering-fix-task.md` - Complete analysis and investigation plan
2. **Working Reference**: `src/components/library/ExerciseLibrary.tsx` - The proven working pattern
3. **Problem Component**: `src/components/library/WorkoutLibrary.tsx` - Uses same pattern but different behavior
4. **Data Provider**: `src/providers/LibraryDataProvider.tsx` - May have different data flow for workouts vs exercises
5. **Simple Solutions Rule**: `.clinerules/simple-solutions-first.md` - Avoid over-engineering, use what works

## Starting Point
Begin with **Phase 1: Investigation** by comparing the data flow between ExerciseLibrary and WorkoutLibrary. The goal is to identify why identical patterns produce different removal behavior. Focus on:

1. **LibraryDataProvider implementation** - How workout vs exercise data gets populated
2. **Console logs during removal** - Compare workout vs exercise removal logs
3. **Data structure differences** - Any differences in how data is structured or filtered

## Success Target
WorkoutLibrary should behave identically to ExerciseLibrary: removed items disappear from UI within 2 seconds, no "FILTERING OUT" console messages, and consistent CRUD behavior across both libraries.

## Simple Solutions Approach
This follows `.clinerules/simple-solutions-first.md` perfectly:
- **"What's the simplest thing that could work?"** → Use exact same pattern as ExerciseLibrary
- **"Can we eliminate the problem instead of solving it?"** → Yes, eliminate any differences between the two components
- **Avoid over-engineering** → No new services, no complex state management, just apply the working pattern
