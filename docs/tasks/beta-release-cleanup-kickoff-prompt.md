# Beta Release Cleanup - Implementation Kickoff Prompt

## Task Summary
Complete comprehensive cleanup and polish of the POWR Workout PWA to prepare for beta release. This involves 14 major cleanup items across security, UI improvements, functionality gaps, and open source preparation.

## Key Technical Approach
- **Incremental Implementation**: Complete ONE item at a time, test thoroughly, then move to next
- **Manual Testing Required**: After each item, manually test to ensure no regressions
- **NDK-First Architecture**: Maintain established patterns throughout
- **NIP-101e Compliance**: Ensure all changes maintain protocol compliance

## Critical Files to Review
1. **Task Document**: `docs/tasks/beta-release-cleanup-task.md` - Complete implementation plan
2. **Active Workout Interface**: `src/components/powr-ui/workout/ActiveWorkoutInterface.tsx` - Major UI changes needed
3. **Library Components**: `src/components/tabs/LibraryTab.tsx` - Mobile list view implementation
4. **Navigation**: `src/components/navigation/MobileBottomTabs.tsx` - Tab cleanup
5. **Workout State Machine**: `src/lib/machines/workout/activeWorkoutMachine.ts` - Set removal functionality
6. **Library Management**: `src/lib/services/libraryManagement.ts` - Add to library functionality

## Starting Point
**Begin with Phase 1, Item 1: Open Source Security Audit**

This is the most critical item that must be completed before any other work:
- Scan entire codebase for hardcoded secrets, API keys, personal references
- Remove any personal information, names, emails, file paths
- Clean up TODO comments with personal references
- Audit configuration files (next.config.js, manifest.json, package.json)
- Create .env.example with placeholder values

**Why Start Here**: Security audit must be done first to ensure no sensitive data is exposed during development or in the final open source release.

## Implementation Workflow
1. **Read the full task document** to understand all 14 items
2. **Start with Item 1** (Security Audit) - complete entirely
3. **Test manually** - verify no functionality is broken
4. **Document any issues** discovered during testing
5. **Only proceed to Item 2** after Item 1 is fully stable
6. **Repeat this pattern** for all 14 items

## Testing Requirements
After each item implementation:
- [ ] Manual test of the specific functionality implemented
- [ ] Test core user flows (login, start workout, complete workout, library browsing)
- [ ] Verify no existing features are broken
- [ ] Check console for any new errors or warnings
- [ ] Test on both desktop and mobile if UI changes were made

## Success Criteria for Each Item
- Implementation matches the specifications in the task document
- No regressions in existing functionality
- Manual testing confirms the feature works as expected
- Code follows established patterns and .clinerules compliance
- Ready to move to next item without concerns

## Phase 1 Priority Order (Week 1)
1. **Open Source Security Audit** - Remove all secrets and personal info
2. **Remove Hardcoded Data from Cards** - Ensure all cards use real Nostr data
3. **Navigation Cleanup** - Remove unused Social/Home tabs

Complete these three items with testing between each before moving to Phase 2.

## Key Reminders
- **One item at a time** - resist the urge to work on multiple items simultaneously
- **Test after each item** - manual testing is required, not optional
- **Document issues** - if you find problems during testing, document them
- **Follow .clinerules** - maintain established architecture patterns
- **NIP-101e compliance** - all changes must maintain protocol compliance

## Expected Outcome
After completing all 14 items with incremental testing, you'll have a polished, stable POWR Workout PWA ready for beta release with:
- Clean, secure codebase ready for open source
- Enhanced user experience with missing functionality filled in
- Consistent UI across all components
- Reliable authentication and data persistence
- Comprehensive content discovery and sharing capabilities

---

**Next Step**: Begin with Phase 1, Item 1 (Open Source Security Audit) from the task document.
