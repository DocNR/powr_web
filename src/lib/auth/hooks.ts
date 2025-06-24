/**
 * Authentication Hooks for POWR Workout PWA
 * 
 * Simplified secure authentication supporting ONLY:
 * - NIP-07 (browser extensions) 
 * - NIP-46 (remote signing)
 * 
 * Based on Chachi PWA patterns with enhanced error handling.
 * No private key management for maximum security.
 */

import { useAtom, useAtomValue } from 'jotai';
import { nip19 } from 'nostr-tools';
import NDK, {
  NDKUser,
  NDKNip07Signer,
  NDKNip46Signer,
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
import type { Account, LoginMethod, AuthenticationError, Nip46Settings, ValidationResult } from './types';
import { ensureNDKInitialized } from '../ndk';

async function getNDK(): Promise<NDK> {
  return await ensureNDKInitialized();
}

// Convenience hooks for accessing auth state
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

export function useLogout() {
  const [, resetAuthState] = useAtom(resetAuthStateAtom);
  const [loginMethod] = useAtom(methodAtom);
  
  return async () => {
    console.log('[Logout] Starting logout process...');
    
    const ndk = await getNDK();
    
    // Clear NDK signer completely
    ndk.signer = undefined;
    
    // Reset all authentication state
    resetAuthState();
    
    console.log('[Logout] Logout complete - all state cleared');
    
    // For NIP-07 extensions, refresh page to clear extension cache
    // This solves the extension caching issue where UI changes don't sync with API
    if (typeof window !== 'undefined' && window.nostr && loginMethod === 'nip07') {
      console.log('[Logout] Refreshing page to clear NIP-07 extension cache...');
      window.location.reload();
    }
  };
}

/**
 * NIP-07 Browser Extension Authentication
 */
export function useNip07Login() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (): Promise<{ success: boolean; error?: AuthenticationError }> => {
    try {
      console.log('[NIP-07 Login] Starting fresh authentication...');
      
      // Check if NIP-07 is available
      if (typeof window === 'undefined' || !window.nostr) {
        return {
          success: false,
          error: {
            code: 'NIP07_NOT_AVAILABLE',
            message: 'No NIP-07 browser extension detected. Please install Alby, nos2x, or another Nostr extension.',
          }
        };
      }

      // Force fresh query from extension (don't use cached data)
      let currentPubkey: string;
      try {
        currentPubkey = await window.nostr.getPublicKey();
        console.log('[NIP-07 Login] Fresh pubkey from extension:', currentPubkey.slice(0, 16) + '...');
      } catch (extensionError) {
        console.error('[NIP-07 Login] Extension query failed:', extensionError);
        return {
          success: false,
          error: {
            code: 'NIP07_PERMISSION_DENIED',
            message: 'Extension access denied. Please check permissions and try again.',
          }
        };
      }

      const ndk = await getNDK();
      
      // Clear any existing signer first
      ndk.signer = undefined;
      
      // Create fresh signer
      const signer = new NDKNip07Signer();
      
      // Test the connection and get user
      const user = await signer.blockUntilReady();
      
      if (!user || !user.pubkey) {
        return {
          success: false,
          error: {
            code: 'NIP07_PERMISSION_DENIED',
            message: 'Extension connection failed. Please check permissions and try again.',
          }
        };
      }

      // Verify the pubkey matches what we got directly
      if (user.pubkey !== currentPubkey) {
        console.warn('[NIP-07 Login] Pubkey mismatch - signer:', user.pubkey.slice(0, 16), 'direct:', currentPubkey.slice(0, 16));
      }

      // Set the signer on NDK
      ndk.signer = signer;

      // Get additional user info if available
      const npub = nip19.npubEncode(user.pubkey);
      
      const account: Account = {
        method: 'nip07' as LoginMethod,
        pubkey: user.pubkey,
        npub,
      };

      console.log('[NIP-07 Login] Successfully authenticated as:', user.pubkey.slice(0, 16) + '...');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== user.pubkey)]);
      setLoginMethod('nip07');

      return { success: true };

    } catch (err) {
      console.error('[NIP-07 Login]', err);
      return {
        success: false,
        error: {
          code: 'NIP07_PERMISSION_DENIED',
          message: 'Failed to connect to browser extension. Please try again.',
          details: { originalError: err }
        }
      };
    }
  };
}

/**
 * Parse NIP-46 connection settings from bunker URL or NIP-05
 */
async function getNostrConnectSettings(ndk: NDK, nostrConnect: string): Promise<Nip46Settings | null> {
  try {
    if (nostrConnect.startsWith('bunker://')) {
      const asURL = new URL(nostrConnect);
      const relays = asURL.searchParams.getAll('relay');
      const token = asURL.searchParams.get('secret');
      const pubkey = asURL.hostname || asURL.pathname.replace(/^\/\//, '');
      
      return { 
        relays: relays.length > 0 ? relays : ['wss://relay.nsecbunker.com'], 
        pubkey, 
        token: token || undefined 
      };
    } else {
      // Try NIP-05 format
      const user = await NDKUser.fromNip05(nostrConnect, ndk);
      if (user) {
        const pubkey = user.pubkey;
        const relays = user.nip46Urls?.length > 0 
          ? user.nip46Urls 
          : ['wss://relay.nsecbunker.com'];
        
        return { pubkey, relays };
      }
    }
  } catch (error) {
    console.error('[NIP-46 Settings]', error);
  }
  
  return null;
}

/**
 * Validate bunker URL format
 */
function validateBunkerUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: false, error: 'Bunker URL is required' };
  }

  const cleanUrl = url.trim();

  // Check bunker:// format
  if (cleanUrl.startsWith('bunker://')) {
    try {
      const parsed = new URL(cleanUrl);
      if (!parsed.hostname && !parsed.pathname.replace(/^\/\//, '')) {
        return { 
          valid: false, 
          error: 'Bunker URL must include pubkey' 
        };
      }
      return { valid: true };
    } catch {
      return { 
        valid: false, 
        error: 'Invalid bunker URL format' 
      };
    }
  }

  // Check NIP-05 format (user@domain.com)
  const nip05Pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (nip05Pattern.test(cleanUrl)) {
    return { valid: true };
  }

  return { 
    valid: false, 
    error: 'Must be bunker:// URL or NIP-05 identifier (user@domain.com)' 
  };
}

/**
 * NIP-46 Remote Signing Authentication
 */
export function useNip46Login() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (remoteSignerURL: string): Promise<{ success: boolean; error?: AuthenticationError }> => {
    try {
      // Validate the URL format
      const validation = validateBunkerUrl(remoteSignerURL);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'NIP46_INVALID_URL',
            message: validation.error || 'Invalid bunker URL format',
          }
        };
      }

      const ndk = await getNDK();
      
      // Get connection settings
      const settings = await getNostrConnectSettings(ndk, remoteSignerURL);
      if (!settings) {
        return {
          success: false,
          error: {
            code: 'NIP46_INVALID_URL',
            message: 'Could not parse bunker URL or NIP-05 identifier',
          }
        };
      }

      // Create local signer for the connection
      const localSigner = NDKPrivateKeySigner.generate();
      
      // Create bunker NDK instance
      const bunkerNDK = new NDK({
        explicitRelayUrls: settings.relays,
      });

      // Create NIP-46 signer
      const signer = new NDKNip46Signer(
        bunkerNDK,
        remoteSignerURL,
        localSigner,
      );

      // Handle auth URL popup
      signer.on('authUrl', (url) => {
        window.open(url, 'auth', 'width=600,height=600');
      });

      // Connect and get user
      const user = await signer.blockUntilReady();
      
      if (!user || !user.pubkey) {
        return {
          success: false,
          error: {
            code: 'NIP46_CONNECTION_FAILED',
            message: 'Failed to connect to remote signer. Please check the URL and try again.',
          }
        };
      }

      // Set the signer on main NDK
      ndk.signer = signer;

      // Get additional user info
      const npub = nip19.npubEncode(user.pubkey);

      const account: Account = {
        method: 'nip46' as LoginMethod,
        pubkey: user.pubkey,
        npub,
        bunker: remoteSignerURL,
        secret: localSigner.privateKey,
        relays: settings.relays,
      };

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== user.pubkey)]);
      setLoginMethod('nip46');

      return { success: true };

    } catch (err) {
      console.error('[NIP-46 Login]', err);
      return {
        success: false,
        error: {
          code: 'NIP46_CONNECTION_FAILED',
          message: 'Failed to connect to remote signer. Please check the URL and try again.',
          details: { originalError: err }
        }
      };
    }
  };
}

/**
 * Check if NIP-07 is available
 */
export function useNip07Available(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.nostr !== 'undefined' && typeof window.nostr.getPublicKey === 'function';
}

/**
 * Auto-login on app startup
 */
export function useAutoLogin() {
  const [account] = useAtom(accountAtom);
  const [accounts] = useAtom(accountsAtom);
  const [loginMethod] = useAtom(methodAtom);
  const nip07Login = useNip07Login();
  const nip46Login = useNip46Login();

  return async (): Promise<boolean> => {
    // Skip if already authenticated
    if (account) return true;

    // Skip if no stored login method
    if (!loginMethod) return false;

    try {
      // Find the account for this login method
      const storedAccount = accounts.find(a => a.method === loginMethod);
      if (!storedAccount) return false;

      if (loginMethod === 'nip07') {
        const result = await nip07Login();
        return result.success;
      } else if (loginMethod === 'nip46' && storedAccount.bunker) {
        const result = await nip46Login(storedAccount.bunker);
        return result.success;
      }

      return false;
    } catch (error) {
      console.error('[Auto Login]', error);
      return false;
    }
  };
}

/**
 * Amber Authentication (NIP-55)
 */
export function useAmberLogin() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (pubkey: string): Promise<{ success: boolean; error?: AuthenticationError }> => {
    try {
      // Validate pubkey format
      if (!/^[a-fA-F0-9]{64}$/.test(pubkey)) {
        return {
          success: false,
          error: {
            code: 'AMBER_INVALID_PUBKEY',
            message: 'Invalid public key format received from Amber',
          }
        };
      }

      // Get additional user info
      const npub = nip19.npubEncode(pubkey);

      const account: Account = {
        method: 'amber' as LoginMethod,
        pubkey,
        npub,
      };

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== pubkey)]);
      setLoginMethod('amber');

      console.log('[Amber Login] Successfully authenticated with pubkey:', pubkey);
      return { success: true };

    } catch (err) {
      console.error('[Amber Login]', err);
      return {
        success: false,
        error: {
          code: 'AMBER_LOGIN_FAILED',
          message: 'Failed to process Amber authentication',
          details: { originalError: err }
        }
      };
    }
  };
}

/**
 * Check for existing Amber authentication on app startup
 */
export function useCheckAmberAuth() {
  const amberLogin = useAmberLogin();

  return async (): Promise<boolean> => {
    try {
      const amberPubkey = localStorage.getItem('amber_pubkey');
      const authMethod = localStorage.getItem('auth_method');

      if (amberPubkey && authMethod === 'amber') {
        console.log('[Amber Auth Check] Found existing Amber authentication');
        const result = await amberLogin(amberPubkey);
        return result.success;
      }

      return false;
    } catch (error) {
      console.error('[Amber Auth Check] Error:', error);
      return false;
    }
  };
}

// Export aliases for compatibility with page component
export const useLoginWithNip07 = useNip07Login;
export const useLoginWithNip46 = useNip46Login;
export const useLoginWithAmber = useAmberLogin;
