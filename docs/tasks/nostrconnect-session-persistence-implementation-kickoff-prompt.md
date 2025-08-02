# NostrConnect Session Persistence Implementation - Kickoff Prompt

## Task Summary
Implement `nostrconnect://` URI-based session persistence to solve the NIP-46 bunker connection issue where connections are lost on browser refresh. This approach uses the standard NIP-46 `nostrconnect://` pattern instead of complex connect tokens, providing better persistence and reliability.

## Key Technical Approach
- Generate persistent `nostrconnect://` URI with client keypair
- Store URI + client keypair in localStorage for session persistence
- Prioritize nostrconnect auto-login over existing bunker URL auto-login
- Keep existing bunker URL support as fallback option
- Add progressive disclosure UI: Get Started → (Connect Extension | NostrConnect | Try Demo)

## Key Files to Review
1. **Task Document**: `docs/tasks/nostrconnect-session-persistence-implementation-task.md` - Complete implementation plan
2. **Current Auth System**: `src/lib/auth/hooks.ts` - Well-structured auth hooks (keep as-is)
3. **Auth Types**: `src/lib/auth/types.ts` - Good type definitions with NIP-46 support
4. **Login Dialog**: `src/components/auth/LoginDialog.tsx` - Needs progressive disclosure update
5. **Research**: `docs/research/noauth-nip46-session-persistence-research.md` - Root cause analysis

## Starting Point
**Phase 1: Test with nsec.app first** - Add basic nostrconnect URI generation and test the flow manually before building the full UI integration. The current auth system is solid and should be kept - we're adding nostrconnect as an additional, prioritized option.

## User Feedback Integration
- ✅ Keep bunker URL approach as option (for NAK bunker users)
- ✅ Progressive disclosure UI: Get Started → 3 options
- ✅ Prioritize nostrconnect auto-login over bunker URL
- ✅ Test with nsec.app first before full implementation

## Success Criteria
- NostrConnect URI generation works with nsec.app
- Session persistence survives browser refresh/close
- Auto-login completes reliably or fails gracefully
- Progressive disclosure UI provides clear auth options
- Backward compatibility with existing bunker URL support
