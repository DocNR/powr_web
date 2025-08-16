'use client';

/**
 * Login Dialog Component for POWR Workout PWA
 * 
 * SIMPLIFIED: Uses nostr-login library for all authentication flows.
 * Maintains compatibility with existing Jotai state management.
 * 
 * Supports:
 * - NIP-07 (browser extensions) 
 * - NIP-46 (remote signing)
 * - Read-only mode (npub only)
 * 
 * SIMPLIFIED: ~600 lines → ~200 lines (70% reduction)
 */

import { useState, ReactNode, useEffect } from 'react';
import { LogIn, Puzzle, Cable, RotateCw, AlertTriangle, Zap, Eye } from 'lucide-react';

// UI Components
import { Button } from '@/components/powr-ui/primitives/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Authentication hooks
import { 
  useNip07Login, 
  useNip46Login, 
  useReadOnlyLogin,
  useLogin,
  useNip07Available,
  useIsAuthenticated 
} from '@/lib/auth/hooks';

interface LoginDialogProps {
  trigger?: ReactNode;
  isCompact?: boolean;
  onSuccess?: () => void;
  defaultOpen?: boolean;
}

export function LoginDialog({ trigger, isCompact = false, onSuccess, defaultOpen = false }: LoginDialogProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  const nip07Login = useNip07Login();
  const nip46Login = useNip46Login();
  const readOnlyLogin = useReadOnlyLogin();
  const generalLogin = useLogin();
  const nip07Available = useNip07Available();
  const isAuthenticated = useIsAuthenticated();

  // Close dialog when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setOpen(false);
      onSuccess?.();
    }
  }, [isAuthenticated, onSuccess]);

  // Clear error when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  function handleNip07Login() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      const result = nip07Login();
      
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[Login Dialog] NIP-07 error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleNip46Login() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      const result = nip46Login();
      
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[Login Dialog] NIP-46 error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleReadOnlyLogin() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      const result = readOnlyLogin();
      
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[Login Dialog] Read-only login error:', err);
      setError('Failed to start read-only mode. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleGeneralLogin() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      const result = generalLogin();
      
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('[Login Dialog] General login error:', err);
      setError('Failed to open login screen. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function onOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setIsLoggingIn(false);
      setError(null);
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            aria-label="Login to POWR"
            className={isCompact ? 'size-8' : 'w-full'}
          >
            {isCompact ? (
              <LogIn className="size-5" />
            ) : (
              <span>Login</span>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to POWR</DialogTitle>
          <DialogDescription>
            Choose your preferred authentication method
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Primary Options - nostr-login handles all UI */}
          <div className="flex flex-col gap-3">
            {/* Browser Extension */}
            <Button
              variant={nip07Available ? "primary-gradient" : "outline"}
              disabled={isLoggingIn || !nip07Available}
              onClick={handleNip07Login}
              className="w-full h-12"
            >
              {isLoggingIn ? (
                <RotateCw className="animate-spin size-4 mr-2" />
              ) : (
                <Puzzle className="size-4 mr-2" />
              )}
              {nip07Available ? 'Connect Extension' : 'Install Extension'}
            </Button>

            {/* Remote Signing (NIP-46) */}
            <Button
              variant="outline"
              disabled={isLoggingIn}
              onClick={handleNip46Login}
              className="w-full h-12"
            >
              {isLoggingIn ? (
                <RotateCw className="animate-spin size-4 mr-2" />
              ) : (
                <Cable className="size-4 mr-2" />
              )}
              Remote Signing
            </Button>

            {/* Read-Only Mode */}
            <Button
              variant="outline"
              disabled={isLoggingIn}
              onClick={handleReadOnlyLogin}
              className="w-full h-12"
            >
              {isLoggingIn ? (
                <RotateCw className="animate-spin size-4 mr-2" />
              ) : (
                <Eye className="size-4 mr-2" />
              )}
              Browse Only
            </Button>

            {/* General Login (Welcome Screen) */}
            <Button
              variant="outline"
              disabled={isLoggingIn}
              onClick={handleGeneralLogin}
              className="w-full h-12"
            >
              {isLoggingIn ? (
                <RotateCw className="animate-spin size-4 mr-2" />
              ) : (
                <Zap className="size-4 mr-2" />
              )}
              More Options
            </Button>
          </div>

          {/* Info about nostr-login */}
          <div className="text-xs text-muted-foreground text-center">
            Powered by nostr-login - battle-tested authentication
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
