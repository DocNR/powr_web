/**
 * Enhanced Library Data Hook with NIP-51 Collection Parsing
 * 
 * Combines Universal NDK Caching performance with proper NIP-51 collection filtering.
 * This provides unified library data access with collections integration.
 * 
 * Key Features:
 * - Uses Universal NDK Caching for 70%+ network reduction and sub-100ms performance
 * - Properly parses NIP-51 collections to show only user's curated content
 * - Maintains offline-first functionality with cache strategies
 * - Compatible with existing LibraryTab component structure
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNDKDataWithCaching } from '@/hooks/useNDKDataWithCaching';
import { dataParsingService } from '@/lib/services/dataParsingService';
import type { NDKFilter } from '@nostr-dev-kit/ndk';

// Types for the enhanced hook
export interface LibraryCollectionData {
  id: string;
  name: string;
  description?: string;
  contentRefs: string[];
  authorPubkey: string;
  createdAt: number;
  eventId: string;
}

export interface ExerciseLibraryItem {
  exerciseRef: string;
  exercise: {
    id: string;
    name: string;
    description?: string;
    equipment: string;
    difficulty: string;
    muscleGroups: string[];
    format: string[];
    format_units: string[];
    authorPubkey: string;
    createdAt: number;
    eventId: string;
    hashtags: string[];
  };
}

export interface WorkoutLibraryItem {
  templateRef: string;
  template: {
    id: string;
    name: string;
    description?: string;
    exercises: Array<{
      exerciseRef: string;
      sets?: number;
      reps?: number;
      weight?: number;
    }>;
    estimatedDuration?: number;
    difficulty: string;
    authorPubkey: string;
    createdAt: number;
    eventId: string;
    tags: string[][];
  };
}

export interface CollectionSubscription {
  collectionRef: string;
  collection: {
    name: string;
    description?: string;
    contentRefs: string[];
    authorPubkey: string;
    createdAt: number;
    eventId: string;
  };
}

export interface LibraryDataResult {
  exerciseLibrary: {
    isLoading: boolean;
    isResolving: boolean;
    content: ExerciseLibraryItem[];
    error?: string;
    checkOfflineAvailability?: () => Promise<boolean>;
  };
  workoutLibrary: {
    isLoading: boolean;
    isResolving: boolean;
    content: WorkoutLibraryItem[];
    error?: string;
    checkOfflineAvailability?: () => Promise<boolean>;
  };
  collectionSubscriptions: {
    isLoading: boolean;
    isResolving: boolean;
    content: CollectionSubscription[];
    error?: string;
    checkOfflineAvailability?: () => Promise<boolean>;
  };
  error?: string;
}

/**
 * Enhanced hook that combines Universal NDK Caching with NIP-51 collection parsing
 */
export function useLibraryDataWithCollections(userPubkey: string | undefined): LibraryDataResult {
  const [resolvedContent, setResolvedContent] = useState<{
    exercises: ExerciseLibraryItem[];
    workouts: WorkoutLibraryItem[];
    collections: CollectionSubscription[];
  }>({
    exercises: [],
    workouts: [],
    collections: []
  });
  
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | undefined>();

  // Step 1: Fetch user's specific collections using Universal NDK Caching
  const collectionFilters: NDKFilter[] = useMemo(() => {
    if (!userPubkey) return [];
    return [
      { kinds: [30003], authors: [userPubkey], '#d': ['powr-exercise-list'] },
      { kinds: [30003], authors: [userPubkey], '#d': ['powr-workout-list'] },
      { kinds: [30003], authors: [userPubkey], '#d': ['powr-collection-subscriptions'] }
    ];
  }, [userPubkey]);

  const { 
    events: collectionEvents, 
    isLoading: collectionsLoading, 
    error: collectionsError
  } = useNDKDataWithCaching(collectionFilters, {
    strategy: 'cache-first'
  });

  // Step 2: Parse collections and extract content references
  const parsedCollections = useMemo(() => {
    const exerciseCollection = collectionEvents.find(e => e.tagValue('d') === 'powr-exercise-list');
    const workoutCollection = collectionEvents.find(e => e.tagValue('d') === 'powr-workout-list');
    const subscriptionCollection = collectionEvents.find(e => e.tagValue('d') === 'powr-collection-subscriptions');

    const exerciseRefs = exerciseCollection?.getMatchingTags('a').map(tag => tag[1]) || [];
    const workoutRefs = workoutCollection?.getMatchingTags('a').map(tag => tag[1]) || [];
    const collectionRefs = subscriptionCollection?.getMatchingTags('a').map(tag => tag[1]) || [];

    return {
      exerciseRefs,
      workoutRefs,
      collectionRefs,
      collections: {
        exercise: exerciseCollection ? dataParsingService.parseCollection(exerciseCollection) : null,
        workout: workoutCollection ? dataParsingService.parseCollection(workoutCollection) : null,
        subscription: subscriptionCollection ? dataParsingService.parseCollection(subscriptionCollection) : null
      }
    };
  }, [collectionEvents]);

  // Step 3: Fetch referenced content using Universal NDK Caching
  const contentFilters: NDKFilter[] = useMemo(() => {
    const { exerciseRefs, workoutRefs, collectionRefs } = parsedCollections;
    const filters: NDKFilter[] = [];

    // Create targeted filters for referenced exercises
    if (exerciseRefs.length > 0) {
      const exerciseFilters = exerciseRefs.map(ref => {
        const [kind, pubkey, dTag] = ref.split(':');
        return {
          kinds: [parseInt(kind)],
          authors: [pubkey],
          '#d': [dTag]
        };
      });
      filters.push(...exerciseFilters);
    }

    // Create targeted filters for referenced workouts
    if (workoutRefs.length > 0) {
      const workoutFilters = workoutRefs.map(ref => {
        const [kind, pubkey, dTag] = ref.split(':');
        return {
          kinds: [parseInt(kind)],
          authors: [pubkey],
          '#d': [dTag]
        };
      });
      filters.push(...workoutFilters);
    }

    // Create targeted filters for referenced collections
    if (collectionRefs.length > 0) {
      const collectionFilters = collectionRefs.map(ref => {
        const [kind, pubkey, dTag] = ref.split(':');
        return {
          kinds: [parseInt(kind)],
          authors: [pubkey],
          '#d': [dTag]
        };
      });
      filters.push(...collectionFilters);
    }

    return filters;
  }, [parsedCollections]);

  const { 
    events: contentEvents, 
    isLoading: contentLoading, 
    error: contentError
  } = useNDKDataWithCaching(contentFilters, {
    strategy: 'cache-first'
  });

  // Step 4: Resolve and format content
  useEffect(() => {
    if (collectionsLoading || contentLoading) {
      return;
    }

    if (contentEvents.length === 0 && parsedCollections.exerciseRefs.length === 0 && parsedCollections.workoutRefs.length === 0) {
      // No content to resolve
      setResolvedContent({
        exercises: [],
        workouts: [],
        collections: []
      });
      return;
    }

    setIsResolving(true);
    setResolutionError(undefined);

    try {
      // Parse exercises
      const exercises: ExerciseLibraryItem[] = contentEvents
        .filter(event => event.kind === 33401)
        .map(event => ({
          exerciseRef: `${event.kind}:${event.pubkey}:${event.tagValue('d')}`,
          exercise: {
            id: event.tagValue('d') || event.id,
            name: event.tagValue('title') || event.tagValue('name') || 'Untitled Exercise',
            description: event.content,
            equipment: event.tagValue('equipment') || 'unknown',
            difficulty: event.tagValue('difficulty') || 'intermediate',
            muscleGroups: event.getMatchingTags('t').map(tag => tag[1]).filter(t => t !== 'fitness'),
            format: event.getMatchingTags('format').map(tag => tag[1]),
            format_units: event.getMatchingTags('format_units').map(tag => tag[1]),
            authorPubkey: event.pubkey,
            createdAt: event.created_at || 0,
            eventId: event.id,
            hashtags: event.getMatchingTags('t').map(tag => tag[1])
          }
        }));

      // Parse workout templates
      const workouts: WorkoutLibraryItem[] = contentEvents
        .filter(event => event.kind === 33402)
        .map(event => ({
          templateRef: `${event.kind}:${event.pubkey}:${event.tagValue('d')}`,
          template: {
            id: event.tagValue('d') || event.id,
            name: event.tagValue('title') || event.tagValue('name') || 'Untitled Workout',
            description: event.content,
            exercises: event.getMatchingTags('exercise').map(tag => ({
              exerciseRef: tag[1],
              sets: parseInt(tag[3]) || undefined,
              reps: parseInt(tag[4]) || undefined,
              weight: parseFloat(tag[5]) || undefined
            })),
            estimatedDuration: parseInt(event.tagValue('duration') || '0'),
            difficulty: event.tagValue('difficulty') || 'intermediate',
            authorPubkey: event.pubkey,
            createdAt: event.created_at || 0,
            eventId: event.id,
            tags: event.tags
          }
        }));

      // Parse collections
      const collections: CollectionSubscription[] = contentEvents
        .filter(event => event.kind === 30003)
        .map(event => ({
          collectionRef: `${event.kind}:${event.pubkey}:${event.tagValue('d')}`,
          collection: {
            name: event.tagValue('title') || event.tagValue('name') || 'Untitled Collection',
            description: event.content,
            contentRefs: event.getMatchingTags('a').map(tag => tag[1]),
            authorPubkey: event.pubkey,
            createdAt: event.created_at || 0,
            eventId: event.id
          }
        }));

      setResolvedContent({
        exercises,
        workouts,
        collections
      });

      console.log(`[useLibraryDataWithCollections] ✅ Resolved library content:`, {
        exercises: exercises.length,
        workouts: workouts.length,
        collections: collections.length
      });

    } catch (error) {
      console.error('[useLibraryDataWithCollections] Failed to resolve content:', error);
      setResolutionError(error instanceof Error ? error.message : 'Failed to resolve library content');
    } finally {
      setIsResolving(false);
    }
  }, [contentEvents, collectionsLoading, contentLoading, parsedCollections]);

  // Combine loading states
  const isLoading = collectionsLoading || contentLoading;
  const error = collectionsError || contentError || resolutionError;

  // Create offline availability checker
  const checkOfflineAvailability = useCallback(async () => {
    // For now, return true if we have any cached data
    return collectionEvents.length > 0 || contentEvents.length > 0;
  }, [collectionEvents.length, contentEvents.length]);

  // Helper function to safely extract error message
  const getErrorMessage = (err: Error | string | null | undefined): string | undefined => {
    if (!err) return undefined;
    if (typeof err === 'string') return err;
    return err.message;
  };

  return {
    exerciseLibrary: {
      isLoading,
      isResolving,
      content: resolvedContent.exercises,
      error: getErrorMessage(error),
      checkOfflineAvailability
    },
    workoutLibrary: {
      isLoading,
      isResolving,
      content: resolvedContent.workouts,
      error: getErrorMessage(error),
      checkOfflineAvailability
    },
    collectionSubscriptions: {
      isLoading,
      isResolving,
      content: resolvedContent.collections,
      error: getErrorMessage(error),
      checkOfflineAvailability
    },
    error: getErrorMessage(error)
  };
}

/**
 * Convenience hooks for individual collection types
 */
export function useExerciseLibrary(userPubkey: string | undefined) {
  const { exerciseLibrary } = useLibraryDataWithCollections(userPubkey);
  return exerciseLibrary;
}

export function useWorkoutLibrary(userPubkey: string | undefined) {
  const { workoutLibrary } = useLibraryDataWithCollections(userPubkey);
  return workoutLibrary;
}

export function useCollectionSubscriptions(userPubkey: string | undefined) {
  const { collectionSubscriptions } = useLibraryDataWithCollections(userPubkey);
  return collectionSubscriptions;
}
