# UI Data Mapping Service Implementation - Kickoff Prompt

## Task Summary
Create a centralized UI Data Mapping Service to eliminate inconsistent fallback values across workout-related components. The WorkoutDetailModal was showing "3x12" instead of actual template data like "1x100" due to inconsistent data mapping between parsed Nostr events and UI component interfaces.

## Key Technical Approach
- **Service Layer Architecture**: Pure business logic service following NDK-first patterns
- **Singleton Pattern**: Centralized data transformation without NDK operations
- **Type Safety**: Standardized UI interfaces for consistent data structures
- **Gradual Migration**: Implement alongside existing logic, then migrate components

## Key Files to Review

### Primary Implementation Files
1. **Task Document**: `docs/tasks/ui-data-mapping-service-implementation-task.md`
2. **Service Architecture Rule**: `.clinerules/service-layer-architecture.md`
3. **Working Reference**: `src/components/powr-ui/workout/WorkoutCard.tsx` (has correct set calculation)
4. **Quick Fix Applied**: `src/components/powr-ui/workout/WorkoutDetailModal.tsx` (temporary solution)
5. **Data Parsing Service**: `src/lib/services/dataParsingService.ts` (existing parsing layer)

### Components to Update
- `src/components/powr-ui/workout/WorkoutDetailModal.tsx` (replace quick fix)
- `src/components/powr-ui/workout/WorkoutCard.tsx` (consolidate existing logic)
- `src/components/search/GlobalWorkoutSearch.tsx` (standardize data mapping)
- `src/components/tabs/WorkoutsTab.tsx` (standardize data mapping)

## Starting Point
1. **Review the task document** to understand the full scope and architecture requirements
2. **Examine WorkoutCard.tsx** to see the working set calculation logic that should be centralized
3. **Check the quick fix in WorkoutDetailModal.tsx** to understand the data mapping problem
4. **Create the service** following the patterns in `.clinerules/service-layer-architecture.md`

## Success Criteria
- All workout components display accurate set/rep information (no more 3x12 fallbacks)
- Consistent data format across all workout-related components
- Service follows NDK-first architecture patterns with comprehensive TypeScript interfaces
- Zero performance regression and easy extensibility for future UI components

## Architecture Context
This service sits between the existing `dataParsingService.ts` (which correctly parses Nostr events) and UI components (which need consistent data structures). The goal is to eliminate the inconsistent component-level data mapping that causes incorrect fallback values.

---

**Quick Fix Status**: ✅ WorkoutDetailModal now shows correct set/rep data
**Next Step**: Implement proper service-based solution for long-term maintainability
