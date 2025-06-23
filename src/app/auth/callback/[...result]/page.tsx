'use client';

/**
 * Amber Authentication Callback Page (Dynamic Route)
 * 
 * Handles NIP-55 callbacks where Amber appends the result directly to the URL path.
 * Example: /auth/callback/3129509e23d3a6125e1451a5912dbe01099e151726c4766b44e1ecb8c846f506
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useLoginWithAmber } from '@/lib/auth/hooks';

export default function AmberCallbackDynamic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const loginWithAmber = useLoginWithAmber();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Amber authentication...');
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Wait for component to mount
    const processAmberResponse = async () => {
      try {
        const debugInfo = { 
          params, 
          searchParams: Object.fromEntries(searchParams.entries()),
          currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR'
        };
        console.log('[Amber Callback] Received params:', debugInfo);
        
        // Also log to server console for debugging
        if (typeof window !== 'undefined') {
          fetch('/api/debug-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: 'amber-callback', 
              data: debugInfo 
            })
          }).catch(() => {}); // Ignore errors
        }
        
        // Method 1: Extract result from URL path (NIP-55 standard)
        let result: string | null = null;
        
        if (params.result && Array.isArray(params.result) && params.result.length > 0) {
          // Amber appends result to path: /auth/callback/[result]
          result = params.result[0];
          console.log('[Amber Callback] Found result in URL path:', result);
        }
        
        // Method 2: Extract from full URL if rewrite didn't capture properly
        if (!result || result.length < 10) {
          const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
          const match = currentUrl.match(/\/auth\/callback([a-fA-F0-9]{64})/);
          if (match) {
            result = match[1];
            console.log('[Amber Callback] Extracted from full URL:', result);
          }
        }
        
        // Method 3: Fallback to query parameters (alternative format)
        if (!result) {
          result = searchParams.get('result') || searchParams.get('event') || searchParams.get('signature');
          console.log('[Amber Callback] Found result in query params:', result);
        }
        
        if (result) {
          // Log the exact result for debugging
          console.log('[Amber Callback] Raw result:', result);
          console.log('[Amber Callback] Result length:', result.length);
          console.log('[Amber Callback] Result type:', typeof result);
          
          // More flexible validation - accept any non-empty string
          if (result.length > 0) {
            // Check if it looks like a hex pubkey (64 chars)
            if (/^[a-fA-F0-9]{64}$/.test(result)) {
              setPubkey(result);
              setStatus('success');
              setMessage('Successfully received public key from Amber!');
              console.log('[Amber Callback] Valid pubkey received:', result);
            } else {
              // Accept any other format and try to use it
              setPubkey(result);
              setStatus('success');
              setMessage(`Successfully received response from Amber! (${result.length} chars)`);
              console.log('[Amber Callback] Non-standard format received:', result);
            }
          } else {
            setStatus('error');
            setMessage('Empty response from Amber. Please try again.');
            console.warn('[Amber Callback] Empty result received');
          }
        } else {
          setStatus('error');
          setMessage('No response received from Amber. Please try again.');
          console.warn('[Amber Callback] No result found in URL or query params');
        }
        
      } catch (error) {
        console.error('[Amber Callback] Error processing response:', error);
        setStatus('error');
        setMessage('Failed to process Amber response. Please try again.');
      }
    };

    processAmberResponse();
  }, [mounted, params, searchParams]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleReturnToLogin = () => {
    router.push('/');
  };

  const handleCreateAmberConnection = async () => {
    if (!pubkey) return;
    
    setIsConnecting(true);
    try {
      console.log('[Amber Callback] Creating Amber authentication with pubkey:', pubkey);
      
      // Use the proper Amber authentication hook
      const result = await loginWithAmber(pubkey);
      
      if (result.success) {
        // Also store in localStorage for persistence
        localStorage.setItem('amber_pubkey', pubkey);
        localStorage.setItem('auth_method', 'amber');
        
        setMessage('Amber authentication successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMessage(`Authentication failed: ${result.error?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('[Amber Callback] Failed to create Amber connection:', error);
      setMessage('Failed to establish connection. You can copy the pubkey and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            📱
          </div>
          POWR × Amber
        </Link>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
              
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </CardTitle>
            <CardDescription>
              {message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {pubkey && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Key from Amber:</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                    {pubkey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(pubkey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {pubkey && (
                <Button 
                  onClick={handleCreateAmberConnection}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Continue with Amber Connection
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={handleReturnToLogin}
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
            
            {status === 'success' && pubkey && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Next Steps:</strong></p>
                <p>1. Your Amber app provided the public key</p>
                <p>2. You can now use this for authentication</p>
                <p>3. Future signing requests will go through Amber</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-xs text-muted-foreground">
                <p><strong>Troubleshooting:</strong></p>
                <p>• Make sure Amber is installed and updated</p>
                <p>• Try the connection again from the main page</p>
                <p>• Use manual bunker URL as fallback</p>
                <p>• Check that you approved the request in Amber</p>
              </div>
            )}
            
            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-muted-foreground">
                <summary>Debug Info</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify({
                    params: params,
                    searchParams: Object.fromEntries(searchParams.entries()),
                    currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR'
                  }, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
