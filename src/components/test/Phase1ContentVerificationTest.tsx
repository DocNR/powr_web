/**
 * Phase 1 Content Verification Test Component
 * 
 * Verifies that Phase 1 test content is accessible with current authentication
 * before removing mock data from loadTemplateActor.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount, usePubkey, useIsAuthenticated } from '@/lib/auth/hooks';
import { getNDKInstance } from '@/lib/ndk';

interface VerificationResult {
  templateId: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  loadTime?: number;
  exerciseCount?: number;
}

const Phase1ContentVerificationTest: React.FC = () => {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Get real authenticated user data
  const account = useAccount();
  const pubkey = usePubkey();
  const isAuthenticated = useIsAuthenticated();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  // Phase 1 template IDs to verify
  const phase1Templates = [
    'push-workout-bodyweight',
    'pull-workout-bodyweight', 
    'legs-workout-bodyweight'
  ];

  const verifyNDKConnection = async (): Promise<boolean> => {
    try {
      const ndk = getNDKInstance();
      if (!ndk) {
        addLog('❌ NDK not initialized');
        return false;
      }

      addLog(`✅ NDK initialized`);
      addLog(`📡 Connected relays: ${ndk.pool?.relays?.size || 0}`);
      addLog(`🌐 Network online: ${navigator.onLine}`);
      
      return true;
    } catch (error) {
      addLog(`❌ NDK connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const verifyAuthentication = (): boolean => {
    if (!isAuthenticated || !pubkey) {
      addLog('❌ User not authenticated');
      return false;
    }

    addLog(`✅ User authenticated: ${pubkey.slice(0, 16)}...`);
    addLog(`👤 Account: ${account?.npub?.slice(0, 16)}...` || 'No account info');
    return true;
  };

  const verifyTemplate = async (templateId: string): Promise<VerificationResult> => {
    const startTime = Date.now();
    
    try {
      const ndk = getNDKInstance();
      if (!ndk || !pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      addLog(`🔍 Loading template: ${templateId}`);
      
      // Try to load template from NDK (cache-first, then relays)
      const templateEvent = await ndk.fetchEvent({
        kinds: [33402 as any], // NIP-101e workout template
        authors: [pubkey],
        '#d': [templateId]
      });

      if (!templateEvent) {
        const loadTime = Date.now() - startTime;
        addLog(`❌ Template not found: ${templateId} (${loadTime}ms)`);
        
        return {
          templateId,
          status: 'error',
          message: `Template not found in cache or relays`,
          loadTime
        };
      }

      // Parse template to check exercise references
      const exerciseTags = templateEvent.tags.filter(tag => tag[0] === 'exercise');
      const loadTime = Date.now() - startTime;
      
      addLog(`✅ Template found: ${templateId} (${exerciseTags.length} exercises, ${loadTime}ms)`);
      
      return {
        templateId,
        status: 'success',
        message: `Template loaded successfully`,
        loadTime,
        exerciseCount: exerciseTags.length
      };

    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      addLog(`❌ Error loading ${templateId}: ${errorMessage} (${loadTime}ms)`);
      
      return {
        templateId,
        status: 'error',
        message: errorMessage,
        loadTime
      };
    }
  };

  const runVerification = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    
    addLog('🚀 Starting Phase 1 Content Verification');
    
    // Step 1: Verify authentication
    if (!verifyAuthentication()) {
      setIsRunning(false);
      return;
    }
    
    // Step 2: Verify NDK connection
    if (!await verifyNDKConnection()) {
      setIsRunning(false);
      return;
    }
    
    // Step 3: Verify each template
    const templateResults: VerificationResult[] = [];
    
    for (const templateId of phase1Templates) {
      const result = await verifyTemplate(templateId);
      templateResults.push(result);
      setResults([...templateResults]);
    }
    
    // Summary
    const successCount = templateResults.filter(r => r.status === 'success').length;
    const totalCount = templateResults.length;
    
    if (successCount === totalCount) {
      addLog(`🎉 Verification PASSED: ${successCount}/${totalCount} templates accessible`);
    } else {
      addLog(`⚠️ Verification PARTIAL: ${successCount}/${totalCount} templates accessible`);
    }
    
    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
    setLogs([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Phase 1 Content Verification Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify Phase 1 test content is accessible before removing mock data
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Authentication Status */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Authentication Status</h3>
          <div className="space-y-1 text-sm">
            <div>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
            <div>Pubkey: {pubkey ? `${pubkey.slice(0, 16)}...` : 'Not available'}</div>
            <div>Account: {account?.npub ? `${account.npub.slice(0, 16)}...` : 'Not available'}</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={runVerification} 
            disabled={isRunning || !isAuthenticated}
            variant="default"
          >
            {isRunning ? 'Running Verification...' : 'Run Verification'}
          </Button>
          <Button 
            onClick={clearResults} 
            disabled={isRunning}
            variant="outline"
          >
            Clear Results
          </Button>
        </div>

        {/* Verification Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Verification Results</h3>
            <div className="grid gap-4">
              {results.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{result.templateId}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>
                        {result.message}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {result.loadTime && `${result.loadTime}ms`}
                      {result.exerciseCount && (
                        <div>{result.exerciseCount} exercises</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Activity Log</h3>
            <Button onClick={() => setLogs([])} variant="ghost" size="sm">
              Clear Log
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto bg-muted p-3 rounded-lg">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-sm">No activity yet</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Next Steps</h3>
          <div className="text-sm space-y-1">
            <div>1. ✅ Run verification to check Phase 1 content accessibility</div>
            <div>2. 🔧 If all templates accessible, proceed to remove mock data</div>
            <div>3. ⚠️ If templates missing, debug Phase 1 content before proceeding</div>
            <div>4. 🚀 After verification passes, implement real template loading</div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default Phase1ContentVerificationTest;
