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
  NDKNip46Signer,
  NDKNip07Signer
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
import { ensureNDKInitialized, ensureRelaysConnected, DEFAULT_RELAYS } from '../ndk';

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

      // Set NIP-07 signer on NDK so Global NDK Actor can publish events
      const ndk = await ensureNDKInitialized();
      const nip07Signer = new NDKNip07Signer();
      ndk.signer = nip07Signer;
      
      console.log('[NIP-07 Login] NDK signer configured for publishing');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== pubkey)]);
      setLoginMethod('nip07');

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
 * DIRECT NDK: Client-initiated handshake with manual listener (spec-compliant)
 */
export function useNip46Login() {
  const setAccount = useSetAtom(accountAtom);
  const [accounts, setAccounts] = useAtom(accountsAtom);
  const setLoginMethod = useSetAtom(methodAtom);

  return async (onConnectionUrl?: (url: string) => void): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[NIP-46 Login] Starting client-initiated NIP-46 connection...');
      console.log('[NIP-46 Login] Relays:', DEFAULT_RELAYS);
      
      const ndk = await ensureNDKInitialized();
      await ensureRelaysConnected();
      
      // 1. Generate local signer for this session
      console.log('[NIP-46 Login] Generating local session signer...');
      const localSigner = NDKPrivateKeySigner.generate();
      const localUser = await localSigner.user();
      
      if (!localUser || !localUser.pubkey) {
        return {
          success: false,
          error: 'Failed to generate local signer',
        };
      }
      
      console.log('[NIP-46 Login] 🔑 Session pubkey:', localUser.pubkey);
      
      // 2. Generate connection secret
      const secret = Math.random().toString(36).substring(2, 12);
      
      // 3. Build nostrconnect:// URL for QR code
      const params = new URLSearchParams();
      DEFAULT_RELAYS.forEach(relay => params.append('relay', relay));
      params.append('secret', secret);
      params.append('name', 'powr.build');
      params.append('url', typeof window !== 'undefined' ? window.location.origin : 'https://powr.build');
      params.append('image', typeof window !== 'undefined' ? `${window.location.origin}/icon-192.png` : 'https://powr.build/icon-192.png');
      params.append('perms', 'sign_event:1,sign_event:1301,sign_event:33401,sign_event:33402,sign_event:30003,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt');
      
      const nostrConnectUrl = `nostrconnect://${localUser.pubkey}?${params.toString()}`;
      
      console.log('[NIP-46 Login] 📱 Generated QR code URL');
      console.log('[NIP-46 Login] 🔍 URL:', nostrConnectUrl);
      
      // 4. Provide URL to UI for QR code display
      if (onConnectionUrl) {
        onConnectionUrl(nostrConnectUrl);
      }
      
      // 5. CLIENT-INITIATED HANDSHAKE: Listen for remote signer's connect response
      console.log('[NIP-46 Login] 👂 Setting up listener for connect response (kind:24133)...');
      
      const handshakeResult = await new Promise<{ remoteSignerPubkey: string; userPubkey: string } | null>((resolve) => {
        const subscription = ndk.subscribe(
          { kinds: [24133], '#p': [localUser.pubkey] },
          { closeOnEose: false }
        );
        
        const timeout = setTimeout(() => {
          subscription.stop();
          console.error('[NIP-46 Login] ⏱️ Handshake timeout after 60 seconds');
          resolve(null);
        }, 60000);
        
        subscription.on('event', async (event) => {
          console.log('[NIP-46 Login] 📨 Received kind:24133 event from:', event.pubkey.slice(0,16));
          console.log('[NIP-46 Login] 📄 Raw content:', event.content.substring(0, 50) + '...');
          
          try {
            // Decrypt the NIP-46 message using the remote signer's pubkey
            const remoteUser = ndk.getUser({ pubkey: event.pubkey });
            
            // Try NIP-04 first, fallback to NIP-44 (mobile signers often use NIP-44)
            let decrypted: string;
            let encryptionType: 'nip04' | 'nip44';
            
            try {
              decrypted = await localSigner.decrypt(remoteUser, event.content, 'nip04');
              encryptionType = 'nip04';
            } catch (nip04Error) {
              console.log('[NIP-46 Login] ⚠️ NIP-04 decrypt failed, trying NIP-44...');
              try {
                decrypted = await localSigner.decrypt(remoteUser, event.content, 'nip44');
                encryptionType = 'nip44';
              } catch (nip44Error) {
                console.error('[NIP-46 Login] ❌ Failed to decrypt with both NIP-04 and NIP-44');
                console.error('[NIP-46 Login] NIP-04 error:', nip04Error);
                console.error('[NIP-46 Login] NIP-44 error:', nip44Error);
                return;
              }
            }
            
            console.log(`[NIP-46 Login] ✅ Decrypted with ${encryptionType.toUpperCase()}`);
            console.log('[NIP-46 Login] 🔓 Decrypted message:', decrypted);
            
            let message;
            try {
              message = JSON.parse(decrypted);
              console.log('[NIP-46 Login] 📝 Parsed message:', message);
            } catch (parseError) {
              console.error('[NIP-46 Login] ❌ Failed to parse decrypted message as JSON');
              console.error('[NIP-46 Login] Parse error:', parseError);
              console.error('[NIP-46 Login] Decrypted content:', decrypted);
              return;
            }
            
            // Check if this is a connect response (can be request OR response format)
            // NIP-46 spec: Response messages have "result" but no "method" field
            // Some signers send: {method: "connect", result: "ack"}
            // Others send: {id: "...", result: <secret>}
            const isConnectRequest = message.method === 'connect' && message.result;
            const isConnectResponse = !message.method && message.result && !message.error;
            
            if (isConnectRequest || isConnectResponse) {
              console.log('[NIP-46 Login] ✅ Received connect message!');
              console.log('[NIP-46 Login] 📝 Message type:', isConnectRequest ? 'request with result' : 'response-only');
              console.log('[NIP-46 Login] 📝 Result:', message.result);
              
              // Spec-compliant: accept secret, "ack", or any non-error result
              // Primal sends the secret back, some signers send "ack"
              if (message.result === secret || message.result === 'ack' || (isConnectResponse && message.result)) {
                console.log('[NIP-46 Login] ✅ Valid connect message accepted');
                
                clearTimeout(timeout);
                subscription.stop();
                
                // Remote signer pubkey is the event author
                const remoteSignerPubkey = event.pubkey;
                
                // Now get the user's actual pubkey via get_public_key request
                console.log('[NIP-46 Login] 🔑 Requesting user pubkey from remote signer...');
                
                // Create proper NIP-46 signer with remote signer pubkey
                const bunkerUrl = `bunker://${remoteSignerPubkey}?${params.toString()}`;
                const finalSigner = new NDKNip46Signer(ndk, bunkerUrl, localSigner);
                
                try {
                  // Start RPC listener before making requests (replaces blockUntilReady)
                  console.log('[NIP-46 Login] 📡 Starting RPC listener for get_public_key...');
                  await finalSigner.rpc.subscribe({ kinds: [24133], '#p': [localUser.pubkey] });
                  
                  // Now get public key via NIP-46 RPC (will use the active subscription)
                  const userPubkey = await finalSigner.getPublicKey();
                  console.log('[NIP-46 Login] ✅ Got user pubkey:', userPubkey.slice(0,16));
                  
                  resolve({ remoteSignerPubkey, userPubkey });
                } catch (error) {
                  console.error('[NIP-46 Login] Failed to get user pubkey:', error);
                  resolve(null);
                }
              } else {
                console.warn('[NIP-46 Login] ❌ Invalid secret in response. Expected:', secret, 'or "ack", got:', message.result);
              }
            }
          } catch (error) {
            console.error('[NIP-46 Login] Error processing event:', error);
          }
        });
        
        subscription.on('eose', () => {
          console.log('[NIP-46 Login] 📭 Initial subscription EOSE received');
        });
        
        console.log('[NIP-46 Login] ✅ Subscription active, waiting for remote signer response...');
      });
      
      if (!handshakeResult) {
        return {
          success: false,
          error: 'Connection timeout - remote signer did not respond. Please try scanning the QR code again.',
        };
      }
      
      const { remoteSignerPubkey, userPubkey } = handshakeResult;
      
      // 6. Create final signer with remote signer pubkey
      console.log('[NIP-46 Login] 🔧 Creating final NIP-46 signer...');
      const finalParams = new URLSearchParams();
      DEFAULT_RELAYS.forEach(relay => finalParams.append('relay', relay));
      finalParams.append('secret', secret);
      
      const bunkerUrl = `bunker://${remoteSignerPubkey}?${finalParams.toString()}`;
      const signer = new NDKNip46Signer(ndk, bunkerUrl, localSigner);
      
      // Set the signer on NDK
      ndk.signer = signer;
      
      console.log('[NIP-46 Login] ✅ Successfully connected to remote signer!');

      const npub = nip19.npubEncode(userPubkey);
      
      const account: Account = {
        method: 'nip46' as LoginMethod,
        pubkey: userPubkey,
        npub,
      };

      console.log('[NIP-46 Login] 🎉 Authenticated:', userPubkey.slice(0, 16) + '...');

      // Update state
      setAccount(account);
      setAccounts([account, ...accounts.filter(a => a.pubkey !== userPubkey)]);
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
