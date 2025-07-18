# Active Workout UI Redesign with Semantic Styling - Kickoff Prompt

## Task Summary
Redesign the active workout interface to match a clean, streamlined target design while implementing semantic styling through POWR UI components for consistent white labeling. The goal is to replace the current complex, card-heavy interface with a clean table-style layout (Back | Timer | Finish header, simplified exercise sections, touch-friendly set inputs) while establishing semantic CSS patterns that enable gym personality theming across the entire application.

## Key Technical Approach
- **POWR UI Component System**: Leverage existing Radix UI + Tailwind architecture for semantic styling
- **White Label Foundation**: Implement gym personality variants (zen, hardcore, corporate, boutique) throughout all workout components
- **Target Design Match**: Clean 3-element header, table-style set layout, minimal visual noise
- **Semantic CSS Architecture**: Replace hardcoded Tailwind classes with semantic class patterns for consistent theming

## Key Files to Review
1. **Task Document**: `docs/tasks/active-workout-ui-redesign-semantic-styling-task.md` - Complete implementation plan and success criteria
2. **POWR UI Architecture**: `.clinerules/radix-ui-component-library.md` - Component library standards and white labeling approach
3. **Current Active Workout Components**: 
   - `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - Main interface to redesign
   - `src/components/powr-ui/workout/ExerciseSection.tsx` - Exercise display component
   - `src/components/powr-ui/workout/SetRow.tsx` - Set input component
4. **Existing POWR UI Primitives**: `src/components/powr-ui/primitives/` - Button, Input, Card components to extend
5. **XState Integration**: `src/lib/machines/workout/activeWorkoutMachine.ts` - Ensure compatibility with existing state management

## Starting Point
Begin with Phase 1: Audit current styling patterns across ActiveWorkoutInterface, ExerciseSection, and SetRow components to identify all hardcoded Tailwind classes that need conversion to semantic POWR UI patterns. Then enhance the existing POWR UI primitives with workout-specific variants and gym personality theming support before implementing the visual redesign.

## Success Criteria Reminder
- Visual design matches target app's clean interface
- All components use semantic POWR UI classes instead of hardcoded Tailwind
- Gym personality theming works consistently across all workout components
- Mobile-optimized touch-friendly interface
- Maintains existing XState integration and performance
