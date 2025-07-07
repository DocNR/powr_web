'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { parseWorkoutEvent, type WorkoutEvent } from '@/lib/workout-events';
import { useIsAuthenticated } from '@/lib/auth/hooks';
import type { NDKSubscription, NDKEvent } from '@nostr-dev-kit/ndk';

// Types from WorkoutsTab
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
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  calories: number;
  muscleGroups: string[];
  level: string;
  author: {
    pubkey: string;
    name: string;
    picture: string;
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
  // New infinite scroll functions
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
  const [socialWorkouts, setSocialWorkouts] = useState<SocialWorkout[]>([]);
  const [discoveryTemplates, setDiscoveryTemplates] = useState<DiscoveryWorkout[]>([]);
  const [workoutIndicators, setWorkoutIndicators] = useState<WorkoutIndicator[]>([]);
  const [rawEventData, setRawEventData] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);

  const isAuthenticated = useIsAuthenticated();

  // Real-time subscription refs (using refs to avoid stale closures)
  const socialSubscriptionRef = useRef<NDKSubscription | null>(null);
  const discoverySubscriptionRef = useRef<NDKSubscription | null>(null);
  
  // Olas-inspired deduplication pattern
  const addedSocialIds = useRef(new Set<string>());
  const addedDiscoveryIds = useRef(new Set<string>());
  const socialEosed = useRef(false);
  const discoveryEosed = useRef(false);
  
  // Pagination state for infinite scroll
  const [oldestWorkoutTimestamp, setOldestWorkoutTimestamp] = useState<number>(0);
  const [oldestTemplateTimestamp, setOldestTemplateTimestamp] = useState<number>(0);
  const [hasMoreWorkouts, setHasMoreWorkouts] = useState(true);
  const [hasMoreTemplates, setHasMoreTemplates] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Helper function to convert NDK event to social workout
  const convertToSocialWorkout = useCallback((event: NDKEvent, eventDataMap: Map<string, Record<string, unknown>>): SocialWorkout | null => {
    try {
      console.log('[WorkoutDataProvider] 🔍 DEBUGGING Social Workout Conversion for event:', event.id);
      console.log('[WorkoutDataProvider] 📅 Raw event.created_at:', event.created_at, 'Type:', typeof event.created_at);
      console.log('[WorkoutDataProvider] 📅 Raw event.created_at as Date:', new Date(event.created_at! * 1000));
      console.log('[WorkoutDataProvider] 🏷️ Event tags:', event.tags);
      console.log('[WorkoutDataProvider] 📝 Event content:', event.content);

      const workoutEvent: WorkoutEvent = {
        kind: event.kind!,
        content: event.content || '',
        tags: event.tags,
        created_at: event.created_at!,
        pubkey: event.pubkey,
        id: event.id
      };

      // Store raw event data for click logging
      eventDataMap.set(event.id, {
        type: '1301_workout_record',
        hexId: event.id,
        nevent: event.encode ? event.encode() : 'encode() not available',
        pubkey: event.pubkey,
        created_at: event.created_at,
        tags: event.tags,
        rawEvent: event
      });

      console.log('[WorkoutDataProvider] 🔄 Calling parseWorkoutEvent...');
      const parsed = parseWorkoutEvent(workoutEvent);
      console.log('[WorkoutDataProvider] ✅ Parsed workout event:', {
        id: parsed.id,
        title: parsed.title,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        duration: parsed.duration,
        exerciseCount: parsed.exercises.length
      });

      // Debug timestamp conversion
      const endTimeMs = parsed.endTime * 1000;
      const completedAtDate = new Date(endTimeMs);
      console.log('[WorkoutDataProvider] 📅 Timestamp conversion:');
      console.log('  - parsed.endTime (Unix):', parsed.endTime);
      console.log('  - endTimeMs:', endTimeMs);
      console.log('  - completedAtDate:', completedAtDate);
      console.log('  - completedAtDate.getTime():', completedAtDate.getTime());
      console.log('  - Is valid date?', !isNaN(completedAtDate.getTime()));

      // Validate the date
      if (isNaN(completedAtDate.getTime())) {
        console.error('[WorkoutDataProvider] ❌ Invalid date created from endTime:', parsed.endTime);
        return null;
      }

      // Convert to social workout format
      const socialWorkout: SocialWorkout = {
        id: parsed.id,
        title: parsed.title,
        completedAt: completedAtDate,
        duration: Math.floor(parsed.duration / 60), // Convert to minutes
        exercises: parsed.exercises.map(ex => ({
          name: `${parsed.exercises.length} exercises`, // Simple count instead of fake names
          sets: [{
            reps: parseInt(ex.reps),
            weight: parseInt(ex.weight),
            rpe: parseInt(ex.rpe)
          }]
        })),
        author: {
          pubkey: parsed.pubkey,
          name: `${parsed.pubkey.slice(0, 8)}...`,
          picture: '/assets/workout-record-fallback.jpg'
        },
        notes: parsed.content || 'Completed workout',
        eventId: parsed.eventId
      };

      console.log('[WorkoutDataProvider] ✅ Created social workout:', {
        id: socialWorkout.id,
        title: socialWorkout.title,
        completedAt: socialWorkout.completedAt,
        duration: socialWorkout.duration,
        exerciseCount: socialWorkout.exercises.length
      });

      return socialWorkout;
    } catch (parseError) {
      console.error('[WorkoutDataProvider] ❌ Failed to parse workout:', event.id, parseError);
      console.error('[WorkoutDataProvider] ❌ Event details:', {
        kind: event.kind,
        created_at: event.created_at,
        tags: event.tags,
        content: event.content
      });
      return null;
    }
  }, []);

  // Helper function to convert NDK event to discovery template
  const convertToDiscoveryTemplate = useCallback((event: NDKEvent, eventDataMap: Map<string, Record<string, unknown>>): DiscoveryWorkout | null => {
    try {
      const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
      if (!dTag) return null;

      // Store raw template data for click logging
      const templateData = {
        type: '33402_workout_template',
        hexId: event.id,
        naddr: event.encode ? event.encode() : 'encode() not available',
        pubkey: event.pubkey,
        created_at: event.created_at,
        tags: event.tags,
        rawEvent: event
      };
      
      // Store using both the d-tag (template ID) and the hex event ID
      eventDataMap.set(event.id, templateData);
      eventDataMap.set(dTag, templateData);

      // Parse template directly
      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const name = tagMap.get('title')?.[1] || tagMap.get('name')?.[1] || 'Untitled Template';
      const difficulty = tagMap.get('difficulty')?.[1] as 'beginner' | 'intermediate' | 'advanced' | undefined;
      const estimatedDuration = tagMap.get('duration')?.[1] ? parseInt(tagMap.get('duration')![1]) : undefined;
      
      // Extract exercise references
      const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
      const exercises = exerciseTags.map(tag => ({
        exerciseRef: tag[1],
        sets: parseInt(tag[2]) || 3,
        reps: parseInt(tag[3]) || 10,
        weight: tag[4] ? parseInt(tag[4]) : undefined
      }));

      const discoveryWorkout: DiscoveryWorkout = {
        id: dTag,
        title: name,
        exercises: exercises.map((ex) => ({
          name: ex.exerciseRef.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise',
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0
        })),
        estimatedDuration: Math.round((estimatedDuration || 1800) / 60), // Convert to minutes
        difficulty: difficulty || 'intermediate',
        rating: 8.5 + Math.random() * 1.5, // Mock rating for now
        calories: Math.round(((estimatedDuration || 1800) / 60) * 4.5), // Rough estimate
        muscleGroups: ['full-body'], // Could be extracted from exercise data
        level: difficulty === 'beginner' ? 'low' : difficulty === 'advanced' ? 'hard' : 'moderate',
        author: {
          pubkey: event.pubkey,
          name: `${event.pubkey.slice(0, 8)}...`,
          picture: '/assets/workout-template-fallback.jpg'
        },
        eventId: event.id,
        eventTags: event.tags
      };

      return discoveryWorkout;
    } catch (parseError) {
      console.warn('[WorkoutDataProvider] Failed to parse template:', event.id, parseError);
      return null;
    }
  }, []);

  const loadNostrData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const ndk = getNDKInstance();
      if (!ndk) {
        console.warn('[WorkoutDataProvider] NDK not initialized');
        setIsLoading(false);
        return;
      }

      console.log('[WorkoutDataProvider] Setting up real-time subscriptions...');

      // Clean up existing subscriptions and reset deduplication state
      if (socialSubscriptionRef.current) {
        socialSubscriptionRef.current.stop();
        socialSubscriptionRef.current = null;
      }
      if (discoverySubscriptionRef.current) {
        discoverySubscriptionRef.current.stop();
        discoverySubscriptionRef.current = null;
      }
      
      // Reset Olas-style deduplication state
      addedSocialIds.current.clear();
      addedDiscoveryIds.current.clear();
      socialEosed.current = false;
      discoveryEosed.current = false;

      const eventDataMap = new Map();

      // Create real-time subscription for workout records (Kind 1301) - Social Feed
      console.log('[WorkoutDataProvider] Creating social feed subscription...');
      const socialSub = ndk.subscribe({
        kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number],
        '#t': ['fitness'],
        limit: 5, // Small initial load for testing with current data volume
      }, {
        closeOnEose: false, // Keep subscription open for real-time updates
        groupableDelay: 100 // Batch subscriptions for performance
      });

      socialSubscriptionRef.current = socialSub;

      // Track initial load vs real-time updates
      const initialSocialWorkouts: SocialWorkout[] = [];

      // Set up real-time event handler for social feed with Olas-style deduplication
      socialSub.on('event', (event: NDKEvent) => {
        console.log('[WorkoutDataProvider] Social workout event received:', event.id);
        
        // Olas-style deduplication check
        const eventId = event.id;
        if (addedSocialIds.current.has(eventId)) {
          console.log('[WorkoutDataProvider] Social event already processed:', eventId);
          return;
        }
        addedSocialIds.current.add(eventId);
        
        const socialWorkout = convertToSocialWorkout(event, eventDataMap);
        if (socialWorkout) {
          if (!socialEosed.current) {
            // During initial load, collect events
            initialSocialWorkouts.push(socialWorkout);
          } else {
            // Real-time update: add to top of existing list
            setSocialWorkouts(prev => {
              const updated = [socialWorkout, ...prev];
              return updated.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()).slice(0, 10);
            });
          }
        }
      });

      socialSub.on('eose', () => {
        console.log('[WorkoutDataProvider] Social feed initial load complete');
        if (!socialEosed.current) {
          // Sort and set initial social workouts
          initialSocialWorkouts.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
          setSocialWorkouts(initialSocialWorkouts.slice(0, 5));
          
          // Track oldest timestamp for pagination
          if (initialSocialWorkouts.length > 0) {
            const oldest = Math.min(...initialSocialWorkouts.map(w => w.completedAt.getTime() / 1000));
            setOldestWorkoutTimestamp(oldest);
          }
          
          // Mark EOSE complete for real-time behavior
          socialEosed.current = true;
        }
      });

      // Create real-time subscription for workout templates (Kind 33402) - Discovery Feed
      console.log('[WorkoutDataProvider] Creating discovery feed subscription...');
      const discoverySub = ndk.subscribe({
        kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
        limit: 6, // Small initial load for testing
      }, {
        closeOnEose: false, // Keep subscription open for real-time updates
        groupableDelay: 100 // Batch subscriptions for performance
      });

      discoverySubscriptionRef.current = discoverySub;

      // Track initial load vs real-time updates
      const initialDiscoveryTemplates: DiscoveryWorkout[] = [];

      // Set up real-time event handler for discovery feed with Olas-style deduplication
      discoverySub.on('event', (event: NDKEvent) => {
        console.log('[WorkoutDataProvider] Discovery template event received:', event.id);
        
        // Olas-style deduplication check
        const eventId = event.id;
        if (addedDiscoveryIds.current.has(eventId)) {
          console.log('[WorkoutDataProvider] Discovery event already processed:', eventId);
          return;
        }
        addedDiscoveryIds.current.add(eventId);
        
        const discoveryTemplate = convertToDiscoveryTemplate(event, eventDataMap);
        if (discoveryTemplate) {
          if (!discoveryEosed.current) {
            // During initial load, collect events
            initialDiscoveryTemplates.push(discoveryTemplate);
          } else {
            // Real-time update: add to top of existing list
            setDiscoveryTemplates(prev => {
              const updated = [discoveryTemplate, ...prev];
              return updated.sort((a, b) => b.rating - a.rating).slice(0, 10);
            });
          }
        }
      });

      discoverySub.on('eose', () => {
        console.log('[WorkoutDataProvider] Discovery feed initial load complete');
        if (!discoveryEosed.current) {
          // Sort and set initial discovery templates
          initialDiscoveryTemplates.sort((a, b) => b.rating - a.rating);
          setDiscoveryTemplates(initialDiscoveryTemplates.slice(0, 6));
          
          // Track oldest timestamp for pagination
          if (initialDiscoveryTemplates.length > 0) {
            const oldest = Math.min(...initialDiscoveryTemplates.map(t => {
              if (t.eventId) {
                const eventData = eventDataMap.get(t.eventId);
                return (eventData?.created_at as number) || Date.now() / 1000;
              }
              return Date.now() / 1000;
            }));
            setOldestTemplateTimestamp(oldest);
          }
          
          // Mark EOSE complete for real-time behavior
          discoveryEosed.current = true;
        }
      });

      // Generate workout indicators from social workouts (will update when socialWorkouts changes)
      // This will be handled in a separate useEffect

      // Store all event data for click logging
      setRawEventData(eventDataMap);
      setLastFetch(Date.now());

      console.log('[WorkoutDataProvider] Real-time subscriptions setup complete');

    } catch (error) {
      console.error('[WorkoutDataProvider] Failed to setup subscriptions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load workout data');
    } finally {
      setIsLoading(false);
    }
  }, [convertToSocialWorkout, convertToDiscoveryTemplate]);

  // Update workout indicators when social workouts change
  useEffect(() => {
    const indicators: WorkoutIndicator[] = socialWorkouts.slice(0, 10).map(workout => ({
      date: workout.completedAt,
      count: 1,
      type: 'completed' as const
    }));
    setWorkoutIndicators(indicators);
  }, [socialWorkouts]);

  // Load more social workouts (infinite scroll)
  const loadMoreSocialWorkouts = useCallback(async () => {
    if (isLoadingMore || !hasMoreWorkouts) return;
    
    setIsLoadingMore(true);
    
    try {
      const ndk = getNDKInstance();
      if (!ndk) return;

      const olderEvents = await ndk.fetchEvents({
        kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number],
        '#t': ['fitness'],
        limit: 3, // Small page size for testing
        until: oldestWorkoutTimestamp
      });
      
      if (olderEvents.size === 0) {
        setHasMoreWorkouts(false);
      } else {
        const eventDataMap = new Map(rawEventData);
        const newWorkouts: SocialWorkout[] = [];
        
        for (const event of Array.from(olderEvents)) {
          // Check if we've already processed this event ID
          if (addedSocialIds.current.has(event.id)) {
            console.log('[WorkoutDataProvider] Skipping duplicate workout in infinite scroll:', event.id);
            continue;
          }
          
          const socialWorkout = convertToSocialWorkout(event, eventDataMap);
          if (socialWorkout) {
            // Add to deduplication set
            addedSocialIds.current.add(event.id);
            newWorkouts.push(socialWorkout);
          }
        }
        
        if (newWorkouts.length > 0) {
          setSocialWorkouts(prev => [...prev, ...newWorkouts]);
          setRawEventData(eventDataMap);
          
          // Update oldest timestamp
          const oldest = Math.min(...newWorkouts.map(w => w.completedAt.getTime() / 1000));
          setOldestWorkoutTimestamp(oldest);
        }
      }
    } catch (error) {
      console.error('[WorkoutDataProvider] Failed to load more workouts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreWorkouts, oldestWorkoutTimestamp, rawEventData, convertToSocialWorkout]);

  // Load more discovery templates (infinite scroll)
  const loadMoreDiscoveryTemplates = useCallback(async () => {
    if (isLoadingMore || !hasMoreTemplates) return;
    
    console.log('[WorkoutDataProvider] 🔄 DEBUGGING Infinite Scroll - Discovery Templates');
    console.log('[WorkoutDataProvider] 📅 Current oldestTemplateTimestamp:', oldestTemplateTimestamp);
    console.log('[WorkoutDataProvider] 📅 Current oldestTemplateTimestamp as Date:', new Date(oldestTemplateTimestamp * 1000));
    console.log('[WorkoutDataProvider] 🔢 Current template count:', discoveryTemplates.length);
    
    setIsLoadingMore(true);
    
    try {
      const ndk = getNDKInstance();
      if (!ndk) return;

      const fetchQuery = {
        kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
        limit: 3, // Small page size for testing
        until: oldestTemplateTimestamp
      };
      
      console.log('[WorkoutDataProvider] 🔍 Fetching with query:', fetchQuery);

      const olderEvents = await ndk.fetchEvents(fetchQuery);
      
      console.log('[WorkoutDataProvider] 📦 Fetched events count:', olderEvents.size);
      console.log('[WorkoutDataProvider] 📦 Fetched event IDs:', Array.from(olderEvents).map(e => e.id));
      console.log('[WorkoutDataProvider] 📦 Fetched event timestamps:', Array.from(olderEvents).map(e => ({
        id: e.id,
        created_at: e.created_at,
        date: new Date(e.created_at! * 1000)
      })));
      
      if (olderEvents.size === 0) {
        console.log('[WorkoutDataProvider] ❌ No more templates available - setting hasMoreTemplates to false');
        setHasMoreTemplates(false);
      } else {
        const eventDataMap = new Map(rawEventData);
        const newTemplates: DiscoveryWorkout[] = [];
        let duplicateCount = 0;
        
        for (const event of Array.from(olderEvents)) {
          // Check if we've already processed this event ID
          if (addedDiscoveryIds.current.has(event.id)) {
            console.log('[WorkoutDataProvider] Skipping duplicate template in infinite scroll:', event.id);
            duplicateCount++;
            continue;
          }
          
          const discoveryTemplate = convertToDiscoveryTemplate(event, eventDataMap);
          if (discoveryTemplate) {
            // Add to deduplication set
            addedDiscoveryIds.current.add(event.id);
            newTemplates.push(discoveryTemplate);
          }
        }
        
        console.log('[WorkoutDataProvider] 📊 Processing results:');
        console.log('  - Total fetched:', olderEvents.size);
        console.log('  - Duplicates skipped:', duplicateCount);
        console.log('  - New templates:', newTemplates.length);
        
        if (newTemplates.length > 0) {
          setDiscoveryTemplates(prev => [...prev, ...newTemplates]);
          setRawEventData(eventDataMap);
          
          // Update oldest timestamp
          const oldest = Math.min(...newTemplates.map(t => {
            if (t.eventId) {
              const eventData = eventDataMap.get(t.eventId);
              return (eventData?.created_at as number) || Date.now() / 1000;
            }
            return Date.now() / 1000;
          }));
          
          console.log('[WorkoutDataProvider] 📅 Updating oldestTemplateTimestamp:');
          console.log('  - Previous:', oldestTemplateTimestamp, new Date(oldestTemplateTimestamp * 1000));
          console.log('  - New:', oldest, new Date(oldest * 1000));
          
          setOldestTemplateTimestamp(oldest);
        } else if (duplicateCount === olderEvents.size) {
          // All events were duplicates - we need to move the timestamp window
          console.log('[WorkoutDataProvider] ⚠️ All events were duplicates - moving timestamp window');
          const eventTimestamps = Array.from(olderEvents).map(e => e.created_at!);
          const oldestFetched = Math.min(...eventTimestamps);
          
          console.log('[WorkoutDataProvider] 📅 Moving timestamp window:');
          console.log('  - Previous:', oldestTemplateTimestamp, new Date(oldestTemplateTimestamp * 1000));
          console.log('  - Oldest fetched:', oldestFetched, new Date(oldestFetched * 1000));
          console.log('  - Setting to:', oldestFetched - 1, new Date((oldestFetched - 1) * 1000));
          
          setOldestTemplateTimestamp(oldestFetched - 1); // Move window past these events
        }
      }
    } catch (error) {
      console.error('[WorkoutDataProvider] Failed to load more templates:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreTemplates, oldestTemplateTimestamp, rawEventData, convertToDiscoveryTemplate, discoveryTemplates.length]);

  const refreshData = useCallback(async () => {
    console.log('[WorkoutDataProvider] Manual refresh requested');
    await loadNostrData();
  }, [loadNostrData]);

  // Load data on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadNostrData();
    }
  }, [isAuthenticated]); // Remove loadNostrData from dependencies to prevent re-runs

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (socialSubscriptionRef.current) {
        socialSubscriptionRef.current.stop();
      }
      if (discoverySubscriptionRef.current) {
        discoverySubscriptionRef.current.stop();
      }
    };
  }, []);

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
