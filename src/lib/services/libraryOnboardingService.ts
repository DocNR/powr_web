/**
 * Library Onboarding Service
 * 
 * Starter content setup and validation for new users.
 * Extracted from LibraryManagementService following Single Responsibility Principle.
 * 
 * Responsibilities:
 * - Starter library setup
 * - Starter content validation
 * - Empty library detection
 * - Recommended content discovery
 * 
 * Follows service-layer-architecture.md - pure business logic only, no NDK operations.
 */

import type { NDKFilter } from '@nostr-dev-kit/ndk';
import { dependencyResolutionService } from './dependencyResolution';
import { dataParsingService } from './dataParsingService';
import { universalNDKCacheService } from './ndkCacheService';
import { libraryCollectionService } from './libraryCollectionService';
import type {
  StarterContentValidation,
  StarterLibraryResult,
  POWRCollectionType
} from './types/libraryTypes';
import { PHASE_1_TEST_PUBKEY } from './types/libraryTypes';

/**
 * Library Onboarding Service
 * 
 * Provides starter content setup and validation for new users:
 * - Validates available starter content from Phase 1 test publisher
 * - Sets up the three standard collections with validated content
 * - Detects empty libraries for onboarding trigger logic
 * - Provides recommended content for user discovery
 */
export class LibraryOnboardingService {

  /**
   * Setup starter library for new users
   * Creates the three standard collections with validated starter content
   */
  async setupStarterLibrary(userPubkey: string): Promise<StarterLibraryResult> {
    const startTime = Date.now();
    console.log('[LibraryOnboardingService] Setting up starter library for user:', userPubkey.slice(0, 8));
    
    try {
      // First, validate that we have starter content available
      const validation = await this.validateStarterContent();
      if (!validation.validCollections || validation.validCollections.length === 0) {
        throw new Error('No starter collections available for setup');
      }

      console.log('[LibraryOnboardingService] Creating starter collections...');

      const results: StarterLibraryResult = {};

      // 1. Create exercise library collection with starter exercises
      const exerciseCollection = validation.validCollections.find(c => 
        c.name.toLowerCase().includes('exercise')
      );
      
      if (exerciseCollection) {
        console.log('[LibraryOnboardingService] Creating exercise library with', exerciseCollection.contentRefs.length, 'exercises');
        results.exerciseLibrary = await libraryCollectionService.createCollection(
          userPubkey,
          'EXERCISE_LIBRARY',
          exerciseCollection.contentRefs
        );
      }

      // 2. Create workout library collection with starter workouts
      const workoutCollection = validation.validCollections.find(c => 
        c.name.toLowerCase().includes('strength') || c.name.toLowerCase().includes('workout')
      );
      
      if (workoutCollection) {
        console.log('[LibraryOnboardingService] Creating workout library with', workoutCollection.contentRefs.length, 'workouts');
        results.workoutLibrary = await libraryCollectionService.createCollection(
          userPubkey,
          'WORKOUT_LIBRARY',
          workoutCollection.contentRefs
        );
      }

      // 3. Create collection subscriptions with starter collections
      const collectionRefs = validation.validCollections.map(collection => {
        // Extract collection reference from the first item or collection metadata
        // For now, we'll create references to the POWR test collections
        const pubkey = PHASE_1_TEST_PUBKEY;
        if (collection.name.toLowerCase().includes('exercise')) {
          return `30003:${pubkey}:powr-test-exercise-library`;
        } else {
          return `30003:${pubkey}:powr-test-strength-bodyweight-collection`;
        }
      });

      console.log('[LibraryOnboardingService] Creating collection subscriptions with', collectionRefs.length, 'collections');
      results.collectionSubscriptions = await libraryCollectionService.createCollection(
        userPubkey,
        'COLLECTION_SUBSCRIPTIONS',
        collectionRefs
      );

      results.setupTime = Date.now() - startTime;
      console.log('[LibraryOnboardingService] ✅ Starter library setup complete in', results.setupTime, 'ms');
      
      return results;
      
    } catch (error) {
      console.error('[LibraryOnboardingService] Failed to setup starter library:', error);
      throw error;
    }
  }

  /**
   * Validate and discover POWR starter content
   * Uses DataParsingService to ensure NIP-101e compliance
   */
  async validateStarterContent(): Promise<StarterContentValidation> {
    const startTime = Date.now();
    console.log('[LibraryOnboardingService] Validating POWR starter content...');

    try {
      // Discover Phase 1 test collections (extracted from WorkoutListManager)
      const filter: NDKFilter = {
        kinds: [30003],
        authors: [PHASE_1_TEST_PUBKEY],
        '#t': ['fitness']
      };

      const collectionEvents = await universalNDKCacheService.fetchCacheFirst([filter], { timeout: 3000 });
      const collections = dataParsingService.parseCollectionsBatch(collectionEvents);

      console.log(`[LibraryOnboardingService] Found ${collections.length} test collections`);

      if (collections.length === 0) {
        return {
          isValid: false,
          validExercises: [],
          validWorkouts: [],
          validCollections: [],
          errors: ['No test collections found from Phase 1 publisher'],
          warnings: []
        };
      }

      // Resolve all content from collections to validate
      const { templates, exercises } = await dependencyResolutionService.resolveAllCollectionContent(collections);

      const validationTime = Date.now() - startTime;
      console.log(`[LibraryOnboardingService] ✅ Validated starter content in ${validationTime}ms:`, {
        collections: collections.length,
        exercises: exercises.length,
        workouts: templates.length
      });

      return {
        isValid: true,
        validExercises: exercises,
        validWorkouts: templates,
        validCollections: collections,
        errors: [],
        warnings: exercises.length === 0 ? ['No valid exercises found in starter content'] : []
      };

    } catch (error) {
      console.error('[LibraryOnboardingService] Starter content validation failed:', error);
      return {
        isValid: false,
        validExercises: [],
        validWorkouts: [],
        validCollections: [],
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: []
      };
    }
  }

  /**
   * Check if user has empty library (all three collection types)
   * Used for onboarding trigger logic
   */
  async isLibraryEmpty(userPubkey: string): Promise<boolean> {
    try {
      console.log('[LibraryOnboardingService] Checking if library is empty for user:', userPubkey.slice(0, 8));

      const collectionTypes: POWRCollectionType[] = ['EXERCISE_LIBRARY', 'WORKOUT_LIBRARY', 'COLLECTION_SUBSCRIPTIONS'];
      
      for (const collectionType of collectionTypes) {
        const collection = await libraryCollectionService.getUserCollection(userPubkey, collectionType);
        if (collection && collection.itemCount > 0) {
          console.log(`[LibraryOnboardingService] Library not empty - found ${collection.itemCount} items in ${collectionType}`);
          return false;
        }
      }

      console.log('[LibraryOnboardingService] ✅ Library is empty - onboarding needed');
      return true;

    } catch (error) {
      console.error('[LibraryOnboardingService] Failed to check library empty status:', error);
      // Default to not empty to avoid unnecessary onboarding on errors
      return false;
    }
  }

  /**
   * Get recommended content for user discovery
   * Returns curated content from validated starter collections
   */
  async getRecommendedContent(): Promise<{
    exercises: import('./dependencyResolution').Exercise[];
    workouts: import('./dependencyResolution').WorkoutTemplate[];
    collections: import('./dependencyResolution').Collection[];
  }> {
    const startTime = Date.now();
    console.log('[LibraryOnboardingService] Getting recommended content...');

    try {
      // Use validated starter content as recommended content
      const validation = await this.validateStarterContent();
      
      if (!validation.isValid) {
        console.warn('[LibraryOnboardingService] No valid starter content for recommendations');
        return {
          exercises: [],
          workouts: [],
          collections: []
        };
      }

      // Filter and curate recommended content
      const recommendedExercises = validation.validExercises.slice(0, 10); // Top 10 exercises
      const recommendedWorkouts = validation.validWorkouts.slice(0, 5);    // Top 5 workouts
      const recommendedCollections = validation.validCollections;          // All collections

      const recommendTime = Date.now() - startTime;
      console.log(`[LibraryOnboardingService] ✅ Generated recommendations in ${recommendTime}ms:`, {
        exercises: recommendedExercises.length,
        workouts: recommendedWorkouts.length,
        collections: recommendedCollections.length
      });

      return {
        exercises: recommendedExercises,
        workouts: recommendedWorkouts,
        collections: recommendedCollections
      };

    } catch (error) {
      console.error('[LibraryOnboardingService] Failed to get recommended content:', error);
      return {
        exercises: [],
        workouts: [],
        collections: []
      };
    }
  }

  /**
   * Check if user needs onboarding based on library state
   * Combines empty library check with additional onboarding criteria
   */
  async needsOnboarding(userPubkey: string): Promise<{
    needsOnboarding: boolean;
    reason: string;
    recommendations?: {
      exercises: number;
      workouts: number;
      collections: number;
    };
  }> {
    try {
      console.log('[LibraryOnboardingService] Checking onboarding needs for user:', userPubkey.slice(0, 8));

      // Check if library is empty
      const isEmpty = await this.isLibraryEmpty(userPubkey);
      
      if (!isEmpty) {
        return {
          needsOnboarding: false,
          reason: 'User already has library content'
        };
      }

      // Check if we have starter content available
      const validation = await this.validateStarterContent();
      
      if (!validation.isValid) {
        return {
          needsOnboarding: false,
          reason: 'No starter content available for onboarding'
        };
      }

      // User needs onboarding and we have content available
      return {
        needsOnboarding: true,
        reason: 'Empty library with available starter content',
        recommendations: {
          exercises: validation.validExercises.length,
          workouts: validation.validWorkouts.length,
          collections: validation.validCollections.length
        }
      };

    } catch (error) {
      console.error('[LibraryOnboardingService] Failed to check onboarding needs:', error);
      return {
        needsOnboarding: false,
        reason: 'Error checking onboarding status'
      };
    }
  }

  /**
   * Get onboarding progress for user
   * Tracks which collections have been set up
   */
  async getOnboardingProgress(userPubkey: string): Promise<{
    exerciseLibrary: boolean;
    workoutLibrary: boolean;
    collectionSubscriptions: boolean;
    overallProgress: number;
  }> {
    try {
      console.log('[LibraryOnboardingService] Checking onboarding progress for user:', userPubkey.slice(0, 8));

      const collectionTypes: POWRCollectionType[] = ['EXERCISE_LIBRARY', 'WORKOUT_LIBRARY', 'COLLECTION_SUBSCRIPTIONS'];
      const progress = {
        exerciseLibrary: false,
        workoutLibrary: false,
        collectionSubscriptions: false,
        overallProgress: 0
      };

      let completedCount = 0;

      for (const collectionType of collectionTypes) {
        const collection = await libraryCollectionService.getUserCollection(userPubkey, collectionType);
        const hasContent = Boolean(collection && collection.itemCount > 0);
        
        if (collectionType === 'EXERCISE_LIBRARY') {
          progress.exerciseLibrary = hasContent;
        } else if (collectionType === 'WORKOUT_LIBRARY') {
          progress.workoutLibrary = hasContent;
        } else if (collectionType === 'COLLECTION_SUBSCRIPTIONS') {
          progress.collectionSubscriptions = hasContent;
        }

        if (hasContent) {
          completedCount++;
        }
      }

      progress.overallProgress = Math.round((completedCount / collectionTypes.length) * 100);

      console.log(`[LibraryOnboardingService] ✅ Onboarding progress: ${progress.overallProgress}%`);
      return progress;

    } catch (error) {
      console.error('[LibraryOnboardingService] Failed to get onboarding progress:', error);
      return {
        exerciseLibrary: false,
        workoutLibrary: false,
        collectionSubscriptions: false,
        overallProgress: 0
      };
    }
  }
}

// Export singleton instance following service-layer-architecture.md
export const libraryOnboardingService = new LibraryOnboardingService();
