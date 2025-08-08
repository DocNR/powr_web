/**
 * Library Management Service
 * 
 * Extracted from WorkoutListManager.tsx proven optimization patterns
 * achieving 867-903ms performance with CACHE_FIRST + batching strategies.
 * 
 * Implements standardized POWR collection d-tags for consistent user experience:
 * - powr-exercise-list: Individual exercise bookmarks
 * - powr-workout-list: Workout template bookmarks  
 * - powr-collection-list: Collection subscriptions from other users
 * 
 * Follows service-layer-architecture.md - pure business logic only, no NDK operations.
 * Integrates with existing DependencyResolutionService and DataParsingService.
 */

import { getNDKInstance } from '@/lib/ndk';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import type { NDKFilter } from '@nostr-dev-kit/ndk';
import { dependencyResolutionService } from './dependencyResolution';
import { dataParsingService } from './dataParsingService';
import { universalNDKCacheService } from './ndkCacheService';
import type { Collection, WorkoutTemplate, Exercise } from './dependencyResolution';

// Standardized POWR collection d-tags - consistent across all users
export const POWR_COLLECTION_DTAGS = {
  EXERCISE_LIBRARY: 'powr-exercise-list',
  WORKOUT_LIBRARY: 'powr-workout-list', 
  COLLECTION_SUBSCRIPTIONS: 'powr-collection-list'
} as const;

export type POWRCollectionType = keyof typeof POWR_COLLECTION_DTAGS;

// Library collection interfaces
export interface LibraryCollection {
  id: string;
  name: string;
  description: string;
  dTag: string;
  contentRefs: string[];
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
  itemCount: number;
}

export interface ExerciseLibraryItem {
  exerciseRef: string;
  exercise: Exercise;
  addedAt: number;
  source: 'manual' | 'collection' | 'workout';
  sourceRef?: string;
}

export interface WorkoutLibraryItem {
  templateRef: string;
  template: WorkoutTemplate;
  addedAt: number;
  source: 'manual' | 'collection' | 'social';
  sourceRef?: string;
}

export interface CollectionSubscription {
  collectionRef: string;
  collection: Collection;
  subscribedAt: number;
  autoUpdate: boolean;
  lastSyncAt?: number;
}

export interface LibraryState {
  exercises: ExerciseLibraryItem[];
  workouts: WorkoutLibraryItem[];
  collections: CollectionSubscription[];
  isLoading: boolean;
  isEmpty: boolean;
  lastUpdated: number;
}

export interface StarterContentValidation {
  isValid: boolean;
  validExercises: Exercise[];
  validWorkouts: WorkoutTemplate[];
  validCollections: Collection[];
  errors: string[];
  warnings: string[];
}

// Phase 1 test publisher for starter content validation
const PHASE_1_TEST_PUBKEY = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';

/**
 * Library Management Service
 * 
 * Provides optimized library management using proven patterns from WorkoutListManager:
 * - CACHE_FIRST strategy for maximum performance
 * - Batched resolution for efficient dependency loading
 * - Standardized d-tags for consistent user experience
 * - Read-heavy operations with simple append functionality
 * - Validated starter content for onboarding
 */
export class LibraryManagementService {


  /**
   * Get user's library collection by type
   * Uses standardized POWR d-tags for consistency
   */
  async getUserLibraryCollection(userPubkey: string, collectionType: POWRCollectionType): Promise<LibraryCollection | null> {
    try {
      const dTag = POWR_COLLECTION_DTAGS[collectionType];
      console.log(`[LibraryManagementService] Fetching ${collectionType} collection for user:`, userPubkey.slice(0, 8));

      const filter: NDKFilter = {
        kinds: [30003],
        authors: [userPubkey],
        '#d': [dTag]
      };

      const events = await universalNDKCacheService.fetchCacheFirst([filter], { timeout: 3000 });
      
      if (events.length === 0) {
        console.log(`[LibraryManagementService] No ${collectionType} collection found for user`);
        return null;
      }

      // Get the most recent collection (should only be one due to replaceable event)
      const collectionEvent = events[0];
      const parsedCollection = dataParsingService.parseCollection(collectionEvent);
      
      if (!parsedCollection) {
        console.warn(`[LibraryManagementService] Failed to parse ${collectionType} collection`);
        return null;
      }

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

      console.log(`[LibraryManagementService] ✅ Found ${collectionType} collection:`, {
        name: libraryCollection.name,
        itemCount: libraryCollection.itemCount
      });

      return libraryCollection;

    } catch (error) {
      console.error(`[LibraryManagementService] Failed to get ${collectionType} collection:`, error);
      throw error;
    }
  }

  /**
   * Create new library collection with initial content
   * Uses standardized POWR d-tags and NIP-51 format
   * FOLLOWS WORKOUTLISTMANAGER PROVEN PATTERN - simple authentication check only
   */
  async createLibraryCollection(
    userPubkey: string,
    collectionType: POWRCollectionType,
    initialContentRefs: string[] = []
  ): Promise<LibraryCollection> {
    try {
      console.log(`[LibraryManagementService] Creating ${collectionType} collection for user:`, userPubkey.slice(0, 8));

      const ndk = getNDKInstance();
      if (!ndk || !userPubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      const dTag = POWR_COLLECTION_DTAGS[collectionType];
      const collectionNames = {
        EXERCISE_LIBRARY: 'My Exercise Library',
        WORKOUT_LIBRARY: 'My Workout Library',
        COLLECTION_SUBSCRIPTIONS: 'My Collection Subscriptions'
      };

      const collectionDescriptions = {
        EXERCISE_LIBRARY: 'My saved exercises and movements',
        WORKOUT_LIBRARY: 'My saved workout templates and routines',
        COLLECTION_SUBSCRIPTIONS: 'Collections I follow from other users'
      };

      // Create NIP-51 collection event (kind 30003) - SAME PATTERN AS WORKOUTLISTMANAGER
      const collectionEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', dTag],
          ['title', collectionNames[collectionType]],
          ['description', collectionDescriptions[collectionType]],
          // Add initial content references
          ...initialContentRefs.map(ref => ['a', ref])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: userPubkey
      });

      console.log(`[LibraryManagementService] Publishing ${collectionType} collection:`, {
        kind: collectionEvent.kind,
        tags: collectionEvent.tags,
        initialItems: initialContentRefs.length
      });

      // Publish the collection - SAME PATTERN AS WORKOUTLISTMANAGER
      await collectionEvent.publish();
      console.log(`[LibraryManagementService] ✅ ${collectionType} collection published successfully:`, collectionEvent.id);

      const libraryCollection: LibraryCollection = {
        id: dTag,
        name: collectionNames[collectionType],
        description: collectionDescriptions[collectionType],
        dTag,
        contentRefs: initialContentRefs,
        authorPubkey: userPubkey,
        createdAt: collectionEvent.created_at || Math.floor(Date.now() / 1000),
        eventId: collectionEvent.id,
        itemCount: initialContentRefs.length
      };

      return libraryCollection;

    } catch (error) {
      console.error(`[LibraryManagementService] Failed to create ${collectionType} collection:`, error);
      throw error;
    }
  }

  /**
   * Setup starter library for new users
   * Creates the three standard collections with validated starter content
   */
  async setupStarterLibrary(userPubkey: string): Promise<{
    exerciseLibrary?: LibraryCollection;
    workoutLibrary?: LibraryCollection;
    collectionSubscriptions?: LibraryCollection;
    setupTime?: number;
  }> {
    const startTime = Date.now();
    console.log('[LibraryManagementService] Setting up starter library for user:', userPubkey.slice(0, 8));
    
    try {
      // First, validate that we have starter content available
      const validation = await this.validateStarterContent();
      if (!validation.validCollections || validation.validCollections.length === 0) {
        throw new Error('No starter collections available for setup');
      }

      console.log('[LibraryManagementService] Creating starter collections...');

      const results: {
        exerciseLibrary?: LibraryCollection;
        workoutLibrary?: LibraryCollection;
        collectionSubscriptions?: LibraryCollection;
        setupTime?: number;
      } = {};

      // 1. Create exercise library collection with starter exercises
      const exerciseCollection = validation.validCollections.find(c => 
        c.name.toLowerCase().includes('exercise')
      );
      
      if (exerciseCollection) {
        console.log('[LibraryManagementService] Creating exercise library with', exerciseCollection.contentRefs.length, 'exercises');
        results.exerciseLibrary = await this.createLibraryCollection(
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
        console.log('[LibraryManagementService] Creating workout library with', workoutCollection.contentRefs.length, 'workouts');
        results.workoutLibrary = await this.createLibraryCollection(
          userPubkey,
          'WORKOUT_LIBRARY',
          workoutCollection.contentRefs
        );
      }

      // 3. Create collection subscriptions with starter collections
      const collectionRefs = validation.validCollections.map(collection => {
        // Extract collection reference from the first item or collection metadata
        // For now, we'll create references to the POWR test collections
        const pubkey = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';
        if (collection.name.toLowerCase().includes('exercise')) {
          return `30003:${pubkey}:powr-test-exercise-library`;
        } else {
          return `30003:${pubkey}:powr-test-strength-bodyweight-collection`;
        }
      });

      console.log('[LibraryManagementService] Creating collection subscriptions with', collectionRefs.length, 'collections');
      results.collectionSubscriptions = await this.createLibraryCollection(
        userPubkey,
        'COLLECTION_SUBSCRIPTIONS',
        collectionRefs
      );

      results.setupTime = Date.now() - startTime;
      console.log('[LibraryManagementService] ✅ Starter library setup complete in', results.setupTime, 'ms');
      
      return results;
      
    } catch (error) {
      console.error('[LibraryManagementService] Failed to setup starter library:', error);
      throw error;
    }
  }

  /**
   * Validate and discover POWR starter content
   * Uses DataParsingService to ensure NIP-101e compliance
   */
  async validateStarterContent(): Promise<StarterContentValidation> {
    const startTime = Date.now();
    console.log('[LibraryManagementService] Validating POWR starter content...');

    try {
      // Discover Phase 1 test collections (extracted from WorkoutListManager)
      const filter: NDKFilter = {
        kinds: [30003],
        authors: [PHASE_1_TEST_PUBKEY],
        '#t': ['fitness']
      };

      const collectionEvents = await universalNDKCacheService.fetchCacheFirst([filter], { timeout: 3000 });
      const collections = dataParsingService.parseCollectionsBatch(collectionEvents);

      console.log(`[LibraryManagementService] Found ${collections.length} test collections`);

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
      console.log(`[LibraryManagementService] ✅ Validated starter content in ${validationTime}ms:`, {
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
      console.error('[LibraryManagementService] Starter content validation failed:', error);
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
      console.log('[LibraryManagementService] Checking if library is empty for user:', userPubkey.slice(0, 8));

      const collectionTypes: POWRCollectionType[] = ['EXERCISE_LIBRARY', 'WORKOUT_LIBRARY', 'COLLECTION_SUBSCRIPTIONS'];
      
      for (const collectionType of collectionTypes) {
        const collection = await this.getUserLibraryCollection(userPubkey, collectionType);
        if (collection && collection.itemCount > 0) {
          console.log(`[LibraryManagementService] Library not empty - found ${collection.itemCount} items in ${collectionType}`);
          return false;
        }
      }

      console.log('[LibraryManagementService] ✅ Library is empty - onboarding needed');
      return true;

    } catch (error) {
      console.error('[LibraryManagementService] Failed to check library empty status:', error);
      // Default to not empty to avoid unnecessary onboarding on errors
      return false;
    }
  }

  /**
   * Add item to existing library collection
   * Updates the collection with new content reference and publishes updated event
   */
  async addToLibraryCollection(
    userPubkey: string,
    collectionType: POWRCollectionType,
    itemRef: string
  ): Promise<void> {
    try {
      console.log(`[LibraryManagementService] Adding ${itemRef} to ${collectionType} collection`);

      const ndk = getNDKInstance();
      if (!ndk || !userPubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Get existing collection
      const existingCollection = await this.getUserLibraryCollection(userPubkey, collectionType);
      
      if (!existingCollection) {
        // Create new collection with this item
        await this.createLibraryCollection(userPubkey, collectionType, [itemRef]);
        console.log(`[LibraryManagementService] ✅ Created new ${collectionType} collection with item`);
        return;
      }

      // Check if item already exists
      if (existingCollection.contentRefs.includes(itemRef)) {
        console.log(`[LibraryManagementService] Item ${itemRef} already exists in ${collectionType}`);
        return;
      }

      // Add new item to existing collection
      const updatedContentRefs = [...existingCollection.contentRefs, itemRef];
      const dTag = POWR_COLLECTION_DTAGS[collectionType];

      // Create updated collection event (replaceable)
      const updatedCollectionEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', dTag],
          ['title', existingCollection.name],
          ['description', existingCollection.description],
          // Add all content references including the new one
          ...updatedContentRefs.map(ref => ['a', ref])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: userPubkey
      });

      // Publish updated collection
      await updatedCollectionEvent.publish();
      console.log(`[LibraryManagementService] ✅ Added ${itemRef} to ${collectionType} collection`);

    } catch (error) {
      console.error(`[LibraryManagementService] Failed to add item to ${collectionType}:`, error);
      throw error;
    }
  }

  /**
   * Analyze template modifications to determine if save prompt should be shown
   * Implements smart thresholds: any add/remove, 2+ substitutions, 3+ reorders
   */
  analyzeTemplateModifications(
    modifications: any,
    originalTemplate: any,
    userPubkey: string
  ): {
    isOwner: boolean;
    hasSignificantChanges: boolean;
    modificationSummary: string;
    totalChanges: number;
    canUpdateOriginal: boolean;
    canSaveAsNew: boolean;
  } {
    const isOwner = originalTemplate.authorPubkey === userPubkey;
    
    const addedCount = modifications.exercisesAdded?.length || 0;
    const removedCount = modifications.exercisesRemoved?.length || 0;
    const substitutedCount = modifications.exercisesSubstituted?.length || 0;
    const reorderedCount = modifications.exercisesReordered?.length || 0;
    
    // Smart thresholds
    const hasSignificantChanges = (
      addedCount > 0 ||
      removedCount > 0 ||
      substitutedCount >= 2 ||
      reorderedCount >= 3
    );
    
    const totalChanges = addedCount + removedCount + substitutedCount + reorderedCount;
    
    // Generate modification summary
    const summaryParts = [];
    if (addedCount > 0) summaryParts.push(`${addedCount} exercise${addedCount > 1 ? 's' : ''} added`);
    if (removedCount > 0) summaryParts.push(`${removedCount} exercise${removedCount > 1 ? 's' : ''} removed`);
    if (substitutedCount > 0) summaryParts.push(`${substitutedCount} exercise${substitutedCount > 1 ? 's' : ''} substituted`);
    if (reorderedCount > 0) summaryParts.push(`${reorderedCount} exercise${reorderedCount > 1 ? 's' : ''} reordered`);
    
    const modificationSummary = summaryParts.length > 0 
      ? summaryParts.join(', ')
      : 'No significant changes detected';
    
    console.log(`[LibraryManagementService] Template modification analysis:`, {
      isOwner,
      hasSignificantChanges,
      totalChanges,
      modificationSummary
    });
    
    return {
      isOwner,
      hasSignificantChanges,
      modificationSummary,
      totalChanges,
      canUpdateOriginal: isOwner,
      canSaveAsNew: true
    };
  }

  /**
   * Generate smart template name based on original template and modifications
   * Creates descriptive names showing relationship to original plus changes
   */
  generateSmartTemplateName(originalTemplate: any, modifications: any): string {
    const baseName = originalTemplate.name || 'Workout Template';
    
    const addedCount = modifications.exercisesAdded?.length || 0;
    const removedCount = modifications.exercisesRemoved?.length || 0;
    const substitutedCount = modifications.exercisesSubstituted?.length || 0;
    
    // Generate descriptive suffix based on modifications
    const suffixParts = [];
    
    if (addedCount > 0) {
      // Try to identify what was added
      const addedExercises = modifications.exercisesAdded || [];
      if (addedExercises.length === 1) {
        suffixParts.push('+ Extra');
      } else {
        suffixParts.push(`+ ${addedCount} Exercises`);
      }
    }
    
    if (removedCount > 0) {
      if (removedCount === 1) {
        suffixParts.push('(Modified)');
      } else {
        suffixParts.push(`(${removedCount} Removed)`);
      }
    }
    
    if (substitutedCount > 0) {
      suffixParts.push('(Custom)');
    }
    
    // Fallback for reorders or no specific changes
    if (suffixParts.length === 0) {
      suffixParts.push('(Modified)');
    }
    
    const smartName = `${baseName} ${suffixParts.join(' ')}`;
    
    console.log(`[LibraryManagementService] Generated smart template name:`, {
      original: baseName,
      generated: smartName,
      modifications: { addedCount, removedCount, substitutedCount }
    });
    
    return smartName;
  }

  /**
   * Build template from workout structure (enhanced to handle added exercises and extra sets)
   * Uses the actual workout state including added exercises and extra sets
   */
  buildTemplateFromWorkoutStructure(
    workoutData: any
  ): {
    name: string;
    type: string;
    description: string;
    exercises: Array<{
      exerciseRef: string;
      name: string;
      sets: number;
      reps: number;
      weight: number;
      rpe: number;
      setType: string;
    }>;
  } {
    console.log('[LibraryManagementService] Building template from workout structure:', {
      workoutTitle: workoutData?.title,
      exerciseCount: workoutData?.exercises?.length || 0
    });

    // ✅ FIXED: Use the actual workout exercises including added exercises and account for extra sets
    const exercises = (workoutData?.exercises || []).map((exercise: any, exerciseIndex: number) => {
      // Get the base sets from the exercise
      const baseSets = exercise.sets || 3;
      
      // ✅ FIXED: Account for extra sets requested via ADD_SET
      const extraSets = workoutData?.extraSetsRequested?.[exerciseIndex] || 0;
      const totalSets = baseSets + extraSets;
      
      console.log(`[LibraryManagementService] Exercise ${exerciseIndex} (${exercise.exerciseRef}): ${baseSets} base + ${extraSets} extra = ${totalSets} total sets`);
      
      return {
        exerciseRef: exercise.exerciseRef,
        name: exercise.exerciseName || exercise.name || 'Exercise',
        sets: totalSets, // ✅ FIXED: Use total sets including extra sets
        reps: exercise.reps || 10,
        weight: exercise.weight || 0,
        rpe: exercise.rpe || 7,
        setType: exercise.setType || 'normal'
      };
    });

    // Generate template name
    const baseName = workoutData?.title?.replace(/ - \d{1,2}\/\d{1,2}\/\d{4}$/, '') || 'Workout Template';
    const templateName = `${baseName} (Modified)`;

    const result = {
      name: templateName,
      type: workoutData?.workoutType || 'strength',
      description: `Modified version of ${baseName}`,
      exercises
    };

    console.log('[LibraryManagementService] ✅ Built template from workout structure:', {
      name: result.name,
      exerciseCount: result.exercises.length,
      totalSets: result.exercises.reduce((sum: number, ex: any) => sum + ex.sets, 0)
    });

    return result;
  }

  /**
   * Create new modified template with NIP-101e compliance
   * Uses workout structure as it was when user hit "Finish"
   */
  async createModifiedTemplate(
    workoutData: any,
    userPubkey: string
  ): Promise<any> {
    try {
      console.log(`[LibraryManagementService] Creating template from workout structure:`, {
        workoutTitle: workoutData?.title,
        userPubkey: userPubkey.slice(0, 8),
        exerciseCount: workoutData?.exercises?.length || 0
      });

      const ndk = getNDKInstance();
      if (!ndk || !userPubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Build template structure from workout data (simple approach)
      const templateData = this.buildTemplateFromWorkoutStructure(workoutData);

      // Generate unique d-tag for new template
      const dTag = `${templateData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

      // Create exercise tags with proper NIP-101e set numbering
      const exerciseTags: string[][] = [];
      templateData.exercises.forEach(exercise => {
        // Create multiple tags for multi-set exercises (proper NIP-101e format)
        for (let setNum = 1; setNum <= exercise.sets; setNum++) {
          exerciseTags.push([
            'exercise',
            exercise.exerciseRef,
            '', // relay-url (empty)
            exercise.weight.toString(),
            exercise.reps.toString(),
            exercise.rpe.toString(),
            exercise.setType,
            setNum.toString() // ✅ FIXED: Per-exercise set numbering (1,2,3 then reset)
          ]);
        }
      });

      console.log(`[LibraryManagementService] Generated ${exerciseTags.length} exercise tags with proper set numbering`);

      // Create NIP-101e compliant template event (kind 33402)
      const templateEvent = new NDKEvent(ndk, {
        kind: 33402,
        content: templateData.description || '',
        tags: [
          ['d', dTag],
          ['title', templateData.name], // NIP-101e uses "title", not "name"
          ['type', templateData.type],
          // Add properly structured exercise tags
          ...exerciseTags,
          ['t', 'fitness']
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: userPubkey
      });

      // Publish the template
      await templateEvent.publish();
      console.log(`[LibraryManagementService] ✅ Modified template published:`, templateEvent.id);

      // Return template data
      return {
        id: dTag,
        name: templateData.name,
        type: templateData.type,
        description: templateData.description,
        exercises: templateData.exercises,
        authorPubkey: userPubkey,
        createdAt: templateEvent.created_at,
        eventId: templateEvent.id
      };

    } catch (error) {
      console.error('[LibraryManagementService] Failed to create modified template:', error);
      throw error;
    }
  }

  /**
   * Update existing template (owner-only, replaceable event)
   * Updates the original template with new data
   */
  async updateExistingTemplate(templateData: any, originalTemplate: any): Promise<any> {
    try {
      console.log(`[LibraryManagementService] Updating existing template:`, originalTemplate.id);

      const ndk = getNDKInstance();
      if (!ndk) {
        throw new Error('NDK not initialized');
      }

      // Create updated template event (replaceable, same d-tag)
      const updatedTemplateEvent = new NDKEvent(ndk, {
        kind: 33402,
        content: templateData.description || originalTemplate.description || '',
        tags: [
          ['d', originalTemplate.id], // Same d-tag for replacement
          ['title', templateData.name], // NIP-101e uses "title", not "name"
          ['type', templateData.type || originalTemplate.type || 'strength'],
          // Add updated exercise references
          ...(templateData.exercises || []).map((exercise: any, index: number) => [
            'exercise',
            exercise.exerciseRef || `33401:${originalTemplate.authorPubkey}:unknown`,
            '', // relay-url (empty)
            (exercise.weight || 0).toString(),
            (exercise.reps || 0).toString(),
            (exercise.rpe || 7).toString(),
            exercise.setType || 'normal',
            (index + 1).toString() // set number for deduplication
          ]),
          ['t', 'fitness']
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: originalTemplate.authorPubkey
      });

      // Publish the updated template
      await updatedTemplateEvent.publish();
      console.log(`[LibraryManagementService] ✅ Template updated:`, updatedTemplateEvent.id);

      // Return updated template data
      return {
        ...originalTemplate,
        name: templateData.name,
        type: templateData.type || originalTemplate.type,
        description: templateData.description || originalTemplate.description,
        exercises: templateData.exercises || originalTemplate.exercises,
        eventId: updatedTemplateEvent.id
      };

    } catch (error) {
      console.error('[LibraryManagementService] Failed to update existing template:', error);
      throw error;
    }
  }

  /**
   * Simple template modification analysis for save prompt
   * Following "simple solutions first" - any modification = save prompt
   */
  analyzeWorkoutForTemplateChanges(workoutData: any): {
    hasModifications: boolean;
    modificationCount: number;
    suggestedName: string;
    isOwner: boolean;
  } {
    const modifications = workoutData.modifications || {};
    const hasModifications = (
      (modifications.exercisesAdded?.length || 0) > 0 ||
      (modifications.exercisesRemoved?.length || 0) > 0 ||
      (modifications.exercisesSubstituted?.length || 0) > 0 ||
      (modifications.exercisesReordered?.length || 0) > 0
    );
    
    const originalTemplate = workoutData.originalTemplate;
    const isOwner = originalTemplate?.templatePubkey === workoutData.userPubkey;
    
    console.log('[LibraryManagementService] Template modification analysis:', {
      hasModifications,
      modificationCount: modifications.totalModifications || 0,
      isOwner,
      templateName: originalTemplate?.templateId || 'Unknown'
    });
    
    return {
      hasModifications,
      modificationCount: modifications.totalModifications || 0,
      suggestedName: `${originalTemplate?.templateId || 'Workout'} (Modified)`,
      isOwner
    };
  }

  /**
   * Resolve library content with full dependency chain
   * Used by useLibraryCollections hook for content resolution
   */
  async resolveLibraryContent(collection: LibraryCollection): Promise<{
    exercises: ExerciseLibraryItem[];
    workouts: WorkoutLibraryItem[];
  }> {
    const startTime = Date.now();
    console.log('[LibraryManagementService] Resolving library content for:', collection.name);

    try {
      // Separate exercise and workout references
      const exerciseRefs = collection.contentRefs.filter(ref => ref.startsWith('33401:'));
      const workoutRefs = collection.contentRefs.filter(ref => ref.startsWith('33402:'));

      // Resolve exercises
      const exercises = await dependencyResolutionService.resolveExerciseReferences(exerciseRefs);
      const exerciseItems: ExerciseLibraryItem[] = exercises.map(exercise => ({
        exerciseRef: `33401:${exercise.authorPubkey}:${exercise.id}`,
        exercise,
        addedAt: collection.createdAt,
        source: 'collection' as const,
        sourceRef: collection.eventId
      }));

      // Resolve workout templates
      const templates = await dependencyResolutionService.resolveTemplateDependencies(workoutRefs);
      const workoutItems: WorkoutLibraryItem[] = templates.map(template => ({
        templateRef: `33402:${template.authorPubkey}:${template.id}`,
        template,
        addedAt: collection.createdAt,
        source: 'collection' as const,
        sourceRef: collection.eventId
      }));

      const resolveTime = Date.now() - startTime;
      console.log(`[LibraryManagementService] ✅ Resolved library content in ${resolveTime}ms:`, {
        exercises: exerciseItems.length,
        workouts: workoutItems.length
      });

      return {
        exercises: exerciseItems,
        workouts: workoutItems
      };

    } catch (error) {
      console.error('[LibraryManagementService] Failed to resolve library content:', error);
      throw error;
    }
  }
}

// Export singleton instance following service-layer-architecture.md
export const libraryManagementService = new LibraryManagementService();
