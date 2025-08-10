# Library CRUD Removal Persistence Fix - Kickoff Prompt

## Task Summary
Fix the critical issue where removed exercises and workout templates continue appearing in the UI despite successful NIP-51 collection updates and cache invalidation attempts. The problem is in the dependency resolution chain where cached exercise/template events are still being resolved and displayed even after removal from collections.

## Key Technical Issue
**Root Cause**: DependencyResolutionService continues to resolve cached exercise templates using CACHE_FIRST strategy, ignoring that these items were removed from NIP-51 collections. The data flow breaks between collection updates and UI filtering.

**Evidence**: Console logs show successful collection removal and cache invalidation, but dependency resolution still finds and parses "removed" items like "Standard Pushup" exercise template.

## Key Files to Review
1. **Task Document**: `docs/tasks/library-crud-removal-persistence-fix-task.md` - Complete analysis and implementation plan
2. **DependencyResolutionService**: `src/lib/services/dependencyResolutionService.ts` - Core resolution logic that needs investigation
3. **LibraryDataProvider**: `src/providers/LibraryDataProvider.tsx` - Data flow and filtering logic
4. **Console Logs**: `console-export-2025-8-8_21-42-52.txt`, `console-export-2025-8-8_22-13-10.txt` - Evidence of the issue
5. **Service Architecture**: `.clinerules/service-layer-architecture.md` - Compliance requirements

## Starting Point
Begin with **Phase 1: Investigation** by analyzing the DependencyResolutionService to understand how exercise references are resolved and where collection membership should be checked. The goal is to identify the exact point where removed items should be filtered out of the resolution process.

## Success Target
Removed items should disappear from the UI within 2 seconds of removal, with the UI accurately reflecting the actual NIP-51 collection state while maintaining sub-500ms resolution performance.
