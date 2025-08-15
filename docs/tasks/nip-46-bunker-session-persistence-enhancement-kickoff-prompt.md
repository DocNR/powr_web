# NIP-46 Bunker Session Persistence Enhancement - Implementation Kickoff

## Task Summary
Fix NIP-46 bunker session persistence by implementing a simple fix first: modify auto-login to use the stored local signer key instead of generating a new one every time. This follows the simple-solutions-first principle and could solve the entire issue in 30 minutes.

## Key Technical Approach
**SIMPLE FIX FIRST**: Our current NIP-46 authentication is working perfectly - we just have a simple oversight in auto-login where we ignore the stored local signer key and generate a new one instead.

**Core Problem Identified**: 
- `useNip46Login()` correctly stores `localSigner.privateKey` as `secret`
- `useAutoLogin()` ignores this stored key and calls `nip46Login(bunker)` which generates a NEW local signer
- Bunker sees each auto-login as a completely new client requiring re-authorization

**Phase 0 Solution (30 minutes)**: 
Replace `const result = await nip46Login(storedAccount.bunker);` with code that uses the stored local signer key to preserve client identity.

**Decision Tree**: If Phase 0 works, task complete! If not, proceed to complex hybrid approach with NDK serialization.

## Key Files to Review

### Critical Files (Must Read First)
1. **`docs/tasks/nip-46-bunker-session-persistence-enhancement-task.md`** - Complete implementation plan with Phase 0 approach
2. **`src/lib/auth/hooks.ts`** - Focus on `useAutoLogin()` function - this is where the fix goes
3. **`src/lib/auth/types.ts`** - Current Account interface (already has `secret` field we need)

### Supporting Files
4. **`.clinerules/simple-solutions-first.md`** - Principle guiding this approach
5. **`.clinerules/web-private-key-security.md`** - Security requirements for browser storage
6. **`.clinerules/ndk-best-practices.md`** - NDK singleton and authentication patterns

## Starting Point
**First Step**: Open `src/lib/auth/hooks.ts` and locate the `useAutoLogin()` function.

**Key Line to Find**: 
```typescript
const result = await nip46Login(storedAccount.bunker); // ❌ This creates new signer
```

**The Fix**: Replace this with code that uses `storedAccount.secret` to create the local signer:
```typescript
const localSigner = new NDKPrivateKeySigner(storedAccount.secret); // ✅ Use stored key
```

## Phase 0 Implementation Focus (30 minutes)
1. **Verify NDK methods exist** - Test `toPayload()` and `fromPayload()` availability
2. **Implement simple fix** - Use stored local signer key in auto-login
3. **Add error handling** - Timeout logic and graceful fallback
4. **Test session persistence** - Login, refresh, verify no re-authorization needed
5. **Decision point** - If it works, task complete! If not, proceed to hybrid approach.

## Expected Outcome
**High Probability**: The simple fix should work because:
- We already store the local signer key correctly
- Bunkers authorize specific client keypairs
- Using the same local signer = same client identity = no re-auth needed
- All other connection logic can remain unchanged

**If Simple Fix Works**: Task complete in 30 minutes, no complex implementation needed!
**If Simple Fix Fails**: Proceed to hybrid approach with NDK serialization (3-4 additional days)

## Success Criteria for Phase 0
- [ ] Auto-login uses stored local signer key instead of generating new one
- [ ] NIP-46 bunker sessions persist across app reloads without re-authorization  
- [ ] Connection timeout prevents hanging on failed connections
- [ ] Clear error messages when restoration fails
- [ ] Fallback to manual login when auto-login fails

---

**Implementation Strategy**: Start with the simplest possible fix. Our analysis shows this is likely just a one-line oversight where auto-login doesn't use the stored local signer key. Test this first before building complex systems.

**Next Action**: Review `useAutoLogin()` in `src/lib/auth/hooks.ts` and implement the Phase 0 simple fix.
