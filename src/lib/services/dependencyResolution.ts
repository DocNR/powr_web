/**
 * Dependency Resolution Service
 * 
 * Extracted from WorkoutListManager.tsx proven optimization patterns
 * achieving 867-903ms performance with CACHE_FIRST + batching strategies.
 * 
 * This service provides pure business logic for resolving Nostr event dependencies
 * while leveraging NDK's IndexedDB cache for optimal performance.
 */

import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

// Types for dependency resolution
export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
  estimatedDuration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
  tags?: string[][];
}

export interface TemplateExercise {
  exerciseRef: string; // Format: "33401:pubkey:exercise-d-tag"
  sets: number;
  reps: number;
  weight?: number;
  restTime?: number;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: string;
  instructions: string[];
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  contentRefs: string[];
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
}

export interface ResolvedTemplate {
  template: WorkoutTemplate;
  exercises: Exercise[];
  loadTime: number;
}

/**
 * Dependency Resolution Service
 * 
 * Provides optimized dependency resolution using proven patterns from WorkoutListManager:
 * - CACHE_FIRST strategy for maximum performance
 * - Batched author grouping to minimize queries
 * - D-tag batching for efficient filtering
 * - Reference deduplication to avoid redundant work
 */
export class DependencyResolutionService {
  /**
   * Optimized event fetching with CACHE_FIRST strategy
   * Extracted from WorkoutListManager lines 200-210
   */
  private async fetchEventsOptimized(filter: NDKFilter): Promise<Set<NDKEvent>> {
    const startTime = Date.now();
    
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    console.log('[DependencyResolutionService] Fetching events with CACHE_FIRST strategy:', filter);

    // PROVEN PATTERN: CACHE_FIRST with closeOnEose for optimal performance
    const events = await ndk.fetchEvents(filter, {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      closeOnEose: true
    });

    const fetchTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Fetched ${events.size} events in ${fetchTime}ms`);

    return events;
  }

  /**
   * Resolve template dependencies with batched optimization
   * Extracted from WorkoutListManager lines 250-290
   */
  async resolveTemplateDependencies(templateRefs: string[]): Promise<WorkoutTemplate[]> {
    if (templateRefs.length === 0) {
      return [];
    }

    const startTime = Date.now();
    console.log('[DependencyResolutionService] Resolving template dependencies:', templateRefs.length);

    // PROVEN PATTERN: Batched author grouping and d-tag collection
    const templateAuthors = new Set<string>();
    const templateDTags: string[] = [];

    for (const templateRef of templateRefs) {
      const [kind, pubkey, dTag] = templateRef.split(':');
      if (kind === '33402' && pubkey && dTag) {
        templateDTags.push(dTag);
        templateAuthors.add(pubkey);
      }
    }

    if (templateAuthors.size === 0) {
      console.warn('[DependencyResolutionService] No valid template references found');
      return [];
    }

    // PROVEN PATTERN: Single batched query instead of N individual requests
    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as any],
      authors: Array.from(templateAuthors),
      '#d': templateDTags
    };

    const templateEvents = await this.fetchEventsOptimized(filter);

    // Parse templates from events
    const templates: WorkoutTemplate[] = Array.from(templateEvents).map(event => {
      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const id = tagMap.get('d')?.[1] || 'unknown';
      const name = tagMap.get('title')?.[1] || tagMap.get('name')?.[1] || 'Untitled Template';
      const description = event.content || 'No description';
      const difficulty = tagMap.get('difficulty')?.[1] as 'beginner' | 'intermediate' | 'advanced' | undefined;
      const estimatedDuration = tagMap.get('duration')?.[1] ? parseInt(tagMap.get('duration')![1]) : undefined;
      
      // Extract exercise references
      const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
      const exercises: TemplateExercise[] = exerciseTags.map(tag => ({
        exerciseRef: tag[1],
        sets: parseInt(tag[2]) || 3,
        reps: parseInt(tag[3]) || 10,
        weight: tag[4] ? parseInt(tag[4]) : undefined,
        restTime: 60
      }));
      
      return {
        id,
        name,
        description,
        exercises,
        estimatedDuration,
        difficulty,
        authorPubkey: event.pubkey,
        createdAt: event.created_at || Math.floor(Date.now() / 1000),
        eventId: event.id,
        tags: event.tags
      };
    });

    const resolveTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved ${templates.length} templates in ${resolveTime}ms`);

    return templates;
  }

  /**
   * Resolve exercise dependencies with batched optimization
   * Extracted from WorkoutListManager lines 300-350
   */
  async resolveExerciseReferences(exerciseRefs: string[]): Promise<Exercise[]> {
    if (exerciseRefs.length === 0) {
      return [];
    }

    const startTime = Date.now();
    console.log('[DependencyResolutionService] Resolving exercise references:', exerciseRefs.length);

    // PROVEN PATTERN: Deduplicate references to avoid redundant work
    const uniqueRefs = [...new Set(exerciseRefs)];

    // PROVEN PATTERN: Batched author grouping and d-tag collection
    const exerciseAuthors = new Set<string>();
    const exerciseDTags: string[] = [];

    for (const exerciseRef of uniqueRefs) {
      const [kind, pubkey, dTag] = exerciseRef.split(':');
      if (kind === '33401' && pubkey && dTag) {
        exerciseDTags.push(dTag);
        exerciseAuthors.add(pubkey);
      }
    }

    if (exerciseAuthors.size === 0) {
      console.warn('[DependencyResolutionService] No valid exercise references found');
      return [];
    }

    // PROVEN PATTERN: Single batched query
    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE as any],
      authors: Array.from(exerciseAuthors),
      '#d': exerciseDTags
    };

    const exerciseEvents = await this.fetchEventsOptimized(filter);

    // Parse exercises from events
    const exercises: Exercise[] = Array.from(exerciseEvents).map(event => {
      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const id = tagMap.get('d')?.[1] || 'unknown';
      const name = tagMap.get('name')?.[1] || tagMap.get('title')?.[1] || 'Unknown Exercise';
      const description = event.content || 'No description';
      const equipment = tagMap.get('equipment')?.[1] || 'unknown';
      const difficulty = tagMap.get('difficulty')?.[1] || 'beginner';
      
      // Extract muscle groups
      const muscleGroups = event.tags
        .filter(tag => tag[0] === 'muscle')
        .map(tag => tag[1]);
      
      // Parse instructions from content if JSON
      let instructions: string[] = [];
      try {
        const contentData = JSON.parse(event.content || '{}');
        instructions = contentData.instructions || [];
      } catch {
        instructions = ['No instructions available'];
      }
      
      return {
        id,
        name,
        description,
        muscleGroups,
        equipment,
        difficulty,
        instructions,
        authorPubkey: event.pubkey,
        createdAt: event.created_at || Math.floor(Date.now() / 1000),
        eventId: event.id
      };
    });

    const resolveTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved ${exercises.length} exercises in ${resolveTime}ms`);

    return exercises;
  }

  /**
   * Resolve all collection content with full dependency chain
   * Extracted from WorkoutListManager lines 350-400
   */
  async resolveAllCollectionContent(collections: Collection[]): Promise<{
    templates: WorkoutTemplate[];
    exercises: Exercise[];
    totalTime: number;
  }> {
    const startTime = Date.now();
    console.log('[DependencyResolutionService] Resolving all collection content:', collections.length);

    // PROVEN PATTERN: Extract all template references from collections
    const allTemplateRefs = new Set<string>();
    
    for (const collection of collections) {
      for (const contentRef of collection.contentRefs) {
        const [kind] = contentRef.split(':');
        if (kind === '33402') {
          allTemplateRefs.add(contentRef);
        }
      }
    }

    // Resolve templates first
    const templates = await this.resolveTemplateDependencies(Array.from(allTemplateRefs));

    // PROVEN PATTERN: Extract exercise references from resolved templates
    const allExerciseRefs = new Set<string>();
    
    for (const template of templates) {
      for (const exercise of template.exercises) {
        allExerciseRefs.add(exercise.exerciseRef);
      }
    }

    // Resolve exercises
    const exercises = await this.resolveExerciseReferences(Array.from(allExerciseRefs));

    const totalTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved complete dependency chain in ${totalTime}ms:`, {
      templates: templates.length,
      exercises: exercises.length
    });

    return {
      templates,
      exercises,
      totalTime
    };
  }

  /**
   * NEW: Single template + exercises resolution (for loadTemplateActor)
   * Optimized for <100ms single template resolution
   */
  async resolveSingleTemplate(templateRef: string): Promise<ResolvedTemplate> {
    const startTime = Date.now();
    console.log('[DependencyResolutionService] 🔧 Starting resolveSingleTemplate for:', templateRef);

    try {
      // Parse template reference: 33402:pubkey:d-tag
      const [kind, pubkey, dTag] = templateRef.split(':');
      console.log('[DependencyResolutionService] 📋 Parsed template ref:', { kind, pubkey, dTag });
      
      if (kind !== '33402' || !pubkey || !dTag) {
        throw new Error(`Invalid template reference format: ${templateRef}`);
      }

      // Resolve the template
      console.log('[DependencyResolutionService] 🔍 Resolving template dependencies...');
      const templates = await this.resolveTemplateDependencies([templateRef]);
      console.log('[DependencyResolutionService] 📦 Template dependencies result:', templates);
      
      if (templates.length === 0) {
        console.error('[DependencyResolutionService] ❌ No templates found for:', templateRef);
        throw new Error(`Template not found: ${templateRef}`);
      }

      const template = templates[0];
      console.log('[DependencyResolutionService] ✅ Found template:', {
        id: template.id,
        name: template.name,
        exerciseCount: template.exercises.length,
        exercises: template.exercises
      });

      // Extract exercise references from this template
      const exerciseRefs = template.exercises.map(ex => ex.exerciseRef);
      console.log('[DependencyResolutionService] 🏋️ Exercise references to resolve:', exerciseRefs);

      // Resolve exercises for this template
      console.log('[DependencyResolutionService] 🔍 Resolving exercise references...');
      const exercises = await this.resolveExerciseReferences(exerciseRefs);
      console.log('[DependencyResolutionService] 📦 Exercise resolution result:', exercises);

      const loadTime = Date.now() - startTime;
      console.log(`[DependencyResolutionService] ✅ Resolved single template in ${loadTime}ms:`, {
        template: template.name,
        exercises: exercises.length,
        exerciseDetails: exercises.map(ex => ({ id: ex.id, name: ex.name }))
      });

      return {
        template,
        exercises,
        loadTime
      };
    } catch (error) {
      console.error('[DependencyResolutionService] ❌ Failed to resolve single template:', error);
      throw error;
    }
  }

  /**
   * NEW: Resolve collections with batched optimization
   * For WorkoutsTab collection browsing
   */
  async resolveCollections(collectionRefs: string[]): Promise<Collection[]> {
    if (collectionRefs.length === 0) {
      return [];
    }

    const startTime = Date.now();
    console.log('[DependencyResolutionService] Resolving collections:', collectionRefs.length);

    // PROVEN PATTERN: Batched author grouping and d-tag collection
    const collectionAuthors = new Set<string>();
    const collectionDTags: string[] = [];

    for (const collectionRef of collectionRefs) {
      const [kind, pubkey, dTag] = collectionRef.split(':');
      if (kind === '30003' && pubkey && dTag) {
        collectionDTags.push(dTag);
        collectionAuthors.add(pubkey);
      }
    }

    if (collectionAuthors.size === 0) {
      console.warn('[DependencyResolutionService] No valid collection references found');
      return [];
    }

    // PROVEN PATTERN: Single batched query
    const filter: NDKFilter = {
      kinds: [30003 as any],
      authors: Array.from(collectionAuthors),
      '#d': collectionDTags
    };

    const collectionEvents = await this.fetchEventsOptimized(filter);

    // Parse collections from events
    const collections: Collection[] = Array.from(collectionEvents).map(event => {
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
    });

    const resolveTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved ${collections.length} collections in ${resolveTime}ms`);

    return collections;
  }
}

// Export singleton instance
export const dependencyResolutionService = new DependencyResolutionService();
