'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { useAccount, useLogout } from '@/lib/auth/hooks';
import { ModeToggle } from '@/components/mode-toggle';
import { Logo } from '@/components/ui/logo';

export function Header() {
  const account = useAccount();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 pt-safe">
      <div className="container mx-auto flex h-16 max-w-7xl items-center px-6">
        {/* Navigation Menu Button - Visible on all screen sizes */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-4 px-2 text-base hover:bg-accent focus-visible:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-background border-border">
            <SheetHeader>
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                Access different sections of the POWR workout app
              </SheetDescription>
            </SheetHeader>
            <MobileNav />
          </SheetContent>
        </Sheet>

        {/* Logo - Center */}
        <div className="flex flex-1 items-center justify-center md:justify-start">
          <Link className="flex items-center space-x-3" href="/">
            <Logo width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold tracking-tight">POWR</span>
          </Link>
        </div>

        {/* User Menu - Right side */}
        <div className="flex items-center space-x-2">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border/50 hover:border-border">
                <User className="h-4 w-4" />
                <span className="sr-only">Open user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {account?.method === 'nip07' ? 'Browser Extension' : 'Remote Signer'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {account?.pubkey?.slice(0, 16)}...
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <div className="flex flex-col h-full px-6 py-8">
      {/* Logo Section */}
      <div className="mb-8">
        <Link href="/" className="flex items-center space-x-3">
          <Logo width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold tracking-tight">POWR</span>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Navigation
        </h3>
        <div className="flex flex-col space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center text-base font-medium text-foreground hover:text-primary transition-colors py-3 px-3 rounded-lg hover:bg-accent"
          >
            Dashboard
          </Link>
          <Link
            href="/workouts"
            className="flex items-center text-base font-medium text-foreground hover:text-primary transition-colors py-3 px-3 rounded-lg hover:bg-accent"
          >
            Workouts
          </Link>
          <Link
            href="/templates"
            className="flex items-center text-base font-medium text-foreground hover:text-primary transition-colors py-3 px-3 rounded-lg hover:bg-accent"
          >
            Templates
          </Link>
          <Link
            href="/history"
            className="flex items-center text-base font-medium text-foreground hover:text-primary transition-colors py-3 px-3 rounded-lg hover:bg-accent"
          >
            History
          </Link>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="mt-auto pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          POWR Workout PWA
        </p>
      </div>
    </div>
  );
}
