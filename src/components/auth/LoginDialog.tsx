'use client';

/**
 * Login Dialog Component for POWR Workout PWA
 * 
 * RESTORED: Original clean 3-button design with smooth authentication flows.
 * Uses direct NDK operations for NIP-07 and ephemeral login.
 * Uses nostr-login only for NIP-46 remote signing.
 * 
 * Design:
 * - Connect Extension (primary - direct NIP-07)
 * - Try Demo (secondary - direct ephemeral)
 * - Advanced Options (collapsible - NIP-46 via nostr-login)
 */

import { useState, ReactNode, useEffect } from 'react';
import { LogIn, Puzzle, Cable, RotateCw, AlertTriangle, Zap } from 'lucide-react';

// UI Components
import { Button } from '@/components/powr-ui/primitives/Button';
import { Input } from '@/components/powr-ui/primitives/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Authentication hooks - using restored smooth implementations
import { 
  useNip07Login, 
  useNip46Login, 
  useEphemeralLogin,
  useNip07Available,
  useIsAuthenticated 
} from '@/lib/auth/hooks';
import type { AuthenticationError } from '@/lib/auth/types';

interface LoginDialogProps {
  trigger?: ReactNode;
  isCompact?: boolean;
  onSuccess?: () => void;
  defaultOpen?: boolean;
}

export function LoginDialog({ trigger, isCompact = false, onSuccess, defaultOpen = false }: LoginDialogProps) {
  const [remoteSigner, setRemoteSigner] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<AuthenticationError | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  const nip07Login = useNip07Login();
  const nip46Login = useNip46Login();
  const ephemeralLogin = useEphemeralLogin();
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

  async function handleNip07Login() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      // Use restored smooth NIP-07 implementation
      const result = await nip07Login();
      
      if (!result.success && result.error) {
        setError({
          code: 'NIP07_PERMISSION_DENIED',
          message: result.error,
        });
      }
    } catch (err) {
      console.error('[Login Dialog] NIP-07 error:', err);
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleNip46Login() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      // Use nostr-login for NIP-46 (the reliable option)
      const result = nip46Login();
      
      if (!result.success && result.error) {
        setError({
          code: 'NIP46_CONNECTION_FAILED',
          message: result.error,
        });
      }
    } catch (err) {
      console.error('[Login Dialog] NIP-46 error:', err);
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleEphemeralLogin() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      // Use restored smooth ephemeral implementation
      const result = await ephemeralLogin();
      
      if (!result.success && result.error) {
        setError({
          code: 'EPHEMERAL_GENERATION_FAILED',
          message: result.error,
        });
      }
    } catch (err) {
      console.error('[Login Dialog] Ephemeral login error:', err);
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to generate demo account. Please try again.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  function onOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setRemoteSigner('');
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
                {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Primary Options - Clean 3-button design */}
          <div className="flex flex-col gap-3">
            {/* Browser Extension - Direct NIP-07 */}
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

            {/* Demo Mode - Direct Ephemeral */}
            <Button
              variant="outline"
              disabled={isLoggingIn}
              onClick={handleEphemeralLogin}
              className="w-full h-12"
            >
              {isLoggingIn ? (
                <RotateCw className="animate-spin size-4 mr-2" />
              ) : (
                <Zap className="size-4 mr-2" />
              )}
              Try Demo
            </Button>
          </div>

          {/* Advanced Options - Collapsible NIP-46 */}
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Advanced Options
              <Cable className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="bunker://... or user@domain.com"
                value={remoteSigner}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoteSigner(e.target.value)}
                disabled={isLoggingIn}
                className="flex-1"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && remoteSigner.trim()) {
                    handleNip46Login();
                  }
                }}
              />
              <Button
                variant="outline"
                disabled={isLoggingIn || !remoteSigner.trim()}
                onClick={handleNip46Login}
                size="icon"
              >
                {isLoggingIn ? (
                  <RotateCw className="animate-spin size-4" />
                ) : (
                  <Cable className="size-4" />
                )}
              </Button>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}
