# Active Workout Machine Service Integration Refactor - Kickoff Prompt

## Task Summary
Refactor the activeWorkoutMachine (~700 lines) to integrate the existing DataParsingService and create a WorkoutTimingService, eliminating inline parsing logic, hardcoded debugging code, and mixed business logic. The goal is a clean, maintainable state machine (~300 lines) focused purely on workout coordination while preserving all existing functionality including the critical NDK deduplication fix.

## Key Technical Approach
- **Service Integration**: Replace inline template parsing with `dataParsingService.parseWorkoutTemplate()` calls
- **Business Logic Extraction**: Create WorkoutTimingService for timing calculations and rest period management  
- **Clean Architecture**: Machine handles only state transitions and event coordination
- **Critical Preservation**: Maintain per-exercise set counters for NDK deduplication

## Primary Goal/Outcome
Transform a complex, mixed-concern state machine into a clean, service-driven architecture that leverages the existing DataParsingService's comprehensive caching and validation while maintaining 100% functional compatibility.

## Key Files to Review

### 1. Task Document (CRITICAL - Read First)
- `docs/tasks/active-workout-machine-service-integration-refactor-task.md` - Complete implementation plan and success criteria

### 2. Target Refactoring File
- `src/lib/machines/workout/activeWorkoutMachine.ts` - Current 700-line machine with inline parsing logic (lines 50-120) and hardcoded debugging (lines 50-80)

### 3. Service Integration Assets
- `src/lib/services/dataParsingService.ts` - Existing 800+ line service with LRU cache, validation, and comprehensive parsing methods
- `src/components/test/WorkflowValidationTest.tsx` - Critical test that must continue working after refactoring

### 4. Architecture Guidelines
- `.clinerules/service-layer-architecture.md` - Service patterns and singleton usage
- `.clinerules/xstate-anti-pattern-prevention.md` - XState best practices to follow

### 5. Critical Reference
- `.clinerules/README.md` - Smart navigation for any additional rules needed during implementation

## Starting Point
Begin by examining the current activeWorkoutMachine to identify the specific inline parsing logic in the `loadTemplateData` actor (lines 50-120) and hardcoded debugging logic (lines 50-80) that need to be replaced with DataParsingService integration. The DataParsingService already has `parseWorkoutTemplate()` method with comprehensive caching that can directly replace this logic.

## Dependencies to Check
- ✅ DataParsingService is complete and functional
- ✅ WorkflowValidationTest exists and validates current functionality  
- ✅ Per-exercise set counters are implemented for NDK deduplication
- ⚠️ Need to create WorkoutTimingService as part of this refactoring

## Success Validation
The refactoring is successful when:
1. Machine is reduced from ~700 to ~300 lines
2. All inline parsing logic is removed and replaced with service calls
3. WorkflowValidationTest passes without modification to test logic
4. Per-exercise set counters for NDK deduplication are preserved
5. Template loading performance is maintained or improved through DataParsingService caching

---

**Timeline**: 1 Day  
**Priority**: High - Blocks history tab implementation  
**Next Steps After Completion**: History tab implementation can proceed with clean, maintainable active workout machine
