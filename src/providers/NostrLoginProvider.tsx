'use client';

/**
 * NDK Provider for POWR Workout PWA
 * 
 * SIMPLIFIED: Removed nostr-login dependency.
 * NDK singleton is already initialized in lib/ndk.ts.
 * Authentication now handled directly through NDK in auth hooks.
 */

import { useEffect } from 'react';
import { ensureNDKInitialized } from '@/lib/ndk';

interface NostrLoginProviderProps {
  children: React.ReactNode;
}

export function NostrLoginProvider({ children }: NostrLoginProviderProps) {
  useEffect(() => {
    // Ensure NDK singleton is initialized
    ensureNDKInitialized()
      .then(() => {
        console.log('[NostrLoginProvider] NDK initialized and ready');
      })
      .catch((error: Error) => {
        console.error('[NostrLoginProvider] Failed to initialize NDK:', error);
      });
  }, []);

  return <>{children}</>;
}
