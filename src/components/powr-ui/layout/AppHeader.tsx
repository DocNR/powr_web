'use client';

import React from 'react';
import { Settings } from 'lucide-react';
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-background border-b min-w-0">
      {/* Left side - User Avatar (opens left drawer) */}
      <Sheet>
        <SheetTrigger asChild>
          <Avatar className="h-10 w-10 ring-2 ring-orange-500 cursor-pointer hover:ring-orange-400 transition-colors">
            <AvatarImage src={undefined} alt="User" />
            <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Avatar className="h-12 w-12">
                <AvatarImage src={undefined} alt="User" />
                <AvatarFallback className="bg-orange-500 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{account?.npub ? account.npub.slice(0, 16) + '...' : "Not logged in"}</p>
                <p className="text-sm text-muted-foreground">
                  {account ? "Nostr Account" : "Tap to sign in"}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-sm font-medium mb-3">Navigation</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  🏠 Home
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  💪 Workouts
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  📊 Progress
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  👥 Community
                </Button>
              </div>
            </div>

            {/* Gym Personality Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Gym Personality</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  💪 Hardcore
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🧘 Zen
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🏢 Corporate
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ✨ Boutique
                </Button>
              </div>
            </div>

            {/* Nostr Settings Section */}
            {account && (
              <div>
                <h3 className="text-sm font-medium mb-3">Nostr Settings</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    🔑 Manage Keys
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    🔗 Relay Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    👤 Profile Settings
                  </Button>
                </div>
              </div>
            )}

            {/* App Settings */}
            <div>
              <h3 className="text-sm font-medium mb-3">App Settings</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📱 Notifications
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  📊 Data & Privacy
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Centered title */}
      <h1 className="text-xl font-bold text-foreground truncate mx-4 flex-1 text-center">{title}</h1>
      
      {/* Right side - Settings icon */}
      <Button variant="ghost" size="icon" className="text-orange-500">
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  );
}
