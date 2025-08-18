/**
 * Simplified Authentication Hooks for POWR Workout PWA
 * 
 * Uses nostr-login library for all authentication flows.
 * Maintains compatibility with existing Jotai state management.
 * 
 * SIMPLIFIED: ~600 lines → ~200 lines (70% reduction)
 */

import { useAtom, useAtomValue } from 'jotai';
import { nip19 } from 'nostr-tools';
import NDK, {
  NDKPrivateKeySigner,
} from '@nostr-dev-kit/ndk';
import { 
  accountAtom, 
  accountsAtom, 
  methodAtom, 
  resetAuthStateAtom,
  isAuthenticatedAtom,
  pubkeyAtom,
  canSignAtom
} from './atoms';
import { triggerLogin, triggerLogout, isAvailable } from './nostrLoginBridge';
import type { Account, LoginMethod } from './types';
import { ensureNDKInitialized } from '../ndk';

async function getNDK(): Promise<NDK> {
  return await ensureNDKInitialized();
}

// ===== CONVENIENCE HOOKS FOR ACCESSING AUTH STATE =====

export function useAccount(): Account | null {
  return useAtomValue(accountAtom);
}

export function usePubkey(): string | undefined {
  return useAtomValue(pubkeyAtom);
}

export function useIsAuthenticated(): boolean {
  return useAtomValue(isAuthenticatedAtom);
}

export function useCanSign(): boolean {
  return useAtomValue(canSignAtom);
}

export function useAccounts(): Account[] {
  return useAtomValue(accountsAtom);
}

export function useLoginMethod(): LoginMethod | null {
  return useAtomValue(methodAtom);
}

// ===== AUTHENTICATION ACTIONS =====

/**
 * Logout hook - clears all authentication state
 */
export function useLogout() {
  const [, resetAuthState] = useAtom(resetAuthStateAtom);
  const loginMethod = useLoginMethod();
  
  return async () => {
    console.log('[Logout] Starting logout process...');
    
    try {
      // Trigger nostr-login logout (clears window.nostr)
      triggerLogout();
      
      // Reset Jotai auth state
      resetAuthState();
      
      console.log('[Logout] Logout complete - all state cleared');
      
      // For NIP-07 extensions, refresh page to clear extension cache
      // This solves the extension caching issue where UI changes don't sync with API
      if (typeof window !== 'undefined' && window.nostr && loginMethod === 'nip07') {
        console.log('[Logout] Refreshing page to clear NIP-07 extension cache...');
        window.location.reload();
      }
      
    } catch (error) {
      console.error('[Logout] Error during logout:', error);
      // Still reset state even if nostr-login logout fails
      resetAuthState();
    }
  };
}

/**
 * Account switching hook - switches between stored accounts
 */
export function useAccountSwitching() {
  const [, setAccount] = useAtom(accountAtom);
  const [, setLoginMethod] = useAtom(methodAtom);
  
  return {
    switchToAccount: (account: Account) => {
      console.log('[Account Switch] Switching to account:', account.pubkey.slice(0, 16) + '...');
      setAccount(account);
      setLoginMethod(account.method);
      
      // Trigger nostr-login welcome screen for account switching
      triggerLogin('welcome');
    }
  };
}

// ===== SIMPLIFIED AUTHENTICATION TRIGGERS =====

/**
 * NIP-07 Browser Extension Authentication
 * REMOVED: Now using nostr-login for all extension authentication
 * The nostr-login bridge handles extension auth and updates Jotai state
 */

/**
 * NIP-46 Remote Signing Authentication  
 * SIMPLIFIED: Just triggers nostr-login, no custom logic
 */
export function useNip46Login() {
  return () => {
    console.log('[NIP-46 Login] Triggering nostr-login connect flow...');
    
    if (!isAvailable()) {
      console.error('[NIP-46 Login] nostr-login not available');
      return { success: false, error: 'nostr-login not initialized' };
    }
    
    // Trigger nostr-login bunker authentication
    triggerLogin('connect');
    
    return { success: true };
  };
}

/**
 * Read-Only Authentication (npub only)
 * SIMPLIFIED: Just triggers nostr-login, no custom logic
 */
export function useReadOnlyLogin() {
  return () => {
    console.log('[Read-Only Login] Triggering nostr-login read-only flow...');
    
    if (!isAvailable()) {
      console.error('[Read-Only Login] nostr-login not available');
      return { success: false, error: 'nostr-login not initialized' };
    }
    
    // Trigger nostr-login read-only authentication
    triggerLogin('readOnly');
    
    return { success: true };
  };
}

/**
 * Ephemeral Login (temporary key generation)
 * RESTORED: Original smooth direct implementation
 */
export function useEphemeralLogin() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Ephemeral Login] Generating temporary key for demo...');
      
      const ndk = await getNDK();
      
      // Generate ephemeral private key signer
      const signer = NDKPrivateKeySigner.generate();
      const user = await signer.user();
      
      if (!user || !user.pubkey) {
        return {
          success: false,
          error: 'Failed to generate ephemeral key',
        };
      }

      // Set the signer on NDK
      ndk.signer = signer;

      // Get additional user info
      const npub = nip19.npubEncode(user.pubkey);
      
      const account: Account = {
        method: 'ephemeral' as LoginMethod,
        pubkey: user.pubkey,
        npub,
      };

      console.log('[Ephemeral Login] Generated demo account:', user.pubkey.slice(0, 16) + '...');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== user.pubkey)]);
      setLoginMethod('ephemeral');

      return { success: true };

    } catch (err) {
      console.error('[Ephemeral Login]', err);
      return {
        success: false,
        error: 'Failed to generate ephemeral key for demo mode',
      };
    }
  };
}

/**
 * General login trigger - shows welcome screen
 * SIMPLIFIED: Just triggers nostr-login welcome screen
 */
export function useLogin() {
  return () => {
    console.log('[Login] Triggering nostr-login welcome screen...');
    
    if (!isAvailable()) {
      console.error('[Login] nostr-login not available');
      return { success: false, error: 'nostr-login not initialized' };
    }
    
    // Trigger nostr-login welcome screen
    triggerLogin('welcome');
    
    return { success: true };
  };
}

/**
 * Signup trigger - shows signup screen
 * SIMPLIFIED: Just triggers nostr-login signup screen
 */
export function useSignup() {
  return () => {
    console.log('[Signup] Triggering nostr-login signup screen...');
    
    if (!isAvailable()) {
      console.error('[Signup] nostr-login not available');
      return { success: false, error: 'nostr-login not initialized' };
    }
    
    // Trigger nostr-login signup screen
    triggerLogin('signup');
    
    return { success: true };
  };
}

// ===== UTILITY HOOKS =====

/**
 * Check if NIP-07 is available
 * SIMPLIFIED: Basic window.nostr detection
 */
export function useNip07Available(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.nostr !== 'undefined' && typeof window.nostr.getPublicKey === 'function';
}

/**
 * Auto-login on app startup
 * SIMPLIFIED: Let nostr-login handle session restoration
 */
export function useAutoLogin() {
  return async (): Promise<boolean> => {
    console.log('[Auto Login] nostr-login handles session restoration automatically');
    
    // nostr-login automatically restores sessions when window.nostr is called
    // Our bridge will receive the nlAuth event and update Jotai state
    // No custom logic needed here
    
    return true;
  };
}

// ===== LEGACY COMPATIBILITY EXPORTS =====

// Export aliases for compatibility with existing components
export const useLoginWithNip46 = useNip46Login;
export const useLoginWithAmber = useNip46Login; // Amber uses NIP-46 connect flow
export const useLoginWithEphemeral = useLogin; // Use general login for demo mode

// Legacy hooks that are no longer needed but kept for compatibility
export function useAmberLogin() {
  console.warn('[useAmberLogin] DEPRECATED: Use useNip46Login() instead');
  return useNip46Login();
}

export function useCheckAmberAuth() {
  console.warn('[useCheckAmberAuth] DEPRECATED: nostr-login handles session restoration automatically');
  return async () => false;
}
