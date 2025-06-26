'use client';

/**
 * POWR Workout PWA - Login-03 Style Authentication
 * 
 * Based on shadcn/ui login-03 component with Nostr authentication
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useAccount, 
  useIsAuthenticated, 
  useLoginWithNip07,
  useLoginWithNip46,
  useLogout
} from '@/lib/auth/hooks';
import { initializeNDK } from '@/lib/ndk';
import { Cable, Loader2, Smartphone, Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/ui/logo';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Home() {
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const loginWithNip07 = useLoginWithNip07();
  const loginWithNip46 = useLoginWithNip46();
  const logout = useLogout();
  
  const [bunkerUrl, setBunkerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasNip07, setHasNip07] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize NDK on app start (following Chachi pattern)
  useEffect(() => {
    if (!mounted) return; // Wait for component to mount
    
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing NDK...');
        await initializeNDK();
        console.log('[App] NDK initialized successfully');
        
        // Check for NIP-07 extension (only after mounting)
        const hasExtension = typeof window !== 'undefined' && 
                            typeof window.nostr !== 'undefined';
        setHasNip07(hasExtension);
        
        // Debug: Check what's in localStorage
        const amberPubkey = localStorage.getItem('amber_pubkey');
        const authMethod = localStorage.getItem('auth_method');
        console.log('[App] localStorage check:', { amberPubkey, authMethod });
        
        console.log('[App] NDK initialization complete');
      } catch (error) {
        console.error('[App] Initialization failed:', error);
      }
    };

    initializeApp();
  }, [mounted]);

  // NIP-07 Extension Change Detection (ONLY for extension users)
  useEffect(() => {
    // Only monitor extension changes if user logged in with NIP-07
    if (!mounted || !hasNip07 || !isAuthenticated || !account || account.method !== 'nip07') {
      return;
    }

    const lastKnownPubkey = account.pubkey;
    
    const checkExtensionChange = async () => {
      try {
        if (window.nostr && typeof window.nostr.getPublicKey === 'function') {
          const currentPubkey = await window.nostr.getPublicKey();
          
          if (currentPubkey !== lastKnownPubkey) {
            console.log('[Extension Change] Detected account switch!');
            console.log('[Extension Change] Old:', lastKnownPubkey.slice(0, 16) + '...');
            console.log('[Extension Change] New:', currentPubkey.slice(0, 16) + '...');
            
            // Auto-logout (page refresh will handle the clean state)
            console.log('[Extension Change] Auto-switching to new account...');
            await logout();
          }
        }
      } catch (error) {
        // Extension might deny permission or be unavailable - that's OK
        console.log('[Extension Change] Check failed (normal if user denies):', error instanceof Error ? error.message : String(error));
      }
    };

    // Check every 3 seconds for extension changes (less frequent to avoid spam)
    const interval = setInterval(checkExtensionChange, 3000);
    
    console.log('[Extension Change] Started monitoring for account changes (NIP-07 users only)');
    
    return () => {
      clearInterval(interval);
      console.log('[Extension Change] Stopped monitoring');
    };
  }, [mounted, hasNip07, isAuthenticated, account, logout]);

  const handleNip07Login = async () => {
    setIsConnecting(true);
    try {
      await loginWithNip07();
    } catch (error) {
      console.error('NIP-07 login failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNip46Login = async () => {
    if (!bunkerUrl.trim()) return;
    
    setIsConnecting(true);
    try {
      await loginWithNip46(bunkerUrl.trim());
    } catch (error) {
      console.error('NIP-46 login failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (isAuthenticated && account) {
    // Beautiful App with Navigation
    return <AppLayout />;
  }

  // Login-03 Style Authentication Page
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10" suppressHydrationWarning>
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <Logo width={24} height={24} className="rounded-md" />
          POWR
        </a>
        
        {/* Login Form */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>
                Connect your Nostr identity to start tracking workouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-6">
                  {/* NIP-07 Browser Extension */}
                  <div className="flex flex-col gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleNip07Login}
                      disabled={!hasNip07 || isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      )}
                      {hasNip07 ? 'Connect Browser Extension' : 'No Extension Detected'}
                    </Button>
                    {!hasNip07 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Install <a href="https://getalby.com" className="underline">Alby</a> or{' '}
                        <a href="https://github.com/fiatjaf/nos2x" className="underline">nos2x</a> for the best experience
                      </p>
                    )}
                  </div>
                  
                  {/* Connect with Amber */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={async () => {
                        try {
                          // NIP-55: Android Signer Application integration
                          // Use nostrsigner: scheme for direct Amber integration
                          
                          const params = new URLSearchParams();
                          params.append('compressionType', 'none');
                          params.append('returnType', 'signature');
                          params.append('type', 'get_public_key');
                          
                          // Use the current origin (works for both localhost and network IP)
                          const callbackUrl = `${window.location.origin}/auth/callback`;
                          params.append('callbackUrl', callbackUrl);
                          
                          console.log('[Amber Connect] Using callback URL:', callbackUrl);
                          
                          // Create NIP-55 URL for Amber
                          const amberUrl = `nostrsigner:?${params.toString()}`;
                          
                          console.log('[Amber Connect] Opening Amber with NIP-55 URL:', amberUrl);
                          
                          // Launch Amber app using NIP-55 protocol
                          window.location.href = amberUrl;
                          
                        } catch (error) {
                          console.error('[Amber Connect] Error:', error);
                        }
                      }}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Smartphone className="mr-2 h-4 w-4" />
                      )}
                      Connect with Amber
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Opens Amber app for secure mobile signing. Install from{' '}
                      <a href="https://github.com/greenart7c3/Amber/releases" className="underline">GitHub</a> or{' '}
                      <a href="https://f-droid.org/packages/com.greenart7c3.nostrsigner/" className="underline">F-Droid</a>
                    </p>
                  </div>
                  
                  {/* Divider */}
                  <div className="text-center">
                    <span className="text-xs uppercase text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                  
                  {/* NIP-46 Remote Signer */}
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="bunker">Remote Signer</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bunker"
                          type="text"
                          placeholder="bunker://"
                          value={bunkerUrl}
                          onChange={(e) => setBunkerUrl(e.target.value)}
                          disabled={isConnecting}
                        />
                        <Button 
                          type="button" 
                          size="icon"
                          onClick={handleNip46Login}
                          disabled={!bunkerUrl.trim() || isConnecting}
                        >
                          {isConnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Cable className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Examples: bunker://pubkey@relay.com or user@nsecbunker.com
                      </p>
                    </div>
                  </div>
                  
                  {/* Demo Login for Testing UI */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={async () => {
                        // Demo login using working bunker URL
                        const demoBunkerUrl = 'bunker://b187f4fa71daeed34a709dcb0e0b5a317b2408a739327f1e549b7bd8011362d0?relay=wss%3A%2F%2Fpromenade.fiatjaf.com';
                        setIsConnecting(true);
                        try {
                          await loginWithNip46(demoBunkerUrl);
                        } catch (error) {
                          console.error('Demo login failed:', error);
                        } finally {
                          setIsConnecting(false);
                        }
                      }}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Gamepad2 className="mr-2 h-4 w-4" />
                      )}
                      Demo Login (Working Bunker)
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Uses real bunker URL for testing dashboard
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Security Notice */}
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
            <div className="flex items-center justify-center gap-2">
              <span>POWR never stores your private keys.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
