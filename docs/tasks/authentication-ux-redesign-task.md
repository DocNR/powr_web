# Authentication UX Redesign Task

## Objective
Redesign the authentication flow to be simpler, more intuitive, and context-aware, reducing friction for both desktop (NIP-07 extension) and mobile PWA (NIP-46 mobile signer) users.

## Current State Analysis

### Current Pain Points
1. **Redundant Landing Page CTAs**: "Start Tracking" and "NostrConnect" both open same dialog
2. **Extra Steps for NIP-46**: Users must click "Generate QR Code" after opening mobile signer section
3. **No Copy Option**: Mobile PWA users cannot copy connection string for paste workflow
4. **Hidden Primary Method**: Mobile signer is buried in "Advanced Options" collapsible
5. **Generic Copy**: "Start Tracking" is ambiguous and doesn't indicate authentication
6. **No Context Detection**: Same flow for desktop and mobile despite different optimal paths

### Current User Flows

**Desktop with Extension (NIP-07):**
1. Click "Start Tracking" or "NostrConnect"
2. Modal opens
3. Click "Connect Extension"
4. Extension prompts → Authenticate
**Total: 3-4 clicks**

**Mobile PWA (NIP-46):**
1. Click "Start Tracking" or "NostrConnect"
2. Modal opens
3. Expand "Mobile Signer" section
4. Click "Generate QR Code"
5. Scan or manually connect
**Total: 4-5 clicks**

### Files Involved
- `src/app/page.tsx` - Landing page with redundant CTAs
- `src/components/auth/LoginDialog.tsx` - Modal with authentication options
- `src/lib/auth/hooks.ts` - Authentication logic (NIP-07, NIP-46, ephemeral)
- `src/lib/auth/atoms.ts` - Auth state management

## Technical Approach

### Phase 1: Immediate Wins (MVP) - 2-3 hours

**Goals:**
- Add copy button for NIP-46 connection string
- Auto-generate QR when NIP-46 flow starts (remove "Generate QR Code" button)
- Merge landing page buttons into one smart "Get Started" CTA
- Improve UI copy and status messages

**Implementation:**

1. **Review Current Authentication Code** ⚠️ CRITICAL
   - Review `useNip07Login()` - Does it auto-detect extension or require user action?
   - Review `useNip46Login()` - How is connection URL generated?
   - Review `useEphemeralLogin()` - Current demo flow behavior
   - Check auto-login logic in `page.tsx` - When/how does it trigger?

2. **LoginDialog.tsx Changes:**
   ```typescript
   // Add copy functionality
   const [copied, setCopied] = useState(false);
   
   const handleCopyConnectionString = async () => {
     try {
       await navigator.clipboard.writeText(connectionUrl);
       setCopied(true);
       
       // Haptic feedback if available
       if ('vibrate' in navigator) {
         navigator.vibrate(50);
       }
       
       setTimeout(() => setCopied(false), 3000);
     } catch (error) {
       // Fallback copy method
       const textarea = document.createElement('textarea');
       textarea.value = connectionUrl;
       document.body.appendChild(textarea);
       textarea.select();
       document.execCommand('copy');
       document.body.removeChild(textarea);
       setCopied(true);
       setTimeout(() => setCopied(false), 3000);
     }
   };
   ```

3. **Auto-generate QR on NIP-46 start:**
   ```typescript
   // Remove "Generate QR Code" button
   // Auto-call handleNip46Login() when mobile signer section is chosen
   
   useEffect(() => {
     if (showMobileSigner && open && !connectionUrl && !isLoggingIn) {
       handleNip46Login();
     }
   }, [showMobileSigner, open]);
   ```

4. **Landing Page (page.tsx) Button Consolidation:**
   ```typescript
   // Replace "Start Tracking" + "NostrConnect" with single button
   <LoginDialog 
     trigger={
       <Button variant="primary-gradient" size="lg">
         Get Started
         <ArrowRight className="ml-2 h-4 w-4" />
       </Button>
     }
   />
   
   // Keep "Try Demo" as secondary option
   <Button onClick={handleTryDemo}>
     Try Demo - No Commitment
   </Button>
   ```

5. **UI Copy Improvements:**
   - "Remote Signer" → "Mobile Signer"
   - "Advanced Options" → Remove collapsible, show as primary option
   - Add clear status messages: "⏳ Approve the connection in your signer app"
   - Copy button text: "Copy Connection String" → "✓ Copied!" (when clicked)

**Success Criteria Phase 1:**
- [ ] Copy button functional with visual feedback
- [ ] QR code auto-generates (no extra click needed)
- [ ] Landing page has single "Get Started" button
- [ ] "Try Demo" remains as secondary option
- [ ] All copy improved for clarity
- [ ] Mobile signer no longer hidden in "Advanced Options"

---

### Phase 2: Smart Context Detection - 2-3 hours

**Goals:**
- Detect browser extension presence
- Detect mobile PWA context
- Show appropriate primary authentication method based on context
- Progressive disclosure of alternative methods

**Implementation:**

1. **Context Detection Utilities:**
   ```typescript
   // src/lib/auth/context-detection.ts (new file)
   export function detectAuthContext() {
     return {
       hasExtension: typeof window !== 'undefined' && 
                     typeof window.nostr !== 'undefined',
       isMobilePWA: typeof window !== 'undefined' && 
                    window.matchMedia('(display-mode: standalone)').matches,
       isMobileDevice: typeof window !== 'undefined' && 
                       /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
     };
   }
   
   export function getPrimaryAuthMethod(context: AuthContext): 'nip07' | 'nip46' {
     // Desktop with extension → NIP-07 primary
     if (context.hasExtension && !context.isMobileDevice) {
       return 'nip07';
     }
     // Mobile or no extension → NIP-46 primary
     return 'nip46';
   }
   ```

2. **LoginDialog Context-Aware UI:**
   ```typescript
   const authContext = detectAuthContext();
   const primaryMethod = getPrimaryAuthMethod(authContext);
   
   // Show different modal layouts based on primary method
   {primaryMethod === 'nip07' ? (
     <div>
       {/* NIP-07 prominent, NIP-46 as alternative */}
       <Button onClick={handleNip07Login}>
         Connect with {extensionName || 'Browser Extension'}
       </Button>
       <div className="text-sm text-muted-foreground mt-4">
         or <button onClick={() => setShowMobileSigner(true)}>
           use mobile signer instead
         </button>
       </div>
     </div>
   ) : (
     <div>
       {/* NIP-46 prominent with auto-generated QR */}
       <QRCodeDisplay connectionUrl={connectionUrl} />
       <Button onClick={handleCopyConnectionString}>
         {copied ? '✓ Copied!' : 'Copy Connection String'}
       </Button>
       <div className="text-sm text-muted-foreground mt-4">
         or <button onClick={() => setShowExtension(true)}>
           use browser extension instead
         </button>
       </div>
     </div>
   )}
   ```

3. **Dynamic Modal Titles:**
   ```typescript
   const getModalTitle = () => {
     if (primaryMethod === 'nip07' && authContext.hasExtension) {
       return 'Connect Your Extension';
     }
     if (primaryMethod === 'nip46') {
       return 'Connect Your Mobile Signer';
     }
     return 'Connect to POWR';
   };
   ```

**Success Criteria Phase 2:**
- [ ] Extension detected on desktop → NIP-07 shown first
- [ ] Mobile PWA detected → NIP-46 shown first
- [ ] Modal title dynamically reflects primary method
- [ ] Alternative methods available via progressive disclosure
- [ ] User sees most relevant option without thinking

---

### Phase 3: Polish & Reliability - 2-3 hours

**Goals:**
- Add retry logic for failed connections
- Improve error messages and recovery flows
- Add session persistence hints
- Better loading and status states

**Implementation:**

1. **Retry Logic for NIP-46:**
   ```typescript
   const retryConnection = async (
     attempt = 1, 
     maxAttempts = 3
   ): Promise<ConnectionResult> => {
     try {
       return await handleNip46Login();
     } catch (error) {
       if (attempt < maxAttempts) {
         const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
         await new Promise(resolve => setTimeout(resolve, delay));
         return retryConnection(attempt + 1, maxAttempts);
       }
       throw new Error('Connection failed after 3 attempts');
     }
   };
   ```

2. **Session Hints (no private keys stored):**
   ```typescript
   // Store hint for reconnection (not keys!)
   const sessionHint = {
     method: loginMethod,
     lastConnectedAt: Date.now(),
     extensionName: 'Alby', // or detected name
   };
   localStorage.setItem('powr_session_hint', JSON.stringify(sessionHint));
   
   // On app restart, show reconnect option if recent
   if (sessionHint && Date.now() - sessionHint.lastConnectedAt < 86400000) {
     showReconnectButton(`Reconnect to ${sessionHint.extensionName}`);
   }
   ```

3. **Enhanced Error Messages:**
   ```typescript
   const getErrorMessage = (error: AuthenticationError) => {
     switch (error.code) {
       case 'NIP46_CONNECTION_FAILED':
         return {
           message: 'Connection timed out',
           action: 'Let\'s try again',
           showRetry: true
         };
       case 'NIP07_NOT_FOUND':
         return {
           message: 'No browser extension detected',
           action: 'Install Alby or nos2x',
           showInstallLink: true
         };
       default:
         return {
           message: 'Something went wrong',
           action: 'Please try again',
           showRetry: true
         };
     }
   };
   ```

4. **Loading States with Guidance:**
   ```typescript
   {isLoggingIn && loginMethod === 'nip46' && (
     <div className="flex flex-col items-center gap-2">
       <RotateCw className="animate-spin size-6" />
       <p className="text-sm text-muted-foreground">
         ⏳ Approve the connection in your signer app
       </p>
       <p className="text-xs text-muted-foreground">
         This usually takes 5-10 seconds
       </p>
     </div>
   )}
   ```

**Success Criteria Phase 3:**
- [ ] Failed connections automatically retry (up to 3 times)
- [ ] Error messages are specific and actionable
- [ ] Session hints enable quick reconnect (no re-authentication)
- [ ] Loading states provide clear guidance on what user should do
- [ ] Connection timeout increased if needed based on testing

---

## Testing Checklist

### Manual Testing Required

**Desktop Browser (Chrome/Firefox):**
- [ ] With Alby extension installed
  - [ ] "Get Started" opens modal with NIP-07 prominent
  - [ ] One-click connection works
  - [ ] Alternative mobile signer option available
- [ ] Without extension installed
  - [ ] Modal shows mobile signer as primary
  - [ ] Install extension link/guidance shown

**Mobile PWA (iOS Safari/Android Chrome):**
- [ ] Standalone PWA mode detected
- [ ] "Get Started" opens modal with QR code already visible
- [ ] Copy button copies connection string successfully
- [ ] Haptic feedback works (iOS/Android)
- [ ] Paste workflow in Primal works correctly

**Demo Mode:**
- [ ] "Try Demo - No Commitment" button works
- [ ] Ephemeral login successful
- [ ] User understands demo limitations

**Error Scenarios:**
- [ ] Connection timeout shows helpful retry option
- [ ] Extension permission denied handled gracefully
- [ ] Offline state doesn't break authentication flow

### Automated Testing Considerations
```typescript
// Test context detection
describe('Auth Context Detection', () => {
  it('detects NIP-07 extension', () => {
    window.nostr = { getPublicKey: jest.fn() };
    expect(detectAuthContext().hasExtension).toBe(true);
  });
  
  it('detects mobile PWA mode', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(detectAuthContext().isMobilePWA).toBe(true);
  });
});

// Test copy functionality
describe('Copy Connection String', () => {
  it('copies to clipboard successfully', async () => {
    const mockClipboard = jest.fn();
    navigator.clipboard = { writeText: mockClipboard };
    
    await handleCopyConnectionString();
    expect(mockClipboard).toHaveBeenCalledWith(connectionUrl);
  });
});
```

---

## Success Metrics

### Quantitative Goals
- **Click Reduction**: 3-5 clicks → 2-3 clicks (40% improvement)
- **First-Try Success Rate**: 
  - Extension users: 60% → 90%
  - Mobile users: 40% → 70%
- **Demo Adoption**: 20% → 35% of new users

### Qualitative Goals
- Users understand authentication options without explanation
- No confusion about which method to choose
- Error states provide clear next steps
- Authentication feels fast and reliable

---

## Implementation Timeline

**Phase 1 (MVP)**: 2-3 hours
- Copy button + auto-generate QR
- Landing page consolidation
- UI copy improvements

**Phase 2 (Smart Defaults)**: 2-3 hours
- Context detection
- Dynamic primary method
- Progressive disclosure

**Phase 3 (Polish)**: 2-3 hours
- Retry logic
- Better errors
- Session hints

**Total Estimated Time**: 6-9 hours across 3 phases

---

## References

### Related Files
- `src/app/page.tsx` - Landing page
- `src/components/auth/LoginDialog.tsx` - Auth modal
- `src/lib/auth/hooks.ts` - Authentication logic
- `src/lib/auth/atoms.ts` - State management
- `src/lib/auth/types.ts` - Type definitions

### Related .clinerules
- `simple-solutions-first.md` - Keep solutions simple
- `radix-ui-component-library.md` - UI component standards
- `web-private-key-security.md` - Security requirements

### External References
- NIP-07: Browser extension signing
- NIP-46: Remote signing (Nostr Connect)
- Clipboard API: `navigator.clipboard.writeText()`

---

**Last Updated**: 2025-01-26
**Status**: Ready for implementation
**Priority**: High - UX improvement
