'use client';

/**
 * Enhanced Amber Authentication Callback Page (Dynamic Route)
 * 
 * Handles NIP-55 callbacks with localStorage bridge for PWA/Browser compatibility.
 * Features:
 * - Universal localStorage bridge (works for PWA ↔ Browser communication)
 * - Context-aware user guidance (PWA vs Browser instructions)
 * - Auto-close with professional countdown
 * - Branded POWR experience
 * 
 * Example: /auth/callback/3129509e23d3a6125e1451a5912dbe01099e151726c4766b44e1ecb8c846f506
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Copy, Smartphone, Globe } from 'lucide-react';
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
  const [countdown, setCountdown] = useState(5);
  const [context, setContext] = useState<'pwa' | 'browser'>('browser');

  // Set mounted state and detect context
  useEffect(() => {
    setMounted(true);
    
    // Detect if user likely came from PWA
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
      const isDisplayMode = window.matchMedia('(display-mode: standalone)').matches;
      const isPWAContext = isStandalone || isDisplayMode || referrer.includes('powr-kappa.vercel.app');
      
      setContext(isPWAContext ? 'pwa' : 'browser');
      console.log('[Amber Callback] Detected context:', isPWAContext ? 'PWA' : 'Browser');
    }
  }, []);

  // Enhanced localStorage bridge authentication processing
  useEffect(() => {
    if (!mounted) return;
    
    const processAmberResponse = async () => {
      try {
        const debugInfo = { 
          params, 
          searchParams: Object.fromEntries(searchParams.entries()),
          currentUrl: window.location.href,
          context,
          isPopup: window.opener !== null || window.parent !== window,
          hasOpener: window.opener !== null
        };
        console.log('[Amber Callback] Processing with enhanced localStorage bridge:', debugInfo);
        
        // Log to server for debugging
        fetch('/api/debug-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'amber-callback-enhanced', 
            data: debugInfo 
          })
        }).catch(() => {});
        
        // Extract result from URL path (NIP-55 standard)
        let result: string | null = null;
        
        if (params.result && Array.isArray(params.result) && params.result.length > 0) {
          result = params.result[0];
          console.log('[Amber Callback] Found result in URL path:', result);
        }
        
        // Fallback extraction methods
        if (!result || result.length < 10) {
          const currentUrl = window.location.href;
          const match = currentUrl.match(/\/auth\/callback\/([a-fA-F0-9]{64})/);
          if (match) {
            result = match[1];
            console.log('[Amber Callback] Extracted from full URL:', result);
          }
        }
        
        if (!result) {
          result = searchParams.get('result') || searchParams.get('event') || searchParams.get('signature');
          console.log('[Amber Callback] Found result in query params:', result);
        }
        
        if (result && result.length > 0) {
          console.log('[Amber Callback] Processing result:', result.slice(0, 16) + '...');
          
          // Validate pubkey format
          if (/^[a-fA-F0-9]{64}$/.test(result)) {
            setPubkey(result);
            setStatus('success');
            
            // 🚀 UNIVERSAL LOCALSTORAGE BRIDGE - Works for PWA + Browser
            const authResult = {
              success: true,
              pubkey: result,
              method: 'amber',
              timestamp: Date.now()
            };
            
            console.log('[Amber Callback] Storing auth result in localStorage bridge');
            localStorage.setItem('amber_auth_result', JSON.stringify(authResult));
            
            // Context-aware success message
            const contextMessage = context === 'pwa' 
              ? 'Authentication successful! Return to the POWR app to continue.'
              : 'Authentication successful! Return to your browser tab to continue.';
            
            setMessage(contextMessage);
            
            // Start countdown for auto-close
            let countdownValue = 5;
            setCountdown(countdownValue);
            
            const countdownInterval = setInterval(() => {
              countdownValue--;
              setCountdown(countdownValue);
              
              if (countdownValue <= 0) {
                clearInterval(countdownInterval);
                console.log('[Amber Callback] Auto-closing after countdown');
                window.close();
              }
            }, 1000);
            
            // Also try postMessage for immediate communication (fallback)
            if (window.opener || window.parent !== window) {
              console.log('[Amber Callback] Also sending postMessage for immediate communication');
              
              const messageData = {
                type: 'AMBER_AUTH_RESULT',
                result: authResult
              };
              
              if (window.opener) {
                window.opener.postMessage(messageData, window.location.origin);
              } else if (window.parent !== window) {
                window.parent.postMessage(messageData, window.location.origin);
              }
            }
            
            return; // Success path complete
            
          } else {
            // Accept non-standard format but warn
            setPubkey(result);
            setStatus('success');
            setMessage(`Received response from Amber (${result.length} chars). You can copy and use manually.`);
            console.warn('[Amber Callback] Non-standard format received:', result);
          }
          
        } else {
          // No result found
          setStatus('error');
          setMessage('No response received from Amber. Please try again.');
          console.warn('[Amber Callback] No result found in URL or query params');
          
          // Store error in localStorage bridge
          const errorResult = {
            success: false,
            error: 'No response received from Amber',
            timestamp: Date.now()
          };
          
          localStorage.setItem('amber_auth_result', JSON.stringify(errorResult));
          
          // Auto-close after error display
          setTimeout(() => {
            window.close();
          }, 5000);
        }
        
      } catch (error) {
        console.error('[Amber Callback] Error processing response:', error);
        setStatus('error');
        setMessage('Failed to process Amber response. Please try again.');
        
        // Store error in localStorage bridge
        const errorResult = {
          success: false,
          error: 'Failed to process Amber response',
          timestamp: Date.now()
        };
        
        localStorage.setItem('amber_auth_result', JSON.stringify(errorResult));
        
        setTimeout(() => {
          window.close();
        }, 5000);
      }
    };

    processAmberResponse();
  }, [mounted, params, searchParams, context]);

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
      
      const result = await loginWithAmber(pubkey);
      
      if (result.success) {
        localStorage.setItem('amber_pubkey', pubkey);
        localStorage.setItem('auth_method', 'amber');
        
        setMessage('Amber authentication successful! Redirecting to dashboard...');
        
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

  const handleCloseNow = () => {
    console.log('[Amber Callback] Manual close requested');
    window.close();
  };

  // Context-aware instructions
  const getContextInstructions = () => {
    if (context === 'pwa') {
      return {
        icon: <Smartphone className="h-4 w-4" />,
        text: "Return to the POWR app to continue",
        detail: "Switch back to your POWR app - authentication will be detected automatically"
      };
    } else {
      return {
        icon: <Globe className="h-4 w-4" />,
        text: "Return to your browser tab to continue", 
        detail: "Switch back to your original browser tab - authentication will be detected automatically"
      };
    }
  };

  const contextInstructions = getContextInstructions();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10" suppressHydrationWarning>
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Enhanced Logo */}
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            💪
          </div>
          <span className="text-lg">POWR × Amber</span>
        </Link>
        
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
              
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Authentication Successful!'}
              {status === 'error' && 'Authentication Error'}
            </CardTitle>
            <CardDescription className="text-base">
              {message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Success State with Context-Aware Instructions */}
            {status === 'success' && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
                    {contextInstructions.icon}
                    {contextInstructions.text}
                  </div>
                  <p className="text-sm text-green-600">
                    {contextInstructions.detail}
                  </p>
                </div>

                {/* Auto-close countdown */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-blue-700 font-medium mb-2">
                    Auto-closing in {countdown} seconds...
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    ></div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCloseNow}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Close Now
                  </Button>
                </div>
              </>
            )}

            {/* Pubkey Display */}
            {pubkey && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Key from Amber:</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs break-all font-mono">
                    {pubkey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(pubkey)}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {pubkey && status === 'success' && (
                <Button 
                  onClick={handleCreateAmberConnection}
                  disabled={isConnecting}
                  className="w-full"
                  variant="default"
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
            
            {/* Success Instructions */}
            {status === 'success' && pubkey && (
              <div className="text-xs text-muted-foreground space-y-1 bg-gray-50 p-3 rounded">
                <p><strong>✅ Authentication Complete:</strong></p>
                <p>• Your Amber app provided the public key</p>
                <p>• Authentication data saved for automatic login</p>
                <p>• Future signing requests will go through Amber</p>
                <p>• You can now use POWR with your Nostr identity</p>
              </div>
            )}
            
            {/* Error Troubleshooting */}
            {status === 'error' && (
              <div className="text-xs text-muted-foreground bg-red-50 p-3 rounded border border-red-200">
                <p><strong>🔧 Troubleshooting:</strong></p>
                <p>• Make sure Amber is installed and updated</p>
                <p>• Try the connection again from the main page</p>
                <p>• Check that you approved the request in Amber</p>
                <p>• Use manual bunker URL as fallback option</p>
              </div>
            )}
            
            {/* Debug Info (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">Debug Info</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify({
                    params: params,
                    searchParams: Object.fromEntries(searchParams.entries()),
                    currentUrl: mounted ? window.location.href : 'SSR',
                    context,
                    pubkey: pubkey ? pubkey.slice(0, 16) + '...' : null
                  }, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Powered by <strong>POWR</strong> × <strong>Amber</strong> × <strong>Nostr</strong></p>
          <p>Secure, decentralized authentication</p>
        </div>
      </div>
    </div>
  );
}
