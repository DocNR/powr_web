/**
 * Nostr-Login Bridge for POWR Workout PWA
 * 
 * Bridges nostr-login events to Jotai state management.
 * Handles authentication state synchronization between nostr-login and our app state.
 */

import { nip19 } from 'nostr-tools';
import { getDefaultStore } from 'jotai';
import { NDKNip07Signer } from '@nostr-dev-kit/ndk';
import { getNDKInstance } from '@/lib/ndk';
import { 
  accountAtom, 
  accountsAtom, 
  methodAtom, 
  resetAuthStateAtom 
} from './atoms';
import type { Account, LoginMethod } from './types';

// Create store instance
const store = getDefaultStore();

// Extend global Document interface for nostr-login events
declare global {
  interface DocumentEventMap {
    'nlAuth': CustomEvent<{ type: string; pubkey?: string; method?: string }>;
    'nlLaunch': CustomEvent<string>;
    'nlLogout': Event;
  }
}

export class NostrLoginBridge {
  private static instance: NostrLoginBridge;
  private isInitialized = false;

  static getInstance(): NostrLoginBridge {
    if (!this.instance) {
      this.instance = new NostrLoginBridge();
    }
    return this.instance;
  }

  /**
   * Initialize the bridge - sets up event listeners for nostr-login
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('[NostrLoginBridge] Already initialized');
      return;
    }

    console.log('[NostrLoginBridge] Initializing bridge service...');

    // Listen to nostr-login authentication events
    document.addEventListener('nlAuth', this.handleAuthEvent);

    this.isInitialized = true;
    console.log('[NostrLoginBridge] Bridge service initialized');
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('nlAuth', this.handleAuthEvent);
    this.isInitialized = false;
    console.log('[NostrLoginBridge] Bridge service destroyed');
  }

  /**
   * Handle authentication events from nostr-login
   */
  private handleAuthEvent = async (event: Event) => {
    // Type guard to ensure this is a CustomEvent with the right detail
    if (!(event instanceof CustomEvent) || !event.detail) {
      console.warn('[NostrLoginBridge] Received invalid auth event');
      return;
    }

    // nostr-login provides pubkey, not npub - we need to convert
    const { type, pubkey, method } = event.detail as { type: string; pubkey?: string; method?: string };
    
    console.log('[NostrLoginBridge] Auth event received:', { type, pubkey: pubkey?.slice(0, 16) + '...', method });

    try {
      if (type === 'login' || type === 'signup') {
        await this.handleLogin(pubkey, method);
      } else if (type === 'logout') {
        await this.handleLogout();
      }
    } catch (error) {
      console.error('[NostrLoginBridge] Error handling auth event:', error);
    }
  };

  /**
   * Handle login/signup events
   */
  private async handleLogin(pubkey?: string, method?: string): Promise<void> {
    if (!pubkey) {
      console.error('[NostrLoginBridge] Login event missing pubkey');
      return;
    }

    try {
      // Convert pubkey to npub for storage
      const npub = nip19.npubEncode(pubkey);

      console.log('[NostrLoginBridge] Processing login for pubkey:', pubkey.slice(0, 16) + '...');

      // Determine login method from nostr-login method
      let loginMethod: LoginMethod;
      switch (method) {
        case 'extension':
          loginMethod = 'nip07';
          break;
        case 'connect':
          loginMethod = 'nip46';
          break;
        case 'readOnly':
          loginMethod = 'readOnly';
          break;
        default:
          // Try to detect from window.nostr availability
          if (typeof window !== 'undefined' && window.nostr) {
            loginMethod = 'nip07'; // Assume extension if window.nostr is available
          } else {
            loginMethod = 'readOnly'; // Fallback to read-only
          }
      }

      // Create account object
      const account: Account = {
        method: loginMethod,
        pubkey: pubkey,
        npub,
      };

      // Update NDK singleton with new signer (if available)
      const ndk = getNDKInstance();
      if (ndk && typeof window !== 'undefined' && window.nostr && loginMethod !== 'readOnly') {
        // Use NDK's built-in NIP-07 signer for window.nostr integration
        ndk.signer = new NDKNip07Signer();
        console.log('[NostrLoginBridge] NDK signer updated with NDKNip07Signer');
      }

      // Update Jotai atoms
      const currentAccounts = store.get(accountsAtom);
      
      // Update current account
      store.set(accountAtom, account);
      
      // Update accounts list (add to front, remove duplicates)
      const updatedAccounts = [
        account,
        ...currentAccounts.filter((a: Account) => a.pubkey !== account.pubkey)
      ];
      store.set(accountsAtom, updatedAccounts);
      
      // Update login method
      store.set(methodAtom, loginMethod);

      console.log('[NostrLoginBridge] Successfully updated auth state for:', pubkey.slice(0, 16) + '...', 'npub:', npub.slice(0, 16) + '...');

      // Force Jotai to re-read from localStorage by triggering storage events for all auth atoms
      console.log('[NostrLoginBridge] Triggering storage events to force Jotai atom updates...');
      
      // Trigger storage events for all auth-related localStorage keys
      // This forces Jotai's atomWithStorage to re-read and update React components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'powr-current-account',
        newValue: JSON.stringify(account),
        storageArea: localStorage
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'powr-accounts',
        newValue: JSON.stringify(updatedAccounts),
        storageArea: localStorage
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'powr-login-method',
        newValue: JSON.stringify(loginMethod),
        storageArea: localStorage
      }));
      
      console.log('[NostrLoginBridge] Storage events dispatched for Jotai atom sync');

    } catch (error) {
      console.error('[NostrLoginBridge] Error processing login:', error);
    }
  }

  /**
   * Handle logout events
   */
  private async handleLogout(): Promise<void> {
    console.log('[NostrLoginBridge] Processing logout...');

    try {
      // Clear NDK signer
      const ndk = getNDKInstance();
      if (ndk) {
        ndk.signer = undefined;
        console.log('[NostrLoginBridge] Cleared NDK signer');
      }

      // Reset Jotai auth state
      store.set(resetAuthStateAtom);

      console.log('[NostrLoginBridge] Successfully cleared auth state');

    } catch (error) {
      console.error('[NostrLoginBridge] Error processing logout:', error);
    }
  }

  /**
   * Launch nostr-login with specific screen
   * Using nostrcal's proven launch() function approach
   */
  static async launchNostrLogin(screen: 'welcome-login' | 'signup' | 'extension' | 'connect') {
    console.log(`[NostrLoginBridge] Launching nostr-login with screen: ${screen}`);
    
    try {
      // Use nostrcal's approach: direct launch() function call
      const { launch } = await import('nostr-login');
      
      // Map our screen types to nostr-login's expected types
      let launchScreen: string = screen;
      if (screen === 'extension') {
        // Use 'login' as fallback for extension since 'extension' isn't in StartScreens
        launchScreen = 'login';
      }
      
      // Launch with mapped screen like nostrcal does
      launch(launchScreen as any);
      
      console.log(`[NostrLoginBridge] Successfully launched nostr-login with screen: ${launchScreen}`);
      
    } catch (error) {
      console.error('[NostrLoginBridge] Failed to launch nostr-login:', error);
      
      // Fallback to direct extension auth only for extension screen
      if (screen === 'extension') {
        console.log('[NostrLoginBridge] Falling back to direct extension auth...');
        NostrLoginBridge.tryDirectExtensionAuth();
      }
    }
  }

  /**
   * Trigger nostr-login authentication flows
   * Updated to use the same screens as before: welcome-login and connect
   */
  static triggerLogin(screen?: 'welcome' | 'welcome-login' | 'welcome-signup' | 'signup' | 'login' | 'connect' | 'connection-string' | 'extension' | 'readOnly' | 'local-signup'): void {
    const detail = screen || 'welcome';
    
    // Use the new launch approach for the main screens we use
    if (screen === 'welcome-login' || screen === 'connect') {
      NostrLoginBridge.launchNostrLogin(screen);
    } else {
      // Fallback to old approach for other screens
      document.dispatchEvent(new CustomEvent('nlLaunch', { detail }));
    }
    
    // Only try direct extension auth as a fallback after nostr-login has a chance to work
    if (screen === 'extension') {
      setTimeout(() => {
        // Check if nostr-login succeeded, if not try direct fallback
        if (typeof window !== 'undefined' && window.nostr && !store.get(accountAtom)) {
          NostrLoginBridge.tryDirectExtensionAuth();
        }
      }, 2000); // Give nostr-login 2 seconds to work
    }
  }

  /**
   * Fallback: Direct extension authentication if nostr-login doesn't detect it
   */
  static async tryDirectExtensionAuth(): Promise<void> {
    if (typeof window === 'undefined' || !window.nostr) {
      console.log('[NostrLoginBridge] No extension available for direct auth');
      return;
    }

    try {
      console.log('[NostrLoginBridge] Attempting direct extension authentication...');
      
      // Try to get pubkey directly from extension
      const pubkey = await window.nostr.getPublicKey();
      
      if (pubkey) {
        console.log('[NostrLoginBridge] Direct extension auth successful, pubkey:', pubkey.slice(0, 16) + '...');
        
        // Manually trigger the auth event that nostr-login would normally send
        const authEvent = new CustomEvent('nlAuth', {
          detail: {
            type: 'login',
            pubkey: pubkey,
            method: 'extension'
          }
        });
        
        document.dispatchEvent(authEvent);
      }
      
    } catch (error) {
      console.log('[NostrLoginBridge] Direct extension auth failed (user may have denied):', error);
    }
  }

  /**
   * Trigger nostr-login logout
   */
  static triggerLogout(): void {
    document.dispatchEvent(new Event('nlLogout'));
  }

  /**
   * Check if nostr-login is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' &&
           'dispatchEvent' in document;
  }
}

// Export singleton instance
export const nostrLoginBridge = NostrLoginBridge.getInstance();

// Export static methods for convenience
export const { triggerLogin, triggerLogout, isAvailable } = NostrLoginBridge;
