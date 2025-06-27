'use client';

/**
 * Global NDK Actor Test Component
 * 
 * Test component for validating Global NDK Actor integration with XState
 * workout machines. Tests both optimistic and confirmed publishing modes.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAccount, useIsAuthenticated } from '@/lib/auth/hooks';
import {
  publishEvent,
  getNDKConnectionStatus,
  subscribeToNDKState,
  type PublishResult,
  type NDKConnectionStatus
} from '@/lib/actors/globalNDKActor';
import { 
  workoutAnalyticsService, 
  type CompletedWorkout 
} from '@/lib/services/workoutAnalytics';

export function GlobalNDKActorTest() {
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [status, setStatus] = useState<NDKConnectionStatus>(getNDKConnectionStatus());
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  // Subscribe to NDK state changes
  useEffect(() => {
    const unsubscribe = subscribeToNDKState((newStatus) => {
      setStatus(newStatus);
    });

    return () => unsubscribe.unsubscribe();
  }, []);

  const createTestWorkout = (): CompletedWorkout => {
    if (!account?.pubkey) {
      throw new Error('No authenticated user');
    }

    const workoutId = workoutAnalyticsService.generateWorkoutId();
    const now = Date.now();
    
    return {
      workoutId,
      title: 'Test Strength Workout',
      workoutType: 'strength',
      startTime: now - 1800000, // 30 minutes ago
      endTime: now,
      completedSets: [
        {
          exerciseRef: workoutAnalyticsService.createExerciseReference(account.pubkey, 'pushup-standard'),
          setNumber: 1,
          reps: 10,
          weight: 0,
          rpe: 7,
          setType: 'normal',
          completedAt: now - 1200000 // 20 minutes ago
        },
        {
          exerciseRef: workoutAnalyticsService.createExerciseReference(account.pubkey, 'pushup-standard'),
          setNumber: 2,
          reps: 8,
          weight: 0,
          rpe: 8,
          setType: 'normal',
          completedAt: now - 600000 // 10 minutes ago
        },
        {
          exerciseRef: workoutAnalyticsService.createExerciseReference(account.pubkey, 'squat-bodyweight'),
          setNumber: 1,
          reps: 15,
          weight: 0,
          rpe: 6,
          setType: 'normal',
          completedAt: now - 300000 // 5 minutes ago
        }
      ],
      notes: 'Great workout! Testing Global NDK Actor integration.'
    };
  };

  const testConfirmedPublishing = async () => {
    if (!account?.pubkey) return;

    setIsPublishing(true);
    try {
      const testWorkout = createTestWorkout();
      
      // Validate workout data using service
      const validation = workoutAnalyticsService.validateWorkoutData(testWorkout);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate NIP-101e event using service
      const eventData = workoutAnalyticsService.generateNIP101eEvent(testWorkout, account.pubkey);
      
      console.log('[GlobalNDKActorTest] Testing confirmed publishing...');
      console.log('[GlobalNDKActorTest] Event data:', eventData);

      // Test confirmed publishing (default - waits for confirmation)
      const result = await publishEvent(eventData, `test_confirmed_${Date.now()}`);
      
      setPublishResults(prev => [result, ...prev]);
      
    } catch (error) {
      console.error('[GlobalNDKActorTest] Confirmed publishing test failed:', error);
      setPublishResults(prev => [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: `test_confirmed_${Date.now()}`
      }, ...prev]);
    } finally {
      setIsPublishing(false);
    }
  };

  const testOptimisticPublishing = async () => {
    if (!account?.pubkey) return;

    setIsPublishing(true);
    try {
      const testWorkout = createTestWorkout();
      testWorkout.title = 'Test Circuit Workout (Optimistic)';
      testWorkout.workoutType = 'circuit';
      
      // Validate and generate event
      const validation = workoutAnalyticsService.validateWorkoutData(testWorkout);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const eventData = workoutAnalyticsService.generateNIP101eEvent(testWorkout, account.pubkey);
      
      console.log('[GlobalNDKActorTest] Testing optimistic publishing...');

      // Test optimistic publishing (fire and forget)
      const result = await publishEvent(eventData, `test_optimistic_${Date.now()}`, { 
        optimistic: true 
      });
      
      setPublishResults(prev => [result, ...prev]);
      
    } catch (error) {
      console.error('[GlobalNDKActorTest] Optimistic publishing test failed:', error);
      setPublishResults(prev => [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: `test_optimistic_${Date.now()}`
      }, ...prev]);
    } finally {
      setIsPublishing(false);
    }
  };

  const testBulkPublishing = async () => {
    if (!account?.pubkey) return;

    setIsPublishing(true);
    try {
      console.log('[GlobalNDKActorTest] Testing bulk publishing (5 events)...');
      
      const results: PublishResult[] = [];
      
      for (let i = 0; i < 5; i++) {
        const testWorkout = createTestWorkout();
        testWorkout.title = `Bulk Test Workout ${i + 1}`;
        testWorkout.workoutType = i % 2 === 0 ? 'strength' : 'circuit';
        
        const validation = workoutAnalyticsService.validateWorkoutData(testWorkout);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const eventData = workoutAnalyticsService.generateNIP101eEvent(testWorkout, account.pubkey);
        
        // Alternate between confirmed and optimistic
        const isOptimistic = i % 2 === 1;
        const result = await publishEvent(
          eventData, 
          `test_bulk_${i}_${Date.now()}`, 
          { optimistic: isOptimistic }
        );
        
        results.push(result);
        
        // Small delay between publishes
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setPublishResults(prev => [...results, ...prev]);
      
    } catch (error) {
      console.error('[GlobalNDKActorTest] Bulk publishing test failed:', error);
      setPublishResults(prev => [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: `test_bulk_${Date.now()}`
      }, ...prev]);
    } finally {
      setIsPublishing(false);
    }
  };

  const clearResults = () => {
    setPublishResults([]);
  };


  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global NDK Actor Test</CardTitle>
          <CardDescription>
            Please authenticate to test Global NDK Actor integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Authentication required to test Global NDK Actor publishing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global NDK Actor Test</CardTitle>
        <CardDescription>
          Test Global NDK Actor integration with Workout Analytics Service.
          Tests both confirmed and optimistic publishing modes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="text-sm text-muted-foreground">
          <p>Authenticated as: {account?.pubkey?.slice(0, 16)}...</p>
          <p>NPub: {account?.npub?.slice(0, 20)}...</p>
        </div>

        {/* NDK Connection Status */}
        <div className="flex items-center gap-2">
          <Badge variant={status.isConnected ? "default" : "destructive"}>
            {status.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {status.relayCount} relays ({status.connectedRelays.length} connected)
          </span>
        </div>

        {/* NDK handles all queuing internally - no custom queue display needed */}

        {/* Test Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={testConfirmedPublishing}
              disabled={isPublishing}
              variant="default"
            >
              🔒 Test Confirmed Publishing
            </Button>
            
            <Button 
              onClick={testOptimisticPublishing}
              disabled={isPublishing}
              variant="outline"
            >
              ⚡ Test Optimistic Publishing
            </Button>
            
            <Button 
              onClick={testBulkPublishing}
              disabled={isPublishing}
              variant="secondary"
            >
              📦 Test Bulk Publishing (5 events)
            </Button>
          </div>
        </div>

        {/* Results Management */}
        {publishResults.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {publishResults.length} publish attempts
            </p>
            <Button onClick={clearResults} variant="ghost" size="sm">
              Clear Results
            </Button>
          </div>
        )}

        {/* Publishing Status */}
        {isPublishing && (
          <Alert>
            <AlertDescription>
              Publishing events via Global NDK Actor... Check console for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {publishResults.map((result, index) => (
            <Alert key={index} variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p>
                      <strong>{result.success ? '✅ Success' : '❌ Failed'}</strong>
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {result.requestId?.includes('optimistic') ? 'Optimistic' : 'Confirmed'}
                    </Badge>
                  </div>
                  {result.eventId && (
                    <p className="text-xs font-mono">
                      Event ID: {result.eventId.slice(0, 16)}...
                    </p>
                  )}
                  {result.requestId && (
                    <p className="text-xs text-muted-foreground">
                      Request: {result.requestId}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-600">
                      Error: {result.error}
                    </p>
                  )}
                  {result.validationErrors && (
                    <div className="text-xs text-red-600">
                      <p>Validation errors:</p>
                      <ul className="list-disc list-inside">
                        {result.validationErrors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Open browser DevTools Console for detailed logging</li>
            <li><strong>Confirmed:</strong> Waits for publish confirmation (for workout completion)</li>
            <li><strong>Optimistic:</strong> Fire-and-forget publishing (for progress updates)</li>
            <li><strong>Bulk:</strong> Tests multiple events with mixed publishing modes</li>
            <li>Failed events are automatically queued for retry</li>
            <li>Check IndexedDB in DevTools → Application → Storage</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
