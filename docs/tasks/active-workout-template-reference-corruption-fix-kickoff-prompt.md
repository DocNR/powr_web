# Active Workout Template Reference Corruption Fix - Kickoff Prompt

## Task Summary
Fix the critical template reference corruption bug in `activeWorkoutMachine.ts` that prevents users from starting workouts. The template reference gets duplicated from `33402:pubkey:d-tag` to `33402:pubkey:33402:pubkey:d-tag` during XState actor execution, causing template loading failures. This is a React StrictMode compatibility issue with XState context state management.

## Key Technical Approach
- **Debug-First Strategy**: Add comprehensive logging to trace template reference corruption through the entire data flow
- **XState v5 Compliance**: Ensure proper input validation and immutability patterns following anti-pattern prevention rules
- **React StrictMode Fix**: Handle double-invocation gracefully and prevent state corruption between actor calls
- **Minimal Impact**: Fix the bug without changing existing NDK-first architecture or NIP-101e event generation

## Primary Goal/Outcome
Restore the ability for users to start workouts by ensuring template references maintain their correct format throughout the XState machine execution, with full React StrictMode compatibility and robust error handling for legitimate template loading failures.

## Key Files to Review

### **Critical Task Document**
- `docs/tasks/active-workout-template-reference-corruption-fix-task.md` - Complete implementation plan with 4-phase approach

### **Primary Bug Location**
- `src/lib/machines/workout/activeWorkoutMachine.ts` - Contains the `loadTemplateData` actor where corruption occurs
- `src/lib/machines/workout/workoutLifecycleMachine.ts` - Data flow source that passes template reference to active workout machine

### **Integration Points**
- `src/components/tabs/WorkoutsTab.tsx` - User interaction trigger point where template selection occurs
- `src/lib/machines/workout/actors/loadTemplateActor.ts` - Template loading dependency resolution logic

### **Evidence and Debugging**
- `../Downloads/console-export-2025-7-10_7-49-45.txt` - Complete console logs showing exact corruption pattern

### **Relevant .clinerules**
- `.clinerules/xstate-anti-pattern-prevention.md` - XState best practices and red flags (MANDATORY)
- `.clinerules/simple-solutions-first.md` - Prefer simple fixes over complex workarounds
- `.clinerules/web-ndk-actor-integration.md` - NDK integration patterns to preserve

## Starting Point
Begin with **Phase 1: Debug and Root Cause Analysis** from the task document:

1. **Add Comprehensive Logging** to `activeWorkoutMachine.ts` input handling
2. **Create Debug Test Component** to reproduce the issue in isolation
3. **Trace Template Reference Flow** from `WorkoutsTab.tsx` through the machine hierarchy

Focus on identifying the exact point where the template reference gets corrupted - whether it's during:
- Context assignment in `workoutLifecycleMachine.ts`
- Input parameter handling in `activeWorkoutMachine.ts`
- React StrictMode double-invocation effects
- XState actor cleanup/restart cycles

## Critical Success Criteria
- **Template Loading Works Consistently**: Users can start workouts without template loading failures
- **React StrictMode Compatibility**: Works correctly with React StrictMode enabled
- **No Architecture Changes**: Preserve existing NDK-first patterns and NIP-101e compliance
- **Robust Error Handling**: Legitimate template loading errors still display appropriate messages

## Implementation Timeline
- **Phase 1 (Debug)**: 2-3 hours - Root cause identification
- **Phase 2 (Fix)**: 2-3 hours - Template reference validation and immutability
- **Phase 3 (Test)**: 1-2 hours - End-to-end validation
- **Phase 4 (Cleanup)**: 1 hour - Documentation and code cleanup

## Important Notes
- **React StrictMode**: This bug only manifests with React StrictMode enabled (development mode)
- **XState v5 Patterns**: Follow official XState v5 input validation and actor patterns
- **No Workarounds**: Fix the root cause rather than building defensive workarounds
- **Golf App Migration**: Document patterns for React Native XState integration

---

**Ready to debug and fix! Start by adding detailed logging to trace the template reference corruption through the XState machine execution flow.**
