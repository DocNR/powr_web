'use client';

import React from 'react';
import { Settings, Sun, Moon } from 'lucide-react';
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
import { useAccount } from '@/lib/auth/hooks';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ 
  title = "POWR"
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const account = useAccount();
  
  const userInitials = account?.npub
    ? account.npub.slice(4, 6).toUpperCase()
    : "?";

  const formatNpub = (npub: string) => {
    if (npub.length <= 16) return npub;
    return `${npub.slice(0, 8)}...${npub.slice(-8)}`;
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-background border-b min-w-0">
      {/* Left side - User Avatar (opens left drawer) */}
      <Sheet>
        <SheetTrigger asChild>
          <Avatar className="h-10 w-10 ring-2 ring-[color:var(--workout-primary)] cursor-pointer hover:ring-[color:var(--workout-active)] transition-colors">
            <AvatarImage src={undefined} alt="User" />
            <AvatarFallback className="bg-[color:var(--workout-primary)] text-white text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* User Profile Section */}
            <div className="p-4 rounded-lg bg-[color:var(--workout-surface)]">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={undefined} alt="User" />
                  <AvatarFallback className="bg-[color:var(--workout-primary)] text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[color:var(--workout-text)] text-sm">
                    {account?.npub ? formatNpub(account.npub) : "Not signed in"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account ? "Nostr Account" : "Authentication required"}
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
              <h3 className="text-sm font-medium mb-3 text-[color:var(--workout-text)]">Theme</h3>
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

            {/* Coming Soon Features */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-[color:var(--workout-text)]">Features</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gym Personality Themes</span>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      Coming Soon™
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hardcore, Zen, Corporate & Boutique themes
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Relay Management</span>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      Coming Soon™
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure your Nostr relays
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Notification Settings</span>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                      Coming Soon™
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Workout reminders & social updates
                  </p>
                </div>
              </div>
            </div>

            {/* App Info */}
            <div className="mt-auto pt-6 border-t">
              <div className="text-center space-y-2">
                <h3 className="font-medium text-[color:var(--workout-primary)]">POWR Workout PWA</h3>
                <p className="text-xs text-muted-foreground">
                  Decentralized Fitness
                </p>
                <p className="text-xs text-muted-foreground">
                  Powered by Nostr
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Centered title */}
      <h1 className="text-xl font-bold text-foreground truncate mx-4 flex-1 text-center">{title}</h1>
      
      {/* Right side - Settings icon (visual balance only) */}
      <Button variant="ghost" size="icon" className="text-[color:var(--workout-primary)] opacity-50 cursor-default">
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  );
}