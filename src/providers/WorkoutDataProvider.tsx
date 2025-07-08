'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect, useRef } from 'react';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { parseWorkoutEvent } from '@/lib/workout-events';
import { useIsAuthenticated } from '@/lib/auth/hooks';
import type { NDKEvent, NDKFilter, NDKSubscription } from '@nostr-dev-kit/ndk';

// Types from WorkoutsTab - keeping exact same interface
interface SocialWorkout {
  id: string;
  title: string;
  completedAt: Date;
  duration: number;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: number;
      weight: number;
      rpe: number;
    }>;
  }>;
  author: {
    pubkey: string;
    name: string;
    picture: string;
  };
  notes: string;
  eventId?: string;
}

interface DiscoveryWorkout {
  id: string;
  title: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  estimatedDuration: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Optional - only if present in event
  rating?: number; // Optional - only if present in event
  calories?: number; // Optional - only if calculable from real data
  muscleGroups?: string[]; // Optional - only if extractable from event
  level?: string; // Optional - only if derivable from real data
  author: {
    pubkey: string;
    name?: string; // Optional - only if profile data available
    picture?: string; // Optional - only if profile data available
  };
  eventId?: string;
  eventTags?: string[][];
  eventKind?: number;
  templateRef?: string;
}

interface WorkoutIndicator {
  date: Date;
  count: number;
  type: 'completed';
}

interface WorkoutDataContextType {
  socialWorkouts: SocialWorkout[];
  discoveryTemplates: DiscoveryWorkout[];
  workoutIndicators: WorkoutIndicator[];
  rawEventData: Map<string, Record<string, unknown>>;
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
  refreshData: () => Promise<void>;
  loadMoreSocialWorkouts: () => Promise<void>;
  loadMoreDiscoveryTemplates: () => Promise<void>;
  hasMoreWorkouts: boolean;
  hasMoreTemplates: boolean;
  isLoadingMore: boolean;
}

const WorkoutDataContext = createContext<WorkoutDataContextType | undefined>(undefined);

export function useWorkoutData() {
  const context = useContext(WorkoutDataContext);
  if (context === undefined) {
    throw new Error('useWorkoutData must be used within a WorkoutDataProvider');
  }
  return context;
}

interface WorkoutDataProviderProps {
  children: ReactNode;
}

export function WorkoutDataProvider({ children }: WorkoutDataProviderProps) {
  // Simple state management following NDK best practices
  const [socialEvents, setSocialEvents] = useState<NDKEvent[]>([]);
  const [discoveryEvents, setDiscoveryEvents] = useState<NDKEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [socialLimit, setSocialLimit] = useState(5);
  const [discoveryLimit, setDiscoveryLimit] = useState(6);

  const isAuthenticated = useIsAuthenticated();
  
  // Subscription refs for cleanup
  const socialSubRef = useRef<NDKSubscription | null>(null);
  const discoverySubRef = useRef<NDKSubscription | null>(null);
  
  // Event maps for deduplication (NDK best practice)
  const socialEventsMapRef = useRef<Map<string, NDKEvent>>(new Map());
  const discoveryEventsMapRef = useRef<Map<string, NDKEvent>>(new Map());

  // Simple useSubscribe pattern following NDK best practices
  const setupSocialSubscription = useCallback((limit: number) => {
    const ndk = getNDKInstance();
    if (!ndk || !isAuthenticated) return;

    console.log('[WorkoutDataProvider] Setting up social subscription, limit:', limit);

    // Clean up existing subscription
    if (socialSubRef.current) {
      socialSubRef.current.stop();
    }

    // Clear events map
    socialEventsMapRef.current.clear();

    const filters: NDKFilter[] = [{
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number], // 1301 - workout records only
      limit
    }];

    // Use NDK singleton subscribe method
    const subscription = ndk.subscribe(filters);
    socialSubRef.current = subscription;

    subscription.on('event', (event: NDKEvent) => {
      console.log('[WorkoutDataProvider] Social event received:', event.id);
      
      // NDK automatic deduplication using Map
      socialEventsMapRef.current.set(event.id, event);
      
      // Update state with sorted events (newest first)
      const sortedEvents = Array.from(socialEventsMapRef.current.values())
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      
      setSocialEvents(sortedEvents);
    });

    subscription.on('eose', () => {
      console.log('[WorkoutDataProvider] Social EOSE received');
      setIsLoading(false);
    });

  }, [isAuthenticated]);

  const setupDiscoverySubscription = useCallback((limit: number) => {
    const ndk = getNDKInstance();
    if (!ndk || !isAuthenticated) return;

    console.log('[WorkoutDataProvider] Setting up discovery subscription, limit:', limit);

    // Clean up existing subscription
    if (discoverySubRef.current) {
      discoverySubRef.current.stop();
    }

    // Clear events map
    discoveryEventsMapRef.current.clear();

    const filters: NDKFilter[] = [{
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number], // 33402 - workout templates only
      limit
    }];

    // Use NDK singleton subscribe method
    const subscription = ndk.subscribe(filters);
    discoverySubRef.current = subscription;

    subscription.on('event', (event: NDKEvent) => {
      console.log('[WorkoutDataProvider] Discovery event received:', event.id);
      
      // NDK automatic deduplication using Map
      discoveryEventsMapRef.current.set(event.id, event);
      
      // Update state with sorted events (newest first)
      const sortedEvents = Array.from(discoveryEventsMapRef.current.values())
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      
      setDiscoveryEvents(sortedEvents);
    });

    subscription.on('eose', () => {
      console.log('[WorkoutDataProvider] Discovery EOSE received');
      setIsLoading(false);
    });

  }, [isAuthenticated]);

  // Initial subscription setup
  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up when not authenticated
      if (socialSubRef.current) socialSubRef.current.stop();
      if (discoverySubRef.current) discoverySubRef.current.stop();
      setSocialEvents([]);
      setDiscoveryEvents([]);
      return;
    }

    console.log('[WorkoutDataProvider] Setting up initial subscriptions');
    setIsLoading(true);
    setError(null);

    setupSocialSubscription(socialLimit);
    setupDiscoverySubscription(discoveryLimit);
    setLastFetch(Date.now());

    // Cleanup function
    return () => {
      console.log('[WorkoutDataProvider] Cleaning up subscriptions');
      if (socialSubRef.current) socialSubRef.current.stop();
      if (discoverySubRef.current) discoverySubRef.current.stop();
    };
  }, [isAuthenticated, socialLimit, discoveryLimit, setupSocialSubscription, setupDiscoverySubscription]);

  // Transform social events to UI format (minimal processing)
  const socialWorkouts = useMemo(() => {
    return socialEvents.map((event: NDKEvent) => {
      try {
        const parsed = parseWorkoutEvent({
          kind: event.kind!,
          content: event.content || '',
          tags: event.tags,
          created_at: event.created_at!,
          pubkey: event.pubkey,
          id: event.id
        });

        // Extract first exercise for preview
        const firstExercise = parsed.exercises[0];
        const exercisePreview = firstExercise ? {
          name: firstExercise.reference.split(':')[2]?.replace(/-/g, ' ') || 'Exercise',
          sets: [{
            reps: parseInt(firstExercise.reps) || 0,
            weight: parseInt(firstExercise.weight) || 0,
            rpe: parseInt(firstExercise.rpe) || 7
          }]
        } : {
          name: `${parsed.exercises.length} exercises`,
          sets: [{ reps: 0, weight: 0, rpe: 7 }]
        };

        return {
          id: parsed.id,
          title: parsed.title,
          completedAt: new Date(parsed.endTime * 1000),
          duration: Math.floor(parsed.duration / 60), // Convert to minutes
          exercises: [exercisePreview],
          author: {
            pubkey: parsed.pubkey,
            name: `${parsed.pubkey.slice(0, 8)}...`, // Keep minimal display name for UI compatibility
            picture: '/assets/workout-record-fallback.jpg' // Keep fallback for UI compatibility
          },
          notes: parsed.content || 'Completed workout',
          eventId: parsed.eventId
        };
      } catch (error) {
        console.warn('[WorkoutDataProvider] Failed to parse social workout:', error);
        return null;
      }
    }).filter(Boolean) as SocialWorkout[];
  }, [socialEvents]);

  // Transform discovery events to UI format (minimal processing)
  const discoveryTemplates = useMemo(() => {
    return discoveryEvents.map((event: NDKEvent) => {
      try {
        const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
        if (!dTag) return null;

        const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
        const name = tagMap.get('title')?.[1] || tagMap.get('name')?.[1] || 'Untitled Template';
        const difficulty = tagMap.get('difficulty')?.[1] as 'beginner' | 'intermediate' | 'advanced' | undefined;
        const estimatedDuration = tagMap.get('duration')?.[1] ? parseInt(tagMap.get('duration')![1]) : undefined;
        
        // Extract exercise references
        const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
        const exercises = exerciseTags.map(tag => ({
          name: tag[1]?.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise',
          sets: parseInt(tag[2]) || 3,
          reps: parseInt(tag[3]) || 10,
          weight: tag[4] ? parseInt(tag[4]) : 0
        }));

        return {
          id: dTag,
          title: name,
          exercises,
          estimatedDuration: estimatedDuration ? Math.round(estimatedDuration / 60) : 30, // Convert to minutes or default to 30
          difficulty, // Only include if present in event tags
          // rating: removed - no fake data
          // calories: removed - no fake data  
          // muscleGroups: removed - no fake data
          // level: removed - no fake data
          author: {
            pubkey: event.pubkey,
            // name: removed - only pubkey available
            // picture: removed - no fake fallback images
          },
          eventId: event.id,
          eventTags: event.tags,
          eventKind: event.kind,
          templateRef: `33402:${event.pubkey}:${dTag}`
        };
      } catch (error) {
        console.warn('[WorkoutDataProvider] Failed to parse discovery template:', error);
        return null;
      }
    }).filter(Boolean) as DiscoveryWorkout[];
  }, [discoveryEvents]);

  // Generate workout indicators from social workouts
  const workoutIndicators = useMemo(() => {
    return socialWorkouts.slice(0, 10).map(workout => ({
      date: workout.completedAt,
      count: 1,
      type: 'completed' as const
    }));
  }, [socialWorkouts]);

  // Create raw event data map for UI compatibility
  const rawEventData = useMemo(() => {
    const eventMap = new Map<string, Record<string, unknown>>();
    
    // Add social workout events
    socialEvents.forEach((event: NDKEvent) => {
      eventMap.set(event.id, {
        type: '1301_workout_record',
        hexId: event.id,
        nevent: event.encode ? event.encode() : 'encode() not available',
        pubkey: event.pubkey,
        created_at: event.created_at,
        tags: event.tags,
        rawEvent: event
      });
    });

    // Add discovery template events
    discoveryEvents.forEach((event: NDKEvent) => {
      const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
      const templateData = {
        type: '33402_workout_template',
        hexId: event.id,
        naddr: event.encode ? event.encode() : 'encode() not available',
        pubkey: event.pubkey,
        created_at: event.created_at,
        tags: event.tags,
        rawEvent: event
      };
      
      eventMap.set(event.id, templateData);
      if (dTag) {
        eventMap.set(dTag, templateData);
      }
    });

    return eventMap;
  }, [socialEvents, discoveryEvents]);

  // Simple infinite scroll - increase limits
  const loadMoreSocialWorkouts = useCallback(async () => {
    if (isLoadingMore || !isAuthenticated) return;
    
    console.log('[WorkoutDataProvider] Loading more social workouts...');
    setIsLoadingMore(true);
    
    try {
      const newLimit = socialLimit + 3;
      setSocialLimit(newLimit);
      // Subscription will automatically update with new limit
    } catch (error) {
      console.error('[WorkoutDataProvider] Failed to load more social workouts:', error);
      setError('Failed to load more workouts');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isAuthenticated, socialLimit]);

  const loadMoreDiscoveryTemplates = useCallback(async () => {
    if (isLoadingMore || !isAuthenticated) return;
    
    console.log('[WorkoutDataProvider] Loading more discovery templates...');
    setIsLoadingMore(true);
    
    try {
      const newLimit = discoveryLimit + 3;
      setDiscoveryLimit(newLimit);
      // Subscription will automatically update with new limit
    } catch (error) {
      console.error('[WorkoutDataProvider] Failed to load more discovery templates:', error);
      setError('Failed to load more templates');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isAuthenticated, discoveryLimit]);

  // Simple refresh function
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    console.log('[WorkoutDataProvider] Manual refresh requested');
    setError(null);
    setIsLoading(true);
    
    // Reset limits and restart subscriptions
    setSocialLimit(5);
    setDiscoveryLimit(6);
    setLastFetch(Date.now());
  }, [isAuthenticated]);

  // Simple hasMore logic - assume there's more if we got the full limit
  const hasMoreWorkouts = socialEvents.length >= socialLimit;
  const hasMoreTemplates = discoveryEvents.length >= discoveryLimit;

  const value: WorkoutDataContextType = {
    socialWorkouts,
    discoveryTemplates,
    workoutIndicators,
    rawEventData,
    isLoading,
    error,
    lastFetch,
    refreshData,
    loadMoreSocialWorkouts,
    loadMoreDiscoveryTemplates,
    hasMoreWorkouts,
    hasMoreTemplates,
    isLoadingMore
  };

  return (
    <WorkoutDataContext.Provider value={value}>
      {children}
    </WorkoutDataContext.Provider>
  );
}
