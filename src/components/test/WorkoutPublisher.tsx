'use client';

/**
 * WorkoutPublisher Test Component
 * 
 * Simple test component for validating NDK event publishing.
 * This is for NDK cache validation only - not production-ready.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount, useIsAuthenticated } from '@/lib/auth/hooks';
import { getNDKInstance } from '@/lib/ndk';
import { 
  generateTestWorkoutRecord, 
  generateTestStrengthWorkout, 
  generateTestFailedWorkout,
  generateBulkTestWorkouts,
  validateWorkoutEvent,
  type WorkoutEvent 
} from '@/lib/workout-events';
import { NDKEvent } from '@nostr-dev-kit/ndk';

interface PublishResult {
  success: boolean;
  eventId?: string;
  error?: string;
  validationErrors?: string[];
}

export function WorkoutPublisher() {
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const publishWorkoutEvent = async (workoutData: WorkoutEvent): Promise<PublishResult> => {
    try {
      console.log('[WorkoutPublisher] Publishing workout event:', workoutData);
      
      // Validate event format first
      const validation = validateWorkoutEvent(workoutData);
      if (!validation.valid) {
        console.error('[WorkoutPublisher] Validation failed:', validation.errors);
        return {
          success: false,
          error: 'Event validation failed',
          validationErrors: validation.errors
        };
      }
      
      // Get NDK instance
      const ndk = getNDKInstance();
      if (!ndk) {
        return {
          success: false,
          error: 'NDK not initialized'
        };
      }
      
      // Check if NDK has a signer
      if (!ndk.signer) {
        console.error('[WorkoutPublisher] NDK has no signer - authentication required');
        return {
          success: false,
          error: 'NDK not authenticated - no signer available'
        };
      }
      
      // Create NDK event
      const ndkEvent = new NDKEvent(ndk, workoutData);
      
      console.log('[WorkoutPublisher] Created NDK event:', {
        kind: ndkEvent.kind,
        pubkey: ndkEvent.pubkey,
        tags: ndkEvent.tags,
        content: ndkEvent.content,
        hasSigner: !!ndk.signer,
        signerType: ndk.signer?.constructor.name,
        relayCount: ndk.pool?.relays?.size || 0,
        connectedRelays: Array.from(ndk.pool?.relays?.values() || [])
          .filter(relay => relay.connectivity.status === 1)
          .map(relay => relay.url)
      });
      
      // Wait a moment for relay connections to stabilize
      console.log('[WorkoutPublisher] Waiting for relay connections to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check relay status again before publishing
      const finalRelayStatus = Array.from(ndk.pool?.relays?.values() || [])
        .map(relay => ({
          url: relay.url,
          status: relay.connectivity.status,
          connected: relay.connectivity.status === 1
        }));
      console.log('[WorkoutPublisher] Final relay status before publish:', finalRelayStatus);
      
      // Publish event directly - NDK handles signing automatically (noga app pattern)
      try {
        await ndkEvent.publish();
        console.log('[WorkoutPublisher] Event published successfully:', ndkEvent.id);
        
        return {
          success: true,
          eventId: ndkEvent.id
        };
      } catch (publishError) {
        console.error('[WorkoutPublisher] Publish failed:', publishError);
        console.error('[WorkoutPublisher] Full error details:', {
          message: publishError instanceof Error ? publishError.message : 'Unknown error',
          stack: publishError instanceof Error ? publishError.stack : undefined,
          publishError
        });
        return {
          success: false,
          error: `Publishing failed: ${publishError instanceof Error ? publishError.message : String(publishError)}`
        };
      }
      
    } catch (error) {
      console.error('[WorkoutPublisher] Publishing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const handlePublishTest = async (testType: 'circuit' | 'strength' | 'failed' | 'bulk') => {
    if (!account?.pubkey) {
      console.error('[WorkoutPublisher] No authenticated user');
      return;
    }

    setIsPublishing(true);
    const results: PublishResult[] = [];

    try {
      if (testType === 'bulk') {
        // Publish 10 test workouts for performance testing
        const bulkWorkouts = generateBulkTestWorkouts(account.pubkey, 10);
        console.log('[WorkoutPublisher] Publishing 10 bulk test workouts...');
        
        for (let i = 0; i < bulkWorkouts.length; i++) {
          const result = await publishWorkoutEvent(bulkWorkouts[i]);
          results.push(result);
          
          // Small delay between publishes to avoid overwhelming relays
          if (i < bulkWorkouts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        // Single workout test
        let workoutData: WorkoutEvent;
        
        switch (testType) {
          case 'circuit':
            workoutData = generateTestWorkoutRecord(account.pubkey);
            break;
          case 'strength':
            workoutData = generateTestStrengthWorkout(account.pubkey);
            break;
          case 'failed':
            workoutData = generateTestFailedWorkout(account.pubkey);
            break;
          default:
            throw new Error(`Unknown test type: ${testType}`);
        }
        
        const result = await publishWorkoutEvent(workoutData);
        results.push(result);
      }
      
      setPublishResults(prev => [...results, ...prev]);
      
    } catch (error) {
      console.error('[WorkoutPublisher] Test publishing failed:', error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setPublishResults(prev => [...results, ...prev]);
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
          <CardTitle>Workout Publisher Test</CardTitle>
          <CardDescription>
            Please authenticate to test workout event publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Authentication required to publish test workout events.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Publisher Test</CardTitle>
        <CardDescription>
          Test NDK event publishing with various workout types. 
          Check browser console for detailed logging.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="text-sm text-muted-foreground">
          <p>Authenticated as: {account?.pubkey?.slice(0, 16)}...</p>
          <p>NPub: {account?.npub?.slice(0, 20)}...</p>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => handlePublishTest('circuit')}
            disabled={isPublishing}
            variant="outline"
          >
            Test Circuit Workout
          </Button>
          
          <Button 
            onClick={() => handlePublishTest('strength')}
            disabled={isPublishing}
            variant="outline"
          >
            Test Strength Workout
          </Button>
          
          <Button 
            onClick={() => handlePublishTest('failed')}
            disabled={isPublishing}
            variant="outline"
          >
            Test Failed Workout
          </Button>
          
          <Button 
            onClick={() => handlePublishTest('bulk')}
            disabled={isPublishing}
            variant="secondary"
          >
            Bulk Test (10 workouts)
          </Button>
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
              Publishing workout events... Check console for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {publishResults.map((result, index) => (
            <Alert key={index} variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-1">
                  <p>
                    <strong>{result.success ? '✅ Success' : '❌ Failed'}</strong>
                  </p>
                  {result.eventId && (
                    <p className="text-xs font-mono">
                      Event ID: {result.eventId.slice(0, 16)}...
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
            <li>Test different workout types to validate NIP-101e compliance</li>
            <li>Use bulk test to validate performance with multiple events</li>
            <li>Check IndexedDB in DevTools → Application → Storage</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
