'use client';

/**
 * POWR Workout PWA - Landing Page
 * 
 * User-experience focused fitness tracking with data control.
 * Emphasizes fitness value first, with technical benefits as credibility multipliers.
 */

import { useEffect, useState } from 'react';
import { Shield, Globe, Unlock, Zap, Users, ArrowRight, Github, BookOpen } from 'lucide-react';
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
                Fitness that travels with you
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="https://github.com/DocNR/powr_web" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a 
              href="https://nostr.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex"
            >
              <Badge variant="secondary" className="font-mono-tech hover:bg-secondary/80 transition-colors cursor-pointer">
                Built on Nostr
              </Badge>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight font-mono-tech text-white">
              Your Workouts,{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Your Community,
              </span>
              {' '}Your Control
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Track workouts, connect with athletes, and control your fitness journey.
              Simple tracking that works everywhere.
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
              Start Tracking
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
            {/* Simple Workout Tracking */}
            <Card className="border-0 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white">Simple Workout Tracking</h3>
                <p className="text-gray-300">
                  Log exercises, sets, and reps. Build your personal workout library 
                  and track your progress over time.
                </p>
              </CardContent>
            </Card>

            {/* Global Community */}
            <Card className="border-0 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white">Open Community</h3>
                <p className="text-gray-300">
                  Connect with other athletes using open protocols. Your social connections 
                  aren't trapped in any single app.
                </p>
              </CardContent>
            </Card>

            {/* You Control Your Data */}
            <Card className="border-0 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white">You Control Your Data</h3>
                <p className="text-gray-300">
                  Your workouts are secured with your keys, not locked in our database. 
                  Keep your fitness journey with you, forever.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Future-Focused Section */}
        <div className="max-w-4xl mx-auto mt-24 text-center space-y-8">
          <h2 className="text-2xl font-semibold text-white">Building the Foundation for Open Fitness</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 bg-gray-800/30">
              <CardContent className="p-6 text-left">
                <h3 className="font-semibold text-white mb-2">Today</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Track workouts and build your library</li>
                  <li>• Connect with athletes globally</li>
                  <li>• Control your data with your keys</li>
                  <li>• Works offline, syncs everywhere</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-gray-800/30">
              <CardContent className="p-6 text-left">
                <h3 className="font-semibold text-white mb-2">Tomorrow</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Full ecosystem of compatible apps</li>
                  <li>• Your data works across all fitness platforms</li>
                  <li>• Enhanced analytics and insights</li>
                  <li>• Built-in payments and challenges</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="max-w-3xl mx-auto mt-24 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Users className="h-4 w-4" />
            <span>Join athletes who've chosen control over lock-in</span>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <p className="text-lg font-medium mb-4 text-white">
              "Your Keys, Your Control, Your Fitness Journey"
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                No ads, no tracking
              </span>
              <span className="flex items-center gap-1">
                <Unlock className="h-3 w-3" />
                No vendor lock-in
              </span>
              <span className="flex items-center gap-1">
                <Github className="h-3 w-3" />
                Open source
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-24 border-t border-gray-700">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <a 
              href="https://nostr.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Badge variant="outline" className="text-xs font-mono-tech border-gray-600 text-gray-300 hover:bg-gray-700/80 transition-colors">
                Learn about Nostr
              </Badge>
            </a>
            <a 
              href="https://github.com/DocNR/powr_web" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Github className="h-3 w-3" />
              <span className="text-xs">View Code</span>
            </a>
            <div className="flex items-center gap-2 text-gray-400">
              <BookOpen className="h-3 w-3" />
              <span className="text-xs">Blog Coming Soon</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            POWR never stores your private keys. Your privacy depends on keeping your keys secure.
          </p>
        </div>
      </footer>
    </div>
  );
}