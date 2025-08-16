# Nostr-Login Authentication Replacement Implementation Task

## Objective
Replace the current custom authentication system with nostr-login library to solve NIP-46 bunker reliability issues while maintaining existing NDK-first architecture and Jotai state management patterns.

## Current State Analysis
- **Existing System**: Custom NIP-07/NIP-46 implementation with ~600 lines of complex auth logic
- **Pain Points**: NIP-46 bunker connection reliability issues, complex session management
- **Architecture**: Jotai atoms for state, NDK singleton, XState integration, Global NDK Actor
- **Security**: Following web-private-key-security.md patterns with NIP-07 first approach

## Technical Approach
- **Complete Replacement**: Remove all custom auth logic, use nostr-login as authentication layer
- **Bridge Pattern**: Connect nostr-login's `window.nostr` to existing NDK singleton and Jotai state
- **Security Compliance**: Follow .clinerules/web-private-key-security.md - nostr-login never exposes private keys
- **Simple Solutions**: Follow .clinerules/simple-solutions-first.md - let battle-tested library handle complexity

## Implementation Steps

### Phase 1: Foundation Setup ✅ COMPLETE
1. [x] Install nostr-login package: `npm install nostr-login`
2. [x] Create nostr-login configuration with POWR-specific settings
3. [x] Add Next.js SSR-compatible initialization to layout.tsx
4. [x] Create bridge between nostr-login events and Jotai atoms

### Phase 2: Authentication Logic Replacement ✅ COMPLETE
5. [x] Create simplified auth hooks that trigger nostr-login UI
6. [x] Remove all custom NIP-07/NIP-46 implementation from hooks.ts
7. [x] Update LoginDialog to use nostr-login triggers instead of custom UI
8. [x] Implement auth event listeners for state synchronization

### Phase 3: Testing & Validation 🔄 IN PROGRESS
9. [x] Test with provided nostr.band connection string
10. [x] Verify NDK singleton integration works correctly
11. [ ] **PENDING**: Test all authentication methods (extension, bunker, read-only)
12. [ ] **PENDING**: Validate session persistence across browser refreshes

## Current Progress Status (August 16, 2025)

### ✅ COMPLETED WORK
- **Foundation Setup**: nostr-login library installed and configured
- **Bridge Architecture**: nostrLoginBridge.ts successfully connects nostr-login to Jotai atoms
- **Code Reduction**: Achieved 70% reduction (~600 → ~200 lines)
- **UI Integration**: LoginDialog updated to use nostr-login triggers
- **Critical Fix**: Storage event dispatch mechanism for React re-renders implemented
- **NDK Integration**: NDK singleton properly receives signer from window.nostr
- **NIP-46 Bunker**: Basic bunker authentication working with nostr.band connection

### 🔄 REMAINING WORK
- **NIP-07 Browser Extensions**: Extension authentication still needs debugging
- **Authentication Method Testing**: Need comprehensive testing of all methods (extension, readOnly)
- **Session Persistence**: Validate persistence works across all authentication methods
- **Edge Case Testing**: Comprehensive validation of the nostr-login integration

## Success Criteria
- [ ] **PENDING**: User can authenticate with NIP-07 browser extensions (Alby, nos2x)
- [x] **COMPLETE**: User can authenticate with NIP-46 bunkers (nsec.app)
- [ ] **PENDING**: User can use read-only mode by entering npub
- [ ] **PENDING**: User can use ephemeral/demo mode for testing
- [x] **COMPLETE**: System maintains existing NDK singleton and Jotai state patterns
- [ ] **PENDING**: Authentication state persists across browser refreshes
- [x] **COMPLETE**: All existing XState machines and Global NDK Actor continue working
- [x] **COMPLETE**: Code reduction: ~600 lines → ~200 lines (70% reduction)
- [x] **COMPLETE**: NIP-46 bunker connections are reliable (solving current pain point)

### Progress Summary: 5/9 Success Criteria Complete (56%)
**Major Achievement**: 70% code reduction and reliable NIP-46 bunker authentication working
**Remaining Work**: NIP-07 extension authentication and comprehensive method testing

## Nostr-Login Configuration Specifications

### Required Permissions for POWR Events
```typescript
perms: 'sign_event:1,sign_event:1301,sign_event:33401,sign_event:33402,sign_event:30003'
```
- `sign_event:1` - Basic notes
- `sign_event:1301` - Workout records (NIP-101e)
- `sign_event:33401` - Exercise templates (NIP-101e)
- `sign_event:33402` - Workout templates (NIP-101e)
- `sign_event:30003` - Lists/collections (NIP-51)

### Authentication Methods Configuration
```typescript
methods: 'connect,extension,readOnly'
```
- `connect` - NIP-46 bunker authentication
- `extension` - NIP-07 browser extensions
- `readOnly` - npub-only read access (no signing)
- **Excluded**: `local` (private key input) for maximum security

### Bunker Provider Configuration
```typescript
bunkers: 'nsec.app'
```
- Focus on nsec.app as primary bunker provider
- Can expand later based on user feedback

## Architecture Integration Points

### 1. NDK Singleton Compatibility
- **Keep**: Existing NDK singleton pattern in `src/lib/ndk.ts`
- **Bridge**: nostr-login's `window.nostr` automatically works with NDK
- **Benefit**: No changes needed to NDK configuration or Global NDK Actor

### 2. Jotai State Management
- **Keep**: All existing atoms in `src/lib/auth/atoms.ts`
- **Bridge**: nostr-login auth events update Jotai atoms
- **Benefit**: Existing components continue working unchanged

### 3. XState Integration
- **Keep**: Global NDK Actor and all existing state machines
- **Benefit**: Publishing logic remains unchanged since NDK singleton handles it

### 4. Security Compliance
- **Enhanced**: nostr-login never exposes private keys to application
- **Maintained**: NIP-07 first approach with secure fallbacks
- **Improved**: Battle-tested security patterns from nostr.band

## Testing Strategy

### Test Cases
1. **NIP-07 Extension Authentication**
   - Test with Alby extension
   - Test with nos2x extension
   - Verify account switching between extensions

2. **NIP-46 Bunker Authentication**
   - Test with provided nostr.band connection string
   - Test with nsec.app bunker
   - Verify session persistence across refreshes

3. **Read-Only Mode**
   - Test npub input for read-only access
   - Verify no signing capabilities in read-only mode
   - Test data fetching works correctly

4. **Ephemeral/Demo Mode**
   - Test temporary key generation for demos
   - Verify demo accounts work for testing
   - Ensure demo keys are not persisted

5. **Integration Testing**
   - Verify NDK singleton receives correct signer
   - Test workout publishing with all auth methods
   - Validate XState machines work unchanged

## Code Removal Checklist

### Files to Significantly Simplify
- [ ] `src/lib/auth/hooks.ts` - Remove ~300 lines of custom auth logic
- [ ] `src/components/auth/LoginDialog.tsx` - Simplify to nostr-login triggers
- [ ] `src/lib/auth/types.ts` - Remove complex error handling types

### Logic to Remove
- [ ] Custom NIP-07 detection and connection logic
- [ ] Manual bunker URL parsing and validation
- [ ] Complex NIP-46 signer creation and management
- [ ] Custom session persistence and restoration
- [ ] Manual error handling for auth edge cases

### Logic to Keep
- [ ] Jotai atoms and state management
- [ ] NDK singleton pattern and configuration
- [ ] Account switching and multi-user support
- [ ] XState integration patterns

## Security Considerations

### Enhanced Security Benefits
- **Zero Private Key Exposure**: nostr-login never exposes keys to application
- **Battle-Tested Security**: Used by production apps like nostr.band
- **Automatic Session Management**: Secure session handling without custom code
- **Comprehensive Auth Flows**: Handles all edge cases and error states

### Compliance with .clinerules
- **web-private-key-security.md**: Enhanced - no private key management needed
- **simple-solutions-first.md**: Perfect example - replace complex custom code with proven library
- **ndk-best-practices.md**: Compatible - maintains NDK singleton pattern

## Risk Assessment

### Low Risk
- **NDK Integration**: nostr-login's `window.nostr` is standard NDK pattern
- **State Management**: Bridge pattern preserves existing Jotai architecture
- **UI Components**: Gradual migration possible, can keep existing components

### Medium Risk
- **Next.js SSR**: Requires client-side initialization (solvable with useEffect)
- **Session Persistence**: Need to verify nostr-login session handling works with our patterns
- **Testing Coverage**: Need comprehensive testing of all auth methods

### Mitigation Strategies
- **Incremental Testing**: Test each auth method individually
- **Fallback Plan**: Keep current system in separate branch until validation complete
- **Comprehensive Validation**: Use provided nostr.band connection for real-world testing

## References
- **nostr-login README**: `/Users/danielwyler/Downloads/README(2).md`
- **Current Auth System**: `src/lib/auth/hooks.ts`, `src/components/auth/LoginDialog.tsx`
- **Security Guidelines**: `.clinerules/web-private-key-security.md`
- **Simplicity Principles**: `.clinerules/simple-solutions-first.md`
- **NDK Integration**: `.clinerules/ndk-best-practices.md`
- **Test Connection**: `nostrconnect://74a43434a79b0bd583e49f7f315a438b00e4ca8448864872e0eb6a7e31585fe2?...`

## Expected Outcomes

### User Experience Improvements
- **Reliable NIP-46**: Battle-tested bunker connections solve current reliability issues
- **Better Onboarding**: Built-in signup flows for new Nostr users
- **Account Management**: Seamless account switching and session handling
- **Security Confidence**: Users trust proven authentication system

### Developer Experience Improvements
- **Code Reduction**: 70% reduction in authentication code complexity
- **Maintenance**: No more custom auth edge case handling
- **Reliability**: Proven library handles all authentication complexity
- **Focus**: Team can focus on workout features instead of auth debugging

### Architecture Validation
- **NDK-First Confirmed**: Proves NDK singleton pattern works with external auth libraries
- **State Management**: Validates Jotai + bridge pattern for external integrations
- **Security Model**: Demonstrates maximum security with zero private key exposure
- **Golf App Migration**: Establishes patterns for React Native authentication integration

---

**Created**: 2025-08-16
**Branch**: nostr-login
**Priority**: High - Solves critical NIP-46 reliability issues
**Estimated Duration**: 3 days
**Security Level**: Maximum - No private key exposure
