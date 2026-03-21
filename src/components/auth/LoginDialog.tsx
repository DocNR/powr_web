'use client';

/**
 * Login Dialog Component for POWR Workout PWA
 * 
 * MIGRATED: Now uses direct NDK authentication hooks.
 * All authentication methods use direct NDK calls (no nostr-login dependency).
 * 
 * Design:
 * - Connect Extension (primary - direct NIP-07)
 * - Try Demo (secondary - direct ephemeral)
 * - Advanced Options (collapsible - direct NIP-46 with QR code)
 */

import { useState, ReactNode, useEffect } from 'react';
import { LogIn, Puzzle, RotateCw, AlertTriangle, Zap, Copy, Check, ChevronDown } from 'lucide-react';
import QRCode from 'react-qr-code';

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

// Authentication hooks - Direct NDK implementation
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
  mode?: 'modal' | 'inline';
}

export function LoginDialog({ trigger, isCompact = false, onSuccess, defaultOpen = false, mode = 'modal' }: LoginDialogProps) {
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<AuthenticationError | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const [showMobileSigner, setShowMobileSigner] = useState(false);

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

  // Clear error and connection URL when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setConnectionUrl(null);
      setShowMobileSigner(false);
    }
  }, [open]);

  // Auto-generate QR code when mobile signer section opens
  useEffect(() => {
    if (showMobileSigner && open && !connectionUrl && !isLoggingIn) {
      handleNip46Login();
    }
  }, [showMobileSigner, open]);

  // Copy connection string handler
  async function handleCopyConnectionString() {
    if (!connectionUrl) return;
    
    try {
      await navigator.clipboard.writeText(connectionUrl);
      setCopied(true);
      
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = connectionUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  async function handleNip07Login() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      console.log('[Login Dialog] Starting NIP-07 extension authentication...');
      
      // Direct NDK NIP-07 authentication
      const result = await nip07Login();
      
      if (!result.success && result.error) {
        setError({
          code: 'UNKNOWN_ERROR',
          message: result.error,
        });
        setIsLoggingIn(false);
      }
      // Success case: isAuthenticated will change and close dialog automatically
      
    } catch (err) {
      console.error('[Login Dialog] Extension error:', err);
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to authenticate with extension. Please try again.',
      });
      setIsLoggingIn(false);
    }
  }

  async function handleNip46Login() {
    try {
      setIsLoggingIn(true);
      setError(null);
      setConnectionUrl(null);
      
      console.log('[Login Dialog] Starting NIP-46 mobile signer authentication...');
      
      // Direct NDK NIP-46 authentication - generates QR code with DEFAULT_RELAYS
      const result = await nip46Login((url: string) => {
        console.log('[Login Dialog] QR Code URL received');
        setConnectionUrl(url);
      });
      
      if (!result.success && result.error) {
        setError({
          code: 'NIP46_CONNECTION_FAILED',
          message: result.error,
        });
        setIsLoggingIn(false);
        setConnectionUrl(null);
      }
      // Success case: isAuthenticated will change and close dialog automatically
      
    } catch (err) {
      console.error('[Login Dialog] NIP-46 error:', err);
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      });
      setIsLoggingIn(false);
      setConnectionUrl(null);
    }
  }

  async function handleEphemeralLogin() {
    try {
      setIsLoggingIn(true);
      setError(null);
      
      console.log('[Login Dialog] Starting ephemeral demo authentication...');
      
      // Direct NDK ephemeral authentication
      const result = await ephemeralLogin();
      
      if (!result.success && result.error) {
        setError({
          code: 'EPHEMERAL_GENERATION_FAILED',
          message: result.error,
        });
        setIsLoggingIn(false);
      }
      // Success case: isAuthenticated will change and close dialog automatically
      
    } catch (err) {
      console.error('[Login Dialog] Ephemeral login error:', err);
      setError({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to generate demo account. Please try again.',
      });
      setIsLoggingIn(false);
    }
  }

  function onOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setConnectionUrl(null);
      setIsLoggingIn(false);
      setError(null);
    }
    setOpen(newOpen);
  }

  const loginFormContent = (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <Button
          variant={nip07Available ? "primary-gradient" : "secondary"}
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

        <Button
          variant="secondary"
          disabled={isLoggingIn}
          onClick={() => setShowMobileSigner(!showMobileSigner)}
          className="w-full h-12"
        >
          <ChevronDown className={`size-4 mr-2 transition-transform ${showMobileSigner ? 'rotate-180' : ''}`} />
          Mobile Signer
        </Button>

        <Button
          variant="ghost"
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

      {showMobileSigner && (
        <div className="flex flex-col gap-3">
          {isLoggingIn && !connectionUrl && (
            <div className="flex items-center justify-center p-8">
              <RotateCw className="animate-spin size-8 text-[var(--color-primary)]" />
            </div>
          )}
          {connectionUrl && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-[var(--color-on-surface-variant)] text-center">
                Scan QR code with your mobile signer (Primal, Amber, etc.)
              </div>
              <div className="bg-[var(--color-surface-elevated)] p-4 rounded-[var(--radius)] flex items-center justify-center">
                <QRCode value={connectionUrl} size={200} />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyConnectionString}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="size-4 mr-2 text-[var(--color-secondary)]" />
                    Copied! Paste in your signer app
                  </>
                ) : (
                  <>
                    <Copy className="size-4 mr-2" />
                    Copy Connection String
                  </>
                )}
              </Button>
              {isLoggingIn && (
                <div className="flex flex-col items-center gap-2 text-sm text-[var(--color-on-surface-variant)]">
                  <RotateCw className="animate-spin size-5 text-[var(--color-primary)]" />
                  <span>Approve connection in your signer app</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (mode === 'inline') {
    return (
      <div className="bg-[var(--color-surface-card)] rounded-[var(--radius)] border-l-[3px] border-l-[var(--color-primary)] p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-[var(--color-on-surface)] mb-1">Connect to POWR</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">Choose your preferred authentication method</p>
        {loginFormContent}
      </div>
    );
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
      <DialogContent className="sm:max-w-md bg-[var(--color-surface-card)] rounded-[var(--radius)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-on-surface)]">Connect to POWR</DialogTitle>
          <DialogDescription className="text-[var(--color-on-surface-variant)]">
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

          {/* Primary Options - Clean 2-button design */}
          <div className="flex flex-col gap-3">
            {/* Browser Extension - Direct NIP-07 */}
            <Button
              variant={nip07Available ? "primary-gradient" : "secondary"}
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
              variant="ghost"
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

          {/* Mobile Signer - Controlled collapsible with auto-QR generation */}
          <div className="pt-4 mt-2">
            <button
              type="button"
              onClick={() => setShowMobileSigner(!showMobileSigner)}
              className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Mobile Signer</span>
              <ChevronDown className={`size-4 transition-transform ${showMobileSigner ? 'rotate-180' : ''}`} />
            </button>
            
            {showMobileSigner && (
              <div className="mt-3 flex flex-col gap-3">
                {isLoggingIn && !connectionUrl && (
                  <div className="flex items-center justify-center p-8">
                    <RotateCw className="animate-spin size-8" />
                  </div>
                )}

                {connectionUrl && (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-muted-foreground text-center">
                      Scan QR code with your mobile signer (Primal, Amber, etc.)
                    </div>
                    <div className="bg-[var(--color-surface-elevated)] p-4 rounded-[var(--radius)] flex items-center justify-center">
                      <QRCode value={connectionUrl} size={200} />
                    </div>
                    
                    {/* Copy Button */}
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-muted-foreground text-center">
                        Or copy connection string:
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyConnectionString}
                        className="w-full"
                      >
                        {copied ? (
                          <>
                            <Check className="size-4 mr-2 text-green-500" />
                            ✓ Copied! Paste in your signer app
                          </>
                        ) : (
                          <>
                            <Copy className="size-4 mr-2" />
                            Copy Connection String
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {isLoggingIn && (
                      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <RotateCw className="animate-spin size-5" />
                        <span>⏳ Approve connection in your signer app</span>
                        <span className="text-xs">(Primal, Amber, or other NIP-46 signers)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
