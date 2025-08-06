'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useIsAuthenticated, useAccount } from '@/lib/auth/hooks';
import { dataParsingService, type ParsedWorkoutEvent } from '@/lib/services/dataParsingService';
import { dependencyResolutionService, type Exercise } from '@/lib/services/dependencyResolution';
import { useWorkoutHistory as useWorkoutHistoryHook } from '@/hooks/useNDKDataWithCaching';

interface WorkoutHistoryContextType {
  workoutRecords: ParsedWorkoutEvent[];
  resolvedExercises: Map<string, Exercise>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  loadMoreRecords: () => Promise<void>;
  hasMoreRecords: boolean;
  isLoadingMore: boolean;
  // New caching features
  getOfflineCount: () => Promise<number>;
  lastFetched: number | null;
  // ✅ NEW: Force refetch after workout completion
  forceRefetch: () => Promise<void>;
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
  // State management with caching integration
  const [resolvedExercises, setResolvedExercises] = useState<Map<string, Exercise>>(new Map());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [recordLimit, setRecordLimit] = useState(20);

  const isAuthenticated = useIsAuthenticated();
  const user = useAccount();
  
  // ✅ NEW: Use caching hook with PARALLEL strategy for real-time updates
  const {
    events: workoutEvents,
    isLoading,
    error: hookError,
    refetch,
    lastFetched,
    getOfflineCount
  } = useWorkoutHistoryHook(
    user?.pubkey || '',
    recordLimit,
    {
      enabled: isAuthenticated && !!user?.pubkey,
      onSuccess: (events) => {
        console.log('[WorkoutHistoryProvider] ✅ Parallel fetch completed:', events.length, 'events for user:', user?.pubkey?.slice(0, 8));
        console.log('[WorkoutHistoryProvider] 📊 Event details:', events.map(e => ({
          id: e.id.slice(0, 8),
          kind: e.kind,
          pubkey: e.pubkey.slice(0, 8),
          created_at: e.created_at ? new Date(e.created_at * 1000).toISOString() : 'unknown'
        })));
      },
      onError: (error) => {
        console.error('[WorkoutHistoryProvider] ❌ Parallel fetch failed for user:', user?.pubkey?.slice(0, 8), error);
      }
    }
  );

  // Convert hook error to string for compatibility
  const error = hookError?.message || null;

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
      }
    };

    resolveExercises();
  }, [workoutRecords]);

  // Load more records - update limit to trigger new fetch
  const loadMoreRecords = useCallback(async () => {
    if (isLoadingMore || !isAuthenticated) return;
    
    console.log('[WorkoutHistoryProvider] Loading more workout records...');
    setIsLoadingMore(true);
    
    try {
      const newLimit = recordLimit + 20;
      setRecordLimit(newLimit);
      // The useWorkoutHistoryHook will automatically refetch with new limit
    } catch (error) {
      console.error('[WorkoutHistoryProvider] Failed to load more records:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isAuthenticated, recordLimit]);

  // Refresh data - use the hook's refetch function
  const refreshData = useCallback(async () => {
    if (!isAuthenticated || !user?.pubkey) return;
    
    console.log('[WorkoutHistoryProvider] Manual refresh requested');
    
    try {
      await refetch();
    } catch (error) {
      console.error('[WorkoutHistoryProvider] Refresh failed:', error);
    }
  }, [isAuthenticated, user?.pubkey, refetch]);

  // ✅ NEW: Force refetch function (same as refreshData for now)
  const forceRefetch = useCallback(async () => {
    console.log('[WorkoutHistoryProvider] 🔄 Force refetch requested (after workout completion)');
    await refreshData();
  }, [refreshData]);

  // Listen for workout completion events
  useEffect(() => {
    const handleWorkoutComplete = () => {
      console.log('[WorkoutHistoryProvider] 🎯 Workout completion detected, triggering refetch');
      
      // 3 second delay to allow NDK event delivery
      setTimeout(() => {
        forceRefetch();
      }, 3000);
    };

    // Listen for custom workout completion event
    window.addEventListener('powr-workout-complete', handleWorkoutComplete);
    
    return () => {
      window.removeEventListener('powr-workout-complete', handleWorkoutComplete);
    };
  }, [forceRefetch]);

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
    isLoadingMore,
    getOfflineCount,
    lastFetched,
    forceRefetch
  };

  return (
    <WorkoutHistoryContext.Provider value={value}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
}
