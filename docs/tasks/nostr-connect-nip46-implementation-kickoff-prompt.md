# Nostr Connect (NIP-46) Implementation - Kickoff Prompt

## Task Summary
Implement Nostr Connect (NIP-46) remote signing functionality as a more reliable alternative to bunker connections. This involves creating a client-initiated connection flow where the app generates `nostrconnect://` URIs for users to share with remote signers, enabling persistent authentication sessions that survive browser restarts.

## Key Technical Approach
- Use NDK's `NDKNip46Signer.nostrconnect()` method for client-initiated connections
- Generate `nostrconnect://` URIs using NDK's built-in URI generation
- Implement session persistence through encrypted local storage of signer keys
- Create user-friendly UI with QR codes for easy remote signer connection

## Key Files to Review
1. **Task Document**: `docs/tasks/nostr-connect-nip46-implementation-task.md` - Complete implementation plan
2. **Security Patterns**: `.clinerules/web-private-key-security.md` - Required security compliance
3. **NDK Integration**: `.clinerules/web-ndk-actor-integration.md` - NDK singleton patterns
4. **Service Architecture**: `.clinerules/service-layer-architecture.md` - Business logic patterns
5. **UI Components**: `.clinerules/radix-ui-component-library.md` - Component standards

## Starting Point
Begin with Phase 1: Core NIP-46 Integration by examining the current authentication architecture in `src/lib/auth/` and understanding how to extend it with Nostr Connect functionality. The NDK NIP-46 implementation research shows clear patterns for `nostrconnect://` URI generation and connection management.

## Dependencies to Check
- Verify NDK NIP-46 imports are available in current NDK version
- Review existing authentication hooks and atoms structure
- Understand current NDK singleton setup and Global NDK Actor integration
- Check existing UI component patterns for modal and status displays

This implementation should provide a more reliable authentication method than the previously attempted bunker connections, with better session persistence and user experience.
