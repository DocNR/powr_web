# Library Onboarding Modal State Fix - Kickoff Prompt

## Task Summary
Fix critical state management bugs in the library onboarding modal that prevent proper closure and create dangerous data overwrite scenarios.

## Key Technical Issues
1. **Modal Won't Close**: `needsOnboarding: false` but `showOnboarding: true` 
2. **Data Loss Risk**: Modal appears for users with existing collections (12 exercises, 3 workouts)
3. **State Race Condition**: Modal shows before library empty check completes

## Primary Files to Fix
- `src/components/tabs/LibraryTab.tsx` - Modal state synchronization
- `src/hooks/useLibraryOnboarding.ts` - State transition logic
- `src/components/library/LibraryOnboarding.tsx` - Completion signaling

## Critical Success Criteria
- Modal NEVER appears for users with existing content
- Modal closes immediately on completion/skip
- No race conditions during library checking

## Console Evidence
See `/Users/danielwyler/Downloads/console-export-2025-8-1_0-29-4.txt` for detailed state logs showing the issue.

## Starting Point
Begin by examining the LibraryTab useEffect that should sync `showOnboarding` with the `needsOnboarding` state from useLibraryOnboarding hook.
