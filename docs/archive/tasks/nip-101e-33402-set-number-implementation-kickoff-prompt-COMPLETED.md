# NIP-101e 33402 Set Number Implementation - Kickoff Prompt

## Task Summary
Implement `set_number` parameter support in 33402 workout template events to prevent NDK deduplication of identical exercise tags. This ensures data integrity for workout templates with multiple sets of the same exercise (e.g., "3 sets of 10 push-ups" maintains all 3 exercise tags instead of being deduplicated to 1).

The core issue is that NDK automatically deduplicates events with identical tags, which causes workout templates with repeated exercises to lose sets. Adding `set_number` as a 5th parameter (matching the existing 1301 record format) will prevent this deduplication while maintaining consistency across event types.

## Key Technical Approach
- **Phase 1**: Run NDK Deduplication Test to confirm the issue and validate the solution
- **Phase 2**: Update core services (event generation, parsing, parameter interpretation)
- **Phase 3**: Update UI components (WorkoutDataProvider, WorkoutCard, social feed components)
- **Phase 4**: Update XState machines to handle new parameter structure
- **Phase 5**: Update documentation and test data

## Key Files to Review

### Critical Reference Files
1. **`docs/tasks/nip-101e-33402-set-number-implementation-task.md`** - Complete task document with detailed implementation steps
2. **`docs/nip-101e-specification.md`** - Official NIP-101e specification (already updated)
3. **`.clinerules/nak-nip-101e-publishing.md`** - NAK publishing examples (already updated)
4. **`src/components/test/NDKDeduplicationTest.tsx`** - Test component to validate the issue and solution

### Core Implementation Files
5. **`src/lib/services/workoutEventGeneration.ts`** - Event generation service (needs set_number support)
6. **`src/lib/services/dataParsingService.ts`** - Event parsing service (needs 5-parameter parsing)
7. **`src/lib/services/parameterInterpretation.ts`** - Parameter interpretation service
8. **`src/providers/WorkoutDataProvider.tsx`** - UI data provider (needs new format support)

### UI Components That Need Updates
9. **`src/components/tabs/WorkoutsTab.tsx`** - Main workout discovery interface
10. **`src/components/tabs/SocialTab.tsx`** - Social feed filtering
11. **`src/components/powr-ui/workout/WorkoutCard.tsx`** - Workout display cards
12. **`src/components/powr-ui/workout/WorkoutDetailModal.tsx`** - Workout detail modal

## Starting Point
1. **First Step**: Run the `NDKDeduplicationTest` component to confirm the deduplication issue exists with 33402 templates and validate that adding `set_number` solves it
2. **Dependencies**: Ensure you understand the difference between 33402 templates (currently 4 parameters) and 1301 records (already 5 parameters with set_number)

## Success Criteria
- NDK Deduplication Test shows 33402 templates preserve all exercise tags with `set_number`
- Templates with "3 sets of 10 push-ups" maintain all 3 exercise tags
- All existing functionality continues to work without regression
- Social feed and discovery components handle new parameter structure correctly

## Context Notes
- **NDK Behavior**: NDK automatically deduplicates events with identical content and tags
- **Current Issue**: 33402 templates with multiple identical exercise prescriptions lose sets
- **Solution**: Add `set_number` as 5th parameter to make each exercise tag unique
- **Consistency**: This matches the existing 1301 record format which already uses set_number

## Implementation Priority
1. **High Priority**: Core services and event generation (prevents data loss)
2. **Medium Priority**: UI components and data providers (ensures proper display)
3. **Low Priority**: Documentation updates (maintains consistency)

---

**Task Document**: `docs/tasks/nip-101e-33402-set-number-implementation-task.md`
**Estimated Duration**: 2-3 days
**Priority**: High - Data Integrity Issue
