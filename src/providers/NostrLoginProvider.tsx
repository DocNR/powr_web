'use client';

/**
 * Nostr-Login Provider for POWR Workout PWA
 * 
 * Simplified initialization based on nostrcal's proven approach.
 * Uses launch() pattern instead of complex init() configuration.
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
        console.log('[NostrLoginProvider] Initializing nostr-login with simplified config...');
        
        // Simplified configuration based on nostrcal's working approach
        // Let nostr-login handle its own relay selection instead of forcing overrides
        await init({
          // Authentication methods
          methods: ['connect', 'extension', 'local', 'readOnly'],
          
          // POWR event permissions for NIP-101e workout events
          perms: 'sign_event:1,sign_event:1301,sign_event:33401,sign_event:33402,sign_event:30003',
          
          // Bunker providers
          bunkers: 'nsec.app',
          
          // UI configuration
          theme: 'default',
          darkMode: true,
          noBanner: true, // We'll trigger auth flows manually
          
          // Welcome screen configuration
          title: 'POWR Workout PWA',
          description: 'Track your workouts on Nostr with POWR',
          
          // Don't override relay configuration - let nostr-login handle it
          // This prevents conflicts with internal relay selection
        });
        
        // Add debug logging for extension detection after initialization
        console.log('[NostrLoginProvider] Post-init extension detection check...');
        console.log('[NostrLoginProvider] window.nostr available:', typeof window !== 'undefined' && !!window.nostr);
        
        if (typeof window !== 'undefined' && window.nostr) {
          console.log('[NostrLoginProvider] Extension detected - window.nostr methods:', Object.keys(window.nostr));
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
