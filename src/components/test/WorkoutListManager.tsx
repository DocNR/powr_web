'use client';

/**
 * WorkoutListManager Test Component
 * 
 * Implements NIP-51 list management for workout organization.
 * Creates and manages "POWR History" list with relay hints.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount, useIsAuthenticated } from '@/lib/auth/hooks';
import { getNDKInstance } from '@/lib/ndk';
import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

interface WorkoutListResult {
  success: boolean;
  listId?: string;
  eventCount?: number;
  error?: string;
}

interface WorkoutEventRef {
  eventId: string;
  relayHint: string;
  timestamp: number;
}

export function WorkoutListManager() {
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [listResults, setListResults] = useState<WorkoutListResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setWorkoutEvents] = useState<WorkoutEventRef[]>([]);
  const [currentList, setCurrentList] = useState<NDKEvent | null>(null);

  // Fetch workout events for list creation
  const fetchWorkoutEvents = async (): Promise<WorkoutEventRef[]> => {
    try {
      console.log('[WorkoutListManager] Fetching workout events for list creation...');
      
      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Fetch user's workout events (kind 1301)
      const filter: NDKFilter = {
        kinds: [1301 as any],
        authors: [account.pubkey],
        limit: 100 // Get up to 100 recent workouts
      };

      const events = await ndk.fetchEvents(filter);
      console.log(`[WorkoutListManager] Found ${events.size} workout events`);

      // Convert to WorkoutEventRef with relay hints
      const eventRefs: WorkoutEventRef[] = Array.from(events).map(event => ({
        eventId: event.id,
        relayHint: 'wss://nos.lol', // Default relay hint - could be improved to track actual source
        timestamp: event.created_at || 0
      }));

      // Sort by timestamp (newest first)
      eventRefs.sort((a, b) => b.timestamp - a.timestamp);

      console.log('[WorkoutListManager] Workout event refs:', eventRefs);
      return eventRefs;

    } catch (error) {
      console.error('[WorkoutListManager] Failed to fetch workout events:', error);
      throw error;
    }
  };

  // Create POWR History list (NIP-51 kind 30003)
  const createPOWRHistoryList = async (): Promise<WorkoutListResult> => {
    try {
      console.log('[WorkoutListManager] Creating POWR History list...');

      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Fetch current workout events
      const eventRefs = await fetchWorkoutEvents();
      setWorkoutEvents(eventRefs);

      if (eventRefs.length === 0) {
        return {
          success: false,
          error: 'No workout events found to add to list'
        };
      }

      // Create NIP-51 bookmark set (kind 30003) for POWR History
      const listEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', 'powr-history'], // Unique identifier for this list
          ['title', 'POWR History'],
          ['description', 'Complete workout history'],
          // Add workout event references with relay hints
          ...eventRefs.map(ref => ['e', ref.eventId, ref.relayHint])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: account.pubkey
      });

      console.log('[WorkoutListManager] Publishing POWR History list:', {
        kind: listEvent.kind,
        tags: listEvent.tags,
        eventCount: eventRefs.length
      });

      // Publish the list
      await listEvent.publish();
      setCurrentList(listEvent);

      console.log('[WorkoutListManager] POWR History list published successfully:', listEvent.id);

      return {
        success: true,
        listId: listEvent.id,
        eventCount: eventRefs.length
      };

    } catch (error) {
      console.error('[WorkoutListManager] Failed to create POWR History list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Fetch existing POWR History list
  const fetchPOWRHistoryList = async (): Promise<WorkoutListResult> => {
    try {
      console.log('[WorkoutListManager] Fetching existing POWR History list...');

      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Fetch POWR History list (kind 30003 with d tag "powr-history")
      const filter: NDKFilter = {
        kinds: [30003],
        authors: [account.pubkey],
        '#d': ['powr-history']
      };

      const events = await ndk.fetchEvents(filter);
      console.log(`[WorkoutListManager] Found ${events.size} POWR History lists`);

      if (events.size === 0) {
        return {
          success: false,
          error: 'No POWR History list found'
        };
      }

      // Get the most recent list (should only be one due to replaceable event)
      const listEvent = Array.from(events)[0];
      setCurrentList(listEvent);

      // Count workout event references
      const workoutRefs = listEvent.tags.filter(tag => tag[0] === 'e');
      
      console.log('[WorkoutListManager] POWR History list found:', {
        id: listEvent.id,
        workoutCount: workoutRefs.length,
        tags: listEvent.tags
      });

      return {
        success: true,
        listId: listEvent.id,
        eventCount: workoutRefs.length
      };

    } catch (error) {
      console.error('[WorkoutListManager] Failed to fetch POWR History list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Update existing list with new workouts
  const updatePOWRHistoryList = async (): Promise<WorkoutListResult> => {
    try {
      console.log('[WorkoutListManager] Updating POWR History list...');

      // Fetch current workout events
      const eventRefs = await fetchWorkoutEvents();
      setWorkoutEvents(eventRefs);

      if (!currentList) {
        throw new Error('No current list to update');
      }

      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Create updated list with all current workout events
      const updatedListEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', 'powr-history'],
          ['title', 'POWR History'],
          ['description', 'Complete workout history'],
          // Add all current workout event references with relay hints
          ...eventRefs.map(ref => ['e', ref.eventId, ref.relayHint])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: account.pubkey
      });

      console.log('[WorkoutListManager] Publishing updated POWR History list:', {
        kind: updatedListEvent.kind,
        eventCount: eventRefs.length,
        previousEventCount: currentList.tags.filter(tag => tag[0] === 'e').length
      });

      // Publish the updated list
      await updatedListEvent.publish();
      setCurrentList(updatedListEvent);

      console.log('[WorkoutListManager] POWR History list updated successfully:', updatedListEvent.id);

      return {
        success: true,
        listId: updatedListEvent.id,
        eventCount: eventRefs.length
      };

    } catch (error) {
      console.error('[WorkoutListManager] Failed to update POWR History list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const handleListOperation = async (operation: 'create' | 'fetch' | 'update') => {
    setIsProcessing(true);
    let result: WorkoutListResult;

    try {
      switch (operation) {
        case 'create':
          result = await createPOWRHistoryList();
          break;
        case 'fetch':
          result = await fetchPOWRHistoryList();
          break;
        case 'update':
          result = await updatePOWRHistoryList();
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      setListResults(prev => [result, ...prev]);

    } catch (error) {
      console.error('[WorkoutListManager] List operation failed:', error);
      setListResults(prev => [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setListResults([]);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout List Manager</CardTitle>
          <CardDescription>
            Please authenticate to test NIP-51 list functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Authentication required to manage workout lists.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout List Manager (NIP-51)</CardTitle>
        <CardDescription>
          Test NIP-51 list creation and management for POWR History.
          Check browser console for detailed logging.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="text-sm text-muted-foreground">
          <p>Authenticated as: {account?.pubkey?.slice(0, 16)}...</p>
          <p>NPub: {account?.npub?.slice(0, 20)}...</p>
        </div>

        {/* Current List Status */}
        {currentList && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Current POWR History List:</strong></p>
                <p className="text-xs font-mono">ID: {currentList.id.slice(0, 16)}...</p>
                <p className="text-xs">
                  Workouts: {currentList.tags.filter(tag => tag[0] === 'e').length}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* List Operation Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={() => handleListOperation('create')}
            disabled={isProcessing}
            variant="default"
          >
            Create POWR History
          </Button>
          
          <Button 
            onClick={() => handleListOperation('fetch')}
            disabled={isProcessing}
            variant="outline"
          >
            Fetch Existing List
          </Button>
          
          <Button 
            onClick={() => handleListOperation('update')}
            disabled={isProcessing}
            variant="secondary"
          >
            Update List
          </Button>
        </div>

        {/* Results Management */}
        {listResults.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {listResults.length} list operations
            </p>
            <Button onClick={clearResults} variant="ghost" size="sm">
              Clear Results
            </Button>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <Alert>
            <AlertDescription>
              Processing list operation... Check console for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {listResults.map((result, index) => (
            <Alert key={index} variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-1">
                  <p>
                    <strong>{result.success ? '✅ Success' : '❌ Failed'}</strong>
                  </p>
                  {result.listId && (
                    <p className="text-xs font-mono">
                      List ID: {result.listId.slice(0, 16)}...
                    </p>
                  )}
                  {result.eventCount !== undefined && (
                    <p className="text-xs">
                      Workout Events: {result.eventCount}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-600">
                      Error: {result.error}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>NIP-51 List Testing:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Create:</strong> Creates new POWR History list with all workout events</li>
            <li><strong>Fetch:</strong> Retrieves existing POWR History list from Nostr</li>
            <li><strong>Update:</strong> Updates list with any new workout events</li>
            <li>Lists use kind 30003 (bookmark sets) with relay hints</li>
            <li>Check console for detailed NIP-51 event structure</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
