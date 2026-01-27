# NDK Authentication Migration Implementation Task

## Objective
Replace nostr-login with direct NDK authentication to fix Primal iOS connectivity and gain full control over NIP-46 relay configuration, eliminating the black-box abstraction layer that prevents proper mobile signer integration.

## Problem Statement

### **Root Cause Identified**
Log analysis reveals nostr-login completely ignores our `relays` configuration:
```javascript
relays: ['wss://relay.nsec.app/']  // ❌ ONLY nsec.app relay used
```

Our `relays: DEFAULT_RELAYS` configuration is ignored, making mobile signers like Primal iOS unable to connect.

### **Why This is Fighting the Framework**
Per `.clinerules/simple-solutions-first.md`: *"When a library feels difficult, the solution is almost always to simplify, not build workarounds."*

- We've spent multiple hours trying to configure nostr-login properly
- The library provides no visibility into why relay configuration is ignored
- We're fighting against an abstraction layer instead of working directly with NDK
- Mobile signer support should be straightforward, not a debugging black box

## Current State Analysis

### **What Exists Now (and stays!)**
- ✅ `src/lib/auth/atoms.ts` - **KEEP** Jotai state management
- ✅ `src/lib/auth/types.ts` - **KEEP** Authentication types
- ✅ `src/lib/auth/hooks.ts` - **KEEP** Hook interface (update implementations)
- ✅ `src/lib/ndk.ts` - **KEEP** NDK singleton

### **What Gets Replaced**
- ❌ `src/providers/NostrLoginProvider.tsx` - Remove nostr-login init, use direct NDK
- ❌ `src/lib/auth/nostrLoginBridge.ts` - **DELETE** No longer need bridge
- ❌ `package.json` - Remove nostr-login dependency

### **The Simple Truth**
**We DON'T need:**
- ❌ A new "NDKAuthService" class
- ❌ A new "NDKAuthProvider" wrapper
- ❌ Complex service layers
- ❌ New architecture

**We just need to:**
- ✅ Replace `import('nostr-login')` with direct NDK calls
- ✅ Use `NDKNip46Signer` instead of nostr-login's 'connect'
- ✅ Use `window.nostr` detection instead of nostr-login's extension handling
- ✅ Update Jotai atoms directly (no bridge)

## Technical Approach

### **Current Flow (nostr-login)**
```
Component → useNip46Login() → nostr-login library → nostrLoginBridge → Jotai atoms
```

### **New Flow (Direct NDK)**
```
Component → useNip46Login() → Direct NDK (NDKNip46Signer) → Jotai atoms
```

## Implementation Steps

### **Phase 1: Research NDK NIP-46 Patterns (30 minutes)**

#### **1.1 Study NDK Signer Source Code**
Review the local NDK repository for implementation patterns:
```bash
# We have NDK cloned locally at ../ReferenceRepos/ndk
# Key file: ndk/src/signers/nip46/index.ts
```

**Key NDK Patterns to understand:**
1. **NDKNip46Signer constructor patterns:**
   - `new NDKNip46Signer(ndk, "bunker://pubkey?relay=...")` - Connection token
   - `new NDKNip46Signer(ndk, "nip05@domain.com")` - NIP-05 lookup
   
2. **Connection flow:**
   - Create signer with NDK instance
   - Listen for `authUrl` event
   - Call `blockUntilReady()` to establish connection
   - Handle connection success/failure

3. **Relay configuration:**
   - Constructor accepts `relayUrls` array
   - Can be set via connection token: `bunker://pubkey?relay=wss://relay1&relay=wss://relay2`
   - Relays are used for NIP-46 communication channel

#### **1.2 Review Existing Code**
- [ ] Read `src/lib/auth/hooks.ts` - Understand current hook interface
- [ ] Read `src/lib/auth/atoms.ts` - Understand Jotai state structure
- [ ] Read `src/providers/NostrLoginProvider.tsx` - Understand initialization flow

### **Phase 2: Replace NostrLoginProvider (1-2 hours)**

#### **2.1 Update NostrLoginProvider.tsx**
Replace nostr-login initialization with minimal NDK setup:

```typescript
// src/providers/NostrLoginProvider.tsx
'use client';

import { useEffect } from 'react';
import { getNDKInstance } from '@/lib/ndk';

interface NostrLoginProviderProps {
  children: React.ReactNode;
}

export function NostrLoginProvider({ children }: NostrLoginProviderProps) {
  useEffect(() => {
    // Initialize NDK instance (already done in lib/ndk.ts)
    // Just ensure it's ready
    getNDKInstance().then(() => {
      console.log('[NostrLoginProvider] NDK initialized and ready');
    });
  }, []);

  return <>{children}</>;
}
```

**That's it!** No complex initialization, NDK is already a singleton.

### **Phase 3: Update Authentication Hooks (2-3 hours)**

#### **3.1 Replace NIP-07 Extension Hook**
```typescript
// src/lib/auth/hooks.ts - Update useNip07Login implementation

import { useAtom } from 'jotai';
import { accountAtom, methodAtom } from './atoms';
import { getNDKInstance } from '../ndk';

export function useNip07Login() {
  const [, setAccount] = useAtom(accountAtom);
  const [, setMethod] = useAtom(methodAtom);

  return async () => {
    // Check for NIP-07 extension
    if (!window.nostr || typeof window.nostr.getPublicKey !== 'function') {
      return { success: false, error: 'No NIP-07 extension found' };
    }

    try {
      const pubkey = await window.nostr.getPublicKey();
      
      // Update Jotai atoms directly (no bridge!)
      setAccount({
        method: 'nip07',
        pubkey,
        npub: nip19.npubEncode(pubkey)
      });
      setMethod('nip07');

      return { success: true, pubkey };
    } catch (error) {
      console.error('[NIP-07 Login] Error:', error);
      return { success: false, error: 'Extension permission denied' };
    }
  };
}
```

#### **3.2 Replace NIP-46 Remote Signing Hook**
```typescript
// src/lib/auth/hooks.ts - Update useNip46Login implementation

import { NDKNip46Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

export function useNip46Login() {
  const [, setAccount] = useAtom(accountAtom);
  const [, setMethod] = useAtom(methodAtom);
  const [nip46Signer, setNip46Signer] = useState<NDKNip46Signer | null>(null);

  return {
    // Generate connection URI for QR code
    generateConnectionUri: async () => {
      const ndk = await getNDKInstance();
      
      // Generate local signer for this session
      const localSigner = NDKPrivateKeySigner.generate();
      const localUser = await localSigner.user();
      
      // Create NIP-46 signer with OUR relay configuration
      const signer = new NDKNip46Signer(ndk, '', localSigner);
      signer.relayUrls = DEFAULT_RELAYS; // ✅ WE control the relays!
      
      setNip46Signer(signer);
      
      // Generate bunker URI with our relays
      const relayParams = DEFAULT_RELAYS.map(r => `relay=${encodeURIComponent(r)}`).join('&');
      const connectUri = `bunker://${localUser.pubkey}?${relayParams}`;
      
      return { connectUri, signer };
    },
    
    // Wait for connection to complete
    waitForConnection: async () => {
      if (!nip46Signer) {
        return { success: false, error: 'No signer created' };
      }

      try {
        // Listen for auth URL events
        nip46Signer.on('authUrl', (url) => {
          console.log('[NIP-46] Auth URL:', url);
          // Could show this to user as alternative to QR
        });

        // Wait for connection
        const user = await nip46Signer.blockUntilReady();
        
        // Update Jotai atoms directly
        setAccount({
          method: 'nip46',
          pubkey: user.pubkey,
          npub: user.npub,
          relays: DEFAULT_RELAYS
        });
        setMethod('nip46');
        
        // Set signer on NDK instance
        const ndk = await getNDKInstance();
        ndk.signer = nip46Signer;

        return { success: true, user };
      } catch (error) {
        console.error('[NIP-46 Login] Connection failed:', error);
        return { success: false, error: error.message };
      }
    }
  };
}
```

#### **3.3 Keep Read-Only and Ephemeral Hooks**
These don't use nostr-login, so they stay as-is:
- ✅ `useReadOnlyLogin` - Already simple
- ✅ `useEphemeralLogin` - Already using direct NDK

### **Phase 4: Update Login UI (1-2 hours)**

#### **4.1 Update LoginDialog Component**
```typescript
// src/components/auth/LoginDialog.tsx

import QRCode from 'qrcode.react';

const LoginDialog = () => {
  const nip07Login = useNip07Login();
  const nip46Login = useNip46Login();
  const [connectionUri, setConnectionUri] = useState<string>('');
  const [isWaiting, setIsWaiting] = useState(false);

  // Handle NIP-07 (Extension) Login
  const handleExtensionLogin = async () => {
    const result = await nip07Login();
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  // Handle NIP-46 (Mobile Signer) Login
  const handleMobileSignerLogin = async () => {
    const { connectUri } = await nip46Login.generateConnectionUri();
    setConnectionUri(connectUri);
    setIsWaiting(true);
    
    // Wait for mobile signer to connect
    const result = await nip46Login.waitForConnection();
    setIsWaiting(false);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog>
      <Tabs>
        <Tab label="Extension">
          <Button onClick={handleExtensionLogin}>
            Connect Extension
          </Button>
        </Tab>
        
        <Tab label="Mobile Signer">
          {!connectionUri ? (
            <Button onClick={handleMobileSignerLogin}>
              Generate QR Code
            </Button>
          ) : (
            <div>
              <QRCode value={connectionUri} size={256} />
              {isWaiting && <p>Waiting for mobile signer...</p>}
            </div>
          )}
        </Tab>
        
        <Tab label="Read-Only">
          {/* Existing read-only implementation */}
        </Tab>
      </Tabs>
    </Dialog>
  );
};
```

### **Phase 5: Cleanup & Dependency Removal (30 minutes)**

#### **5.1 Delete Unused Files**
```bash
rm src/lib/auth/nostrLoginBridge.ts
```

#### **5.2 Remove nostr-login Dependency**
```bash
npm uninstall nostr-login
```

#### **5.3 Add QR Code Library**
```bash
npm install qrcode.react
npm install --save-dev @types/qrcode.react
```

### **Phase 6: Testing & Validation (1-2 hours)**

#### **6.1 Browser Extension Testing (NIP-07)**
- [ ] Test with Alby extension
- [ ] Test with nos2x extension
- [ ] Verify auto-detection works
- [ ] Test logout and re-login

#### **6.2 Mobile Signer Testing (NIP-46)**
- [ ] Generate QR code with DEFAULT_RELAYS
- [ ] Scan with Primal iOS app
- [ ] Verify connection establishes successfully
- [ ] Test signing operations
- [ ] Confirm relays are correctly configured (check network tab)

#### **6.3 Read-Only Mode Testing**
- [ ] Enable read-only mode
- [ ] Browse published workout content
- [ ] Verify publishing is disabled
- [ ] Test login flow from read-only mode

#### **6.4 Session Persistence Testing**
- [ ] Close browser tab and reopen
- [ ] Verify session restoration works
- [ ] Test page refresh during active session
- [ ] Test logout persistence

### **Phase 7: NIP-46 Handshake Debugging (If Needed)**

**Reference Document**: `docs/research/nip-46-handshake-debugging-with-nak.md`

If `blockUntilReady()` hangs or the handshake doesn't complete, use NAK to diagnose:

#### **7.1 Extract Session Pubkey from Logs**
```
[NIP-46 Login] 🔍 FULL QR CODE URL: nostrconnect://6ef54bfb10db...
                                                   ^^^^^^^^^^^^
                                                   Session pubkey
```

#### **7.2 Monitor Real-Time Handshake Events**

**Terminal 1 - Monitor nos.lol:**
```bash
SESSION_PUBKEY="6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"
echo '["REQ","watch",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://nos.lol
```

**Then scan QR code with Primal and watch for events**

#### **7.3 Check Historical Events (After Scan)**
```bash
# Check if event was published to our relays
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.damus.io | jq
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.primal.net | jq

# Check other common relays (in case Primal uses different relays)
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.nsec.app | jq
```

#### **7.4 Interpret Results**

**✅ Event Found on Our Relays**
→ Problem is in our NDK subscription setup
- Add verbose logging to NDK subscription creation
- Verify NDK is connected to relays before `blockUntilReady()`
- Check subscription filter matches: `{kinds: [24133], "#p": [SESSION_PUBKEY]}`

**🚨 Event Found on DIFFERENT Relays**
→ Primal is using different relays than we specified
- Document which relays Primal actually uses
- Add those relays to our DEFAULT_RELAYS list
- Test again with updated relay list

**❌ No Event Found Anywhere**
→ Primal isn't publishing the handshake event
- Verify QR code format matches NIP-46 spec exactly
- Test with different mobile signer (nsec.app, Amber)
- Check Primal app for known issues/required permissions

## Success Criteria (80% minimum threshold)

### **Critical (Must Pass)**
- [x] ✅ NIP-07 browser extension authentication works (Alby, nos2x)
- [x] ✅ NIP-46 mobile signer authentication (Primal iOS WORKING!)
- [x] ✅ QR code contains DEFAULT_RELAYS configuration
- [x] ✅ Existing hooks interface unchanged (components don't break)
- [x] ✅ Jotai atoms work the same way
- [x] ✅ Session persistence across page refreshes
- [x] ✅ No nostr-login dependency remaining

### **Important (Should Pass)**
- [x] ✅ Clear error messages for authentication failures
- [x] ✅ Simplified codebase (no bridge complexity)
- [x] ✅ Relay configuration visible in logs
- [x] ✅ Logout clears authentication state properly

### **All Blockers Resolved! ✅**
- [x] ✅ **NIP-46 Handshake COMPLETE** - Primal iOS now connects successfully!
  - Root cause: Bypassing `blockUntilReady()` left no RPC listener active
  - Solution: Manual `rpc.subscribe()` before `getPublicKey()` ensures listener is ready
  - Primal uses response-only format (no "ack"), our implementation handles it perfectly
  - Complete authentication flow working end-to-end

### **Nice to Have**
- [ ] Account switching support
- [ ] Enhanced QR code UI with instructions
- [ ] Connection status indicators
- [ ] Relay health monitoring

## Key Files to Modify

### **Files to Modify**
- `src/providers/NostrLoginProvider.tsx` - Remove nostr-login init
- `src/lib/auth/hooks.ts` - Replace nostr-login calls with direct NDK
- `src/components/auth/LoginDialog.tsx` - Update UI for direct NDK
- `package.json` - Remove nostr-login, add qrcode.react

### **Files to Delete**
- `src/lib/auth/nostrLoginBridge.ts` - No longer needed

### **Files that DON'T Change**
- ✅ `src/lib/auth/atoms.ts` - Jotai state (unchanged)
- ✅ `src/lib/auth/types.ts` - Types (unchanged)
- ✅ `src/lib/ndk.ts` - NDK singleton (unchanged)

## Dependencies

### **Add**
```json
{
  "qrcode.react": "^3.1.0"
}
```

### **Remove**
```json
{
  "nostr-login": "^x.x.x"  // Remove completely
}
```

### **Existing (Already Installed)**
- `@nostr-dev-kit/ndk` - Core NDK library
- `@nostr-dev-kit/ndk-cache-dexie` - IndexedDB cache
- `jotai` - State management

## Risk Mitigation

### **Authentication State Migration**
- Existing Jotai atoms remain unchanged
- Authentication hooks maintain same interface
- Components using hooks won't need changes

### **Fallback Strategy**
- Keep nostr-login code in git history
- Test thoroughly before removing dependency
- Document rollback procedure if needed

### **User Impact**
- Users may need to re-authenticate once (session state format changes slightly)
- Clear messaging about authentication method options
- Preserve read-only browsing for unauthenticated users

## Benefits

### **Immediate Benefits**
- ✅ Primal iOS and other mobile signers will work
- ✅ Full control over NIP-46 relay configuration
- ✅ Simplified authentication codebase (remove bridge)
- ✅ No black-box abstraction layer

### **Long-term Benefits**
- ✅ Easier debugging and troubleshooting
- ✅ Better alignment with NDK ecosystem
- ✅ Future-proof authentication architecture
- ✅ Reduced dependency maintenance burden

## References

### **Related .clinerules**
- `.clinerules/ndk-best-practices.md` - NDK usage patterns
- `.clinerules/simple-solutions-first.md` - Why we're removing nostr-login
- `.clinerules/task-creation-process.md` - Task structure guidelines

### **NDK Documentation**
- NDK GitHub: https://github.com/nostr-dev-kit/ndk
- NDK Signers: https://github.com/nostr-dev-kit/ndk/tree/master/ndk/src/signers
- NIP-46 Spec: https://github.com/nostr-protocol/nips/blob/master/46.md

### **Local NDK Source Code**
- Local Repository: `../ReferenceRepos/ndk`
- Key File: `ndk/src/signers/nip46/index.ts` - NDKNip46Signer implementation

---

**Last Updated**: 2026-01-26
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Estimated Time**: 8 hours total (Research: 30min, Implementation: 5.5hrs, Debugging: 2hrs)
**Priority**: High - MISSION ACCOMPLISHED ✅
**Status**: ✅ COMPLETE - ALL SUCCESS CRITERIA MET | Primal iOS NIP-46 WORKING! ✅

## Implementation Progress

### ✅ Completed Phases

**Phase 1: Research** (30 minutes) ✅
- Studied NDK NIP-46 source code
- Reviewed NIP-46 specification 
- Understood `nostrconnect://` vs `bunker://` formats

**Phase 2: Provider Update** (1 hour) ✅
- Removed nostr-login from NostrLoginProvider
- Kept minimal NDK initialization wrapper

**Phase 3: Authentication Hooks** (3 hours) ✅
- ✅ NIP-07 extension auth working perfectly
- ✅ NIP-46 QR code generation working perfectly
- ✅ All DEFAULT_RELAYS included in connection URL
- 🚨 NIP-46 handshake not completing (see blocker below)

**Phase 4: Login UI** (1 hour) ✅
- QR code displays correctly
- All relays visible in logs
- UI state management working

**Phase 5: Cleanup** (30 minutes) ✅
- nostr-login dependency removed
- Bridge file deleted
- QR code library added

**Phase 6: Testing** (2 hours) ✅
- ✅ NIP-07 fully tested with Alby and nos2x
- ✅ NIP-46 Primal iOS fully tested and working
- ✅ Session persistence verified
- ✅ All authentication flows working

### ✅ RESOLVED: NIP-46 Handshake Fix (2026-01-26)

**Root Cause:**
Bypassing `blockUntilReady()` to handle Primal's response-only format left no RPC listener active. When `getPublicKey()` sent a NIP-46 request, no subscription was listening for the response, causing indefinite hang.

**Solution Implemented:**
```typescript
// Start RPC listener before making requests (replaces blockUntilReady)
await finalSigner.rpc.subscribe({ kinds: [24133], '#p': [localUser.pubkey] });

// Now get public key via NIP-46 RPC (will use the active subscription)
const userPubkey = await finalSigner.getPublicKey();
```

**What Now Works:**
```
✅ QR Code generation with all relays
✅ Primal iOS scan and connect response
✅ Response-only format handling (no "ack" required)
✅ Manual RPC listener setup
✅ getPublicKey() successful response
✅ Complete authentication flow
```

**Log Evidence** (`localhost-1769476982433.log`):
```
✅ Valid connect message accepted
🔑 Requesting user pubkey from remote signer...
📡 Starting RPC listener for get_public_key...
✅ Got user pubkey: [user_pubkey]
🎉 Authenticated: [user_pubkey]
```
