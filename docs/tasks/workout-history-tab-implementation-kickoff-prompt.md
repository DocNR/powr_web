# Workout History Tab Implementation - Kickoff Prompt

## Task Summary
Implement a comprehensive workout history tab that displays user's completed workout records (Kind 1301 events) with timeline detail viewing and public sharing capabilities. This task leverages existing services and components while following .clinerules best practices, extending `DependencyResolutionService` and `WorkoutAnalyticsService` for business logic, and creating a separate `WorkoutHistoryDetailModal` following the proven `WorkoutSummaryModal` pattern. **Optimized with reusable UI patterns from `GlobalWorkoutSearch` and confirmed NDK readiness.**

## Key Files to Review

### 1. Task Document (Primary)
- **`docs/tasks/workout-history-tab-implementation-task.md`** - Complete implementation plan and requirements

### 2. Architecture References (Critical)
- **`src/components/tabs/WorkoutsTab.tsx`** - Proven tab structure and NDK subscription patterns
- **`src/components/powr-ui/workout/WorkoutSummaryModal.tsx`** - Recent modal separation pattern to follow
- **`src/lib/services/dependencyResolution.ts`** - Service extension patterns and NDK optimization
- **`src/lib/services/workoutAnalytics.ts`** - Business logic service to extend

### 3. Reusable Components (Major Optimization)
- **`src/components/search/GlobalWorkoutSearch.tsx`** - Search UI patterns, debouncing, data transformation
- **`src/hooks/useNDKSearch.ts`** - Search state management and race condition prevention patterns

### 4. .clinerules Compliance (Essential)
- **`.clinerules/ndk-best-practices.md`** - Component-level subscriptions, no loading states
- **`.clinerules/service-layer-architecture.md`** - Pure business logic in services, NDK in components
- **`.clinerules/radix-ui-component-library.md`** - POWR UI component standards

## Starting Point
Begin by extending the `DependencyResolutionService` with a `resolveWorkoutRecords()` method that queries Kind 1301 events using the proven CACHE_FIRST strategy. Then create the `HistoryTab.tsx` component using `useSubscribe` patterns from `WorkoutsTab.tsx`, ensuring no loading states and reactive data handling. **Leverage search UI patterns from `GlobalWorkoutSearch` for the filtering functionality.**

## Implementation Priority
1. **Service Extensions** (1.5-2 hours) - Extend existing services for workout record parsing and volume calculations
2. **UI Components** (2.5-3 hours) - Create history card and detail modal following established patterns, reuse search UI patterns
3. **Public Sharing** (1-1.5 hours) - Add dynamic route and URL generation (simple modal reuse)
4. **Integration** (1 hour) - Connect to tab navigation and polish edge cases

**Total Estimated Time**: 5-6.5 hours (optimized with reusable components)

## Key Optimizations
- **Reuse search UI patterns** from `GlobalWorkoutSearch` (debouncing, input styling, status text)
- **Client-side filtering** instead of extending complex search service
- **Data transformation patterns** from existing search component
- **Confirmed NDK readiness** with `useSubscribe` and `CACHE_FIRST` patterns
