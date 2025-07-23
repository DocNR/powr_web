# Flexible Set Interaction System Implementation - Kickoff Prompt

## Task Summary

Transform the POWR Workout PWA from rigid, machine-centric set interaction to a flexible, user-centric system that supports professional-grade fitness training. This addresses the critical "wrong set completion bug" and enables advanced training patterns like supersets, circuits, and non-linear progression through a unified "Active Set = Active Exercise" architecture.

**Core Innovation**: The app follows what the user is working on, not the other way around.

## Key Technical Approach

**Phase 1 (4-6 days)**: Enhanced event system with new events (`COMPLETE_SPECIFIC_SET`, `EDIT_COMPLETED_SET`, `SELECT_SET`) alongside existing patterns - zero breaking changes.

**Phase 2 (3-4 days)**: UI/UX enhancement with direct editing of completed sets, input focus auto-selection, and context-aware display logic.

**Phase 3 (2-3 days)**: Advanced workout support for supersets, circuits, EMOM/AMRAP with seamless cross-exercise interaction.

**Phase 4 (1-2 days)**: Performance optimization and mobile UX polish.

## Primary Goal/Outcome

Enable professional-grade fitness training methodologies while maintaining NDK-first architecture, NIP-101e compliance, and XState v5 best practices. Users can naturally interact with any set in any exercise without the "wrong set completion" bug, supporting everything from beginner linear progression to advanced competitive training.

## Key Files to Review

1. **Task Document**: `docs/tasks/flexible-set-interaction-system-implementation-task.md` - Complete implementation plan with 4-phase approach
2. **Current Machine**: `src/lib/machines/workout/activeWorkoutMachine.ts` - XState machine requiring event system enhancement
3. **Current UI**: `src/components/powr-ui/workout/SetRow.tsx` - Component needing flexible interaction capabilities
4. **Type Definitions**: `src/lib/machines/workout/types/activeWorkoutTypes.ts` - Event types requiring extension
5. **Standards Compliance**: `.clinerules/xstate-anti-pattern-prevention.md` - Critical XState patterns to follow

## Starting Point

Begin with **Phase 1: Enhanced Event System** by adding new event types to `activeWorkoutTypes.ts` following existing naming conventions. The unified active state system (`SELECT_SET` event) is the architectural foundation that enables all subsequent phases.

**Dependencies**: Review the draft design document at `../noga claude docs/powr/flexible_set_interaction_system.md` for detailed UX specifications and user interaction patterns.

---

**This implementation transforms the app from a basic workout logger into a professional-grade fitness companion that adapts to how people actually train.**
