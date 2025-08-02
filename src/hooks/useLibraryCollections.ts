/**
 * Library Collections Hook
 * 
 * React hooks for managing library collections using NDK singleton pattern.
 * Integrates with libraryManagementService for optimized performance.
 * 
 * Follows ndk-best-practices.md - singleton pattern with direct NDK operations.
 * Uses standardized POWR collection d-tags for consistent user experience.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getNDKInstance } from '@/lib/ndk';
import { NDKFilter } from '@nostr-dev-kit/ndk';
import { 
  libraryManagementService, 
  POWR_COLLECTION_DTAGS,
  type POWRCollectionType,
  type LibraryCollection,
  type LibraryState,
  type ExerciseLibraryItem,
  type WorkoutLibraryItem,
  type CollectionSubscription
} from '@/lib/services/libraryManagement';
import { dataParsingService } from '@/lib/services/dataParsingService';

// Hook for individual library collection type
export function useLibraryCollection(userPubkey: string | undefined, collectionType: POWRCollectionType) {
  const [collection, setCollection] = useState<LibraryCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dTag = POWR_COLLECTION_DTAGS[collectionType];

  // Real-time subscription following WorkoutHistoryProvider pattern
  useEffect(() => {
    if (!userPubkey) {
      setCollection(null);
      return;
    }

    const ndk = getNDKInstance();
    if (!ndk) {
      setError('NDK not initialized');
      return;
    }

    console.log(`[useLibraryCollection] Setting up ${collectionType} subscription for user:`, userPubkey.slice(0, 8));
    setIsLoading(true);
    setError(null);

    const filter: NDKFilter = {
      kinds: [30003],
      authors: [userPubkey],
      '#d': [dTag]
    };

    // Use NDK singleton subscribe method (following WorkoutHistoryProvider pattern)
    const subscription = ndk.subscribe([filter]);

    subscription.on('event', (event) => {
      console.log(`[useLibraryCollection] ${collectionType} collection event received:`, event.id);
      
      const parsedCollection = dataParsingService.parseCollection(event);
      
      if (parsedCollection) {
        const libraryCollection: LibraryCollection = {
          id: parsedCollection.id,
          name: parsedCollection.name,
          description: parsedCollection.description,
          dTag,
          contentRefs: parsedCollection.contentRefs,
          authorPubkey: parsedCollection.authorPubkey,
          createdAt: parsedCollection.createdAt,
          eventId: parsedCollection.eventId,
          itemCount: parsedCollection.contentRefs.length
        };
        
        setCollection(libraryCollection);
        setError(null);
      } else {
        console.warn(`[useLibraryCollection] Failed to parse ${collectionType} collection`);
        setError('Failed to parse collection');
      }
    });

    subscription.on('eose', () => {
      console.log(`[useLibraryCollection] ${collectionType} collection EOSE received`);
      setIsLoading(false);
    });

    // Cleanup function
    return () => {
      console.log(`[useLibraryCollection] Cleaning up ${collectionType} subscription`);
      subscription.stop();
    };
  }, [userPubkey, collectionType, dTag]);

  // Add item to collection
  const addItem = useCallback(async (contentRef: string) => {
    if (!userPubkey) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedCollection = await libraryManagementService.addToLibraryCollection(
        userPubkey,
        collectionType,
        contentRef
      );
      
      console.log(`[useLibraryCollection] ✅ Added item to ${collectionType}:`, contentRef);
      // Collection will be updated via subscription
      return updatedCollection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      setError(errorMessage);
      console.error(`[useLibraryCollection] Failed to add item to ${collectionType}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userPubkey, collectionType]);

  // Create new collection
  const createCollection = useCallback(async (initialContentRefs: string[] = []) => {
    if (!userPubkey) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newCollection = await libraryManagementService.createLibraryCollection(
        userPubkey,
        collectionType,
        initialContentRefs
      );
      
      console.log(`[useLibraryCollection] ✅ Created ${collectionType} collection`);
      // Collection will be updated via subscription
      return newCollection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      setError(errorMessage);
      console.error(`[useLibraryCollection] Failed to create ${collectionType} collection:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userPubkey, collectionType]);

  return {
    collection,
    isLoading,
    error,
    isEmpty: !collection || collection.itemCount === 0,
    addItem,
    createCollection
  };
}

// Hook for resolved library content with full dependency chain
export function useLibraryContent(collection: LibraryCollection | null) {
  const [content, setContent] = useState<{
    exercises: ExerciseLibraryItem[];
    workouts: WorkoutLibraryItem[];
    collections: CollectionSubscription[];
  }>({
    exercises: [],
    workouts: [],
    collections: []
  });
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionTime, setResolutionTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolve collection content when collection changes
  useEffect(() => {
    if (!collection || collection.contentRefs.length === 0) {
      setContent({ exercises: [], workouts: [], collections: [] });
      setResolutionTime(null);
      setError(null);
      return;
    }

    const resolveContent = async () => {
      setIsResolving(true);
      setError(null);

      try {
        const resolved = await libraryManagementService.resolveLibraryContent(collection);
        
        setContent({
          exercises: resolved.exercises || [],
          workouts: resolved.workouts || [],
          collections: [] // Collection subscriptions don't have nested collections
        });
        setResolutionTime(0); // Service doesn't return timing info yet
        
        console.log(`[useLibraryContent] ✅ Resolved ${collection.name}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to resolve content';
        setError(errorMessage);
        console.error('[useLibraryContent] Failed to resolve collection content:', err);
      } finally {
        setIsResolving(false);
      }
    };

    resolveContent();
  }, [collection]);

  return {
    content,
    isResolving,
    resolutionTime,
    error,
    isEmpty: (content.exercises?.length || 0) === 0 && 
             (content.workouts?.length || 0) === 0 && 
             (content.collections?.length || 0) === 0
  };
}

// Main hook for complete library state across all three collection types
export function useLibraryCollections(userPubkey: string | undefined) {
  // Individual collection hooks
  const exerciseLibrary = useLibraryCollection(userPubkey, 'EXERCISE_LIBRARY');
  const workoutLibrary = useLibraryCollection(userPubkey, 'WORKOUT_LIBRARY');
  const collectionSubscriptions = useLibraryCollection(userPubkey, 'COLLECTION_SUBSCRIPTIONS');

  // Resolved content for each collection
  const exerciseContent = useLibraryContent(exerciseLibrary.collection);
  const workoutContent = useLibraryContent(workoutLibrary.collection);
  const subscriptionContent = useLibraryContent(collectionSubscriptions.collection);

  // Combined library state
  const libraryState: LibraryState = useMemo(() => {
    const isLoading = exerciseLibrary.isLoading || workoutLibrary.isLoading || collectionSubscriptions.isLoading ||
                     exerciseContent.isResolving || workoutContent.isResolving || subscriptionContent.isResolving;

    const isEmpty = exerciseLibrary.isEmpty && workoutLibrary.isEmpty && collectionSubscriptions.isEmpty;

    return {
      exercises: exerciseContent.content.exercises || [],
      workouts: workoutContent.content.workouts || [],
      collections: subscriptionContent.content.collections || [],
      isLoading,
      isEmpty,
      lastUpdated: Date.now()
    };
  }, [
    exerciseLibrary, workoutLibrary, collectionSubscriptions,
    exerciseContent, workoutContent, subscriptionContent
  ]);

  // Combined error state
  const error = exerciseLibrary.error || workoutLibrary.error || collectionSubscriptions.error ||
                exerciseContent.error || workoutContent.error || subscriptionContent.error;

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const resolutionTimes = [
      exerciseContent.resolutionTime,
      workoutContent.resolutionTime,
      subscriptionContent.resolutionTime
    ].filter(time => time !== null) as number[];

    return {
      totalResolutionTime: resolutionTimes.reduce((sum, time) => sum + time, 0),
      averageResolutionTime: resolutionTimes.length > 0 ? 
        resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length : 0,
      maxResolutionTime: resolutionTimes.length > 0 ? Math.max(...resolutionTimes) : 0
    };
  }, [exerciseContent.resolutionTime, workoutContent.resolutionTime, subscriptionContent.resolutionTime]);

  // Convenience methods for adding items to specific collections
  const addToExerciseLibrary = useCallback((exerciseRef: string) => {
    return exerciseLibrary.addItem(exerciseRef);
  }, [exerciseLibrary.addItem]);

  const addToWorkoutLibrary = useCallback((workoutRef: string) => {
    return workoutLibrary.addItem(workoutRef);
  }, [workoutLibrary.addItem]);

  const subscribeToCollection = useCallback((collectionRef: string) => {
    return collectionSubscriptions.addItem(collectionRef);
  }, [collectionSubscriptions.addItem]);

  return {
    // Individual collections
    exerciseLibrary: {
      ...exerciseLibrary,
      content: exerciseContent.content.exercises,
      isResolving: exerciseContent.isResolving,
      resolutionTime: exerciseContent.resolutionTime
    },
    workoutLibrary: {
      ...workoutLibrary,
      content: workoutContent.content.workouts,
      isResolving: workoutContent.isResolving,
      resolutionTime: workoutContent.resolutionTime
    },
    collectionSubscriptions: {
      ...collectionSubscriptions,
      content: subscriptionContent.content.collections,
      isResolving: subscriptionContent.isResolving,
      resolutionTime: subscriptionContent.resolutionTime
    },

    // Combined state
    libraryState,
    error,
    performanceMetrics,

    // Convenience methods
    addToExerciseLibrary,
    addToWorkoutLibrary,
    subscribeToCollection
  };
}

// Hook for checking if user needs onboarding (empty library)
export function useLibraryOnboardingCheck(userPubkey: string | undefined) {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!userPubkey) {
      setNeedsOnboarding(null);
      return;
    }

    const checkOnboardingNeeded = async () => {
      setIsChecking(true);
      
      try {
        const isEmpty = await libraryManagementService.isLibraryEmpty(userPubkey);
        setNeedsOnboarding(isEmpty);
        
        console.log(`[useLibraryOnboardingCheck] User ${userPubkey.slice(0, 8)} needs onboarding:`, isEmpty);
      } catch (error) {
        console.error('[useLibraryOnboardingCheck] Failed to check onboarding status:', error);
        // Default to not needing onboarding on error to avoid unnecessary prompts
        setNeedsOnboarding(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingNeeded();
  }, [userPubkey]);

  return {
    needsOnboarding,
    isChecking
  };
}

// Hook for bookmark functionality - adding items to appropriate library collections
export function useLibraryBookmarks(userPubkey: string | undefined) {
  const { addToExerciseLibrary, addToWorkoutLibrary } = useLibraryCollections(userPubkey);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Bookmark exercise
  const bookmarkExercise = useCallback(async (exerciseRef: string) => {
    if (!userPubkey) {
      throw new Error('User not authenticated');
    }

    setIsBookmarking(true);
    try {
      await addToExerciseLibrary(exerciseRef);
      console.log('[useLibraryBookmarks] ✅ Bookmarked exercise:', exerciseRef);
    } finally {
      setIsBookmarking(false);
    }
  }, [userPubkey, addToExerciseLibrary]);

  // Bookmark workout template
  const bookmarkWorkout = useCallback(async (workoutRef: string) => {
    if (!userPubkey) {
      throw new Error('User not authenticated');
    }

    setIsBookmarking(true);
    try {
      await addToWorkoutLibrary(workoutRef);
      console.log('[useLibraryBookmarks] ✅ Bookmarked workout:', workoutRef);
    } finally {
      setIsBookmarking(false);
    }
  }, [userPubkey, addToWorkoutLibrary]);

  // Generic bookmark function that determines type from reference
  const bookmark = useCallback(async (contentRef: string) => {
    const [kind] = contentRef.split(':');
    
    if (kind === '33401') {
      return bookmarkExercise(contentRef);
    } else if (kind === '33402') {
      return bookmarkWorkout(contentRef);
    } else {
      throw new Error(`Unsupported content type for bookmarking: ${kind}`);
    }
  }, [bookmarkExercise, bookmarkWorkout]);

  return {
    bookmark,
    bookmarkExercise,
    bookmarkWorkout,
    isBookmarking
  };
}
