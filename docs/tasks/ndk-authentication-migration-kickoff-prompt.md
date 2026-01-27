# NDK Authentication Migration - Kickoff Prompt

## Task Summary

Replace nostr-login with direct NDK authentication to fix Primal iOS mobile signer connectivity. The problem: nostr-login ignores our relay configuration and only uses `wss://relay.nsec.app/`, making mobile signers unable to connect. *Update: Relay configuration was resolved with correct nostrconnect string, however we are still not getting the handshake

## Current Status (Updated 2025-01-26)

**✅ Phases 1-4 Complete** (4-5 hours completed)
- NIP-07 extension auth working perfectly
- NIP-46 QR code generation working perfectly
- All DEFAULT_RELAYS included in connection URL
- **🚨 BLOCKED**: NIP-46 handshake not completing

**Current Blocker:**
- Primal iOS scans QR code successfully
- `blockUntilReady()` hangs indefinitely
- No error messages, no timeout, no response
- **Next Step**: New troubleshooting task needed

## Key Technical Approach

**This is NOT a complex refactor.** We're simply replacing library calls while keeping existing architecture:

- ✅ **KEEP**: Jotai atoms, authentication hooks interface, NDK singleton
- ❌ **REMOVE**: nostr-login library calls and bridge
- ✅ **ADD**: Direct NDK calls (`NDKNip46Signer`, `window.nostr`)

**Current Flow:**
```
Component → hook → nostr-login → bridge → Jotai atoms
```

**New Flow (Implemented):**
```
Component → hook → Direct NDK → Jotai atoms
```

## Key Files to Review

1. **Task Document**: `docs/tasks/ndk-authentication-migration-task.md` - Full implementation plan
2. **Current Auth Hooks**: `src/lib/auth/hooks.ts` - Keep interface, update implementation
3. **Current Provider**: `src/providers/NostrLoginProvider.tsx` - Replace nostr-login init
4. **Jotai Atoms**: `src/lib/auth/atoms.ts` - Keep unchanged
5. **NDK Source**: `../ReferenceRepos/ndk/ndk/src/signers/nip46/index.ts` - Reference implementation

## Starting Point

1. Read the full task document to understand the simplified approach
2. Review `src/lib/auth/hooks.ts` to see current hook implementations
3. Study `../ReferenceRepos/ndk/ndk/src/signers/nip46/index.ts` for NDKNip46Signer patterns
4. Start with Phase 2: Replace NostrLoginProvider.tsx (simplest change)

## What Success Looks Like

- ✅ NIP-07 browser extensions work (COMPLETE - tested with nos2x)
- ✅ NIP-46 QR code includes OUR relay list (COMPLETE - all relays in URL)
- 🚨 Primal iOS mobile signer connects successfully (BLOCKED - handshake issue)
- ✅ Existing components don't break (COMPLETE - hooks interface unchanged)
- ✅ No nostr-login dependency in package.json (COMPLETE)
- ✅ Simplified codebase (COMPLETE - no bridge file)

## Current Implementation Details

### What's Working ✅

**NIP-07 Extension Authentication:**
```typescript
// Fully functional - direct window.nostr detection
if (window.nostr?.getPublicKey) {
  const pubkey = await window.nostr.getPublicKey();
  // Updates Jotai atoms directly
}
```

**NIP-46 QR Code Generation:**
```typescript
// Generates correct nostrconnect:// URL with all relays
nostrconnect://6ef54bfb...?relay=wss://relay.damus.io&relay=wss://nos.lol&relay=wss://relay.primal.net
```

**Architecture Cleanup:**
- ✅ NostrLoginProvider simplified
- ✅ Direct NDK calls in hooks
- ✅ Jotai atoms unchanged
- ✅ No bridge complexity

### What's Blocked 🚨

**NIP-46 Handshake:**
```typescript
// This hangs indefinitely - no response from Primal
const user = await signer.blockUntilReady(); // ⏳ Hangs forever
```

**Log Evidence:**
```
✅ QR Code generated with all relays
✅ Primal iOS scans QR successfully  
🚨 blockUntilReady() never returns
🚨 No error, no timeout, no response
```

**Possible Causes to Investigate:**
1. NDK relay subscription not set up correctly
2. NIP-46 `connect` response event not being received
3. Event filtering issue (wrong pubkey or relay)
4. Timeout mechanism needed
5. Manual subscription setup required before blockUntilReady()

## Important Notes

- **NOT over-architecting**: We're not adding new services or providers
- **Research available**: NDK source code is cloned locally for reference
- **Keep it simple**: Replace library calls, that's it
- **Test incrementally**: Each phase has clear testing steps

## Time Spent & Remaining

**Completed: 4-5 hours**
- ✅ Phase 1 (Research): 30 minutes
- ✅ Phase 2 (Provider): 1 hour
- ✅ Phase 3 (Hooks): 3 hours
- ✅ Phase 4 (UI): 1 hour

**Remaining: 1-2 hours (blocked)**
- ⏸️ Phase 5 (Cleanup): 30 minutes - Pending handshake fix
- ⏸️ Phase 6 (Testing): 1-2 hours - Pending handshake fix

## Next Steps for Troubleshooting - Use NAK! 🔍

### **NEW: Phase 7 Added to Task Document**

The task now includes **Phase 7: NIP-46 Handshake Debugging** with complete NAK commands to diagnose where the handshake is failing.

### **New Research Documents Available:**

1. **`docs/research/nip-46-nostr-connect-explained.md`**
   - Simple explanation of how NIP-46 works
   - Step-by-step handshake process
   - Identifies exactly where the blocker occurs

2. **`docs/research/nip-46-handshake-debugging-with-nak.md`**
   - Complete NAK and websocat commands
   - Real-time monitoring while scanning QR
   - Historical event checking across relays
   - Multi-relay verification script

### **Immediate Next Step: Run NAK Verification**

```bash
# Extract your session pubkey from console logs:
# [NIP-46 Login] 🔍 FULL QR CODE URL: nostrconnect://6ef54bfb10db...

SESSION_PUBKEY="YOUR_SESSION_PUBKEY_HERE"

# Monitor in real-time (Terminal 1 - keep open):
echo '["REQ","watch",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://nos.lol

# Then scan QR with Primal and watch for events

# After scan, check if event was published (Terminal 2):
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.damus.io | jq
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.primal.net | jq
```

### **What NAK Will Tell You:**

**✅ Event found on our relays** → Problem is in our NDK subscription setup
**🚨 Event found on different relays** → Primal using wrong relays
**❌ No event found anywhere** → Primal not publishing

This immediately identifies whether the problem is your code or Primal's behavior!

---

**Ready to debug**: Use the NAK commands in Phase 7 to find out exactly where the handshake is failing. The authentication migration is 80% complete - NAK debugging will get you unstuck!
