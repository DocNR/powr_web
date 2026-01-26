/**
 * Direct NDK Authentication Hooks for POWR Workout PWA
 * 
 * MIGRATED: Replaced nostr-login with direct NDK calls.
 * Maintains compatibility with existing Jotai state management.
 * Uses DEFAULT_RELAYS from lib/ndk.ts (fixes mobile signer connectivity).
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { nip19 } from 'nostr-tools';
import { 
  NDKPrivateKeySigner,
  NDKNip46Signer
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
import type { Account, LoginMethod } from './types';
import { ensureNDKInitialized, DEFAULT_RELAYS } from '../ndk';

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
      const ndk = await ensureNDKInitialized();
      
      // Clear NDK signer
      ndk.signer = undefined;
      
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
      // Still reset state even if NDK logout fails
      resetAuthState();
    }
  };
}

/**
 * Account switching hook - switches between stored accounts
 * For now, just logs out - full account switching will be added later
 */
export function useAccountSwitching() {
  const logout = useLogout();
  
  return {
    switchToAccount: async () => {
      console.log('[Account Switch] Account switching not yet implemented, logging out...');
      await logout();
    }
  };
}

// ===== DIRECT NDK AUTHENTICATION HOOKS =====

/**
 * NIP-07 Browser Extension Authentication
 * DIRECT NDK: No nostr-login dependency
 */
export function useNip07Login() {
  const setAccount = useSetAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const setLoginMethod = useSetAtom(methodAtom);

  return async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[NIP-07 Login] Checking for browser extension...');
      
      // Check if window.nostr is available
      if (typeof window === 'undefined' || !window.nostr || typeof window.nostr.getPublicKey !== 'function') {
        return {
          success: false,
          error: 'No NIP-07 extension detected. Please install a Nostr extension like Alby.',
        };
      }

      console.log('[NIP-07 Login] Extension found, requesting public key...');
      
      // Get pubkey from extension
      const pubkey = await window.nostr.getPublicKey();
      
      if (!pubkey) {
        return {
          success: false,
          error: 'Failed to get public key from extension',
        };
      }

      const npub = nip19.npubEncode(pubkey);
      
      const account: Account = {
        method: 'nip07' as LoginMethod,
        pubkey,
        npub,
      };

      console.log('[NIP-07 Login] Successfully authenticated:', pubkey.slice(0, 16) + '...');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== pubkey)]);
      setLoginMethod('nip07');

      // Note: NDK will use window.nostr automatically when signing
      // No need to set signer explicitly

      return { success: true };

    } catch (err) {
      console.error('[NIP-07 Login]', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to authenticate with browser extension',
      };
    }
  };
}

/**
 * NIP-46 Remote Signing Authentication
 * DIRECT NDK: Uses NDKNip46Signer with DEFAULT_RELAYS
 */
export function useNip46Login() {
  const setAccount = useSetAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const setLoginMethod = useSetAtom(methodAtom);

  return async (connectionToken: string, onAuthUrl?: (url: string) => void): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[NIP-46 Login] Starting bunker connection with DEFAULT_RELAYS...');
      console.log('[NIP-46 Login] Relays:', DEFAULT_RELAYS);
      
      const ndk = await ensureNDKInitialized();
      
      // Generate local signer for NIP-46 communication
      // Check if we have a stored local key for this connection
      const storageKey = `nip46-local-key-${connectionToken.slice(0, 20)}`;
      let localSigner: NDKPrivateKeySigner;
      
      const storedKey = localStorage.getItem(storageKey);
      if (storedKey) {
        console.log('[NIP-46 Login] Using existing local key');
        localSigner = new NDKPrivateKeySigner(storedKey);
      } else {
        console.log('[NIP-46 Login] Generating new local key');
        localSigner = NDKPrivateKeySigner.generate();
        // Store for future use
        const privateKey = await localSigner.privateKey;
        if (privateKey) {
          localStorage.setItem(storageKey, privateKey);
        }
      }

      // Create NIP-46 signer with connection token
      const signer = new NDKNip46Signer(ndk, connectionToken, localSigner);

      // Listen for authUrl events (for QR code display)
      if (onAuthUrl) {
        signer.on('authUrl', (url: string) => {
          console.log('[NIP-46 Login] Auth URL received:', url);
          onAuthUrl(url);
        });
      }

      console.log('[NIP-46 Login] Waiting for bunker connection...');
      
      // Block until ready (this handles the connect handshake)
      const user = await signer.blockUntilReady();
      
      if (!user || !user.pubkey) {
        return {
          success: false,
          error: 'Failed to connect to remote signer',
        };
      }

      console.log('[NIP-46 Login] Successfully connected to bunker');

      // Set the signer on NDK
      ndk.signer = signer;

      const npub = nip19.npubEncode(user.pubkey);
      
      const account: Account = {
        method: 'nip46' as LoginMethod,
        pubkey: user.pubkey,
        npub,
      };

      console.log('[NIP-46 Login] Authenticated:', user.pubkey.slice(0, 16) + '...');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== user.pubkey)]);
      setLoginMethod('nip46');

      return { success: true };

    } catch (err) {
      console.error('[NIP-46 Login]', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to remote signer',
      };
    }
  };
}

/**
 * Read-Only Authentication (npub only)
 * DIRECT NDK: No signing capability
 */
export function useReadOnlyLogin() {
  const setAccount = useSetAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const setLoginMethod = useSetAtom(methodAtom);

  return async (npubOrHex: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Read-Only Login] Authenticating with npub...');
      
      let pubkey: string;
      
      // Try to decode as npub first
      if (npubOrHex.startsWith('npub')) {
        const decoded = nip19.decode(npubOrHex);
        if (decoded.type !== 'npub') {
          return {
            success: false,
            error: 'Invalid npub format',
          };
        }
        pubkey = decoded.data as string;
      } else {
        // Assume it's a hex pubkey
        pubkey = npubOrHex;
      }

      const npub = nip19.npubEncode(pubkey);
      
      const account: Account = {
        method: 'readOnly' as LoginMethod,
        pubkey,
        npub,
      };

      console.log('[Read-Only Login] Authenticated (read-only):', pubkey.slice(0, 16) + '...');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== pubkey)]);
      setLoginMethod('readOnly');

      // No signer for read-only mode

      return { success: true };

    } catch (err) {
      console.error('[Read-Only Login]', err);
      return {
        success: false,
        error: 'Invalid npub or public key',
      };
    }
  };
}

/**
 * Ephemeral Login (temporary key generation)
 * DIRECT NDK: Generates temporary key for demo
 */
export function useEphemeralLogin() {
  const setAccount = useSetAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const setLoginMethod = useSetAtom(methodAtom);

  return async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Ephemeral Login] Generating temporary key for demo...');
      
      const ndk = await ensureNDKInitialized();
      
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

// ===== CONVENIENCE HOOKS =====

/**
 * General login hook - returns object with all login methods
 */
export function useLogin() {
  const nip07Login = useNip07Login();
  const nip46Login = useNip46Login();
  const readOnlyLogin = useReadOnlyLogin();
  const ephemeralLogin = useEphemeralLogin();

  return {
    withNip07: nip07Login,
    withNip46: nip46Login,
    withReadOnly: readOnlyLogin,
    withEphemeral: ephemeralLogin,
  };
}

/**
 * Signup hook - for now, same as login (account creation done by signers)
 */
export function useSignup() {
  return useLogin();
}

// ===== UTILITY HOOKS =====

/**
 * Check if NIP-07 is available
 */
export function useNip07Available(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.nostr !== 'undefined' && typeof window.nostr.getPublicKey === 'function';
}

/**
 * Auto-login on app startup
 * Checks for existing session and restores if available
 */
export function useAutoLogin() {
  const nip07Login = useNip07Login();
  const account = useAccount();

  return async (): Promise<boolean> => {
    console.log('[Auto Login] Checking for existing session...');
    
    // If already authenticated, no need to auto-login
    if (account) {
      console.log('[Auto Login] Already authenticated');
      return true;
    }

    // Try NIP-07 extension auto-login (extension handles session persistence)
    if (typeof window !== 'undefined' && window.nostr) {
      console.log('[Auto Login] Attempting NIP-07 extension auto-login...');
      const result = await nip07Login();
      if (result.success) {
        console.log('[Auto Login] Successfully auto-logged in with NIP-07');
        return true;
      }
    }

    console.log('[Auto Login] No existing session found');
    return false;
  };
}

// ===== LEGACY COMPATIBILITY EXPORTS =====

export const useLoginWithNip46 = useNip46Login;
export const useLoginWithNip07 = useNip07Login;
export const useLoginWithEphemeral = useEphemeralLogin;
export const useLoginWithAmber = useNip46Login; // Amber uses NIP-46
