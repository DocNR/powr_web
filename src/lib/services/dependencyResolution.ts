/**
 * Dependency Resolution Service
 * 
 * Extracted from WorkoutListManager.tsx proven optimization patterns
 * achieving 867-903ms performance with CACHE_FIRST + batching strategies.
 * 
 * This service provides pure business logic for resolving Nostr event dependencies
 * while leveraging NDK's IndexedDB cache for optimal performance.
 * 
 * Enhanced with NIP-101e validation for strict compliance.
 */

import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { dataParsingService } from './dataParsingService';

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
  // Raw parameters from workout template (for parameter interpretation)
  parameters?: {
    param1?: string;
    param2?: string;
    param3?: string;
    param4?: string;
  };
}

// NEW: Interface for interpreted exercise parameters
export interface InterpretedExercise {
  exerciseRef: string;
  exerciseTemplate: Exercise;
  parameters: Record<string, {
    value: string;
    unit: string;
    raw: string;
  }>;
  
  // Common parameter interpretations for backward compatibility
  weight: string;
  reps: string;
  rpe: string;
  setType: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  
  // NEW: NIP-101e required fields
  format: string[];           // e.g., ['weight', 'reps', 'rpe', 'set_type']
  format_units: string[];     // e.g., ['kg', 'count', '0-10', 'warmup|normal|drop|failure']
  equipment: string;          // e.g., 'barbell', 'dumbbell', 'bodyweight'
  
  // NEW: Optional NIP-101e fields
  difficulty?: string;        // e.g., 'beginner', 'intermediate', 'advanced'
  hashtags: string[];         // All 't' tags
  
  // Derived fields
  muscleGroups: string[];     // Filtered hashtags for muscle groups
  instructions: string[];
  
  // Metadata
  authorPubkey: string;
  createdAt: number;
  eventId?: string;
}

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  reason?: string;
  eventRef?: string;
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

// Import ParsedWorkoutEvent from dataParsingService for workout records
export type WorkoutRecord = import('./dataParsingService').ParsedWorkoutEvent;

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
 * - NIP-101e validation with clear error messages
 */
export class DependencyResolutionService {
  
  /**
   * Validate exercise reference format
   */
  private validateExerciseReference(exerciseRef: string): ValidationResult {
    const parts = exerciseRef.split(':');
    
    if (parts.length !== 3) {
      return {
        isValid: false,
        reason: `Invalid exercise reference format: "${exerciseRef}". Expected "33401:pubkey:d-tag" but got ${parts.length} parts. Remove extra comma-separated data.`,
        eventRef: exerciseRef
      };
    }
    
    if (parts[0] !== '33401') {
      return {
        isValid: false,
        reason: `Invalid exercise kind: "${parts[0]}". Exercise templates must use kind 33401.`,
        eventRef: exerciseRef
      };
    }
    
    if (parts[1].length !== 64) {
      return {
        isValid: false,
        reason: `Invalid pubkey length: "${parts[1]}" (${parts[1].length} chars). Pubkeys must be exactly 64 hex characters.`,
        eventRef: exerciseRef
      };
    }
    
    if (parts[2].includes(',')) {
      return {
        isValid: false,
        reason: `Invalid d-tag: "${parts[2]}". D-tags cannot contain commas. This looks like workout parameters mixed into the reference.`,
        eventRef: exerciseRef
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate exercise template event for NIP-101e compliance
   */
  private validateExerciseTemplate(event: NDKEvent): ValidationResult {
    const eventRef = `${event.kind}:${event.pubkey}:${this.getEventDTag(event)}`;
    
    // Check required NIP-101e fields
    const required = ['d', 'title', 'format', 'format_units', 'equipment'];
    for (const field of required) {
      if (!this.hasTag(event, field)) {
        return {
          isValid: false,
          reason: `Missing required ${field} tag. POWR needs this to display exercises correctly.`,
          eventRef
        };
      }
    }
    
    // Validate format/format_units match
    const format = this.getTagValues(event, 'format');
    const format_units = this.getTagValues(event, 'format_units');
    
    if (format.length !== format_units.length) {
      return {
        isValid: false,
        reason: `Format units (${format_units.length}) don't match format parameters (${format.length}). Each parameter needs a unit.`,
        eventRef
      };
    }
    
    return { isValid: true };
  }

  /**
   * Helper: Check if event has a specific tag
   */
  private hasTag(event: NDKEvent, tagName: string): boolean {
    return event.tags.some(tag => tag[0] === tagName);
  }

  /**
   * Helper: Get all values for a specific tag
   */
  private getTagValues(event: NDKEvent, tagName: string): string[] {
    const tag = event.tags.find(tag => tag[0] === tagName);
    return tag ? tag.slice(1) : [];
  }

  /**
   * Helper: Get d-tag value from event
   */
  private getEventDTag(event: NDKEvent): string {
    const dTag = event.tags.find(tag => tag[0] === 'd');
    return dTag ? dTag[1] : 'unknown';
  }

  /**
   * Parse valid exercise template with NIP-101e fields
   */
  private parseValidExerciseTemplate(event: NDKEvent): Exercise {
    const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
    
    const id = tagMap.get('d')![1];
    const name = tagMap.get('title')![1] || tagMap.get('name')?.[1] || 'Unknown Exercise';
    const description = event.content || 'No description';
    
    // NEW: NIP-101e required fields
    const format = tagMap.get('format')!.slice(1);
    const format_units = tagMap.get('format_units')!.slice(1);
    const equipment = tagMap.get('equipment')![1];
    
    // NEW: Optional fields
    const difficulty = tagMap.get('difficulty')?.[1];
    const hashtags = event.tags.filter(t => t[0] === 't').map(t => t[1]);
    
    // NEW: Derived fields
    const muscleGroups = event.tags
      .filter(t => t[0] === 't')
      .map(t => t[1])
      .filter(tag => ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'].includes(tag));
    
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
      
      // NEW: NIP-101e fields
      format,
      format_units,
      equipment,
      difficulty,
      hashtags,
      muscleGroups,
      
      // Existing fields
      instructions,
      authorPubkey: event.pubkey,
      createdAt: event.created_at || Math.floor(Date.now() / 1000),
      eventId: event.id
    };
  }

  /**
   * Optimized event fetching with configurable cache strategy
   * Enhanced to support ONLY_CACHE for true offline functionality
   * Extracted from WorkoutListManager lines 200-210
   */
  private async fetchEventsOptimized(
    filter: NDKFilter, 
    cacheUsage: NDKSubscriptionCacheUsage = NDKSubscriptionCacheUsage.CACHE_FIRST
  ): Promise<Set<NDKEvent>> {
    const startTime = Date.now();
    
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    console.log(`[DependencyResolutionService] Fetching events with ${cacheUsage} strategy:`, filter);

    // ENHANCED PATTERN: Configurable cache strategy following NDK best practices
    const events = await ndk.fetchEvents(filter, {
      cacheUsage,
      closeOnEose: true
    });

    const fetchTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Fetched ${events.size} events in ${fetchTime}ms using ${cacheUsage}`);

    return events;
  }

  /**
   * NEW: Fetch events from cache only (true offline functionality)
   * Uses ONLY_CACHE strategy to prevent network requests
   */
  private async fetchFromCacheOnly(filter: NDKFilter): Promise<Set<NDKEvent>> {
    return this.fetchEventsOptimized(filter, NDKSubscriptionCacheUsage.ONLY_CACHE);
  }

  /**
   * NEW: Fetch events cache-first with network fallback
   * Uses CACHE_FIRST strategy (existing behavior)
   */
  private async fetchCacheFirst(filter: NDKFilter): Promise<Set<NDKEvent>> {
    return this.fetchEventsOptimized(filter, NDKSubscriptionCacheUsage.CACHE_FIRST);
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
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
      authors: Array.from(templateAuthors),
      '#d': templateDTags
    };

    const templateEvents = await this.fetchEventsOptimized(filter);

    // Use DataParsingService for template parsing
    const templates = dataParsingService.parseWorkoutTemplatesBatch(Array.from(templateEvents));

    const resolveTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved ${templates.length} templates in ${resolveTime}ms`);

    return templates;
  }

  /**
   * Resolve exercise dependencies with batched optimization and NIP-101e validation
   * Enhanced with strict validation and clear error messages
   */
  async resolveExerciseReferences(exerciseRefs: string[]): Promise<Exercise[]> {
    if (exerciseRefs.length === 0) {
      return [];
    }

    const startTime = Date.now();
    console.log('[DependencyResolutionService] Resolving exercise references:', exerciseRefs.length);

    // Stage 1: Validate exercise reference format using DataParsingService
    const validRefs = exerciseRefs.filter(ref => {
      const validation = dataParsingService.validateExerciseReference(ref);
      return validation.isValid;
    });

    if (validRefs.length === 0) {
      console.warn('[DependencyResolutionService] No valid exercise references found');
      return [];
    }

    // Stage 2: Fetch events (existing batched logic)
    const uniqueRefs = [...new Set(validRefs)];
    const exerciseAuthors = new Set<string>();
    const exerciseDTags: string[] = [];

    for (const exerciseRef of uniqueRefs) {
      const [, pubkey, dTag] = exerciseRef.split(':');
      exerciseDTags.push(dTag);
      exerciseAuthors.add(pubkey);
    }

    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE as number],
      authors: Array.from(exerciseAuthors),
      '#d': exerciseDTags
    };

    const exerciseEvents = await this.fetchEventsOptimized(filter);

    // Stage 3: Use DataParsingService for batch parsing with validation
    const exercises = dataParsingService.parseExerciseTemplatesBatch(Array.from(exerciseEvents));

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
   * NEW: Resolve workout records for history functionality
   * Optimized for workout history tab with CACHE_FIRST strategy
   */
  async resolveWorkoutRecords(userPubkey: string, limit: number = 50): Promise<WorkoutRecord[]> {
    const startTime = Date.now();
    console.log('[DependencyResolutionService] Resolving workout records for user:', userPubkey.slice(0, 8));

    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number],
      authors: [userPubkey],
      limit: limit
    };

    const workoutEvents = await this.fetchEventsOptimized(filter);

    // Use DataParsingService for workout record parsing
    const workoutRecords = dataParsingService.parseWorkoutEventsBatch(Array.from(workoutEvents));

    const resolveTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved ${workoutRecords.length} workout records in ${resolveTime}ms`);

    return workoutRecords;
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
      const [kindStr, pubkey, dTag] = collectionRef.split(':');
      if (kindStr === '30003' && pubkey && dTag) {
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
      kinds: [30003],
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

  // ========================================
  // PUBLIC OFFLINE-FIRST API METHODS
  // ========================================

  /**
   * NEW: Resolve template dependencies from cache only (offline-first)
   * Uses ONLY_CACHE strategy to prevent network requests
   */
  async resolveTemplateDependenciesOffline(templateRefs: string[]): Promise<WorkoutTemplate[]> {
    if (templateRefs.length === 0) {
      return [];
    }

    const startTime = Date.now();
    console.log('[DependencyResolutionService] 🔌 Resolving template dependencies OFFLINE:', templateRefs.length);

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

    // OFFLINE PATTERN: Single batched query with ONLY_CACHE
    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
      authors: Array.from(templateAuthors),
      '#d': templateDTags
    };

    const templateEvents = await this.fetchFromCacheOnly(filter);

    // Use DataParsingService for template parsing
    const templates = dataParsingService.parseWorkoutTemplatesBatch(Array.from(templateEvents));

    const resolveTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved ${templates.length} templates OFFLINE in ${resolveTime}ms`);

    return templates;
  }

  /**
   * NEW: Resolve exercise references from cache only (offline-first)
   * Uses ONLY_CACHE strategy to prevent network requests
   */
  async resolveExerciseReferencesOffline(exerciseRefs: string[]): Promise<Exercise[]> {
    if (exerciseRefs.length === 0) {
      return [];
    }

    const startTime = Date.now();
    console.log('[DependencyResolutionService] 🔌 Resolving exercise references OFFLINE:', exerciseRefs.length);

    // Stage 1: Validate exercise reference format using DataParsingService
    const validRefs = exerciseRefs.filter(ref => {
      const validation = dataParsingService.validateExerciseReference(ref);
      return validation.isValid;
    });

    if (validRefs.length === 0) {
      console.warn('[DependencyResolutionService] No valid exercise references found');
      return [];
    }

    // Stage 2: Fetch events from cache only
    const uniqueRefs = [...new Set(validRefs)];
    const exerciseAuthors = new Set<string>();
    const exerciseDTags: string[] = [];

    for (const exerciseRef of uniqueRefs) {
      const [, pubkey, dTag] = exerciseRef.split(':');
      exerciseDTags.push(dTag);
      exerciseAuthors.add(pubkey);
    }

    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE as number],
      authors: Array.from(exerciseAuthors),
      '#d': exerciseDTags
    };

    const exerciseEvents = await this.fetchFromCacheOnly(filter);

    // Stage 3: Use DataParsingService for batch parsing with validation
    const exercises = dataParsingService.parseExerciseTemplatesBatch(Array.from(exerciseEvents));

    const resolveTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved ${exercises.length} exercises OFFLINE in ${resolveTime}ms`);

    return exercises;
  }

  /**
   * NEW: Resolve single template from cache only (offline-first)
   * Optimized for <50ms cache-only template resolution
   */
  async resolveSingleTemplateOffline(templateRef: string): Promise<ResolvedTemplate | null> {
    const startTime = Date.now();
    console.log('[DependencyResolutionService] 🔌 Starting resolveSingleTemplateOffline for:', templateRef);

    try {
      // Parse template reference: 33402:pubkey:d-tag
      const [kind, pubkey, dTag] = templateRef.split(':');
      
      if (kind !== '33402' || !pubkey || !dTag) {
        throw new Error(`Invalid template reference format: ${templateRef}`);
      }

      // Resolve the template from cache only
      const templates = await this.resolveTemplateDependenciesOffline([templateRef]);
      
      if (templates.length === 0) {
        console.warn('[DependencyResolutionService] ❌ No templates found in cache for:', templateRef);
        return null; // Return null instead of throwing for offline scenarios
      }

      const template = templates[0];

      // Extract exercise references from this template
      const exerciseRefs = template.exercises.map(ex => ex.exerciseRef);

      // Resolve exercises from cache only
      const exercises = await this.resolveExerciseReferencesOffline(exerciseRefs);

      const loadTime = Date.now() - startTime;
      console.log(`[DependencyResolutionService] ✅ Resolved single template OFFLINE in ${loadTime}ms:`, {
        template: template.name,
        exercises: exercises.length
      });

      return {
        template,
        exercises,
        loadTime
      };
    } catch (error) {
      console.warn('[DependencyResolutionService] ⚠️ Failed to resolve single template offline:', error);
      return null; // Return null instead of throwing for offline scenarios
    }
  }

  /**
   * NEW: Resolve all collection content from cache only (offline-first)
   * Uses ONLY_CACHE strategy for complete offline functionality
   */
  async resolveAllCollectionContentOffline(collections: Collection[]): Promise<{
    templates: WorkoutTemplate[];
    exercises: Exercise[];
    totalTime: number;
  }> {
    const startTime = Date.now();
    console.log('[DependencyResolutionService] 🔌 Resolving all collection content OFFLINE:', collections.length);

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

    // Resolve templates from cache only
    const templates = await this.resolveTemplateDependenciesOffline(Array.from(allTemplateRefs));

    // PROVEN PATTERN: Extract exercise references from resolved templates
    const allExerciseRefs = new Set<string>();
    
    for (const template of templates) {
      for (const exercise of template.exercises) {
        allExerciseRefs.add(exercise.exerciseRef);
      }
    }

    // Resolve exercises from cache only
    const exercises = await this.resolveExerciseReferencesOffline(Array.from(allExerciseRefs));

    const totalTime = Date.now() - startTime;
    console.log(`[DependencyResolutionService] ✅ Resolved complete dependency chain OFFLINE in ${totalTime}ms:`, {
      templates: templates.length,
      exercises: exercises.length
    });

    return {
      templates,
      exercises,
      totalTime
    };
  }
}

// Export singleton instance
export const dependencyResolutionService = new DependencyResolutionService();
