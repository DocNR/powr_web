# NostrConnect Session Persistence Implementation Task

## Objective
Implement `nostrconnect://` URI-based session persistence to solve the NIP-46 bunker connection issue where connections are lost on browser refresh. This approach is simpler and more reliable than the complex connect token system used by noauth.

## Current State Analysis
The existing auth system in `src/lib/auth/` is well-structured and should be kept:
- ✅ **types.ts**: Good type definitions with NIP-46 support
- ✅ **hooks.ts**: Comprehensive NIP-46 implementation with auto-login
- ✅ **page.tsx**: Clean landing page with auto-login integration

**Issue**: Current implementation uses complex `bunker://` URL parsing. The `nostrconnect://` URI approach will be simpler and more persistent.

## Technical Approach

### **Root Cause (From Research)**
Based on noauth research, the persistence issue occurs because:
1. Connect tokens are managed server-side by nsec.app (10-minute setup window)
2. Apps must maintain persistent client keypairs for reconnection
3. Current implementation doesn't store session data for auto-reconnection

### **Solution: NostrConnect URI + Session Persistence**
Use the standard NIP-46 `nostrconnect://` URI pattern with persistent session storage:
- Generate persistent URI with client keypair and app metadata
- Store URI + client keypair in localStorage for session persistence
- 10-minute expiry is only for initial authorization, not ongoing sessions
- Once authorized, the session persists indefinitely until manual logout
- Auto-login uses stored client keypair to reconnect seamlessly

## Implementation Steps

### **Phase 1: Add NostrConnect Types and Utilities**

#### 1.1 Update Types
```typescript
// Add to src/lib/auth/types.ts
export interface NostrConnectSession {
  nostrConnectURI: string;
  clientPrivateKey: string;
  clientPubkey: string;
  secret: string;
  userPubkey?: string;
  lastConnected: number;
  relays: string[];
}
```

#### 1.2 Add URI Generation Utility
```typescript
// Add to src/lib/auth/hooks.ts
function generateNostrConnectURI(clientPubkey: string, relays: string[]): { uri: string; secret: string } {
  const secret = generateRandomSecret(); // 16 random characters
  const params = new URLSearchParams({
    relay: relays[0],
    secret,
    perms: 'sign_event,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt',
    name: 'POWR Workout PWA',
    url: window.location.origin
  });
  
  relays.slice(1).forEach(relay => params.append('relay', relay));
  
  return {
    uri: `nostrconnect://${clientPubkey}?${params.toString()}`,
    secret
  };
}

function generateRandomSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### **Phase 2: Implement NostrConnect Login**

#### 2.1 Add NostrConnect Login Hook
```typescript
// Add to src/lib/auth/hooks.ts
export function useNostrConnectLogin() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (): Promise<{ 
    success: boolean; 
    nostrConnectURI?: string; 
    error?: AuthenticationError 
  }> => {
    try {
      console.log('[NostrConnect] Generating client keypair and URI...');
      
      // Generate client keypair for this session
      const clientSigner = NDKPrivateKeySigner.generate();
      const clientUser = await clientSigner.user();
      
      // Generate nostrconnect:// URI
      const relays = ['wss://relay.nsec.app', 'wss://relay.damus.io'];
      const { uri, secret } = generateNostrConnectURI(clientUser.pubkey, relays);
      
      console.log('[NostrConnect] Generated URI:', uri.slice(0, 50) + '...');
      
      // Store session for persistence
      const session: NostrConnectSession = {
        nostrConnectURI: uri,
        clientPrivateKey: clientSigner.privateKey!,
        clientPubkey: clientUser.pubkey,
        secret,
        lastConnected: Date.now(),
        relays
      };
      
      localStorage.setItem('nostr_connect_session', JSON.stringify(session));
      console.log('[NostrConnect] Session stored for persistence');
      
      return { 
        success: true, 
        nostrConnectURI: uri 
      };
    } catch (error) {
      console.error('[NostrConnect] URI generation failed:', error);
      return {
        success: false,
        error: {
          code: 'NIP46_CONNECTION_FAILED',
          message: 'Failed to generate nostrconnect URI'
        }
      };
    }
  };
}
```

#### 2.2 Add Connection Completion Handler
```typescript
// Add to src/lib/auth/hooks.ts
export function useNostrConnectComplete() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (): Promise<{ success: boolean; error?: AuthenticationError }> => {
    try {
      const stored = localStorage.getItem('nostr_connect_session');
      if (!stored) {
        return {
          success: false,
          error: {
            code: 'NIP46_MISSING_CREDENTIALS',
            message: 'No stored nostrconnect session found'
          }
        };
      }

      const session: NostrConnectSession = JSON.parse(stored);
      
      // Recreate client signer
      const clientSigner = new NDKPrivateKeySigner(session.clientPrivateKey);
      
      // Create bunker NDK for communication
      const bunkerNDK = new NDK({
        explicitRelayUrls: session.relays,
        signer: clientSigner
      });
      
      await bunkerNDK.connect();
      
      // Create NIP-46 signer using stored session
      const signer = new NDKNip46Signer(
        bunkerNDK,
        session.nostrConnectURI,
        clientSigner
      );
      
      // Wait for connection to complete
      const user = await signer.blockUntilReady();
      
      if (!user?.pubkey) {
        return {
          success: false,
          error: {
            code: 'NIP46_CONNECTION_FAILED',
            message: 'Failed to complete nostrconnect authentication'
          }
        };
      }
      
      // Update session with user pubkey
      session.userPubkey = user.pubkey;
      session.lastConnected = Date.now();
      localStorage.setItem('nostr_connect_session', JSON.stringify(session));
      
      // Set signer on main NDK
      const mainNDK = await getNDK();
      mainNDK.signer = signer;
      
      // Create account
      const npub = nip19.npubEncode(user.pubkey);
      const account: Account = {
        method: 'nip46' as LoginMethod,
        pubkey: user.pubkey,
        npub,
        bunker: session.nostrConnectURI,
        secret: session.clientPrivateKey,
        relays: session.relays
      };
      
      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== user.pubkey)]);
      setLoginMethod('nip46');
      
      console.log('[NostrConnect] Authentication completed for:', user.pubkey.slice(0, 16) + '...');
      
      return { success: true };
    } catch (error) {
      console.error('[NostrConnect] Connection completion failed:', error);
      return {
        success: false,
        error: {
          code: 'NIP46_CONNECTION_FAILED',
          message: 'Failed to complete nostrconnect authentication'
        }
      };
    }
  };
}
```

### **Phase 3: Implement Auto-Login with NostrConnect**

#### 3.1 Add NostrConnect Auto-Login Function
```typescript
// Add to src/lib/auth/hooks.ts
async function nostrConnectAutoLogin(): Promise<{ success: boolean; error?: AuthenticationError }> {
  try {
    const stored = localStorage.getItem('nostr_connect_session');
    if (!stored) {
      console.log('[NostrConnect Auto-Login] No stored session found');
      return { success: false };
    }
    
    const session: NostrConnectSession = JSON.parse(stored);
    
    // Check if session has user pubkey (completed connection)
    if (!session.userPubkey) {
      console.log('[NostrConnect Auto-Login] Session not completed yet');
      return { success: false };
    }
    
    console.log('[NostrConnect Auto-Login] Attempting reconnection with stored session...');
    
    // Recreate client signer from stored private key
    const clientSigner = new NDKPrivateKeySigner(session.clientPrivateKey);
    
    // Create bunker NDK for communication
    const bunkerNDK = new NDK({
      explicitRelayUrls: session.relays,
      signer: clientSigner
    });
    
    await bunkerNDK.connect();
    
    // Create NIP-46 signer using stored session
    const signer = new NDKNip46Signer(
      bunkerNDK,
      session.nostrConnectURI,
      clientSigner
    );
    
    // Wait for reconnection
    const user = await Promise.race([
      signer.blockUntilReady(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Auto-login timeout')), 15000);
      })
    ]);
    
    if (!user?.pubkey || user.pubkey !== session.userPubkey) {
      console.log('[NostrConnect Auto-Login] Reconnection failed or pubkey mismatch');
      return { success: false };
    }
    
    // Set signer on main NDK
    const mainNDK = await getNDK();
    mainNDK.signer = signer;
    
    // Update session timestamp
    session.lastConnected = Date.now();
    localStorage.setItem('nostr_connect_session', JSON.stringify(session));
    
    console.log('[NostrConnect Auto-Login] Successfully reconnected');
    return { success: true };
  } catch (error) {
    console.error('[NostrConnect Auto-Login] Failed:', error);
    return { success: false };
  }
}
```

#### 3.2 Update Main Auto-Login to Prioritize NostrConnect
```typescript
// Update existing useAutoLogin hook
export function useAutoLogin() {
  const [account] = useAtom(accountAtom);
  const [accounts] = useAtom(accountsAtom);
  const [loginMethod] = useAtom(methodAtom);
  const nip07Login = useNip07Login();

  return async (): Promise<boolean> => {
    if (account) {
      console.log('[Auto Login] Already authenticated, skipping');
      return true;
    }

    try {
      // Try NostrConnect auto-login first (most reliable)
      console.log('[Auto Login] Attempting NostrConnect auto-login...');
      const nostrConnectResult = await nostrConnectAutoLogin();
      if (nostrConnectResult.success) {
        console.log('[Auto Login] NostrConnect auto-login successful');
        return true;
      }

      // Fall back to existing methods
      if (!loginMethod) {
        console.log('[Auto Login] No stored login method');
        return false;
      }

      const storedAccount = accounts.find(a => a.method === loginMethod);
      if (!storedAccount) {
        console.log('[Auto Login] No stored account found for method:', loginMethod);
        return false;
      }

      console.log('[Auto Login] Attempting auto-login with method:', loginMethod);

      if (loginMethod === 'nip07') {
        const result = await nip07Login();
        return result.success;
      } else if (loginMethod === 'nip46' && storedAccount.bunker && storedAccount.secret) {
        const result = await nip46AutoLogin(storedAccount);
        return result.success;
      }

      return false;
    } catch (error) {
      console.error('[Auto Login] Unexpected error:', error);
      return false;
    }
  };
}
```

### **Phase 4: Update UI Components with Progressive Disclosure**

#### 4.1 Update LoginDialog with Progressive Disclosure
```typescript
// Update src/components/auth/LoginDialog.tsx
const LoginMethodSelection = () => {
  const [selectedMethod, setSelectedMethod] = useState<'extension' | 'nostrconnect' | 'bunker' | null>(null);
  
  if (selectedMethod === null) {
    // Initial selection screen
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Choose Login Method</h2>
        
        <Button 
          onClick={() => setSelectedMethod('extension')}
          className="w-full justify-start"
          variant="outline"
        >
          <Shield className="mr-2 h-4 w-4" />
          Connect Extension
          <span className="ml-auto text-xs text-muted-foreground">Recommended</span>
        </Button>
        
        <Button 
          onClick={() => setSelectedMethod('nostrconnect')}
          className="w-full justify-start"
          variant="outline"
        >
          <Link className="mr-2 h-4 w-4" />
          NostrConnect (nsec.app)
          <span className="ml-auto text-xs text-muted-foreground">Most Secure</span>
        </Button>
        
        <Button 
          onClick={() => setSelectedMethod('bunker')}
          className="w-full justify-start"
          variant="outline"
        >
          <Server className="mr-2 h-4 w-4" />
          Bunker URL
          <span className="ml-auto text-xs text-muted-foreground">Advanced</span>
        </Button>
        
        <div className="pt-2 border-t">
          <Button 
            onClick={() => setSelectedMethod('demo')}
            className="w-full"
            variant="secondary"
          >
            <Zap className="mr-2 h-4 w-4" />
            Try Demo
          </Button>
        </div>
      </div>
    );
  }
  
  // Show selected method component
  switch (selectedMethod) {
    case 'extension':
      return <NIP07LoginOption onBack={() => setSelectedMethod(null)} />;
    case 'nostrconnect':
      return <NostrConnectLoginOption onBack={() => setSelectedMethod(null)} />;
    case 'bunker':
      return <BunkerURLLoginOption onBack={() => setSelectedMethod(null)} />;
    case 'demo':
      return <DemoLoginOption onBack={() => setSelectedMethod(null)} />;
    default:
      return null;
  }
};

const NostrConnectLoginOption = ({ onBack }: { onBack: () => void }) => {
  const [nostrConnectURI, setNostrConnectURI] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const nostrConnectLogin = useNostrConnectLogin();
  const nostrConnectComplete = useNostrConnectComplete();

  const handleGenerateURI = async () => {
    setIsGenerating(true);
    try {
      const result = await nostrConnectLogin();
      if (result.success && result.nostrConnectURI) {
        setNostrConnectURI(result.nostrConnectURI);
        setIsWaiting(true);
        
        // Start polling for connection completion
        const pollInterval = setInterval(async () => {
          const completeResult = await nostrConnectComplete();
          if (completeResult.success) {
            clearInterval(pollInterval);
            setIsWaiting(false);
            // Close dialog - user is now authenticated
          }
        }, 2000);
        
        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsWaiting(false);
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('NostrConnect generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(nostrConnectURI);
    // Show toast notification
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Connect with nsec.app</h2>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Generate a secure connection URI to link with your nsec.app bunker service.
      </p>
      
      <Button 
        onClick={handleGenerateURI} 
        disabled={isGenerating || isWaiting}
        className="w-full"
      >
        {isGenerating ? 'Generating...' : 'Generate Connection URI'}
      </Button>
      
      {nostrConnectURI && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Copy this URI and paste it into nsec.app:
          </p>
          <div className="flex gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
              {nostrConnectURI}
            </code>
            <Button size="sm" onClick={copyToClipboard}>
              Copy
            </Button>
          </div>
          {isWaiting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for authorization... Complete the connection in nsec.app
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### **Phase 5: Session Management & Cleanup**

#### 5.1 Update Logout to Clear NostrConnect Session
```typescript
// Update useLogout hook
export function useLogout() {
  const [, resetAuthState] = useAtom(resetAuthStateAtom);
  const [loginMethod] = useAtom(methodAtom);
  
  return async () => {
    console.log('[Logout] Starting logout process...');
    
    const ndk = await getNDK();
    ndk.signer = undefined;
    
    // Clear NostrConnect session
    localStorage.removeItem('nostr_connect_session');
    
    resetAuthState();
    
    console.log('[Logout] Logout complete - all state cleared');
    
    if (typeof window !== 'undefined' && window.nostr && loginMethod === 'nip07') {
      console.log('[Logout] Refreshing page to clear NIP-07 extension cache...');
      window.location.reload();
    }
  };
}
```

#### 5.2 Add Session Cleanup Utility
```typescript
// Add to src/lib/auth/hooks.ts
export function cleanupExpiredSessions() {
  try {
    const stored = localStorage.getItem('nostr_connect_session');
    if (!stored) return;
    
    const session: NostrConnectSession = JSON.parse(stored);
    const daysSinceLastConnection = (Date.now() - session.lastConnected) / (1000 * 60 * 60 * 24);
    
    // Remove sessions older than 30 days
    if (daysSinceLastConnection > 30) {
      localStorage.removeItem('nostr_connect_session');
      console.log('[Session Cleanup] Removed expired nostrconnect session');
    }
  } catch (error) {
    console.error('[Session Cleanup] Error:', error);
    localStorage.removeItem('nostr_connect_session');
  }
}
```

## Success Criteria

### **Primary Goals**
- [ ] NostrConnect URI generation works correctly
- [ ] Session persistence survives browser refresh/close
- [ ] Auto-login completes within 15 seconds or fails gracefully
- [ ] Manual logout clears all session data
- [ ] UI provides clear feedback during connection process

### **Technical Validation**
- [ ] Generated URIs follow NIP-46 specification exactly
- [ ] Client keypairs are properly stored and reused
- [ ] NDK signer integration works seamlessly
- [ ] Error handling provides useful feedback
- [ ] Session cleanup prevents storage bloat

### **User Experience**
- [ ] Connection process is intuitive and clear
- [ ] Copy/paste workflow is smooth
- [ ] Loading states provide appropriate feedback
- [ ] Error messages are actionable
- [ ] Auto-login is transparent to user

## Testing Plan

### **Manual Testing**
1. Generate nostrconnect URI
2. Copy to nsec.app and complete authorization
3. Verify authentication works in POWR app
4. Refresh browser - should auto-login
5. Close/reopen browser - should auto-login
6. Test logout clears session
7. Test expired session cleanup

### **Edge Cases**
- Network disconnection during auth
- nsec.app unavailable
- Malformed stored session data
- Multiple concurrent auth attempts
- Session storage quota exceeded

## Integration Notes

### **Backward Compatibility**
- Keep existing bunker URL support
- NostrConnect takes priority in auto-login
- Graceful fallback to existing methods
- No breaking changes to current auth flow

### **Future Enhancements**
- Support multiple stored sessions
- Session sharing across browser tabs
- Enhanced error recovery
- Connection status indicators

## References
- **NIP-46 Specification**: Standard nostrconnect URI format
- **Noauth Research**: `docs/research/noauth-nip46-session-persistence-research.md`
- **Current Auth System**: `src/lib/auth/hooks.ts` and `src/lib/auth/types.ts`

---

**Status**: Ready for Implementation
**Priority**: High - Solves critical persistence issue
**Estimated Time**: 2-3 days
**Dependencies**: Current auth system (keep as-is)
