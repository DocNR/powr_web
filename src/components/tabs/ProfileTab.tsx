'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, Key, Shield } from 'lucide-react';
import { useAccount, useLogout } from '@/lib/auth/hooks';

export function ProfileTab() {
  const account = useAccount();
  const logout = useLogout();

  const handleLogout = async () => {
    console.log('[Profile] Logging out...');
    await logout();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your Nostr identity and connection details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Public Key</label>
              <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                {account.pubkey.slice(0, 16)}...{account.pubkey.slice(-16)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Authentication Method</label>
              <p className="text-sm mt-1 flex items-center gap-2">
                {account.method === 'nip07' ? (
                  <>
                    <Shield className="h-4 w-4 text-green-600" />
                    Browser Extension (NIP-07)
                  </>
                ) : account.method === 'nip46' ? (
                  <>
                    <Key className="h-4 w-4 text-blue-600" />
                    Remote Signer (NIP-46)
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 text-orange-600" />
                    Amber (Android)
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>Customize your workout experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
              </div>
              <Button variant="outline" size="sm">
                Toggle
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Workout reminders</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Key className="h-4 w-4 mr-2" />
              Backup Keys
            </Button>
            {account && (
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {!account && (
        <Card>
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>Sign in to access your profile and sync your workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
