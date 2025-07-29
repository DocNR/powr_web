'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect, useRef } from 'react';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { useIsAuthenticated, useAccount } from '@/lib/auth/hooks';
import { dataParsingService, type ParsedWorkoutEvent } from '@/lib/services/dataParsingService';
import { dependencyResolutionService, type Exercise } from '@/lib/services/dependencyResolution';
import type { NDKEvent, NDKFilter, NDKSubscription } from '@nostr-dev-kit/ndk';

interface WorkoutHistoryContextType {
  workoutRecords: ParsedWorkoutEvent[];
  resolvedExercises: Map<string, Exercise>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  loadMoreRecords: () => Promise<void>;
  hasMoreRecords: boolean;
  isLoadingMore: boolean;
}

const WorkoutHistoryContext = createContext<WorkoutHistoryContextType | undefined>(undefined);

export function useWorkoutHistory() {
  const context = useContext(WorkoutHistoryContext);
  if (context === undefined) {
    throw new Error('useWorkoutHistory must be used within a WorkoutHistoryProvider');
  }
  return context;
}

interface WorkoutHistoryProviderProps {
  children: ReactNode;
}

export function WorkoutHistoryProvider({ children }: WorkoutHistoryProviderProps) {
  // State management following WorkoutDataProvider patterns
  const [workoutEvents, setWorkoutEvents] = useState<NDKEvent[]>([]);
  const [resolvedExercises, setResolvedExercises] = useState<Map<string, Exercise>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordLimit, setRecordLimit] = useState(20);

  const isAuthenticated = useIsAuthenticated();
  const user = useAccount();
  
  // Subscription refs for cleanup
  const subscriptionRef = useRef<NDKSubscription | null>(null);
  
  // Event map for deduplication (NDK best practice)
  const eventsMapRef = useRef<Map<string, NDKEvent>>(new Map());

  // Setup subscription for workout records (Kind 1301)
  const setupWorkoutRecordsSubscription = useCallback((limit: number) => {
    const ndk = getNDKInstance();
    if (!ndk || !isAuthenticated || !user?.pubkey) return;

    console.log('[WorkoutHistoryProvider] Setting up workout records subscription, limit:', limit);

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.stop();
    }

    // Clear events map
    eventsMapRef.current.clear();

    const filters: NDKFilter[] = [{
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number], // 1301 - workout records
      authors: [user.pubkey], // Only user's own workout records
      limit
    }];

    // Use NDK singleton subscribe method
    const subscription = ndk.subscribe(filters);
    subscriptionRef.current = subscription;

    subscription.on('event', (event: NDKEvent) => {
      console.log('[WorkoutHistoryProvider] Workout record received:', event.id);
      
      // NDK automatic deduplication using Map
      eventsMapRef.current.set(event.id, event);
      
      // Update state with sorted events (newest first)
      const sortedEvents = Array.from(eventsMapRef.current.values())
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      
      setWorkoutEvents(sortedEvents);
    });

    subscription.on('eose', () => {
      console.log('[WorkoutHistoryProvider] Workout records EOSE received');
      setIsLoading(false);
    });

  }, [isAuthenticated, user?.pubkey]);

  // Initial subscription setup
  useEffect(() => {
    if (!isAuthenticated || !user?.pubkey) {
      // Clean up when not authenticated
      if (subscriptionRef.current) subscriptionRef.current.stop();
      setWorkoutEvents([]);
      setResolvedExercises(new Map());
      return;
    }

    console.log('[WorkoutHistoryProvider] Setting up initial subscription');
    setIsLoading(true);
    setError(null);

    setupWorkoutRecordsSubscription(recordLimit);

    // Cleanup function
    return () => {
      console.log('[WorkoutHistoryProvider] Cleaning up subscription');
      if (subscriptionRef.current) subscriptionRef.current.stop();
    };
  }, [isAuthenticated, user?.pubkey, recordLimit, setupWorkoutRecordsSubscription]);

  // Parse workout events using dataParsingService
  const workoutRecords = useMemo(() => {
    if (!workoutEvents.length) return [];
    
    // Create stable key from event IDs to prevent unnecessary re-parsing
    const eventIds = workoutEvents.map(e => e.id).sort().join(',');
    const stableKey = `workout_records_${eventIds}`;
    
    return dataParsingService.getCachedParse(stableKey, () => {
      console.log('[WorkoutHistoryProvider] 🔄 Parsing workout records (cache miss)');
      
      const parsed = dataParsingService.parseWorkoutEventsBatch(Array.from(workoutEvents));
      
      // Sort by most recent first
      return parsed.sort((a, b) => b.createdAt - a.createdAt);
    });
  }, [workoutEvents]);

  // Resolve exercise templates for enhanced search
  useEffect(() => {
    if (workoutRecords.length === 0) return;

    const resolveExercises = async () => {
      // Extract all unique exercise references
      const exerciseRefs = new Set<string>();
      workoutRecords.forEach(workout => {
        workout.exercises.forEach(exercise => {
          exerciseRefs.add(exercise.exerciseRef);
        });
      });

      if (exerciseRefs.size === 0) return;

      try {
        console.log('[WorkoutHistoryProvider] Resolving exercise references:', exerciseRefs.size);
        
        const exercises = await dependencyResolutionService.resolveExerciseReferences(
          Array.from(exerciseRefs)
        );

        const exerciseMap = new Map<string, Exercise>();
        exercises.forEach(exercise => {
          // Create reference key in format: 33401:pubkey:d-tag
          const ref = `33401:${exercise.authorPubkey}:${exercise.id}`;
          exerciseMap.set(ref, exercise);
        });

        console.log('[WorkoutHistoryProvider] ✅ Resolved exercises:', exerciseMap.size);
        setResolvedExercises(exerciseMap);
      } catch (error) {
        console.error('[WorkoutHistoryProvider] Failed to resolve exercises:', error);
        setError('Failed to load exercise details');
      }
    };

    resolveExercises();
  }, [workoutRecords]);

  // Load more records
  const loadMoreRecords = useCallback(async () => {
    if (isLoadingMore || !isAuthenticated) return;
    
    console.log('[WorkoutHistoryProvider] Loading more workout records...');
    setIsLoadingMore(true);
    
    try {
      const newLimit = recordLimit + 20;
      setRecordLimit(newLimit);
      // Subscription will automatically update with new limit
    } catch (error) {
      console.error('[WorkoutHistoryProvider] Failed to load more records:', error);
      setError('Failed to load more workout records');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isAuthenticated, recordLimit]);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated || !user?.pubkey) return;
    
    console.log('[WorkoutHistoryProvider] Manual refresh requested');
    setError(null);
    setIsLoading(true);
    
    // Reset limit and restart subscription
    setRecordLimit(20);
  }, [isAuthenticated, user?.pubkey]);

  // Simple hasMore logic - assume there's more if we got the full limit
  const hasMoreRecords = workoutEvents.length >= recordLimit;

  const value: WorkoutHistoryContextType = {
    workoutRecords,
    resolvedExercises,
    isLoading,
    error,
    refreshData,
    loadMoreRecords,
    hasMoreRecords,
    isLoadingMore
  };

  return (
    <WorkoutHistoryContext.Provider value={value}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
}
