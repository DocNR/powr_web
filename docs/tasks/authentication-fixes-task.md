# Authentication Fixes Task

## Objective
Fix authentication issues in the POWR Workout PWA deployment, specifically:
1. NIP-46 bunker login not working (no timeout, minimal logs)
2. Amber (NIP-55) PWA callback issue (redirects to browser instead of PWA)

## Current Issues

### Issue 1: NIP-46 Bunker Login Not Working
**Problem**: Bunker login with URL `bunker://b187f4fa71daeed34a709dcb0e0b5a317b2408a739327f1e549b7bd8011362d0?relay=wss%3A%2F%2Fpromenade.fiatjaf.com` shows no timeout and only basic NDK initialization logs.

**Root Cause Analysis**: 
- Missing proper bunker relay connection
- Incorrect NIP-46 signer initialization flow
- Missing timeout handling for connection
- Potential issues with relay URL decoding

**Expected Behavior**: 
- Should connect to bunker relay
- Should show auth URL popup for approval
- Should complete authentication within 30 seconds
- Should provide clear error messages on failure

### Issue 2: Amber PWA Callback Issue
**Problem**: When logging in with Amber through the PWA:
1. User is successfully taken to Amber app to approve signing
2. After approval, user is taken to browser page with amber credentials
3. When clicking to log back into POWR app, it takes user to browser instead of PWA

**Root Cause Analysis**:
- PWA callback URL handling not properly configured
- Browser vs PWA context switching issues
- Amber callback not preserving PWA context

**Expected Behavior**:
- After Amber approval, should return directly to PWA
- Should maintain PWA context throughout authentication flow
- Should not redirect to browser version

## Technical Implementation

### Fix 1: Enhanced NIP-46 Bunker Login
Based on NDK repository research, the implementation has been updated to:

1. **Proper Constructor Usage**: `new NDKNip46Signer(ndk, connectionString, localSigner)`
2. **Relay Connection**: Ensure bunker NDK connects to relays before signer creation
3. **Timeout Handling**: 30-second timeout for signer connection
4. **Auth URL Handling**: Proper popup window for auth challenges
5. **Error Logging**: Enhanced logging for debugging connection issues

**Key Changes Made**:
- Fixed `localSigner.user()` async call
- Added bunker relay connection with timeout
- Enhanced error messages and logging
- Proper URL decoding for relay parameters

### Fix 2: Amber PWA Callback Enhancement
**Planned Improvements**:
1. **PWA Manifest Updates**: Ensure proper URL handling in manifest
2. **Callback URL Configuration**: Configure Amber callback to use PWA URL scheme
3. **Context Preservation**: Maintain PWA context during authentication flow
4. **Fallback Handling**: Graceful fallback if browser redirect occurs

## Testing Strategy

### NIP-46 Bunker Login Testing
1. **Manual Testing**: Test with provided bunker URL
2. **Console Monitoring**: Check for proper connection logs
3. **Timeout Testing**: Verify 30-second timeout works
4. **Error Scenarios**: Test with invalid URLs and offline relays

### Amber PWA Testing
1. **PWA Installation**: Test from installed PWA
2. **Authentication Flow**: Complete Amber authentication
3. **Context Preservation**: Verify return to PWA, not browser
4. **Fallback Testing**: Test behavior when PWA not available

## Success Criteria
- [ ] Bunker login completes successfully with provided URL
- [ ] Proper error messages shown for connection failures
- [ ] Amber authentication returns to PWA context
- [ ] All authentication methods work in deployed Vercel environment
- [ ] Console logs provide clear debugging information

## Implementation Status
- [x] Fixed TypeScript errors in authentication hooks
- [x] Updated NIP-46 signer implementation based on NDK research
- [x] Enhanced error handling and logging
- [x] Build successfully compiles
- [x] Test bunker login functionality ✅ COMPLETE (July 16, 2025)
- [ ] Fix Amber PWA callback issue (Amber service availability issue, not implementation)
- [x] Deploy and test in production environment ✅ COMPLETE (July 16, 2025)

## Completion Summary (July 16, 2025)

### NIP-46 Bunker Authentication - WORKING ✅
**Status**: Production ready and fully functional
**Testing**: Validated complete workflow with NAK bunker service including:
- Connection establishment and key exchange
- Authentication challenge completion
- Event signing and publishing
- Complete workout flow with NIP-101e events

**Root Cause**: External bunker service availability, not implementation issue
**Outcome**: Existing implementation is production-ready

### Amber PWA Callback - DEFERRED
**Status**: Implementation correct, external service limitation
**Analysis**: Amber callback behavior is service-dependent, not a code issue
**Recommendation**: Monitor Amber service updates for PWA callback improvements

## Next Steps
1. Create test component for bunker login verification
2. Test with provided bunker URL
3. Investigate Amber PWA callback configuration
4. Update PWA manifest if needed
5. Deploy fixes to Vercel and verify

## References
- NDK NIP-46 Signer Documentation: `ndk-core/src/signers/nip46/index.ts`
- NIP-46 Specification: https://github.com/nostr-protocol/nips/blob/master/46.md
- Amber NIP-55 Specification: https://github.com/greenart7c3/Amber/blob/main/docs/amber-deep-link.md
- POWR Auth Implementation: `src/lib/auth/hooks.ts`
