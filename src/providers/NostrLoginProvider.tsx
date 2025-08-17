'use client';

/**
 * Nostr-Login Provider for POWR Workout PWA
 * 
 * Handles SSR-compatible initialization of nostr-login with POWR-specific configuration.
 * Integrates with existing Jotai state management through NostrLoginBridge.
 */

import { useEffect, useState } from 'react';
import { nostrLoginBridge } from '@/lib/auth/nostrLoginBridge';

interface NostrLoginProviderProps {
  children: React.ReactNode;
}

export function NostrLoginProvider({ children }: NostrLoginProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // SSR-compatible nostr-login initialization
    import('nostr-login')
      .then(async ({ init }) => {
        console.log('[NostrLoginProvider] Initializing nostr-login...');
        
        // POWR-specific configuration
        await init({
          // Authentication methods (including 'local' for ephemeral login)
          methods: ['connect', 'extension', 'local', 'readOnly'],
          
          // POWR event permissions for NIP-101e workout events
          perms: 'sign_event:1,sign_event:1301,sign_event:33401,sign_event:33402,sign_event:30003',
          
          // Bunker providers (focus on nsec.app for reliability)
          bunkers: 'nsec.app',
          
          // UI configuration
          theme: 'default',
          darkMode: true, // Match POWR's dark theme
          noBanner: true, // We'll trigger auth flows manually
          
          // Welcome screen configuration
          title: 'POWR Workout PWA',
          description: 'Track your workouts on Nostr with POWR',
          
          // Signup relay configuration for ephemeral accounts
          signupRelays: 'wss://relay.damus.io,wss://nos.lol,wss://relay.primal.net',
          outboxRelays: 'wss://relay.damus.io,wss://nos.lol,wss://relay.primal.net',
          
          // Don't set startScreen - let nostr-login auto-detect extensions
          // This allows proper extension detection on initialization
        });
        
        // Add debug logging for extension detection after initialization
        console.log('[NostrLoginProvider] Post-init extension detection check...');
        console.log('[NostrLoginProvider] window.nostr available:', typeof window !== 'undefined' && !!window.nostr);
        
        if (typeof window !== 'undefined' && window.nostr) {
          console.log('[NostrLoginProvider] Extension detected - window.nostr methods:', Object.keys(window.nostr));
          // Note: Not testing extension responsiveness here to avoid auto-launching nostr-login UI
          // Extension responsiveness will be tested when user explicitly triggers authentication
        }

        // Initialize bridge to connect nostr-login events to Jotai atoms
        nostrLoginBridge.initialize();
        
        setIsInitialized(true);
        console.log('[NostrLoginProvider] nostr-login initialized successfully');
        
      })
      .catch((error) => {
        console.error('[NostrLoginProvider] Failed to load nostr-login:', error);
      });

    // Cleanup on unmount
    return () => {
      if (isInitialized) {
        nostrLoginBridge.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
