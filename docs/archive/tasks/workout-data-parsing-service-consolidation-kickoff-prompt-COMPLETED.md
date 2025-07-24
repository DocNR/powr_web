# Workout Data Parsing Service Consolidation - Kickoff Prompt

## Task Summary
Consolidate scattered workout data parsing logic into a centralized DataParsingService to prepare for activeWorkoutMachine refactoring. This foundational work will simplify the upcoming machine refactor by providing clean service dependencies and eliminating inline parsing throughout the codebase.

## Key Technical Approach
- **Create DataParsingService** with singleton pattern following NDK-first architecture
- **Extract parsing logic** from WorkoutDataProvider, workout-events.ts, dependencyResolution.ts, and workoutAnalytics.ts
- **Integrate ParameterInterpretationService** as dependency for exercise parameter parsing
- **Maintain clean boundaries** between NDK data fetching, parsing, business logic, and UI layers

## Key Files to Review

### **Primary Implementation Files**
1. **`docs/tasks/workout-data-parsing-service-consolidation-task.md`** - Complete task specification with 6-step implementation plan
2. **`.clinerules/service-layer-architecture.md`** - NDK-first service patterns and singleton usage guidelines
3. **`.clinerules/xstate-anti-pattern-prevention.md`** - Prevent complexity in upcoming machine refactor

### **Target Files for Parsing Extraction**
4. **`src/providers/WorkoutDataProvider.tsx`** - Primary parsing extraction target with multiple inline parsing functions
5. **`src/lib/workout-events.ts`** - Core parsing utilities to consolidate into service
6. **`src/lib/services/dependencyResolution.ts`** - Template parsing logic to extract
7. **`src/lib/services/workoutAnalytics.ts`** - Analytics parsing to separate from business logic

### **Integration and Testing**
8. **`src/lib/services/parameterInterpretation.ts`** - Existing service for exercise parameter parsing (dependency)
9. **`src/components/test/WorkflowValidationTest.tsx`** - Integration test for parsing functionality validation

## Starting Point
Begin by creating the DataParsingService foundation with comprehensive TypeScript interfaces and core parsing methods. The service should use singleton pattern and integrate ParameterInterpretationService as a dependency. Focus on establishing clean architecture boundaries between NDK data fetching, parsing, business logic, and UI layers.

## Success Criteria
- DataParsingService created with comprehensive parsing methods and proper TypeScript interfaces
- No parsing logic remains in WorkoutDataProvider, dependencyResolution.ts, or workoutAnalytics.ts
- All parsing centralized with consistent error handling and validation
- WorkflowValidationTest passes with new service architecture
- Clean service boundaries established following NDK-first architecture patterns

---

**Estimated Time**: 2 days (14.5 hours)
**Architecture**: NDK-First Service Layer
**Dependencies**: ParameterInterpretationService integration required
