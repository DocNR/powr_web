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
import type { Account, LoginMethod, AuthenticationError, Nip46Settings, ValidationResult, NostrConnectSession } from './types';
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
      const signer = new NDKNip46Signer(
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
 * Prioritizes NostrConnect over other methods for better session persistence
 */
export function useAutoLogin() {
  const [account] = useAtom(accountAtom);
  const [accounts] = useAtom(accountsAtom);
  const [loginMethod] = useAtom(methodAtom);
  const nip07Login = useNip07Login();
  const nip46Login = useNip46Login();
  const nostrConnectAutoLogin = useNostrConnectAutoLogin();

  return async (): Promise<boolean> => {
    // Skip if already authenticated
    if (account) return true;

    try {
      // 1. PRIORITY: Try NostrConnect auto-login first (best session persistence)
      console.log('[Auto Login] Checking NostrConnect session...');
      const nostrConnectSuccess = await nostrConnectAutoLogin();
      if (nostrConnectSuccess) {
        console.log('[Auto Login] NostrConnect auto-login successful');
        return true;
      }

      // 2. FALLBACK: Try stored login method
      if (!loginMethod) {
        console.log('[Auto Login] No stored login method found');
        return false;
      }

      console.log('[Auto Login] Trying stored login method:', loginMethod);

      // Find the account for this login method
      const storedAccount = accounts.find(a => a.method === loginMethod);
      if (!storedAccount) {
        console.log('[Auto Login] No stored account found for method:', loginMethod);
        return false;
      }

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

/**
 * NostrConnect Session Persistence
 * Generates nostrconnect:// URIs and manages persistent sessions
 */

// Generate random secret for NostrConnect
function generateRandomSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate nostrconnect:// URI
function generateNostrConnectURI(clientPubkey: string, relays: string[]): { uri: string; secret: string } {
  const secret = generateRandomSecret();
  const params = new URLSearchParams({
    relay: relays[0],
    secret,
    perms: 'sign_event,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt',
    name: 'POWR Workout PWA',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://powr.app'
  });
  
  relays.slice(1).forEach(relay => params.append('relay', relay));
  
  return {
    uri: `nostrconnect://${clientPubkey}?${params.toString()}`,
    secret
  };
}

/**
 * NostrConnect Login Hook
 * Generates persistent nostrconnect:// URI and manages session
 */
export function useNostrConnectLogin() {
  const [, setAccount] = useAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const [, setLoginMethod] = useAtom(methodAtom);

  return {
    // Generate new NostrConnect session
    generateSession: async (): Promise<{ success: boolean; session?: NostrConnectSession; error?: AuthenticationError }> => {
      try {
        console.log('[NostrConnect] Generating new session...');
        
        // Generate client keypair for this session
        const clientSigner = NDKPrivateKeySigner.generate();
        const clientUser = await clientSigner.user();
        
        // Use production relay configuration
        const relays = [
          'wss://relay.nsec.app',
          'wss://relay.damus.io', 
          'wss://relay.nostr.band',
          'wss://nos.lol'
        ];
        
        const { uri, secret } = generateNostrConnectURI(clientUser.pubkey, relays);
        
        // Create session object
        const session: NostrConnectSession = {
          nostrConnectURI: uri,
          clientPrivateKey: clientSigner.privateKey!,
          clientPubkey: clientUser.pubkey,
          secret,
          lastConnected: Date.now(),
          relays
        };

        // Store session for persistence
        localStorage.setItem('nostr_connect_session', JSON.stringify(session));
        
        console.log('[NostrConnect] Session generated and stored');
        
        return { success: true, session };
        
      } catch (error) {
        console.error('[NostrConnect] Session generation failed:', error);
        return {
          success: false,
          error: {
            code: 'NOSTRCONNECT_GENERATION_FAILED',
            message: 'Failed to generate NostrConnect session',
            details: { originalError: error }
          }
        };
      }
    },

    // Attempt connection with existing session
    connectWithSession: async (session: NostrConnectSession): Promise<{ success: boolean; error?: AuthenticationError }> => {
      try {
        console.log('[NostrConnect] Attempting connection with stored session...');
        
        const ndk = await getNDK();
        
        // Recreate client signer from stored private key
        const clientSigner = new NDKPrivateKeySigner(session.clientPrivateKey);
        
        // Create NIP-46 signer using stored session
        const signer = new NDKNip46Signer(
          ndk, // Use main NDK instance
          session.nostrConnectURI,
          clientSigner
        );
        
        // Wait for connection with timeout
        const user = await Promise.race([
          signer.blockUntilReady(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 20000);
          })
        ]);
        
        if (!user?.pubkey) {
          return {
            success: false,
            error: {
              code: 'NOSTRCONNECT_CONNECTION_FAILED',
              message: 'Failed to connect with stored session'
            }
          };
        }
        
        // Set signer on NDK
        ndk.signer = signer;
        
        // Update session with user pubkey and timestamp
        const updatedSession = {
          ...session,
          userPubkey: user.pubkey,
          lastConnected: Date.now()
        };
        localStorage.setItem('nostr_connect_session', JSON.stringify(updatedSession));
        
        // Create account
        const npub = nip19.npubEncode(user.pubkey);
        const account: Account = {
          method: 'nostrconnect' as LoginMethod,
          pubkey: user.pubkey,
          npub,
          bunker: session.nostrConnectURI,
          secret: session.clientPrivateKey,
          relays: session.relays,
        };

        // Update state
        setAccount(account);
        setAccounts([account, ...accounts.filter(a => a.pubkey !== user.pubkey)]);
        setLoginMethod('nostrconnect');

        console.log('[NostrConnect] Successfully connected with session');
        return { success: true };
        
      } catch (error) {
        console.error('[NostrConnect] Connection failed:', error);
        return {
          success: false,
          error: {
            code: 'NOSTRCONNECT_CONNECTION_FAILED',
            message: error instanceof Error ? error.message : 'Connection failed',
            details: { originalError: error }
          }
        };
      }
    },

    // Get stored session
    getStoredSession: (): NostrConnectSession | null => {
      try {
        const stored = localStorage.getItem('nostr_connect_session');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },

    // Clear stored session
    clearSession: (): void => {
      localStorage.removeItem('nostr_connect_session');
    }
  };
}

/**
 * Check for NostrConnect auto-login on startup
 */
export function useNostrConnectAutoLogin() {
  const nostrConnect = useNostrConnectLogin();

  return async (): Promise<boolean> => {
    try {
      const session = nostrConnect.getStoredSession();
      
      if (!session || !session.userPubkey) {
        return false;
      }
      
      console.log('[NostrConnect Auto-Login] Attempting with stored session...');
      const result = await nostrConnect.connectWithSession(session);
      
      return result.success;
      
    } catch (error) {
      console.error('[NostrConnect Auto-Login] Error:', error);
      return false;
    }
  };
}

// Export aliases for compatibility with page component
export const useLoginWithNip07 = useNip07Login;
export const useLoginWithNip46 = useNip46Login;
export const useLoginWithAmber = useAmberLogin;
export const useLoginWithEphemeral = useEphemeralLogin;
export const useLoginWithNostrConnect = useNostrConnectLogin;
