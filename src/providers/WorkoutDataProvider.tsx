'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { useIsAuthenticated } from '@/lib/auth/hooks';
import { dataParsingService } from '@/lib/services/dataParsingService';
import { useDiscoveryData } from '@/hooks/useNDKDataWithCaching';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

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
  // ✅ NEW: Cache-first state management with parallel strategy
  const [templateCache, setTemplateCache] = useState<Map<string, NDKEvent>>(new Map());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [socialLimit, setSocialLimit] = useState(5);
  const [discoveryLimit, setDiscoveryLimit] = useState(6);

  const isAuthenticated = useIsAuthenticated();

  // ✅ NEW: Social workouts using parallel caching strategy
  const socialFilters = useMemo<NDKFilter[]>(() => 
    isAuthenticated ? [{
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number], // 1301 - workout records
      limit: socialLimit
    }] : [], 
    [isAuthenticated, socialLimit]
  );

  const {
    events: socialEvents,
    isLoading: socialLoading,
    error: socialError,
    refetch: refetchSocial,
    lastFetched: socialLastFetched
  } = useDiscoveryData(socialFilters, {
    enabled: isAuthenticated,
    onSuccess: (events) => {
      console.log('[WorkoutDataProvider] ✅ Social events fetched via parallel cache:', events.length);
    },
    onError: (error) => {
      console.error('[WorkoutDataProvider] ❌ Social events fetch failed:', error);
    }
  });

  // ✅ NEW: Discovery templates using parallel caching strategy
  const discoveryFilters = useMemo<NDKFilter[]>(() => 
    isAuthenticated ? [{
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number], // 33402 - workout templates
      limit: discoveryLimit
    }] : [],
    [isAuthenticated, discoveryLimit]
  );

  const {
    events: discoveryEvents,
    isLoading: discoveryLoading,
    error: discoveryError,
    refetch: refetchDiscovery,
    lastFetched: discoveryLastFetched
  } = useDiscoveryData(discoveryFilters, {
    enabled: isAuthenticated,
    onSuccess: (events) => {
      console.log('[WorkoutDataProvider] ✅ Discovery events fetched via parallel cache:', events.length);
    },
    onError: (error) => {
      console.error('[WorkoutDataProvider] ❌ Discovery events fetch failed:', error);
    }
  });

  // Combined loading and error states
  const isLoading = socialLoading || discoveryLoading;
  const error = socialError?.message || discoveryError?.message || null;
  const lastFetch = Math.max(socialLastFetched || 0, discoveryLastFetched || 0);

  // ✅ NEW: Template fetching using cache-first strategy
  const fetchTemplateForSocialWorkout = useCallback(async (templateReference: string): Promise<NDKEvent | null> => {
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

      console.log('[WorkoutDataProvider] Fetching template via cache-first:', { pubkey: pubkey.slice(0, 8) + '...', dTag });

      // ✅ NEW: Use cache-first strategy for template fetching
      const templateFilters: NDKFilter[] = [{
        kinds: [33402 as number],
        authors: [pubkey],
        '#d': [dTag],
        limit: 1
      }];

      // Use our caching hook for template fetching
      const { events } = await new Promise<{ events: NDKEvent[] }>((resolve, reject) => {
        // Create a temporary hook-like fetch using our cache service
        import('@/lib/services/ndkCacheService').then(({ universalNDKCacheService }) => {
          universalNDKCacheService.fetchCacheFirst(templateFilters, { timeout: 5000 })
            .then(events => resolve({ events }))
            .catch(reject);
        });
      });

      const templateEvent = events[0];
      if (templateEvent) {
        // Cache the template
        setTemplateCache(prev => new Map(prev.set(templateReference, templateEvent)));
        console.log('[WorkoutDataProvider] ✅ Template fetched and cached via cache-first:', templateReference);
        return templateEvent;
      }

      console.warn('[WorkoutDataProvider] ❌ Template not found:', templateReference);
      return null;
    } catch (error) {
      console.error('[WorkoutDataProvider] Error fetching template:', error);
      return null;
    }
  }, [templateCache]);

  // ✅ REMOVED: Direct subscription setup - now handled by caching hooks

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
            title: socialWorkout.templateName || socialWorkout.title, // Use template name if available
            description: socialWorkout.description,
            exercises: [], // Will be populated from template parsing
            estimatedDuration: Math.round(socialWorkout.duration / 60000) || 30, // Convert ms to minutes
            difficulty: undefined, // Will be set from template
            author: {
              pubkey: '', // Will be set from template author below
              // Don't set name here - let useProfile hook handle it
            },
            socialProof: {
              triedBy: socialWorkout.authorPubkey.slice(0, 8) + '...', // Fallback display name
              triedByPubkey: socialWorkout.authorPubkey, // Person who completed the workout (from 1301 event)
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
            
            // ✅ FIXED: Set template author as the workout author (for "by" section)
            providerSocialWorkout.author = {
              pubkey: parsedTemplate.authorPubkey, // Template creator
              // Don't set name here - let useProfile hook handle it
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

  // ✅ NEW: Enhanced infinite scroll with cache-first strategy
  const loadMoreSocialWorkouts = useCallback(async () => {
    if (isLoadingMore || !isAuthenticated) return;
    
    console.log('[WorkoutDataProvider] Loading more social workouts via cache...');
    setIsLoadingMore(true);
    
    try {
      const newLimit = socialLimit + 3;
      setSocialLimit(newLimit);
      // Caching hooks will automatically refetch with new limit
    } catch (error) {
      console.error('[WorkoutDataProvider] Failed to load more social workouts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isAuthenticated, socialLimit]);

  const loadMoreDiscoveryTemplates = useCallback(async () => {
    if (isLoadingMore || !isAuthenticated) return;
    
    console.log('[WorkoutDataProvider] Loading more discovery templates via cache...');
    setIsLoadingMore(true);
    
    try {
      const newLimit = discoveryLimit + 3;
      setDiscoveryLimit(newLimit);
      // Caching hooks will automatically refetch with new limit
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isAuthenticated, discoveryLimit]);

  // ✅ NEW: Enhanced refresh with parallel cache strategy
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    console.log('[WorkoutDataProvider] Manual refresh via parallel cache strategy');
    
    try {
      // Use parallel refetch for both social and discovery
      await Promise.all([
        refetchSocial(),
        refetchDiscovery()
      ]);
      console.log('[WorkoutDataProvider] ✅ Parallel refresh completed');
    } catch (error) {
      console.error('[WorkoutDataProvider] ❌ Refresh failed:', error);
    }
  }, [isAuthenticated, refetchSocial, refetchDiscovery]);

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
