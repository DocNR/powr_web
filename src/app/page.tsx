'use client';

/**
 * POWR Workout PWA - Landing Page
 * 
 * Revolutionary fitness tracking with data control and Nostr integration.
 * Emphasizes user autonomy and the decentralized fitness movement.
 */

import { useEffect, useState } from 'react';
import { Shield, Globe, Unlock, Zap, Users, ArrowRight } from 'lucide-react';
import { useIsAuthenticated, useEphemeralLogin, useAutoLogin } from '@/lib/auth/hooks';
import { initializeNDK } from '@/lib/ndk';
import { triggerLogin } from '@/lib/auth/nostrLoginBridge';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { Logo } from '@/components/ui/logo';

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const ephemeralLogin = useEphemeralLogin();
  const autoLogin = useAutoLogin();
  const [mounted, setMounted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Set mounted state to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize NDK and attempt auto-login on app start
  useEffect(() => {
    if (!mounted) return;
    
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing NDK...');
        await initializeNDK();
        console.log('[App] NDK initialized successfully');
        
        // Attempt auto-login after NDK is ready
        console.log('[App] Attempting auto-login...');
        const loginSuccess = await autoLogin();
        if (loginSuccess) {
          console.log('[App] Auto-login successful');
        } else {
          console.log('[App] Auto-login not available or failed');
        }
      } catch (error) {
        console.error('[App] Initialization failed:', error);
      }
    };

    initializeApp();
  }, [mounted, autoLogin]);

  const handleTryDemo = async () => {
    console.log('[Landing Page] Try Demo button clicked');
    try {
      setIsLoggingIn(true);
      console.log('[Landing Page] Starting ephemeral login...');
      const result = await ephemeralLogin();
      console.log('[Landing Page] Ephemeral login result:', result);
      if (!result.success && result.error) {
        console.error('Demo login failed:', result.error);
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isAuthenticated) {
    // Show the main app when authenticated
    return <AppLayout />;
  }

  // Show landing page when not authenticated
  return (
    <div className="min-h-screen hero-background" suppressHydrationWarning>
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo width={32} height={32} className="rounded-md" />
            <div className="flex flex-col">
              <span className="text-xl font-bold font-mono-tech text-white">POWR</span>
              <span className="text-xs text-gray-400 font-mono-tech hidden sm:block">
                Proof of Workout over Relays
              </span>
            </div>
          </div>
          <a 
            href="https://njump.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex"
          >
            <Badge variant="secondary" className="font-mono-tech hover:bg-secondary/80 transition-colors cursor-pointer">
              Powered by Nostr
            </Badge>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight font-mono-tech text-white">
              Your Fitness,{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Your Rules
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Control your data. Connect with athletes worldwide. 
              Join the decentralized fitness revolution.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  variant="primary-gradient" 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={() => triggerLogin('welcome-login')}
                >
                  Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => triggerLogin('connection-string')}
            >
              NostrConnect
              <Globe className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white"
              onClick={handleTryDemo}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-pulse" />
                  Starting Demo...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Try Demo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-24">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Control Your Data */}
            <Card className="border-0 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">Control Your Data</h3>
                <p className="text-gray-300">
                  Your workouts stay with you, not locked in an app. 
                  Switch platforms anytime, keep your progress forever.
                </p>
              </CardContent>
            </Card>

            {/* Connect Globally */}
            <Card className="border-0 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">Connect Globally</h3>
                <p className="text-gray-300">
                  Join athletes worldwide on the open Nostr network. 
                  Share workouts, find motivation, build community.
                </p>
              </CardContent>
            </Card>

            {/* No Lock-in */}
            <Card className="border-0 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Unlock className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">No Lock-in</h3>
                <p className="text-gray-300">
                  Break free from app ecosystems. Your fitness journey 
                  belongs to you, not to any single company.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Proof / Revolution Message */}
        <div className="max-w-3xl mx-auto mt-24 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Users className="h-4 w-4" />
            <span>Join tens of athletes taking control of their data</span>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <p className="text-lg font-medium mb-2 text-white">
              &ldquo;The future of fitness is open, decentralized, and user-controlled.&rdquo;
            </p>
            <p className="text-sm text-gray-300">
              Built on Nostr protocol • No ads • No tracking • No vendor lock-in
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-24 border-t border-gray-700">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Powered by</span>
            <a 
              href="https://nstart.me" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Badge variant="outline" className="text-xs font-mono-tech hover:bg-gray-700/80 transition-colors cursor-pointer border-gray-600 text-gray-300">
                Nostr Protocol
              </Badge>
            </a>
          </div>
          <p className="text-xs text-gray-400">
            POWR never stores your private keys. Your data, your control.
          </p>
        </div>
      </footer>
    </div>
  );
}
