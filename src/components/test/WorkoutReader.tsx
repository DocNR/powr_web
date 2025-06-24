'use client';

/**
 * WorkoutReader Test Component
 * 
 * Simple test component for reading and displaying workout events from NDK cache.
 * This validates that published events are properly stored and retrievable.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount, useIsAuthenticated } from '@/lib/auth/hooks';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { parseWorkoutEvent, type WorkoutEvent, type ParsedWorkoutEvent } from '@/lib/workout-events';
import { NDKFilter } from '@nostr-dev-kit/ndk';

interface ReadResult {
  success: boolean;
  workouts: ParsedWorkoutEvent[];
  error?: string;
  totalEvents: number;
  loadTime: number;
}

export function WorkoutReader() {
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [readResult, setReadResult] = useState<ReadResult | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const readWorkoutEvents = useCallback(async (limit: number = 50): Promise<ReadResult> => {
    const startTime = Date.now();
    
    try {
      console.log('[WorkoutReader] Reading workout events...');
      
      // Get NDK instance
      const ndk = getNDKInstance();
      if (!ndk) {
        return {
          success: false,
          workouts: [],
          error: 'NDK not initialized',
          totalEvents: 0,
          loadTime: Date.now() - startTime
        };
      }

      if (!account?.pubkey) {
        return {
          success: false,
          workouts: [],
          error: 'No authenticated user',
          totalEvents: 0,
          loadTime: Date.now() - startTime
        };
      }

      // Create filter for user's workout events
      const filter: NDKFilter = {
        kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number],
        authors: [account.pubkey],
        limit: limit,
        // Sort by most recent first
        since: 0
      };

      console.log('[WorkoutReader] Using filter:', filter);

      // Fetch events from NDK cache
      const events = await ndk.fetchEvents(filter);
      const eventArray = Array.from(events);
      
      console.log('[WorkoutReader] Retrieved events:', eventArray.length);
      console.log('[WorkoutReader] Raw events:', eventArray.map(e => ({
        id: e.id,
        kind: e.kind,
        pubkey: e.pubkey,
        created_at: e.created_at,
        tags: e.tags
      })));

      // Parse events for display
      const parsedWorkouts: ParsedWorkoutEvent[] = [];
      
      for (const event of eventArray) {
        try {
          const workoutEvent: WorkoutEvent = {
            kind: event.kind!,
            content: event.content || '',
            tags: event.tags,
            created_at: event.created_at!,
            pubkey: event.pubkey,
            id: event.id
          };
          
          const parsed = parseWorkoutEvent(workoutEvent);
          parsedWorkouts.push(parsed);
        } catch (parseError) {
          console.warn('[WorkoutReader] Failed to parse event:', event.id, parseError);
        }
      }

      // Sort by most recent first
      parsedWorkouts.sort((a, b) => b.endTime - a.endTime);

      const loadTime = Date.now() - startTime;
      console.log('[WorkoutReader] Parsing completed in', loadTime, 'ms');

      return {
        success: true,
        workouts: parsedWorkouts,
        totalEvents: eventArray.length,
        loadTime
      };

    } catch (error) {
      console.error('[WorkoutReader] Reading failed:', error);
      return {
        success: false,
        workouts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        totalEvents: 0,
        loadTime: Date.now() - startTime
      };
    }
  }, [account?.pubkey]);

  const handleReadEvents = useCallback(async (limit: number = 50) => {
    setIsReading(true);
    try {
      const result = await readWorkoutEvents(limit);
      setReadResult(result);
    } finally {
      setIsReading(false);
    }
  }, [readWorkoutEvents]); // Only include readWorkoutEvents dependency

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      handleReadEvents();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, handleReadEvents]);

  // Auto-read events when user changes (SECURITY FIX)
  useEffect(() => {
    if (isAuthenticated && account?.pubkey) {
      console.log('[WorkoutReader] User changed, refreshing events for:', account.pubkey.slice(0, 16));
      
      // Clear previous results immediately to prevent showing wrong user's data
      setReadResult(null);
      
      // Force fresh read from NDK cache with new user filter
      handleReadEvents();
    } else {
      // Clear results when user logs out
      setReadResult(null);
    }
  }, [account?.pubkey, isAuthenticated, handleReadEvents]);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Reader Test</CardTitle>
          <CardDescription>
            Please authenticate to read workout events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Authentication required to read workout events from NDK cache.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Reader Test</CardTitle>
        <CardDescription>
          Read and display workout events from NDK cache. 
          Check browser console for detailed logging.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="text-sm text-muted-foreground">
          <p>Reading events for: {account?.pubkey?.slice(0, 16)}...</p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => handleReadEvents(10)}
            disabled={isReading}
            variant="outline"
          >
            Read 10 Events
          </Button>
          
          <Button 
            onClick={() => handleReadEvents(50)}
            disabled={isReading}
            variant="outline"
          >
            Read 50 Events
          </Button>
          
          <Button 
            onClick={() => handleReadEvents(100)}
            disabled={isReading}
            variant="outline"
          >
            Read 100 Events
          </Button>

          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "ghost"}
            size="sm"
          >
            {autoRefresh ? 'Stop Auto-Refresh' : 'Auto-Refresh (5s)'}
          </Button>
        </div>

        {/* Reading Status */}
        {isReading && (
          <Alert>
            <AlertDescription>
              Reading workout events from NDK cache... Check console for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Results Summary */}
        {readResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className={readResult.success ? "text-green-600" : "text-red-600"}>
                {readResult.success ? '✅ Success' : '❌ Failed'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Events</p>
              <p className="font-mono">{readResult.totalEvents}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Parsed Workouts</p>
              <p className="font-mono">{readResult.workouts.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Load Time</p>
              <p className="font-mono">{readResult.loadTime}ms</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {readResult?.error && (
          <Alert variant="destructive">
            <AlertDescription>
              Error: {readResult.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Workouts Display */}
        {readResult?.workouts && readResult.workouts.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h4 className="font-medium">Retrieved Workouts ({readResult.workouts.length})</h4>
            {readResult.workouts.map((workout, index) => (
              <Card key={`${workout.eventId || workout.id || 'workout'}-${index}-${workout.endTime}`} className="p-3">
                <div className="space-y-2">
                  {/* Workout Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{workout.title}</h5>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(workout.endTime)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <span className={`px-2 py-1 text-xs rounded ${workout.completed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {workout.type}
                      </span>
                      {!workout.completed && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Failed</span>
                      )}
                    </div>
                  </div>

                  {/* Workout Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-mono">{formatDuration(workout.duration)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Exercises</p>
                      <p className="font-mono">{workout.exercises.length} sets</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Event ID</p>
                      <p className="font-mono text-xs">{workout.eventId?.slice(0, 8)}...</p>
                    </div>
                  </div>

                  {/* Exercise Details */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Exercise Sets:</p>
                    <div className="grid gap-1 text-xs">
                      {workout.exercises.map((exercise, i) => (
                        <div key={i} className="flex justify-between items-center bg-muted/50 p-1 rounded">
                          <span className="font-mono">{exercise.reference.split(':')[2]}</span>
                          <span>
                            {exercise.weight !== '0' && `${exercise.weight}kg × `}
                            {exercise.reps} reps 
                            {exercise.rpe !== '0' && ` @ RPE ${exercise.rpe}`}
                            {exercise.setType !== 'normal' && ` (${exercise.setType})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  {workout.content && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium">Notes:</p>
                      <p className="italic">{workout.content}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {readResult?.success && readResult.workouts.length === 0 && (
          <Alert>
            <AlertDescription>
              No workout events found. Try publishing some test workouts first using the Workout Publisher.
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use Workout Publisher to create test events first</li>
            <li>Read events to verify they are stored in NDK cache</li>
            <li>Check browser DevTools Console for detailed logging</li>
            <li>Monitor load times to validate cache performance</li>
              <li>Use auto-refresh to see new events appear in real-time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
