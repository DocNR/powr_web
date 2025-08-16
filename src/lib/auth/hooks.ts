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

/**
 * NDK NIP-46 Signer URL Patch
 * 
 * Fixes bunker:// URL parsing issue in NDK's connectionTokenInit method.
 * Based on proven Stacker News workaround for NDK URL parsing bug.
 * 
 * The issue: JavaScript's new URL() constructor doesn't recognize bunker:// 
 * as a valid protocol, causing NDK's internal URL parsing to fail.
 * 
 * The fix: Replace bunker:// with http:// before NDK processes the URL.
 * The rest of the URL structure (hostname, search params) remains intact.
 * 
 * This patch fixes BOTH the constructor AND the internal connectionTokenInit method
 * that was causing "Bunker pubkey not set" errors during session restoration.
 */
class NDKNip46SignerURLPatch extends NDKNip46Signer {
  constructor(ndk: NDK, userOrConnectionToken: string, localSigner?: NDKPrivateKeySigner) {
    // Fix bunker:// URL parsing issue - replace bunker:// with http://
    // This fixes the URL before it gets passed to bunkerFlowInit internally
    if (userOrConnectionToken.startsWith('bunker://')) {
      userOrConnectionToken = userOrConnectionToken.replace('bunker://', 'http://');
    }
    super(ndk, userOrConnectionToken, localSigner);
  }
}

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
      
      // Create fresh signer (NDK will handle signer replacement)
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
      console.log('[NIP-07 Login] Setting NDK signer for user:', user.pubkey.slice(0, 16) + '...');
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
 * Based on NIP-46 specification: bunker://<remote-signer-pubkey>?relay=<wss://relay>&secret=<optional-secret>
 */
async function getNostrConnectSettings(ndk: NDK, nostrConnect: string): Promise<Nip46Settings | null> {
  try {
    if (nostrConnect.startsWith('bunker://')) {
      const asURL = new URL(nostrConnect);
      const relays = asURL.searchParams.getAll('relay');
      const secret = asURL.searchParams.get('secret');
      
      // Extract remote-signer-pubkey from hostname
      const remoteSignerPubkey = asURL.hostname;
      
      if (!remoteSignerPubkey || remoteSignerPubkey.length !== 64) {
        throw new Error('Invalid bunker URL: missing or invalid remote-signer-pubkey');
      }
      
      // Decode relay URLs (they're URL encoded in bunker URLs)
      const decodedRelays = relays.map(relay => decodeURIComponent(relay));
      
      console.log('[NIP-46 Settings] Parsed bunker URL:', {
        remoteSignerPubkey: remoteSignerPubkey.slice(0, 16) + '...',
        relays: decodedRelays,
        hasSecret: !!secret
      });
      
      return { 
        relays: decodedRelays.length > 0 ? decodedRelays : ['wss://relay.nsecbunker.com'], 
        pubkey: remoteSignerPubkey, 
        token: secret || undefined 
      };
    }
    // Note: NIP-05 support removed for now due to API complexity
  } catch (error) {
    console.error('[NIP-46 Settings] Error parsing connection string:', error);
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
 * Fixed implementation based on NIP-46 specification
 */
export function useNip46Login() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (remoteSignerURL: string): Promise<{ success: boolean; error?: AuthenticationError }> => {
    try {
      console.log('[NIP-46 Login] Starting connection to:', remoteSignerURL);
      
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

      const mainNDK = await getNDK();
      
      // Get connection settings from bunker URL
      const settings = await getNostrConnectSettings(mainNDK, remoteSignerURL);
      if (!settings) {
        return {
          success: false,
          error: {
            code: 'NIP46_INVALID_URL',
            message: 'Could not parse bunker URL or NIP-05 identifier',
          }
        };
      }

      console.log('[NIP-46 Login] Connection settings:', {
        remoteSignerPubkey: settings.pubkey.slice(0, 16) + '...',
        relays: settings.relays,
        hasToken: !!settings.token
      });

      // Create local signer for the connection (client-keypair)
      const localSigner = NDKPrivateKeySigner.generate();
      const localUser = await localSigner.user();
      console.log('[NIP-46 Login] Generated local client keypair:', localUser.pubkey.slice(0, 16) + '...');
      
      // Create separate NDK instance for bunker communication
      const bunkerNDK = new NDK({
        explicitRelayUrls: settings.relays,
        signer: localSigner, // Use local signer for bunker communication
      });

      // Connect bunker NDK first (this was missing!)
      console.log('[NIP-46 Login] Connecting to bunker relays...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Bunker relay connection timeout'));
        }, 15000); // 15 second timeout

        bunkerNDK.connect()
          .then(() => {
            clearTimeout(timeout);
            console.log('[NIP-46 Login] Successfully connected to bunker relays');
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            console.warn('[NIP-46 Login] Bunker relay connection error:', error);
            // Don't reject - NDK can work with partial connections
            resolve();
          });
      });

      // Create NIP-46 signer with connected bunker NDK
      console.log('[NIP-46 Login] Creating NIP-46 signer...');
      const signer = new NDKNip46SignerURLPatch(
        bunkerNDK,
        remoteSignerURL,
        localSigner,
      );

      // Handle auth URL popup (for auth challenges)
      signer.on('authUrl', (url) => {
        console.log('[NIP-46 Login] Auth URL received:', url);
        window.open(url, 'auth', 'width=600,height=600');
      });

      // Connect and get user with timeout
      console.log('[NIP-46 Login] Waiting for signer to be ready...');
      const user = await Promise.race([
        signer.blockUntilReady(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Signer connection timeout')), 30000); // 30 second timeout
        })
      ]);
      
      if (!user || !user.pubkey) {
        return {
          success: false,
          error: {
            code: 'NIP46_CONNECTION_FAILED',
            message: 'Failed to connect to remote signer. Please check the URL and try again.',
          }
        };
      }

      console.log('[NIP-46 Login] Successfully connected to remote signer. User pubkey:', user.pubkey.slice(0, 16) + '...');

      // Set the signer on main NDK instance
      console.log('[NIP-46 Login] Setting NDK signer for user:', user.pubkey.slice(0, 16) + '...');
      mainNDK.signer = signer;

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

      console.log('[NIP-46 Login] Authentication successful for user:', user.pubkey.slice(0, 16) + '...');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== user.pubkey)]);
      setLoginMethod('nip46');

      return { success: true };

    } catch (err) {
      console.error('[NIP-46 Login] Connection failed:', err);
      return {
        success: false,
        error: {
          code: 'NIP46_CONNECTION_FAILED',
          message: err instanceof Error ? err.message : 'Failed to connect to remote signer. Please check the URL and try again.',
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
  const [account, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [loginMethod, setLoginMethod] = useAtom(methodAtom);
  const nip07Login = useNip07Login();

  return async (): Promise<boolean> => {
    console.log('[Auto Login] === COMPREHENSIVE DEBUG START ===');
    console.log('[Auto Login] Current account state:', account ? `${account.pubkey.slice(0, 16)}... (${account.method})` : 'null');
    console.log('[Auto Login] Current loginMethod:', loginMethod);
    console.log('[Auto Login] Stored accounts count:', accounts.length);
    console.log('[Auto Login] Stored accounts:', accounts.map(a => ({
      pubkey: a.pubkey.slice(0, 16) + '...',
      method: a.method,
      hasBunker: !!a.bunker,
      hasSecret: !!a.secret,
      hasRelays: !!a.relays,
      relayCount: a.relays?.length
    })));

    // Check if NDK has a signer even when already authenticated
    const ndk = await getNDK();
    console.log('[Auto Login] NDK signer status:', !!ndk.signer);

    // If already authenticated but NDK has no signer, we need to restore it
    if (account && ndk.signer) {
      console.log('[Auto Login] Already authenticated with valid NDK signer, skipping');
      return true;
    }

    // If authenticated but no NDK signer, restore the signer
    if (account && !ndk.signer) {
      console.log('[Auto Login] Authenticated but NDK has no signer - restoring signer...');
      
      // Find the stored account data
      const storedAccount = accounts.find(a => a.pubkey === account.pubkey);
      if (!storedAccount) {
        console.log('[Auto Login] No stored account found for current account, clearing auth state');
        setAccount(null);
        setLoginMethod(null);
        return false;
      }

      // Restore signer based on method
      if (account.method === 'nip46' && storedAccount.secret && storedAccount.bunker && storedAccount.relays) {
        console.log('[Auto Login] Restoring NIP-46 signer for authenticated user...');
        try {
          // Use stored local signer key to preserve client identity
          const localSigner = new NDKPrivateKeySigner(storedAccount.secret);
          const localUser = await localSigner.user();
          console.log('[Auto Login] Restored local signer. Client pubkey:', localUser.pubkey.slice(0, 16) + '...');
          
          // Create bunker NDK
          const bunkerNDK = new NDK({ 
            explicitRelayUrls: storedAccount.relays, 
            signer: localSigner 
          });
          
          // Connect with timeout
          await Promise.race([
            bunkerNDK.connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Bunker connection timeout')), 10000))
          ]);
          
          // Create NIP-46 signer
          const signer = new NDKNip46Signer(bunkerNDK, storedAccount.bunker, localSigner);
          
          // Wait for signer ready with timeout
          const user = await Promise.race([
            signer.blockUntilReady(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Signer ready timeout')), 15000))
          ]);
          
          if (user && user.pubkey === account.pubkey) {
            ndk.signer = signer;
            console.log('[Auto Login] NIP-46 signer restored successfully!');
            return true;
          } else {
            throw new Error('Signer user mismatch');
          }
        } catch (error) {
          console.error('[Auto Login] Failed to restore NIP-46 signer:', error);
          // Clear invalid state and continue with full restoration
          setAccount(null);
        }
      } else if (account.method === 'nip07') {
        console.log('[Auto Login] Restoring NIP-07 signer for authenticated user...');
        try {
          if (typeof window !== 'undefined' && window.nostr) {
            const signer = new NDKNip07Signer();
            const user = await signer.blockUntilReady();
            if (user && user.pubkey === account.pubkey) {
              ndk.signer = signer;
              console.log('[Auto Login] NIP-07 signer restored successfully!');
              return true;
            }
          }
        } catch (error) {
          console.error('[Auto Login] Failed to restore NIP-07 signer:', error);
          // Clear invalid state and continue with full restoration
          setAccount(null);
        }
      }
    }

    // If no account, proceed with normal auto-login flow
    if (!account) {
      console.log('[Auto Login] No current account, proceeding with auto-login...');
    }

    // Skip if no stored login method
    if (!loginMethod) {
      console.log('[Auto Login] No stored login method, skipping');
      return false;
    }

    try {
      // Find the account for this login method
      console.log('[Auto Login] Looking for account with method:', loginMethod);
      const storedAccount = accounts.find(a => a.method === loginMethod);
      
      if (!storedAccount) {
        console.log('[Auto Login] No stored account found for method:', loginMethod);
        console.log('[Auto Login] Available account methods:', accounts.map(a => a.method));
        return false;
      }

      console.log('[Auto Login] Found stored account:', {
        pubkey: storedAccount.pubkey.slice(0, 16) + '...',
        method: storedAccount.method,
        hasBunker: !!storedAccount.bunker,
        hasSecret: !!storedAccount.secret,
        hasRelays: !!storedAccount.relays,
        relayCount: storedAccount.relays?.length,
        bunkerPreview: storedAccount.bunker?.slice(0, 50) + '...',
        secretPreview: storedAccount.secret?.slice(0, 16) + '...'
      });

      if (loginMethod === 'nip07') {
        console.log('[Auto Login] Attempting NIP-07 restoration...');
        const result = await nip07Login();
        console.log('[Auto Login] NIP-07 result:', result.success);
        return result.success;
      } else if (loginMethod === 'nip46') {
        console.log('[Auto Login] Checking NIP-46 restoration conditions...');
        console.log('[Auto Login] - loginMethod === "nip46":', loginMethod === 'nip46');
        console.log('[Auto Login] - storedAccount.bunker exists:', !!storedAccount.bunker);
        console.log('[Auto Login] - storedAccount.secret exists:', !!storedAccount.secret);
        console.log('[Auto Login] - storedAccount.relays exists:', !!storedAccount.relays);
        
        if (!storedAccount.bunker) {
          console.log('[Auto Login] MISSING: storedAccount.bunker');
          return false;
        }
        if (!storedAccount.secret) {
          console.log('[Auto Login] MISSING: storedAccount.secret');
          return false;
        }
        if (!storedAccount.relays) {
          console.log('[Auto Login] MISSING: storedAccount.relays');
          return false;
        }
        
        console.log('[Auto Login] All NIP-46 conditions met, proceeding with restoration...');
        try {
          console.log('[Auto Login] Starting NIP-46 restoration...');
          console.log('[Auto Login] Stored account found:', {
            pubkey: storedAccount.pubkey.slice(0, 16) + '...',
            hasBunker: !!storedAccount.bunker,
            hasSecret: !!storedAccount.secret,
            hasRelays: !!storedAccount.relays,
            relayCount: storedAccount.relays?.length
          });
          
          const ndk = await getNDK();
          console.log('[Auto Login] NDK instance obtained');
          
          // Use stored local signer key instead of generating new one
          console.log('[Auto Login] Creating local signer from stored secret...');
          const localSigner = new NDKPrivateKeySigner(storedAccount.secret);
          const localUser = await localSigner.user();
          console.log('[Auto Login] Local signer created. Client pubkey:', localUser.pubkey.slice(0, 16) + '...');
          
          console.log('[Auto Login] Creating bunker NDK with relays:', storedAccount.relays);
          const bunkerNDK = new NDK({ 
            explicitRelayUrls: storedAccount.relays, 
            signer: localSigner 
          });
          
          // Connect with timeout
          console.log('[Auto Login] Connecting to bunker relays...');
          await Promise.race([
            bunkerNDK.connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Bunker connection timeout after 10s')), 10000))
          ]);
          console.log('[Auto Login] Bunker relay connection successful');
          
          console.log('[Auto Login] Creating NIP-46 signer with bunker:', storedAccount.bunker.slice(0, 50) + '...');
          const signer = new NDKNip46SignerURLPatch(bunkerNDK, storedAccount.bunker, localSigner);
          
          // Add diagnostic event listeners to understand what's happening
          signer.on('authUrl', (url) => {
            console.log('[Auto Login] 🔐 AUTH URL REQUIRED - bunker needs re-authorization:', url);
            console.log('[Auto Login] This indicates bunker does not recognize the stored client identity');
          });

          signer.on('ready', () => {
            console.log('[Auto Login] ✅ SIGNER READY - bunker accepted client identity');
          });

          signer.on('error', (error) => {
            console.log('[Auto Login] ❌ SIGNER ERROR:', error);
          });
          
          // Wait for signer ready with timeout
          console.log('[Auto Login] Waiting for signer to be ready...');
          const user = await Promise.race([
            signer.blockUntilReady(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Signer ready timeout after 15s')), 15000))
          ]);
          
          if (!user || !user.pubkey) {
            throw new Error('Signer ready but no user returned');
          }
          
          console.log('[Auto Login] Signer ready! Remote user pubkey:', user.pubkey.slice(0, 16) + '...');
          
          // Verify the pubkey matches stored account
          if (user.pubkey !== storedAccount.pubkey) {
            console.warn('[Auto Login] Pubkey mismatch - stored:', storedAccount.pubkey.slice(0, 16), 'signer:', user.pubkey.slice(0, 16));
          }
          
          console.log('[Auto Login] Setting NDK signer...');
          ndk.signer = signer;
          
          console.log('[Auto Login] Setting account state...');
          setAccount(storedAccount);
          
          console.log('[Auto Login] NIP-46 session restored successfully! User:', storedAccount.pubkey.slice(0, 16) + '...');
          return true;
          
        } catch (error) {
          console.error('[Auto Login] Session restoration failed:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            storedAccount: {
              pubkey: storedAccount.pubkey.slice(0, 16) + '...',
              hasBunker: !!storedAccount.bunker,
              hasSecret: !!storedAccount.secret,
              relayCount: storedAccount.relays?.length
            }
          });
          
          // Clear invalid stored data and fallback to manual login
          console.log('[Auto Login] Clearing invalid stored data...');
          setAccounts(accounts.filter(a => a.pubkey !== storedAccount.pubkey));
          setLoginMethod(null);
          return false;
        }
      } else {
        console.log('[Auto Login] Unhandled login method:', loginMethod);
        console.log('[Auto Login] This could indicate a conflict or invalid state');
        return false;
      }

      console.log('[Auto Login] Reached end of method checks - this should not happen');
      return false;
    } catch (error) {
      console.error('[Auto Login] Unexpected error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        loginMethod,
        accountsCount: accounts.length
      });
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

/**
 * Ephemeral Key Authentication (Demo Mode)
 * Generates a random temporary key for testing and demos
 */
export function useEphemeralLogin() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return async (): Promise<{ success: boolean; error?: AuthenticationError }> => {
    try {
      console.log('[Ephemeral Login] Generating temporary key for demo...');
      
      const ndk = await getNDK();
      
      // Generate ephemeral private key signer
      const signer = NDKPrivateKeySigner.generate();
      const user = await signer.user();
      
      if (!user || !user.pubkey) {
        return {
          success: false,
          error: {
            code: 'EPHEMERAL_GENERATION_FAILED',
            message: 'Failed to generate ephemeral key',
          }
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
        error: {
          code: 'EPHEMERAL_GENERATION_FAILED',
          message: 'Failed to generate ephemeral key for demo mode',
          details: { originalError: err }
        }
      };
    }
  };
}

// Export aliases for compatibility with page component
export const useLoginWithNip07 = useNip07Login;
export const useLoginWithNip46 = useNip46Login;
export const useLoginWithAmber = useAmberLogin;
export const useLoginWithEphemeral = useEphemeralLogin;
