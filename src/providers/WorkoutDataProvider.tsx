'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect, useRef } from 'react';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { useIsAuthenticated } from '@/lib/auth/hooks';
import { dataParsingService } from '@/lib/services/dataParsingService';
import type { NDKEvent, NDKFilter, NDKSubscription } from '@nostr-dev-kit/ndk';

// Updated SocialWorkout interface - now template-focused with social proof
interface SocialWorkout {
  id: string;
  title: string; // Template name, not workout record title
  description?: string; // Template description
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>; // Template exercises, not completed sets
  estimatedDuration: number; // Template duration
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author: {
    pubkey: string; // Template author pubkey
    name?: string;
    picture?: string;
  };
  // Social proof - who tried this template
  socialProof: {
    triedBy: string; // Person who completed the workout
    triedByPubkey: string;
    completedAt: Date;
    workoutRecordId: string; // Reference to the 1301 event
  };
  // Template info
  templateId: string;
  templateReference: string;
  eventId?: string; // The 1301 event ID for tracking
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
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  rating?: number;
  calories?: number;
  muscleGroups?: string[];
  level?: string;
  author: {
    pubkey: string;
    name?: string;
    picture?: string;
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
  const [templateCache, setTemplateCache] = useState<Map<string, NDKEvent>>(new Map());
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

  // Helper function to fetch template data for social workouts
  const fetchTemplateForSocialWorkout = useCallback(async (templateReference: string): Promise<NDKEvent | null> => {
    const ndk = getNDKInstance();
    if (!ndk) return null;

    // Check cache first
    if (templateCache.has(templateReference)) {
      return templateCache.get(templateReference)!;
    }

    try {
      const [kind, pubkey, dTag] = templateReference.split(':');
      if (kind !== '33402' || !pubkey || !dTag) {
        console.warn('[WorkoutDataProvider] Invalid template reference:', templateReference);
        return null;
      }

      console.log('[WorkoutDataProvider] Fetching template:', { pubkey: pubkey.slice(0, 8) + '...', dTag });

      const templateEvents = await ndk.fetchEvents({
        kinds: [33402 as number],
        authors: [pubkey],
        '#d': [dTag],
        limit: 1
      });

      const templateEvent = Array.from(templateEvents)[0];
      if (templateEvent) {
        // Cache the template
        setTemplateCache(prev => new Map(prev.set(templateReference, templateEvent)));
        console.log('[WorkoutDataProvider] ✅ Template fetched and cached:', templateReference);
        return templateEvent;
      }

      console.warn('[WorkoutDataProvider] ❌ Template not found:', templateReference);
      return null;
    } catch (error) {
      console.error('[WorkoutDataProvider] Error fetching template:', error);
      return null;
    }
  }, [templateCache]);

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

  // ✅ OPTIMIZED: Use stable event IDs to prevent unnecessary re-parsing
  const socialWorkouts = useMemo(() => {
    // Create stable key from event IDs to prevent unnecessary re-computation
    const eventIds = socialEvents.map(e => e.id).sort().join(',');
    const templateKeys = Array.from(templateCache.keys()).sort().join(',');
    const stableKey = `social_${eventIds}_${templateKeys}`;
    
    return dataParsingService.getCachedParse(stableKey, () => {
      console.log('[WorkoutDataProvider] 🔄 Computing social workouts (cache miss)');
      const processedWorkouts: SocialWorkout[] = [];
      
      for (const event of socialEvents) {
        try {
          // Extract template reference from 1301 event
          const templateTag = event.tags.find(tag => tag[0] === 'template');
          const templateReference = templateTag?.[1];
          
          if (!templateReference) {
            console.warn('[WorkoutDataProvider] No template reference in workout record:', event.id);
            continue;
          }

          // Check if we have the template cached
          const templateEvent = templateCache.get(templateReference);
          if (!templateEvent) {
            // Template not cached yet, fetch it
            fetchTemplateForSocialWorkout(templateReference);
            continue; // Skip this workout for now, will be processed when template is fetched
          }

          // Use DataParsingService with caching for social workout parsing
          const socialWorkout = dataParsingService.getCachedParse(`social_${event.id}`, () => 
            dataParsingService.parseSocialWorkout(event, templateEvent)
          );
          if (!socialWorkout) {
            console.warn('[WorkoutDataProvider] Failed to parse social workout:', event.id);
            continue;
          }

          // Convert to WorkoutDataProvider format (maintaining backward compatibility)
          const providerSocialWorkout: SocialWorkout = {
            id: socialWorkout.id,
            title: socialWorkout.title,
            description: socialWorkout.description,
            exercises: [], // Will be populated from template parsing
            estimatedDuration: Math.round(socialWorkout.duration / 60000) || 30, // Convert ms to minutes
            difficulty: undefined, // Will be set from template
            author: {
              pubkey: socialWorkout.authorPubkey,
              name: socialWorkout.authorPubkey.slice(0, 8) + '...',
            },
            socialProof: {
              triedBy: socialWorkout.authorPubkey.slice(0, 8) + '...',
              triedByPubkey: socialWorkout.authorPubkey,
              completedAt: new Date(socialWorkout.createdAt),
              workoutRecordId: socialWorkout.eventId
            },
            templateId: socialWorkout.templateId || 'unknown-template',
            templateReference,
            eventId: socialWorkout.eventId
          };

          // Parse template for additional details
          const parsedTemplate = dataParsingService.getCachedParse(`template_${templateEvent.id}`, () =>
            dataParsingService.parseWorkoutTemplate(templateEvent)
          );
          if (parsedTemplate) {
            providerSocialWorkout.difficulty = parsedTemplate.difficulty;
            providerSocialWorkout.estimatedDuration = parsedTemplate.estimatedDuration ? 
              Math.round(parsedTemplate.estimatedDuration / 60) : 30;
            
            // Convert template exercises to provider format
            providerSocialWorkout.exercises = parsedTemplate.exercises.map(exercise => ({
              name: exercise.exerciseRef?.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise',
              sets: exercise.sets || 3,
              reps: exercise.reps || 10,
              weight: exercise.weight || 0
            }));
            
            // Update author to template author
            providerSocialWorkout.author = {
              pubkey: parsedTemplate.authorPubkey,
              name: parsedTemplate.authorPubkey.slice(0, 8) + '...',
            };
          }

          processedWorkouts.push(providerSocialWorkout);

        } catch (error) {
          console.warn('[WorkoutDataProvider] Failed to process social workout:', error);
        }
      }

      console.log('[WorkoutDataProvider] ✅ Social workouts computed:', processedWorkouts.length);
      return processedWorkouts;
    });
  }, [socialEvents, templateCache, fetchTemplateForSocialWorkout]);

  // ✅ OPTIMIZED: Use stable event IDs to prevent unnecessary re-parsing
  const discoveryTemplates = useMemo(() => {
    // Create stable key from event IDs to prevent unnecessary re-computation
    const eventIds = discoveryEvents.map(e => e.id).sort().join(',');
    const stableKey = `discovery_${eventIds}`;
    
    return dataParsingService.getCachedParse(stableKey, () => {
      console.log('[WorkoutDataProvider] 🔄 Computing discovery templates (cache miss)');
      
      return discoveryEvents.map((event: NDKEvent) => {
        try {
          // Use DataParsingService for discovery template parsing
          const discoveryWorkout = dataParsingService.getCachedParse(`discovery_${event.id}`, () =>
            dataParsingService.parseDiscoveryTemplate(event)
          );
          if (!discoveryWorkout) {
            console.warn('[WorkoutDataProvider] Failed to parse discovery template:', event.id);
            return null;
          }

          // Convert to WorkoutDataProvider format (maintaining backward compatibility)
          const parsedTemplate = dataParsingService.getCachedParse(`template_${event.id}`, () =>
            dataParsingService.parseWorkoutTemplate(event)
          );
          const exercises = parsedTemplate ? parsedTemplate.exercises.map(exercise => ({
            name: exercise.exerciseRef?.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise',
            sets: exercise.sets || 3,
            reps: exercise.reps || 10,
            weight: exercise.weight || 0
          })) : [];

          return {
            id: discoveryWorkout.id,
            title: discoveryWorkout.title,
            exercises,
            estimatedDuration: discoveryWorkout.estimatedDuration || 30,
            difficulty: discoveryWorkout.difficulty,
            author: {
              pubkey: discoveryWorkout.authorPubkey,
            },
            eventId: discoveryWorkout.eventId,
            eventTags: discoveryWorkout.tags,
            eventKind: event.kind,
            templateRef: `33402:${discoveryWorkout.authorPubkey}:${discoveryWorkout.id}`
          };
        } catch (error) {
          console.warn('[WorkoutDataProvider] Failed to parse discovery template:', error);
          return null;
        }
      }).filter(Boolean) as DiscoveryWorkout[];
    });
  }, [discoveryEvents]);

  // Generate workout indicators from social workouts (now based on template completion)
  const workoutIndicators = useMemo(() => {
    return socialWorkouts.slice(0, 10).map(workout => ({
      date: workout.socialProof.completedAt,
      count: 1,
      type: 'completed' as const
    }));
  }, [socialWorkouts]);

  // ✅ UPDATED: Create raw event data map with template references
  const rawEventData = useMemo(() => {
    const eventMap = new Map<string, Record<string, unknown>>();
    
    // Add social workout events with template references
    socialEvents.forEach((event: NDKEvent) => {
      const templateTag = event.tags.find(tag => tag[0] === 'template');
      const templateReference = templateTag?.[1];
      
      eventMap.set(event.id, {
        type: '1301_workout_record',
        hexId: event.id,
        nevent: event.encode ? event.encode() : 'encode() not available',
        pubkey: event.pubkey,
        created_at: event.created_at,
        tags: event.tags,
        rawEvent: event,
        templateReference: templateReference // Store template reference for WorkoutsTab
      });
    });

    // Add discovery template events (unchanged)
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

  // Trigger template fetching when social events change
  useEffect(() => {
    const fetchMissingTemplates = async () => {
      for (const event of socialEvents) {
        const templateTag = event.tags.find(tag => tag[0] === 'template');
        const templateReference = templateTag?.[1];
        
        if (templateReference && !templateCache.has(templateReference)) {
          await fetchTemplateForSocialWorkout(templateReference);
        }
      }
    };

    if (socialEvents.length > 0) {
      fetchMissingTemplates();
    }
  }, [socialEvents, templateCache, fetchTemplateForSocialWorkout]);

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
