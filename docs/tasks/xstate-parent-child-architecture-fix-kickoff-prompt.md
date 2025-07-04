# XState Parent-Child Architecture Fix - Task Kickoff Prompt

## Task Summary
Fix the `workoutLifecycleMachine` to follow proper XState v5 parent-child architecture patterns (like NOGA `roundLifecycleMachine`) while extracting proven dependency resolution logic from `WorkoutListManager` into a shared `DependencyResolutionService`. This enables unified template browsing in WorkoutsTab with on-demand exercise resolution, maintains single NDK IndexedDB architecture, and replaces mock data in `loadTemplateActor` with real batched optimization achieving sub-100ms single template resolution.

## Key Technical Approach
- **Phase 0a**: Extract `DependencyResolutionService` from `WorkoutListManager` with proven CACHE_FIRST + batching patterns
- **Phase 0b**: Enhance WorkoutsTab for on-demand template browsing (feed <50ms, details <100ms)
- **Phase 2**: Fix `workoutLifecycleMachine` to use real child machines (not `fromPromise` actors)
- **Architecture**: Single NDK IndexedDB, no custom databases, service provides pure business logic

## Primary Goal
Achieve proper XState parent-child hierarchy while enabling fast template browsing and maintaining proven 867-903ms dependency resolution performance through service optimization.

## Key Files to Review

### **Critical Task Documents**
1. **`docs/tasks/xstate-parent-child-architecture-fix-task.md`** - Complete implementation plan
2. **`src/components/test/WorkoutListManager.tsx`** - Proven optimization patterns to extract
3. **`src/lib/machines/workout/workoutLifecycleMachine.ts`** - Current incorrect architecture
4. **`../noga/state/machines/round/roundLifecycleMachine.ts`** - NOGA reference pattern
5. **`src/lib/machines/workout/actors/loadTemplateActor.ts`** - Mock data to replace

### **Essential .clinerules**
1. **`.clinerules/xstate-anti-pattern-prevention.md`** - Prevent workaround rabbit holes
2. **`.clinerules/service-layer-architecture.md`** - NDK-first service patterns
3. **`.clinerules/ndk-best-practices.md`** - CACHE_FIRST optimization strategies
4. **`.clinerules/simple-solutions-first.md`** - Avoid over-engineering

### **Reference Architecture**
1. **`src/components/tabs/WorkoutsTab.tsx`** - Target for template browsing enhancement
2. **`src/lib/machines/workout/workoutSetupMachine.ts`** - Machine to enhance for dual-use
3. **`src/providers/NavigationProvider.tsx`** - SPA navigation to enhance

## Starting Point
Begin with **Phase 0a**: Analyze `WorkoutListManager.tsx` optimization patterns (lines 200-400 contain the proven batching logic). Extract the `fetchEventsOptimized`, `resolveAllCollectionContent`, and `resolveExerciseDependencies` methods into a new `DependencyResolutionService` class in `src/lib/services/dependencyResolution.ts`. Preserve the exact CACHE_FIRST strategy and author/d-tag batching patterns that achieve 867-903ms performance.

## Dependencies to Check
- Ensure `WorkoutListManager` is working correctly (test the "Test Complete Dependency Resolution" button)
- Verify `workoutSetupMachine` and `activeWorkoutMachine` exist and function independently
- Confirm NOGA reference patterns are accessible in `../noga/state/machines/round/`
- Validate NDK IndexedDB cache is populated with Phase 1 test content

## Success Validation
- Service extraction maintains 867-903ms baseline performance
- WorkoutsTab shows template feed <50ms, details <100ms
- `workoutLifecycleMachine` uses real child machines (no `fromPromise` actors)
- Complete workout flow works end-to-end with NAK verification
- Single NDK IndexedDB architecture preserved (no additional databases)

---

**Next Step**: Start Phase 0a by analyzing `WorkoutListManager.tsx` optimization patterns and creating the `DependencyResolutionService` class.
