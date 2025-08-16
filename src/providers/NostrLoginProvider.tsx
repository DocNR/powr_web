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
          // Authentication methods (excluding 'local' for security)
          methods: ['connect', 'extension', 'readOnly'],
          
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
          startScreen: 'welcome',
        });

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
