# Workout Summary & Social Sharing Implementation - Kickoff Prompt

## Task Summary
Implement a workout summary screen with optional social sharing functionality that appears after workout completion. The system will automatically publish NIP-101e workout records (kind 1301) and provide users with a summary modal containing workout statistics and the option to share their achievements via kind 1 social notes to the broader Nostr community.

**Key Technical Approach**: Add a `summary` state to the workout lifecycle machine, reuse existing WorkoutDetailModal structure, and implement optimistic publishing for social notes using the Global NDK Actor pattern.

**Primary Goal**: Enhance user engagement with immediate workout completion feedback while validating NDK's dual-publishing capabilities (workout records + social content).

## Key Files to Review

### 1. Task Document (Primary Reference)
- `docs/tasks/workout-summary-social-sharing-implementation-task.md` - Complete implementation plan and requirements

### 2. Critical Cline Rules
- `.clinerules/ndk-best-practices.md` - Optimistic publishing patterns, no loading states
- `.clinerules/xstate-anti-pattern-prevention.md` - Simple state machine patterns
- `.clinerules/web-ndk-actor-integration.md` - Global NDK Actor usage for publishing

### 3. Technical References
- `src/lib/machines/workout/workoutLifecycleMachine.ts` - Current state machine to extend
- `src/components/powr-ui/workout/WorkoutDetailModal.tsx` - Modal structure to reuse
- `src/lib/services/workoutAnalytics.ts` - Analytics service for summary calculations

### 4. Architecture Context
- `src/lib/machines/workout/actors/publishWorkoutActor.ts` - Existing publishing patterns to follow

## Starting Point

**First Step**: Create the `socialSharingService.ts` in `src/lib/services/` to generate kind 1 social content from workout data using the simple template format specified in the task document.

**Dependencies to Check**: Ensure the existing workout lifecycle machine successfully publishes NIP-101e records and that the WorkoutDetailModal components are available for reuse in the summary implementation.

## Implementation Order
1. **Service Layer**: Social sharing service for content generation
2. **State Machine**: Add summary state and social publishing actor
3. **UI Components**: WorkoutSummaryModal and SocialShareSection
4. **Integration**: End-to-end flow testing and navigation

This task validates NDK's dual-publishing capabilities while following all established Cline rules for maintainable, optimistic publishing patterns.
