'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../primitives/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../primitives/Avatar';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '../primitives/Sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../primitives/Dialog';
import { useAccount, useLogout } from '@/lib/auth/hooks';
import { useProfile, getDisplayName, getAvatarUrl } from '@/hooks/useProfile';
import { GlobalWorkoutSearch } from '@/components/search/GlobalWorkoutSearch';

interface AppHeaderProps {
  title?: string;
  onWorkoutSelect?: (templateReference: string) => void;
}

export function AppHeader({ 
  title = "POWR",
  onWorkoutSelect
}: AppHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect if we're in fullscreen PWA mode
  useEffect(() => {
    const checkDisplayMode = () => {
      const isFullscreenMode = window.matchMedia('(display-mode: fullscreen)').matches;
      setIsFullscreen(isFullscreenMode);
    };

    checkDisplayMode();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: fullscreen)');
    mediaQuery.addEventListener('change', checkDisplayMode);
    
    return () => mediaQuery.removeEventListener('change', checkDisplayMode);
  }, []);
  const { theme, setTheme } = useTheme();
  const account = useAccount();
  const logout = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Get user profile data using NDK
  const { profile } = useProfile(account?.pubkey);
  
  // Get display name and avatar using our helper functions
  const displayName = getDisplayName(profile, account?.pubkey);
  const avatarUrl = getAvatarUrl(profile, account?.pubkey);
  
  const userInitials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : account?.npub
    ? account.npub.slice(4, 6).toUpperCase()
    : "?";

  const formatNpub = (npub: string) => {
    if (npub.length <= 16) return npub;
    return `${npub.slice(0, 8)}...${npub.slice(-8)}`;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className={`flex items-center justify-between px-4 py-2 md:py-3 min-w-0 ${
      isFullscreen ? 'app-header-fullscreen' : ''
    }`}>
      {/* Left side - User Avatar (opens left drawer) */}
      <Sheet>
        <SheetTrigger asChild>
          <Avatar className="h-10 w-10 ring-2 ring-[color:var(--workout-primary)] cursor-pointer hover:ring-[color:var(--workout-active)] transition-all duration-200 hover:scale-105 active:scale-95">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-[color:var(--workout-primary)] text-white text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          
          {/* Main content area - scrollable */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* User Profile Section */}
            <div className="p-3 rounded-lg bg-[color:var(--workout-surface)]">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-[color:var(--workout-primary)] text-white text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[color:var(--workout-text)] text-sm">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account?.npub ? formatNpub(account.npub) : "Not signed in"}
                  </p>
                </div>
              </div>
              
              {account ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✅ Connected to Nostr network</p>
                  <p>✅ Data syncing across devices</p>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  <p>Sign in to sync your workouts across devices</p>
                </div>
              )}
            </div>

            {/* Theme Toggle Section */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-[color:var(--workout-text)]">Theme</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'bg-[color:var(--workout-primary)] hover:bg-[color:var(--workout-primary)]/90' : ''}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'bg-[color:var(--workout-primary)] hover:bg-[color:var(--workout-primary)]/90' : ''}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom section - fixed at bottom */}
          <div className="mt-auto pt-4 border-t space-y-3">
            {/* Logout Section - Only show if authenticated */}
            {account && (
              <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign Out</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to sign out? You&apos;ll need to authenticate again to access your workouts.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLogoutDialog(false)}
                      disabled={isLoggingOut}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full sm:w-auto"
                    >
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* App Info - POWR Footer */}
            <div className="text-center space-y-1 pb-2">
              <h2 className="font-medium text-[color:var(--workout-primary)] text-sm font-mono-tech">POWR</h2>
              <p className="text-xs text-muted-foreground">
                Proof Of Workout / Relays
              </p>
              <p className="text-xs text-muted-foreground">
                Powered by Nostr
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Centered title */}
      <h1 className="text-xl font-bold text-foreground truncate mx-4 flex-1 text-center font-mono-tech">{title}</h1>
      
      {/* Right side - Global Search */}
      <GlobalWorkoutSearch 
        onWorkoutSelect={onWorkoutSelect}
        className="text-[color:var(--workout-primary)]"
      />
    </header>
  );
}
