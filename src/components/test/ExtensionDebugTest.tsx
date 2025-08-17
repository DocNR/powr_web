/**
 * Extension Debug Test Component
 * 
 * Helps debug NIP-07 extension detection issues with nostr-login
 * and test all authentication methods.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useNip07Login, useNip46Login, useReadOnlyLogin, useLogin, useLogout } from '@/lib/auth/hooks';
import { triggerLogin } from '@/lib/auth/nostrLoginBridge';

export default function ExtensionDebugTest() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const account = useAccount();
  const nip07Login = useNip07Login();
  const nip46Login = useNip46Login();
  const readOnlyLogin = useReadOnlyLogin();
  const generalLogin = useLogin();
  const logout = useLogout();

  // Debug extension detection
  useEffect(() => {
    const checkExtension = () => {
      const info = {
        windowNostr: typeof window !== 'undefined' && !!window.nostr,
        nostrMethods: typeof window !== 'undefined' && window.nostr ? Object.keys(window.nostr) : [],
        getPublicKey: typeof window !== 'undefined' && !!window.nostr?.getPublicKey,
        signEvent: typeof window !== 'undefined' && !!window.nostr?.signEvent,
        nip04: typeof window !== 'undefined' && !!window.nostr?.nip04,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
      console.log('[ExtensionDebugTest] Extension detection info:', info);
    };

    checkExtension();
    
    // Check again after a delay in case extension loads slowly
    const timer = setTimeout(checkExtension, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testDirectExtension = async () => {
    addTestResult('Testing direct extension access...');
    
    if (!window.nostr) {
      addTestResult('❌ window.nostr not available');
      return;
    }

    try {
      const pubkey = await window.nostr.getPublicKey();
      addTestResult(`✅ Direct extension success - pubkey: ${pubkey.slice(0, 16)}...`);
      
      // Test signing
      const testEvent = {
        kind: 1,
        content: 'Test from POWR PWA',
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        pubkey: pubkey // Add pubkey to test event
      };
      
      const signedEvent = await window.nostr.signEvent(testEvent);
      addTestResult(`✅ Direct signing success - event ID: ${signedEvent.id?.slice(0, 16) || 'no-id'}...`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addTestResult(`❌ Direct extension failed: ${errorMessage}`);
    }
  };

  const testNostrLoginExtension = () => {
    addTestResult('Testing nostr-login extension flow...');
    nip07Login();
  };

  const testNostrLoginConnect = () => {
    addTestResult('Testing nostr-login connect flow...');
    nip46Login();
  };

  const testNostrLoginReadOnly = () => {
    addTestResult('Testing nostr-login read-only flow...');
    readOnlyLogin();
  };

  const testNostrLoginWelcome = () => {
    addTestResult('Testing nostr-login welcome screen...');
    generalLogin();
  };

  const testDirectTrigger = (screen: string) => {
    addTestResult(`Testing direct trigger: ${screen}`);
    triggerLogin(screen as 'welcome' | 'signup' | 'login' | 'connect' | 'extension' | 'readOnly');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Extension Debug Test</h2>
      
      {/* Current Auth Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Current Authentication Status</h3>
        {account ? (
          <div>
            <p>✅ Authenticated</p>
            <p>Method: {account.method}</p>
            <p>Pubkey: {account.pubkey.slice(0, 16)}...</p>
            <p>Npub: {account.npub?.slice(0, 16)}...</p>
          </div>
        ) : (
          <p>❌ Not authenticated</p>
        )}
      </div>

      {/* Extension Detection Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Extension Detection Debug</h3>
        <pre className="text-sm bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4">Authentication Tests</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={testDirectExtension}
            className="p-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Direct Extension
          </button>
          
          <button 
            onClick={testNostrLoginExtension}
            className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test nostr-login Extension
          </button>
          
          <button 
            onClick={testNostrLoginConnect}
            className="p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test nostr-login Connect
          </button>
          
          <button 
            onClick={testNostrLoginReadOnly}
            className="p-3 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Test nostr-login Read-Only
          </button>
          
          <button 
            onClick={testNostrLoginWelcome}
            className="p-3 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Test nostr-login Welcome
          </button>
          
          <button 
            onClick={logout}
            className="p-3 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Direct Trigger Tests */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4">Direct Trigger Tests</h3>
        <div className="grid grid-cols-3 gap-2">
          {['welcome', 'signup', 'login', 'connect', 'extension', 'readOnly'].map(screen => (
            <button 
              key={screen}
              onClick={() => testDirectTrigger(screen)}
              className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
            >
              Trigger {screen}
            </button>
          ))}
        </div>
      </div>

      {/* Test Results Log */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Test Results</h3>
        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {testResults.length === 0 ? (
            <p>No test results yet. Click buttons above to run tests.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))
          )}
        </div>
        <button 
          onClick={() => setTestResults([])}
          className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      {/* Manual Extension Check */}
      <div className="mb-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Manual Extension Check</h3>
        <p className="text-sm mb-2">
          If you have nos2x installed, you should see window.nostr available above.
          If not, check:
        </p>
        <ul className="text-sm list-disc list-inside">
          <li>nos2x extension is installed and enabled</li>
          <li>Extension has permission to run on localhost</li>
          <li>Extension is not blocked by browser security settings</li>
          <li>Try refreshing the page after enabling the extension</li>
        </ul>
      </div>
    </div>
  );
}
