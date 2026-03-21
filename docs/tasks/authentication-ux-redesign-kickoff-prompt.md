# Authentication UX Redesign - Kickoff Prompt

## Task Summary
Redesign the POWR authentication flow to be simpler and more intuitive, implementing a world-class login experience with context-aware defaults. Reduce friction for both desktop (NIP-07 extension) and mobile PWA (NIP-46 mobile signer) users.

## Current Problems
- **Redundant buttons**: "Start Tracking" and "NostrConnect" both open same dialog
- **Extra clicks**: Users must click "Generate QR Code" after opening mobile signer
- **Missing feature**: No copy button for connection string (needed for mobile PWA paste workflow)
- **Hidden options**: Mobile signer buried in "Advanced Options" collapsible
- **No context detection**: Same flow for desktop and mobile despite different optimal paths

## What We're Building (3 Phases)

### Phase 1: Immediate Wins (START HERE) - 2-3 hours
**Goal**: Add copy button, auto-generate QR, consolidate landing page buttons

**Key Changes:**
1. **Add copy button** for NIP-46 connection string with visual feedback
2. **Auto-generate QR code** when mobile signer flow starts (remove "Generate QR Code" button)
3. **Merge landing page buttons** into single "Get Started" CTA
4. **Improve UI copy**: "Remote Signer" → "Mobile Signer", better status messages

### Phase 2: Smart Context Detection - 2-3 hours
**Goal**: Show appropriate primary method based on user's context

**Key Changes:**
1. **Detect browser extension** presence
2. **Detect mobile PWA** context
3. **Show appropriate primary method** (NIP-07 for desktop w/ extension, NIP-46 for mobile)
4. **Progressive disclosure** of alternative methods

### Phase 3: Polish & Reliability - 2-3 hours
**Goal**: Retry logic, better errors, session hints

**Key Changes:**
1. **Retry logic** for failed NIP-46 connections (exponential backoff)
2. **Enhanced error messages** with clear next steps
3. **Session hints** for quick reconnect (no keys stored)
4. **Better loading states** with user guidance

## Key Files to Review (CRITICAL - Review Before Implementation!)

**⚠️ MUST REVIEW FIRST:**
1. `src/lib/auth/hooks.ts` - Review authentication logic:
   - Does `useNip07Login()` auto-detect or require user action?
   - How does `useNip46Login()` generate the connection URL?
   - What's the current behavior of `useEphemeralLogin()`?

2. `src/app/page.tsx` - Review landing page:
   - Check auto-login logic - when/how does it trigger?
   - Current button structure and event handlers

3. `src/components/auth/LoginDialog.tsx` - Review modal:
   - Current flow for NIP-07 and NIP-46
   - How "Generate QR Code" button currently works
   - State management for connection URL

**Files to Modify:**
- `src/components/auth/LoginDialog.tsx` - Main implementation file
- `src/app/page.tsx` - Landing page button consolidation
- `src/lib/auth/context-detection.ts` - NEW FILE (Phase 2)

## Success Criteria for Phase 1
- [ ] Copy button functional with "✓ Copied!" feedback
- [ ] QR code auto-generates (no "Generate QR Code" button click needed)
- [ ] Landing page has single "Get Started" button
- [ ] "Try Demo - No Commitment" remains as secondary option
- [ ] Copy improved: "Mobile Signer", "⏳ Approve connection in your signer app"
- [ ] Mobile signer no longer hidden in "Advanced Options"

## Implementation Notes

### Copy Button Implementation
```typescript
// Add to LoginDialog.tsx
const [copied, setCopied] = useState(false);

const handleCopyConnectionString = async () => {
  try {
    await navigator.clipboard.writeText(connectionUrl);
    setCopied(true);
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => setCopied(false), 3000);
  } catch (error) {
    // Fallback for older browsers
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

### Auto-Generate QR
```typescript
// Add to LoginDialog.tsx
useEffect(() => {
  if (showMobileSigner && open && !connectionUrl && !isLoggingIn) {
    handleNip46Login();
  }
}, [showMobileSigner, open]);
```

## Testing Checklist (Phase 1)

**Desktop Browser:**
- [ ] "Get Started" button works (replaces old buttons)
- [ ] Extension authentication still works
- [ ] Mobile signer option visible (not hidden)

**Mobile PWA:**
- [ ] QR code appears immediately (no "Generate" click)
- [ ] Copy button copies connection string
- [ ] Paste into Primal/Amber works
- [ ] Haptic feedback works (iOS/Android)

**All Platforms:**
- [ ] "Try Demo - No Commitment" button works
- [ ] UI copy improvements applied
- [ ] No regressions in existing auth flows

## Expected Outcomes
- **40% reduction** in clicks to authenticate (3-5 → 2-3 clicks)
- **Clearer user journey** with context-aware defaults
- **Better mobile PWA experience** with copy-paste workflow
- **Foundation for Phase 2/3** improvements

## Starting Point
**Begin with Phase 1 implementation:**
1. Review the key files listed above to understand current implementation
2. Implement copy button functionality
3. Auto-generate QR code on mobile signer flow start
4. Consolidate landing page buttons
5. Update UI copy throughout

Full task details: `docs/tasks/authentication-ux-redesign-task.md`

---

**Ready to start?** Review the key files first, then begin Phase 1 implementation. This is a high-impact UX improvement that will significantly reduce authentication friction.
