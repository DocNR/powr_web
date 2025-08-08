/**
 * Library Collection Service
 * 
 * Pure CRUD operations for NIP-51 collections (30003 events).
 * Extracted from LibraryManagementService following Single Responsibility Principle.
 * 
 * Responsibilities:
 * - Collection CRUD operations
 * - Content reference management
 * - Collection content resolution
 * 
 * Follows service-layer-architecture.md - pure business logic only, no NDK operations.
 */

import { getNDKInstance } from '@/lib/ndk';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import type { NDKFilter } from '@nostr-dev-kit/ndk';
import { dependencyResolutionService } from './dependencyResolution';
import { universalNDKCacheService } from './ndkCacheService';
import type {
  LibraryCollection,
  ExerciseLibraryItem,
  WorkoutLibraryItem,
  POWRCollectionType
} from './types/libraryTypes';
import { POWR_COLLECTION_DTAGS } from './types/libraryTypes';

/**
 * Library Collection Service
 * 
 * Provides optimized collection management using proven patterns:
 * - CACHE_FIRST strategy for maximum performance
 * - Standardized d-tags for consistent user experience
 * - Read-heavy operations with simple append functionality
 */
export class LibraryCollectionService {

  /**
   * Get user's library collection by type
   * Uses standardized POWR d-tags for consistency
   */
  async getUserCollection(userPubkey: string, collectionType: POWRCollectionType): Promise<LibraryCollection | null> {
    try {
      const dTag = POWR_COLLECTION_DTAGS[collectionType];
      console.log(`[LibraryCollectionService] Fetching ${collectionType} collection for user:`, userPubkey.slice(0, 8));

      const filter: NDKFilter = {
        kinds: [30003],
        authors: [userPubkey],
        '#d': [dTag]
      };

      const events = await universalNDKCacheService.fetchCacheFirst([filter], { timeout: 3000 });
      
      if (events.length === 0) {
        console.log(`[LibraryCollectionService] No ${collectionType} collection found for user`);
        return null;
      }

      // Get the most recent collection (should only be one due to replaceable event)
      const collectionEvent = events[0];
      const parsedCollection = this.parseCollectionEvent(collectionEvent);
      
      if (!parsedCollection) {
        console.warn(`[LibraryCollectionService] Failed to parse ${collectionType} collection`);
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

      console.log(`[LibraryCollectionService] ✅ Found ${collectionType} collection:`, {
        name: libraryCollection.name,
        itemCount: libraryCollection.itemCount
      });

      return libraryCollection;

    } catch (error) {
      console.error(`[LibraryCollectionService] Failed to get ${collectionType} collection:`, error);
      throw error;
    }
  }

  /**
   * Create new library collection with initial content
   * Uses standardized POWR d-tags and NIP-51 format
   */
  async createCollection(
    userPubkey: string,
    collectionType: POWRCollectionType,
    initialContentRefs: string[] = []
  ): Promise<LibraryCollection> {
    try {
      console.log(`[LibraryCollectionService] Creating ${collectionType} collection for user:`, userPubkey.slice(0, 8));

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

      // Create NIP-51 collection event (kind 30003)
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

      console.log(`[LibraryCollectionService] Publishing ${collectionType} collection:`, {
        kind: collectionEvent.kind,
        tags: collectionEvent.tags,
        initialItems: initialContentRefs.length
      });

      // Publish the collection
      await collectionEvent.publish();
      console.log(`[LibraryCollectionService] ✅ ${collectionType} collection published successfully:`, collectionEvent.id);

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
      console.error(`[LibraryCollectionService] Failed to create ${collectionType} collection:`, error);
      throw error;
    }
  }

  /**
   * Add item to existing library collection
   * Updates the collection with new content reference and publishes updated event
   */
  async addToCollection(
    userPubkey: string,
    collectionType: POWRCollectionType,
    itemRef: string
  ): Promise<void> {
    console.log(`[LibraryCollectionService] Adding ${itemRef} to ${collectionType} collection`);

    try {
      const ndk = getNDKInstance();
      if (!ndk) {
        throw new Error('NDK not initialized');
      }
      if (!userPubkey) {
        throw new Error('User not authenticated');
      }

      // Get existing collection
      const existingCollection = await this.getUserCollection(userPubkey, collectionType);
      
      if (!existingCollection) {
        // Create new collection with this item
        await this.createCollection(userPubkey, collectionType, [itemRef]);
        console.log(`[LibraryCollectionService] ✅ Created new ${collectionType} collection with item`);
        return;
      }

      // Check if item already exists
      if (existingCollection.contentRefs.includes(itemRef)) {
        console.log(`[LibraryCollectionService] Item already exists in ${collectionType}, skipping`);
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
      
      console.log(`[LibraryCollectionService] ✅ Added ${itemRef} to ${collectionType} collection (${updatedContentRefs.length} total items)`);

    } catch (error) {
      console.error(`[LibraryCollectionService] ❌ Failed to add item to ${collectionType}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        itemRef
      });
      throw error;
    }
  }

  /**
   * Remove item from existing library collection
   * Updates the collection by removing content reference and publishes updated event
   */
  async removeFromCollection(
    userPubkey: string,
    collectionType: POWRCollectionType,
    itemRef: string
  ): Promise<void> {
    console.log(`[LibraryCollectionService] Removing ${itemRef} from ${collectionType} collection`);

    try {
      const ndk = getNDKInstance();
      if (!ndk) {
        throw new Error('NDK not initialized');
      }
      if (!userPubkey) {
        throw new Error('User not authenticated');
      }

      // Get existing collection
      const existingCollection = await this.getUserCollection(userPubkey, collectionType);
      
      if (!existingCollection) {
        console.log(`[LibraryCollectionService] No ${collectionType} collection found, nothing to remove`);
        return;
      }

      // Check if item exists
      if (!existingCollection.contentRefs.includes(itemRef)) {
        console.log(`[LibraryCollectionService] Item not found in ${collectionType}, nothing to remove`);
        return;
      }

      // Remove item from existing collection
      const updatedContentRefs = existingCollection.contentRefs.filter(ref => ref !== itemRef);
      const dTag = POWR_COLLECTION_DTAGS[collectionType];

      // Create updated collection event (replaceable)
      const updatedCollectionEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', dTag],
          ['title', existingCollection.name],
          ['description', existingCollection.description],
          // Add remaining content references
          ...updatedContentRefs.map(ref => ['a', ref])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: userPubkey
      });

      // Publish updated collection
      await updatedCollectionEvent.publish();
      
      console.log(`[LibraryCollectionService] ✅ Removed ${itemRef} from ${collectionType} collection (${updatedContentRefs.length} remaining items)`);

    } catch (error) {
      console.error(`[LibraryCollectionService] ❌ Failed to remove item from ${collectionType}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        itemRef
      });
      throw error;
    }
  }

  /**
   * Resolve library content with full dependency chain
   * Used by useLibraryCollections hook for content resolution
   */
  async resolveCollectionContent(collection: LibraryCollection): Promise<{
    exercises: ExerciseLibraryItem[];
    workouts: WorkoutLibraryItem[];
  }> {
    const startTime = Date.now();
    console.log('[LibraryCollectionService] Resolving library content for:', collection.name);

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
      console.log(`[LibraryCollectionService] ✅ Resolved library content in ${resolveTime}ms:`, {
        exercises: exerciseItems.length,
        workouts: workoutItems.length
      });

      return {
        exercises: exerciseItems,
        workouts: workoutItems
      };

    } catch (error) {
      console.error('[LibraryCollectionService] Failed to resolve library content:', error);
      throw error;
    }
  }

  /**
   * Parse collection event to Collection interface
   * Private helper method for consistent parsing
   */
  private parseCollectionEvent(event: NDKEvent): import('./dependencyResolution').Collection | null {
    try {
      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const id = tagMap.get('d')?.[1] || 'unknown';
      const name = tagMap.get('name')?.[1] || tagMap.get('title')?.[1] || 'Unknown Collection';
      const description = event.content || 'No description';
      
      // Extract content references (a tags)
      const contentRefs = event.tags
        .filter(tag => tag[0] === 'a')
        .map(tag => tag[1]);
      
      return {
        id,
        name,
        description,
        contentRefs,
        authorPubkey: event.pubkey,
        createdAt: event.created_at || Math.floor(Date.now() / 1000),
        eventId: event.id
      };
    } catch (error) {
      console.error('[LibraryCollectionService] Failed to parse collection event:', error);
      return null;
    }
  }
}

// Export singleton instance following service-layer-architecture.md
export const libraryCollectionService = new LibraryCollectionService();
