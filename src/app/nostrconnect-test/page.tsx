'use client';

import { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { Copy, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import NDK, { NDKPrivateKeySigner, NDKNip46Signer } from '@nostr-dev-kit/ndk';
import { nip19 } from 'nostr-tools';
import type { NostrConnectSession } from '@/lib/auth/types';

interface TestState {
  phase: 'idle' | 'generating' | 'waiting' | 'connected' | 'error';
  nostrConnectURI: string;
  session: NostrConnectSession | null;
  userPubkey: string;
  error: string;
  logs: string[];
}

export default function NostrConnectTestPage() {
  const [state, setState] = useState<TestState>({
    phase: 'idle',
    nostrConnectURI: '',
    session: null,
    userPubkey: '',
    error: '',
    logs: []
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, `[${timestamp}] ${message}`]
    }));
  };

  const generateRandomSecret = (): string => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const generateNostrConnectURI = (clientPubkey: string, relays: string[]): { uri: string; secret: string } => {
    const secret = generateRandomSecret();
    
    // Use the actual deployment URL for testing
    const appUrl = window.location.hostname === 'localhost' 
      ? 'https://powr-git-feature-nostrconnect-session-pe-2725ba-docnrs-projects.vercel.app'  // Use actual branch deployment URL
      : window.location.origin;
    
    const params = new URLSearchParams({
      relay: relays[0],
      secret,
      perms: 'sign_event,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt',
      name: 'POWR Workout PWA Test',
      url: appUrl
    });
    
    relays.slice(1).forEach(relay => params.append('relay', relay));
    
    return {
      uri: `nostrconnect://${clientPubkey}?${params.toString()}`,
      secret
    };
  };

  const handleGenerateURI = async () => {
    setState(prev => ({ ...prev, phase: 'generating', error: '', logs: [] }));
    addLog('Starting NostrConnect URI generation...');

    try {
      // Generate client keypair for this session
      addLog('Generating client keypair...');
      const clientSigner = NDKPrivateKeySigner.generate();
      const clientUser = await clientSigner.user();
      addLog(`Client pubkey: ${clientUser.pubkey.slice(0, 16)}...`);

      // Generate nostrconnect:// URI with better relay selection
      const relays = [
        'wss://relay.nsec.app',
        'wss://relay.damus.io', 
        'wss://relay.nostr.band',
        'wss://nos.lol'
      ];
      addLog(`Using relays: ${relays.join(', ')}`);
      
      // Debug URL detection
      const hostname = window.location.hostname;
      const origin = window.location.origin;
      const isLocalhost = hostname === 'localhost';
      
      addLog(`🌐 URL Detection Debug:`);
      addLog(`  hostname: ${hostname}`);
      addLog(`  origin: ${origin}`);
      addLog(`  isLocalhost: ${isLocalhost}`);
      
      const { uri, secret } = generateNostrConnectURI(clientUser.pubkey, relays);
      
      // CRITICAL DEBUG: Force console output that can't be missed
      console.log('🚨 CRITICAL DEBUG - URI Generated:', uri.length, 'chars');
      console.log('🚨 CRITICAL DEBUG - Full URI:', uri);
      
      // Extract and log the URL parameter from the URI
      const uriParams = new URLSearchParams(uri.split('?')[1]);
      const urlParam = uriParams.get('url');
      
      console.log('🚨 CRITICAL DEBUG - URL Parameter:', urlParam);
      console.log('🚨 CRITICAL DEBUG - Window Location:', window.location.href);
      
      addLog(`🔗 NostrConnect URI Details:`);
      addLog(`  Total length: ${uri.length} chars`);
      addLog(`  URL parameter: ${urlParam}`);
      addLog(`  Full URI: ${uri}`);

      // Store session for persistence
      const session: NostrConnectSession = {
        nostrConnectURI: uri,
        clientPrivateKey: clientSigner.privateKey!,
        clientPubkey: clientUser.pubkey,
        secret,
        lastConnected: Date.now(),
        relays
      };

      localStorage.setItem('nostr_connect_session', JSON.stringify(session));
      addLog('Session stored in localStorage');

      setState(prev => ({
        ...prev,
        phase: 'waiting',
        nostrConnectURI: uri,
        session
      }));

      addLog('URI generation complete - ready for nsec.app authorization');
      
      // Start polling for connection completion
      startPolling(session);

    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const startPolling = (session: NostrConnectSession) => {
    addLog('Starting connection polling...');
    let pollCount = 0;
    let sharedNDK: NDK | null = null; // Reuse NDK instance
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        addLog(`Polling attempt ${pollCount}...`);
        
        // Recreate client signer
        const clientSigner = new NDKPrivateKeySigner(session.clientPrivateKey);
        const clientUser = await clientSigner.user();
        addLog(`Client signer created for pubkey: ${clientUser.pubkey.slice(0, 16)}...`);
        
        // Use production NDK singleton that already has working connections
        if (!sharedNDK) {
          addLog('Getting production NDK singleton with working relay connections...');
          
          const { getNDKInstance } = await import('@/lib/ndk');
          const productionNDK = getNDKInstance();
          
          if (!productionNDK) {
            addLog('❌ Production NDK not available - initializing...');
            const { ensureNDKInitialized } = await import('@/lib/ndk');
            sharedNDK = await ensureNDKInitialized();
          } else {
            sharedNDK = productionNDK;
            addLog('✅ Using production NDK singleton');
          }
          
          // Detailed relay status debugging
          addLog('🔍 Debugging relay connections...');
          addLog(`Total relays in pool: ${sharedNDK.pool.relays.size}`);
          
          const relayDetails = Array.from(sharedNDK.pool.relays.entries()).map(([url, relay]) => {
            const typedRelay = relay as { 
              connectivity: { status: number }; 
              url: string;
              connected: boolean;
            };
            return {
              url,
              status: typedRelay.connectivity.status,
              connected: typedRelay.connected,
              statusText: typedRelay.connectivity.status === 1 ? 'connected' : 
                         typedRelay.connectivity.status === 0 ? 'connecting' : 'disconnected'
            };
          });
          
          addLog('Relay details:');
          relayDetails.forEach(({ url, status, connected, statusText }) => {
            addLog(`  ${url}: status=${status}, connected=${connected}, text=${statusText}`);
          });
          
          const connectedRelays = relayDetails.filter(r => r.status === 1 || r.connected);
          addLog(`Connected relays: ${connectedRelays.length} of ${relayDetails.length}`);
          
          if (connectedRelays.length === 0) {
            addLog('⚠️ No relay connections detected - checking if this is a timing issue...');
            
            // Wait a bit and check again
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const recheckDetails = Array.from(sharedNDK.pool.relays.entries()).map(([url, relay]) => {
              const typedRelay = relay as { 
                connectivity: { status: number }; 
                connected: boolean;
              };
              return {
                url,
                status: typedRelay.connectivity.status,
                connected: typedRelay.connected
              };
            });
            
            const recheckConnected = recheckDetails.filter(r => r.status === 1 || r.connected);
            addLog(`After 3s wait: ${recheckConnected.length} relays connected`);
            
            if (recheckConnected.length === 0) {
              addLog('❌ Still no relay connections - this might be a localhost issue');
              addLog('💡 Suggestion: Try deploying to production URL for testing');
              
              // Continue anyway to test the NIP-46 flow
              addLog('🔄 Continuing with NIP-46 test anyway...');
            } else {
              addLog(`✅ Found ${recheckConnected.length} connected relays after wait`);
            }
          } else {
            addLog(`✅ Found ${connectedRelays.length} connected relays immediately`);
          }
        }
        
        const ndk = sharedNDK; // Use the production NDK instance
        
        // Create NIP-46 signer using stored session
        addLog('Creating NIP-46 signer...');
        addLog(`🔗 NostrConnect URI: ${session.nostrConnectURI.slice(0, 100)}...`);
        
        const signer = new NDKNip46Signer(
          ndk,
          session.nostrConnectURI,
          clientSigner
        );
        
        addLog('Waiting for NIP-46 connection...');
        
        // Add event listeners to debug the signer
        signer.on('authUrl', (url) => {
          addLog(`🔐 Auth URL received: ${url}`);
        });
        
        signer.on('ready', () => {
          addLog('🎉 NIP-46 signer ready!');
        });
        
        // Check if bunker pubkey is set
        const signerInternal = signer as unknown as { bunkerPubkey?: string; remoteUser?: { pubkey: string } };
        addLog(`🔍 Bunker pubkey before blockUntilReady: ${signerInternal.bunkerPubkey || 'NOT SET'}`);
        addLog(`🔍 Remote user before blockUntilReady: ${signerInternal.remoteUser?.pubkey || 'NOT SET'}`);
        
        // Wait for connection to complete (with timeout)
        const user = await Promise.race([
          signer.blockUntilReady(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000);
          })
        ]);
        
        if (user?.pubkey) {
          clearInterval(pollInterval);
          addLog(`🎉 Connection successful! User pubkey: ${user.pubkey.slice(0, 16)}...`);
          addLog(`Full user pubkey: ${user.pubkey}`);
          
          // Update session with user pubkey
          session.userPubkey = user.pubkey;
          session.lastConnected = Date.now();
          localStorage.setItem('nostr_connect_session', JSON.stringify(session));
          
          setState(prev => ({
            ...prev,
            phase: 'connected',
            userPubkey: user.pubkey,
            session
          }));
          
          addLog('Session updated with user pubkey');
          
          // No cleanup needed - using singleton NDK instance
        } else {
          addLog('blockUntilReady returned but no user pubkey found');
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        // Log all errors during polling for debugging
        if (errorMsg.includes('timeout')) {
          addLog(`⏱️ Polling timeout (attempt ${pollCount})`);
        } else if (errorMsg.includes('connect')) {
          addLog(`🔌 Connection error: ${errorMsg}`);
        } else {
          addLog(`❌ Polling error: ${errorMsg}`);
        }
        
        // No cleanup needed - using singleton NDK instance
      }
    }, 5000); // Increased to 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (state.phase === 'waiting') {
        addLog('⏰ Polling timeout - stopped after 10 minutes');
      }
    }, 10 * 60 * 1000);
  };

  const testAutoLogin = async () => {
    addLog('🔄 Testing auto-login with stored session...');
    
    try {
      const stored = localStorage.getItem('nostr_connect_session');
      if (!stored) {
        addLog('❌ No stored session found');
        return;
      }
      
      const session: NostrConnectSession = JSON.parse(stored);
      addLog(`📋 Found session for client: ${session.clientPubkey.slice(0, 16)}...`);
      
      if (!session.userPubkey) {
        addLog('⚠️ Session not completed yet - no user pubkey');
        return;
      }
      
      addLog(`👤 Expected user pubkey: ${session.userPubkey.slice(0, 16)}...`);
      addLog('🔌 Attempting reconnection...');
      
      // Recreate client signer from stored private key
      const clientSigner = new NDKPrivateKeySigner(session.clientPrivateKey);
      const clientUser = await clientSigner.user();
      addLog(`🔑 Client signer recreated for: ${clientUser.pubkey.slice(0, 16)}...`);
      
      // Create bunker NDK for communication
      const bunkerNDK = new NDK({
        explicitRelayUrls: session.relays,
        signer: clientSigner,
        // Use same settings as production app to fix connection issues
        enableOutboxModel: true,
        initialValidationRatio: 0.0,  // Don't wait for multiple relays to validate
        lowestValidationRatio: 0.0,   // Accept events from first responding relay
        autoConnectUserRelays: false, // Prevent auto connections that block
        autoFetchUserMutelist: false, // Prevent auto fetches that block
        clientName: 'POWR-NostrConnect-AutoLogin'
      });
      
      addLog('🌐 Connecting to relays...');
      await bunkerNDK.connect();
      
      // Check relay connections
      const connectedRelays = Array.from(bunkerNDK.pool.relays.values())
        .filter(relay => relay.connectivity.status === 1)
        .map(relay => relay.url);
      
      addLog(`✅ Connected to ${connectedRelays.length} relays: ${connectedRelays.join(', ')}`);
      
      if (connectedRelays.length === 0) {
        addLog('❌ No relay connections for auto-login');
        return;
      }
      
      // Create NIP-46 signer using stored session
      addLog('🔐 Creating NIP-46 signer for auto-login...');
      const signer = new NDKNip46Signer(
        bunkerNDK,
        session.nostrConnectURI,
        clientSigner
      );
      
      addLog('⏳ Waiting for auto-login connection...');
      
      // Wait for reconnection
      const user = await Promise.race([
        signer.blockUntilReady(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auto-login timeout after 20s')), 20000);
        })
      ]);
      
      if (user?.pubkey) {
        addLog(`🔍 Received user pubkey: ${user.pubkey.slice(0, 16)}...`);
        
        if (user.pubkey === session.userPubkey) {
          addLog('🎉 Auto-login successful!');
          
          // Update session timestamp
          session.lastConnected = Date.now();
          localStorage.setItem('nostr_connect_session', JSON.stringify(session));
          
          setState(prev => ({
            ...prev,
            phase: 'connected',
            userPubkey: user.pubkey,
            session
          }));
        } else {
          addLog(`❌ Auto-login failed - pubkey mismatch!`);
          addLog(`Expected: ${session.userPubkey}`);
          addLog(`Received: ${user.pubkey}`);
        }
      } else {
        addLog('❌ Auto-login failed - no user returned from blockUntilReady');
      }
      
      // Clean up
      // NDK will handle relay cleanup automatically
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Auto-login error: ${errorMsg}`);
    }
  };

  const clearSession = () => {
    localStorage.removeItem('nostr_connect_session');
    setState({
      phase: 'idle',
      nostrConnectURI: '',
      session: null,
      userPubkey: '',
      error: '',
      logs: []
    });
    addLog('Session cleared');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(state.nostrConnectURI);
      addLog('URI copied to clipboard');
    } catch {
      addLog('Failed to copy to clipboard');
    }
  };

  const copyLogsToClipboard = async () => {
    try {
      const logsText = state.logs.join('\n');
      await navigator.clipboard.writeText(logsText);
      addLog('Logs copied to clipboard');
    } catch {
      addLog('Failed to copy logs to clipboard');
    }
  };

  const getPhaseIcon = () => {
    switch (state.phase) {
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'waiting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getPhaseColor = () => {
    switch (state.phase) {
      case 'generating':
        return 'blue';
      case 'waiting':
        return 'yellow';
      case 'connected':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">NostrConnect Test</h1>
          <p className="text-muted-foreground">
            Test NostrConnect URI generation and session persistence
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status
              {getPhaseIcon()}
              <Badge variant="outline" className={`text-${getPhaseColor()}-600`}>
                {state.phase}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateURI}
                disabled={state.phase === 'generating' || state.phase === 'waiting'}
              >
                Generate NostrConnect URI
              </Button>
              
              <Button 
                onClick={testAutoLogin}
                variant="outline"
                disabled={state.phase === 'generating'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Auto-Login
              </Button>
              
              <Button 
                onClick={clearSession}
                variant="outline"
              >
                Clear Session
              </Button>
            </div>

            {state.userPubkey && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Connected!</p>
                <p className="text-xs text-green-600">
                  User: {nip19.npubEncode(state.userPubkey)}
                </p>
              </div>
            )}

            {state.error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-xs text-red-600">{state.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {state.nostrConnectURI && (
          <Card>
            <CardHeader>
              <CardTitle>NostrConnect URI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy this URI and paste it into nsec.app to authorize the connection:
              </p>
              
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-muted rounded text-xs break-all font-mono">
                  {state.nostrConnectURI}
                </code>
                <Button size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {state.phase === 'waiting' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for authorization... Complete the connection in nsec.app
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Session Data</CardTitle>
          </CardHeader>
          <CardContent>
            {state.session ? (
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify({
                  clientPubkey: state.session.clientPubkey,
                  secret: state.session.secret,
                  userPubkey: state.session.userPubkey,
                  lastConnected: new Date(state.session.lastConnected).toISOString(),
                  relays: state.session.relays,
                  uriLength: state.session.nostrConnectURI.length
                }, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No session data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Activity Log
              {state.logs.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={copyLogsToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Logs
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {state.logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                <div className="space-y-1">
                  {state.logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
