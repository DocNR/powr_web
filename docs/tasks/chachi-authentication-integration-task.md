# Chachi Authentication Integration Implementation Task

## Objective
Implement a secure two-method Nostr authentication system for the POWR Workout PWA based on the Chachi PWA's proven authentication patterns, incorporating NIP-07 (browser extensions) and NIP-46 (remote signing) ONLY. No private key management for maximum security and simplified architecture.

## Current State Analysis
- **Existing**: Basic NDK singleton setup in `src/lib/ndk.ts`
- **Missing**: Complete authentication system with multiple methods
- **Need**: User-friendly login flow with proper security patterns
- **Goal**: Production-ready authentication matching Chachi's UX but with enhanced security

## Technical Approach
- **Architecture**: Next.js 15 App Router with Jotai atomic state management
- **State Management**: Jotai atoms (following Chachi's proven patterns, avoids Context API violations)
- **NDK Integration**: Leverage existing NDK singleton with proper signer assignment
- **Security**: Maximum security - NO private key management, external signers only
- **UX**: Two-method dialog (NIP-07 + NIP-46) with loading states and error handling
- **Compliance**: Align with `.clinerules/ndk-best-practices.md` patterns (no React Context)

## Key Chachi Files to Review and Adapt

### 🔑 **Core Authentication Logic**
1. **`src/lib/account.ts`** (Lines 49-180)
   - `useNip07Login()` hook implementation
   - `useNip46Login()` hook implementation  
   - `useNsecLogin()` hook implementation
   - NDK signer setup patterns
   - Account state management

### 🎨 **UI Components**
2. **`src/components/nostr/login.tsx`** (Complete file)
   - Multi-method authentication dialog
   - NIP-07 extension detection and connection
   - NIP-46 remote signer input and connection
   - Private key (nsec) input and validation
   - Loading states and error handling
   - URL-based login support (`#nostr-login=nsec1...`)

### 🔄 **State Management & Persistence**
3. **`src/pages/layout.tsx`** (Lines 60-120, 440-470)
   - Login method persistence with localStorage
   - Automatic re-authentication on app load
   - Route protection logic
   - Session management patterns

### 📦 **Dependencies & Types**
4. **Key imports to verify:**
   ```typescript
   // From account.ts
   import { NDKNip07Signer, NDKPrivateKeySigner, NDKNip46Signer } from "@nostr-dev-kit/ndk"
   
   // Jotai state management (Chachi's proven pattern)
   import { atom, useAtom } from "jotai"
   ```

5. **Required Dependencies:**
   ```bash
   npm install jotai
   # Jotai is lightweight (~2.9kb) and Next.js 15 compatible
   ```

## Implementation Steps

### Phase 1: Dependencies & Core Setup (Day 1)
1. [ ] **Install Jotai dependency**
   ```bash
   npm install jotai
   ```

2. [ ] **Create `src/lib/auth/atoms.ts`**
   - Adapt Chachi's Jotai atoms exactly
   - `accountAtom`, `accountsAtom`, `methodAtom`
   - Follow proven patterns from Chachi

3. [ ] **Create `src/lib/auth/types.ts`**
   - Define authentication method types
   - Account state interfaces
   - Error handling types

4. [ ] **Create `src/lib/auth/hooks.ts`**
   - Adapt `useNip07Login()` from Chachi (NIP-07 browser extensions)
   - Adapt `useNip46Login()` from Chachi (NIP-46 remote signing)
   - Remove all private key handling - external signers only
   - Simplified error handling for two methods only

5. [ ] **Enhance `src/lib/ndk.ts`**
   - Add signer management methods
   - Integrate with authentication hooks
   - Maintain singleton pattern

### Phase 2: Authentication Components (Day 2)
6. [ ] **Create `src/components/auth/LoginDialog.tsx`** (Client Component)
   - Multi-method authentication dialog (adapt from Chachi)
   - NIP-07 extension connection button
   - NIP-46 remote signer input field
   - Private key input with security warnings
   - Loading states and error toasts
   - Use Jotai atoms for state management

7. [ ] **Create authentication persistence logic**
   - Session persistence with encrypted storage (enhance Chachi's localStorage)
   - Auto-login on app startup using Jotai atoms
   - Route protection logic without Context API
   - Next.js 15 App Router integration

### Phase 3: Security Enhancements (Day 3)
6. [ ] **Implement encrypted storage**
   - Replace plain localStorage with encrypted storage
   - Add Web Crypto API encryption utilities
   - Implement secure session management
   - Add memory cleanup on logout

7. [ ] **Add security warnings**
   - Private key storage risk warnings
   - Browser extension recommendations
   - Security best practices education

### Phase 4: Integration & Testing (Day 4)
8. [ ] **Integrate with Next.js App Router**
   - Add Jotai Provider to `src/app/layout.tsx`
   - Implement route protection using Jotai atoms
   - Add logout functionality
   - Test all authentication flows
   - Ensure SSR compatibility with Jotai

9. [ ] **Testing & validation**
   - Test NIP-07 with multiple extensions (Alby, nos2x)
   - Test NIP-46 remote signing flow
   - Test private key authentication
   - Verify Jotai state persistence across page reloads
   - Verify Next.js 15 App Router compatibility
   - Verify security compliance with Cline rules

## Success Criteria
- [ ] **NIP-07 Authentication**: Users can connect with browser extensions seamlessly
- [ ] **NIP-46 Authentication**: Users can connect with remote signers (bunker URLs)
- [ ] **Private Key Authentication**: Users can input nsec keys with proper security warnings
- [ ] **Session Persistence**: Login state persists across browser sessions securely
- [ ] **Security Compliance**: All storage is encrypted, memory is cleaned up properly
- [ ] **Error Handling**: Clear error messages for all failure scenarios
- [ ] **URL Login Support**: Support for `#nostr-login=nsec1...` onboarding links
- [ ] **Route Protection**: Authenticated routes properly protected
- [ ] **Logout Flow**: Complete session cleanup on logout

## Security Requirements (Cline Rules Compliance)
- [ ] **NIP-07 First**: Browser extensions prioritized for maximum security
- [ ] **Encrypted Storage**: No plain text sensitive data in localStorage
- [ ] **Memory Cleanup**: Private keys cleared from memory after use
- [ ] **Security Warnings**: Clear warnings about private key storage risks
- [ ] **Validation**: Proper private key format validation
- [ ] **Error Handling**: No sensitive data exposed in error messages

## References
- **Chachi PWA Repository**: `/Users/danielwyler/referencerepos/reference-apps/chachi-pwa`
- **Chachi Authentication Files**:
  - `src/lib/account.ts` (Jotai atoms and hooks)
  - `src/components/nostr/login.tsx` (UI components)
  - `src/pages/layout.tsx` (persistence and routing)
- **Security Rules**: `.clinerules/web-private-key-security.md`
- **NDK Best Practices**: `.clinerules/ndk-best-practices.md` (Context API restrictions)
- **Web NDK Integration**: `.clinerules/web-ndk-actor-integration.md`
- **Project Goals**: `docs/project-kickoff.md`
- **Jotai Documentation**: https://jotai.org/docs/introduction

## Architecture Validation Goals
This implementation will validate:
- **NDK-first authentication** patterns for web browsers
- **Multi-method authentication** UX for Nostr applications
- **Security-first approach** to private key handling in web environments
- **Production-ready patterns** for golf app migration

## Post-Implementation Documentation
After completion, document:
- Authentication flow diagrams
- Security implementation details
- Migration patterns for golf app
- Best practices learned from Chachi integration

---

**Created**: 2025-06-21
**Estimated Duration**: 4 days
**Priority**: High (Critical for MVP)
**Dependencies**: NDK singleton setup (completed)
**Validation Target**: Golf app authentication migration patterns
