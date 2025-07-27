/**
 * Data Parsing Service for Workout Data Consolidation
 * 
 * Centralized parsing logic for all workout-related Nostr events, extracted from
 * scattered parsing functions across WorkoutDataProvider, workout-events.ts,
 * dependencyResolution.ts, and workoutAnalytics.ts.
 * 
 * Follows NDK-first service architecture patterns - pure parsing logic only,
 * no NDK operations. Integrates with ParameterInterpretationService for
 * advanced exercise parameter parsing.
 */

import type { NDKEvent } from '@nostr-dev-kit/ndk';
import { WORKOUT_EVENT_KINDS, type WorkoutEventKind } from '@/lib/ndk';
import { parameterInterpretationService } from './parameterInterpretation';
import type {
  WorkoutTemplate,
  TemplateExercise,
  Exercise,
  Collection,
  ResolvedTemplate
} from './dependencyResolution';

// Re-export types from dependencyResolution for compatibility
export type {
  WorkoutTemplate,
  TemplateExercise,
  Exercise,
  Collection,
  ResolvedTemplate
};

// Core parsing result interfaces
export interface ParsedWorkoutEvent {
  id: string;
  title: string;
  description: string;
  workoutType: 'strength' | 'circuit' | 'emom' | 'amrap';
  startTime: number;
  endTime: number;
  duration: number;
  completed: boolean;
  exercises: ParsedExerciseSet[];
  templateReference?: string;
  templatePubkey?: string;
  authorPubkey: string;
  createdAt: number;
  eventId: string;
  tags: string[][];
}

export interface ParsedExerciseSet {
  exerciseRef: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
  setType: 'warmup' | 'normal' | 'drop' | 'failure';
  completedAt?: number;
}

export interface SocialWorkout {
  id: string;
  title: string;
  description: string;
  authorPubkey: string;
  createdAt: number;
  duration: number;
  exerciseCount: number;
  templateId?: string;
  templateName?: string;
  workoutType: string;
  eventId: string;
  tags: string[][];
}

export interface DiscoveryWorkout {
  id: string;
  title: string;
  description: string;
  authorPubkey: string;
  createdAt: number;
  estimatedDuration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  exerciseCount: number;
  workoutType: string;
  eventId: string;
  tags: string[][];
}

export interface ParsedExerciseRef {
  kind: number;
  pubkey: string;
  dTag: string;
  isValid: boolean;
  error?: string;
}

export interface ParsedTemplateRef {
  kind: number;
  pubkey: string;
  dTag: string;
  isValid: boolean;
  error?: string;
}

export interface InterpretedExercise {
  exerciseRef: string;
  exerciseTemplate: Exercise;
  parameters: Record<string, {
    value: string;
    unit: string;
    raw: string;
  }>;
  
  // Backward compatibility
  weight: string;
  reps: string;
  rpe: string;
  setType: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Data Parsing Service
 * 
 * Centralized parsing logic following NDK-first architecture:
 * - Pure parsing functions - no NDK operations
 * - Comprehensive TypeScript interfaces
 * - Integration with ParameterInterpretationService
 * - Consistent error handling and validation
 * - Singleton pattern for service access
 * - Intelligent LRU caching to prevent duplicate parsing
 */
export class DataParsingService {
  // LRU Cache for parsed results to prevent duplicate parsing
  private parseCache = new Map<string, unknown>();
  private maxCacheSize = 1000;
  
  // Performance metrics
  private metrics = {
    parseCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalParseTime: 0
  };

  /**
   * Get cached parse result or execute parse function
   * Implements LRU cache with automatic size management
   */
  getCachedParse<T>(eventId: string, parseFunction: () => T): T {
    // Check cache first
    if (this.parseCache.has(eventId)) {
      this.metrics.cacheHits++;
      const result = this.parseCache.get(eventId) as T;
      
      // Move to end for LRU (delete and re-add)
      this.parseCache.delete(eventId);
      this.parseCache.set(eventId, result);
      
      console.log(`[DataParsingService] 🎯 Cache HIT for ${eventId.slice(0, 8)}... (${this.metrics.cacheHits}/${this.metrics.cacheHits + this.metrics.cacheMisses} hit rate)`);
      return result;
    }
    
    // Cache miss - execute parse function
    this.metrics.cacheMisses++;
    const startTime = Date.now();
    const result = parseFunction();
    const parseTime = Date.now() - startTime;
    
    this.metrics.parseCount++;
    this.metrics.totalParseTime += parseTime;
    
    // LRU cache management - remove oldest if at capacity
    if (this.parseCache.size >= this.maxCacheSize) {
      const firstKey = this.parseCache.keys().next().value as string | undefined;
      if (firstKey) {
        this.parseCache.delete(firstKey);
        console.log(`[DataParsingService] 🗑️ Cache evicted oldest entry: ${firstKey.slice(0, 8)}...`);
      }
    }
    
    // Store in cache
    this.parseCache.set(eventId, result);
    
    console.log(`[DataParsingService] ⚡ Cache MISS for ${eventId.slice(0, 8)}... - parsed in ${parseTime}ms (cache size: ${this.parseCache.size})`);
    return result;
  }

  /**
   * Log performance metrics for debugging
   */
  logPerformanceMetrics() {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.metrics.cacheHits / totalRequests) * 100 : 0;
    const avgParseTime = this.metrics.parseCount > 0 ? this.metrics.totalParseTime / this.metrics.parseCount : 0;
    
    console.group('[DataParsingService] 📊 Performance Metrics');
    console.log(`Cache Hit Rate: ${hitRate.toFixed(1)}% (${this.metrics.cacheHits}/${totalRequests})`);
    console.log(`Total Parses: ${this.metrics.parseCount} (${this.metrics.totalParseTime}ms total, ${avgParseTime.toFixed(1)}ms avg)`);
    console.log(`Cache Size: ${this.parseCache.size}/${this.maxCacheSize}`);
    console.groupEnd();
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    const cacheSize = this.parseCache.size;
    this.parseCache.clear();
    console.log(`[DataParsingService] 🧹 Cache cleared (${cacheSize} entries removed)`);
  }
  
  /**
   * Parse workout record event (Kind 1301)
   * Extracted from workout-events.ts parseWorkoutEvent()
   */
  parseWorkoutEvent(event: NDKEvent): ParsedWorkoutEvent | null {
    try {
      const validation = this.validateNIP101eEvent(event);
      if (!validation.isValid) {
        console.warn(`[DataParsingService] Invalid workout event ${event.id}:`, validation.error);
        return null;
      }

      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const id = tagMap.get('d')?.[1] || event.id;
      const title = tagMap.get('title')?.[1] || tagMap.get('name')?.[1] || 'Untitled Workout';
      const description = event.content || 'No description';
      const workoutType = (tagMap.get('type')?.[1] || 'strength') as 'strength' | 'circuit' | 'emom' | 'amrap';
      
      const startTime = parseInt(tagMap.get('start')?.[1] || '0') * 1000;
      const endTime = parseInt(tagMap.get('end')?.[1] || '0') * 1000;
      const duration = endTime - startTime;
      const completed = tagMap.get('completed')?.[1] === 'true';
      
      // Parse template reference
      const templateTag = tagMap.get('template');
      const templateReference = templateTag?.[1];
      const templatePubkey = templateReference?.split(':')[1];
      
      // Parse exercise sets
      const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
      const exercises: ParsedExerciseSet[] = exerciseTags.map((tag, index) => {
        const [, exerciseRef, , weight, reps, rpe, setType, setNumber] = tag;
        
        return {
          exerciseRef,
          setNumber: parseInt(setNumber || (index + 1).toString()),
          reps: parseInt(reps || '1'),
          weight: parseFloat(weight || '0'),
          rpe: rpe ? parseFloat(rpe) : undefined,
          setType: (setType || 'normal') as 'warmup' | 'normal' | 'drop' | 'failure',
          completedAt: event.created_at ? event.created_at * 1000 : Date.now()
        };
      });
      
      const parsed: ParsedWorkoutEvent = {
        id,
        title,
        description,
        workoutType,
        startTime,
        endTime,
        duration,
        completed,
        exercises,
        templateReference,
        templatePubkey,
        authorPubkey: event.pubkey,
        createdAt: event.created_at ? event.created_at * 1000 : Date.now(),
        eventId: event.id,
        tags: event.tags
      };
      
      console.log(`[DataParsingService] ✅ Parsed workout: ${title} (${exercises.length} sets)`);
      return parsed;
      
    } catch (error) {
      console.error(`[DataParsingService] Failed to parse workout event ${event.id}:`, error);
      return null;
    }
  }

  /**
   * Parse exercise template event (Kind 33401)
   * Extracted from dependencyResolution.ts parseValidExerciseTemplate()
   */
  parseExerciseTemplate(event: NDKEvent): Exercise | null {
    try {
      const validation = this.validateExerciseTemplate(event);
      if (!validation.isValid) {
        console.warn(`[DataParsingService] Invalid exercise template ${event.id}:`, validation.error);
        return null;
      }

      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const id = tagMap.get('d')![1];
      const name = tagMap.get('title')![1] || tagMap.get('name')?.[1] || 'Unknown Exercise';
      const description = event.content || 'No description';
      
      // NIP-101e required fields
      const format = tagMap.get('format')!.slice(1);
      const format_units = tagMap.get('format_units')!.slice(1);
      const equipment = tagMap.get('equipment')![1];
      
      // Optional fields
      const difficulty = tagMap.get('difficulty')?.[1];
      const hashtags = event.tags.filter(t => t[0] === 't').map(t => t[1]);
      
      // Derived fields
      const muscleGroups = hashtags.filter(tag => 
        ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'].includes(tag)
      );
      
      // Parse instructions from content if JSON
      let instructions: string[] = [];
      try {
        const contentData = JSON.parse(event.content || '{}');
        instructions = contentData.instructions || [];
      } catch {
        instructions = ['No instructions available'];
      }
      
      const parsed: Exercise = {
        id,
        name,
        description,
        format,
        format_units,
        equipment,
        difficulty,
        hashtags,
        muscleGroups,
        instructions,
        authorPubkey: event.pubkey,
        createdAt: event.created_at || Math.floor(Date.now() / 1000),
        eventId: event.id
      };
      
      console.log(`[DataParsingService] ✅ Parsed exercise template: ${name}`);
      return parsed;
      
    } catch (error) {
      console.error(`[DataParsingService] Failed to parse exercise template ${event.id}:`, error);
      return null;
    }
  }

  /**
   * Parse workout template event (Kind 33402)
   * Extracted from dependencyResolution.ts resolveTemplateDependencies()
   * 
   * FIXED: Correct NIP-101e exercise tag parsing with proper indexing
   * Format: ["exercise", "33401:pubkey:d-tag", "relay-url", "weight", "reps", "rpe", "set_type"]
   */
  parseWorkoutTemplate(event: NDKEvent): WorkoutTemplate | null {
    console.log(`[DataParsingService] Parsing workout template: ${event.id}`);
    
    try {
      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const id = tagMap.get('d')?.[1] || 'unknown';
      const name = tagMap.get('title')?.[1] || tagMap.get('name')?.[1] || 'Untitled Template';
      const description = event.content || 'No description';
      const difficulty = tagMap.get('difficulty')?.[1] as 'beginner' | 'intermediate' | 'advanced' | undefined;
      const estimatedDuration = tagMap.get('duration')?.[1] ? parseInt(tagMap.get('duration')![1]) : undefined;
      
      // Extract exercise references with CORRECT NIP-101e indexing
      const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
      
      // Group exercise tags by exerciseRef to count sets per exercise
      const exerciseGroups = new Map<string, string[][]>();
      exerciseTags.forEach(tag => {
        const [, exerciseRef] = tag;
        if (!exerciseGroups.has(exerciseRef)) {
          exerciseGroups.set(exerciseRef, []);
        }
        exerciseGroups.get(exerciseRef)!.push(tag);
      });
      
      const exercises: TemplateExercise[] = Array.from(exerciseGroups.entries()).map(([exerciseRef, tags]) => {
        // Use the first tag for the exercise parameters (they should all be the same for a template)
        const [, , , weight, reps, rpe, setType] = tags[0];
        
        console.log(`[DataParsingService] 🔍 TEMPLATE EXERCISE DEBUG: ${exerciseRef}`, {
          exerciseRef,
          tagCount: tags.length,
          weight,
          reps,
          rpe,
          setType
        });
        
        return {
          exerciseRef,
          sets: tags.length, // Count of exercise tags = number of sets planned
          reps: parseInt(reps) || 10,
          weight: weight ? parseInt(weight) : undefined,
          restTime: 60,
          // Store raw parameters for parameter interpretation service
          parameters: {
            param1: weight || '',
            param2: reps || '',
            param3: rpe || '',
            param4: setType || ''
          }
        };
      });
      
      const parsed: WorkoutTemplate = {
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
      
      console.log(`[DataParsingService] ✅ Parsed workout template: ${name} (${exercises.length} exercises)`);
      return parsed;
      
    } catch (error) {
      console.error(`[DataParsingService] Failed to parse workout template ${event.id}:`, error);
      return null;
    }
  }

  /**
   * Parse collection event (Kind 30003)
   * Extracted from dependencyResolution.ts resolveCollections()
   */
  parseCollection(event: NDKEvent): Collection | null {
    console.log(`[DataParsingService] Parsing collection: ${event.id}`);
    
    try {
      const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
      
      const id = tagMap.get('d')?.[1] || 'unknown';
      const name = tagMap.get('name')?.[1] || tagMap.get('title')?.[1] || 'Unknown Collection';
      const description = event.content || 'No description';
      
      // Extract content references (a tags)
      const contentRefs = event.tags
        .filter(tag => tag[0] === 'a')
        .map(tag => tag[1]);
      
      const parsed: Collection = {
        id,
        name,
        description,
        contentRefs,
        authorPubkey: event.pubkey,
        createdAt: event.created_at || Math.floor(Date.now() / 1000),
        eventId: event.id
      };
      
      console.log(`[DataParsingService] ✅ Parsed collection: ${name} (${contentRefs.length} items)`);
      return parsed;
      
    } catch (error) {
      console.error(`[DataParsingService] Failed to parse collection ${event.id}:`, error);
      return null;
    }
  }

  /**
   * Parse social workout for social feed display
   * Extracted from WorkoutDataProvider.tsx socialWorkouts useMemo
   */
  parseSocialWorkout(workoutEvent: NDKEvent, templateEvent?: NDKEvent): SocialWorkout | null {
    console.log(`[DataParsingService] Parsing social workout: ${workoutEvent.id}`);
    
    return this.getCachedParse(`social_${workoutEvent.id}`, () => {
      try {
        const parsedWorkout = this.getCachedParse(`workout_${workoutEvent.id}`, () => 
          this.parseWorkoutEvent(workoutEvent)
        );
        
        if (!parsedWorkout) {
          return null;
        }
        
        const templateName = templateEvent ? 
          this.getCachedParse(`template_${templateEvent.id}`, () => 
            this.parseWorkoutTemplate(templateEvent)
          )?.name : 
          undefined;
        
        const social: SocialWorkout = {
          id: parsedWorkout.id,
          title: templateName || parsedWorkout.title, // Use template name if available, fallback to workout title
          description: parsedWorkout.description,
          authorPubkey: parsedWorkout.authorPubkey,
          createdAt: parsedWorkout.createdAt,
          duration: parsedWorkout.duration,
          exerciseCount: parsedWorkout.exercises.length,
          templateId: parsedWorkout.templateReference?.split(':')[2],
          templateName,
          workoutType: parsedWorkout.workoutType,
          eventId: parsedWorkout.eventId,
          tags: parsedWorkout.tags
        };
        
        console.log(`[DataParsingService] ✅ Parsed social workout: ${social.title}`);
        return social;
        
      } catch (error) {
        console.error(`[DataParsingService] Failed to parse social workout ${workoutEvent.id}:`, error);
        return null;
      }
    });
  }

  /**
   * Parse discovery template for workout discovery
   * Extracted from WorkoutDataProvider.tsx discoveryTemplates useMemo
   */
  parseDiscoveryTemplate(templateEvent: NDKEvent): DiscoveryWorkout | null {
    console.log(`[DataParsingService] Parsing discovery template: ${templateEvent.id}`);
    
    return this.getCachedParse(`discovery_${templateEvent.id}`, () => {
      try {
        const parsedTemplate = this.getCachedParse(`template_${templateEvent.id}`, () => 
          this.parseWorkoutTemplate(templateEvent)
        );
        
        if (!parsedTemplate) {
          return null;
        }
        
        const discovery: DiscoveryWorkout = {
          id: parsedTemplate.id,
          title: parsedTemplate.name,
          description: parsedTemplate.description,
          authorPubkey: parsedTemplate.authorPubkey,
          createdAt: parsedTemplate.createdAt * 1000, // Convert to milliseconds
          estimatedDuration: parsedTemplate.estimatedDuration,
          difficulty: parsedTemplate.difficulty,
          exerciseCount: parsedTemplate.exercises.length,
          workoutType: 'strength', // Default for templates
          eventId: parsedTemplate.eventId!,
          tags: parsedTemplate.tags || []
        };
        
        console.log(`[DataParsingService] ✅ Parsed discovery template: ${discovery.title}`);
        return discovery;
        
      } catch (error) {
        console.error(`[DataParsingService] Failed to parse discovery template ${templateEvent.id}:`, error);
        return null;
      }
    });
  }

  /**
   * Parse exercise reference string
   * Extracted from workoutAnalytics.ts parseExerciseReference()
   */
  parseExerciseReference(exerciseRef: string): ParsedExerciseRef {
    console.log(`[DataParsingService] Parsing exercise reference: ${exerciseRef}`);
    
    const parts = exerciseRef.split(':');
    if (parts.length !== 3) {
      return {
        kind: 0,
        pubkey: '',
        dTag: '',
        isValid: false,
        error: `Invalid exercise reference format: ${exerciseRef}. Expected "kind:pubkey:d-tag"`
      };
    }
    
    const [kindStr, pubkey, dTag] = parts;
    const kind = parseInt(kindStr);
    
    if (isNaN(kind) || !pubkey || !dTag) {
      return {
        kind: 0,
        pubkey: '',
        dTag: '',
        isValid: false,
        error: `Invalid exercise reference components: kind=${kindStr}, pubkey=${pubkey}, dTag=${dTag}`
      };
    }
    
    if (kind !== WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE) {
      return {
        kind,
        pubkey,
        dTag,
        isValid: false,
        error: `Invalid exercise kind: ${kind}. Expected ${WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE}`
      };
    }
    
    return {
      kind,
      pubkey,
      dTag,
      isValid: true
    };
  }

  /**
   * Parse template reference string
   * New method for template reference parsing
   */
  parseTemplateReference(templateRef: string): ParsedTemplateRef {
    console.log(`[DataParsingService] Parsing template reference: ${templateRef}`);
    
    const parts = templateRef.split(':');
    if (parts.length !== 3) {
      return {
        kind: 0,
        pubkey: '',
        dTag: '',
        isValid: false,
        error: `Invalid template reference format: ${templateRef}. Expected "kind:pubkey:d-tag"`
      };
    }
    
    const [kindStr, pubkey, dTag] = parts;
    const kind = parseInt(kindStr);
    
    if (isNaN(kind) || !pubkey || !dTag) {
      return {
        kind: 0,
        pubkey: '',
        dTag: '',
        isValid: false,
        error: `Invalid template reference components: kind=${kindStr}, pubkey=${pubkey}, dTag=${dTag}`
      };
    }
    
    if (kind !== WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE) {
      return {
        kind,
        pubkey,
        dTag,
        isValid: false,
        error: `Invalid template kind: ${kind}. Expected ${WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE}`
      };
    }
    
    return {
      kind,
      pubkey,
      dTag,
      isValid: true
    };
  }

  /**
   * Parse exercise with parameter interpretation
   * Integration with ParameterInterpretationService
   */
  parseExerciseWithParameters(
    exerciseRef: string,
    rawParams: string[],
    exerciseTemplate: Exercise
  ): InterpretedExercise | null {
    console.log(`[DataParsingService] Parsing exercise with parameters: ${exerciseRef}`);
    
    try {
      const refValidation = this.parseExerciseReference(exerciseRef);
      if (!refValidation.isValid) {
        console.warn(`[DataParsingService] Invalid exercise reference: ${refValidation.error}`);
        return null;
      }
      
      // Use ParameterInterpretationService for advanced parameter parsing
      const interpretation = parameterInterpretationService.interpretExerciseParameters(
        rawParams,
        exerciseTemplate
      );
      
      if (!interpretation.isValid) {
        console.warn(`[DataParsingService] Parameter interpretation failed:`, interpretation.validationErrors);
        // Continue with best-effort parsing
      }
      
      const interpreted: InterpretedExercise = {
        exerciseRef,
        exerciseTemplate,
        parameters: interpretation.parameters,
        weight: interpretation.backwardCompatibility.weight,
        reps: interpretation.backwardCompatibility.reps,
        rpe: interpretation.backwardCompatibility.rpe,
        setType: interpretation.backwardCompatibility.setType
      };
      
      console.log(`[DataParsingService] ✅ Parsed exercise with parameters: ${exerciseTemplate.name}`);
      return interpreted;
      
    } catch (error) {
      console.error(`[DataParsingService] Failed to parse exercise with parameters:`, error);
      return null;
    }
  }

  /**
   * Validate NIP-101e event structure
   * Extracted from workout-events.ts validation functions
   */
  validateNIP101eEvent(event: NDKEvent): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check event kind
    const validKinds: WorkoutEventKind[] = [
      WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE,
      WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE,
      WORKOUT_EVENT_KINDS.WORKOUT_RECORD
    ];
    
    if (!validKinds.includes(event.kind as WorkoutEventKind)) {
      errors.push(`Invalid event kind: ${event.kind}. Expected one of: ${validKinds.join(', ')}`);
    }
    
    // Check required d-tag
    const dTag = event.tags.find(tag => tag[0] === 'd');
    if (!dTag || !dTag[1]) {
      errors.push('Missing required d-tag');
    }
    
    // Kind-specific validation
    if (event.kind === WORKOUT_EVENT_KINDS.WORKOUT_RECORD) {
      const requiredTags = ['title', 'type', 'start', 'end', 'completed'];
      for (const tagName of requiredTags) {
        const tag = event.tags.find(t => t[0] === tagName);
        if (!tag || !tag[1]) {
          errors.push(`Missing required ${tagName} tag for workout record`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      warnings
    };
  }

  /**
   * Validate exercise template event
   * Extracted from dependencyResolution.ts validateExerciseTemplate()
   */
  validateExerciseTemplate(event: NDKEvent): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required NIP-101e fields
    const required = ['d', 'title', 'format', 'format_units', 'equipment'];
    for (const field of required) {
      const tag = event.tags.find(tag => tag[0] === field);
      if (!tag || !tag[1]) {
        errors.push(`Missing required ${field} tag`);
      }
    }
    
    // Validate format/format_units match
    const formatTag = event.tags.find(tag => tag[0] === 'format');
    const formatUnitsTag = event.tags.find(tag => tag[0] === 'format_units');
    
    if (formatTag && formatUnitsTag) {
      const format = formatTag.slice(1);
      const formatUnits = formatUnitsTag.slice(1);
      
      if (format.length !== formatUnits.length) {
        errors.push(`Format units (${formatUnits.length}) don't match format parameters (${format.length})`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      warnings
    };
  }

  /**
   * Validate exercise reference format
   * Extracted from dependencyResolution.ts validateExerciseReference()
   */
  validateExerciseReference(exerciseRef: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const parts = exerciseRef.split(':');
    
    if (parts.length !== 3) {
      errors.push(`Invalid exercise reference format: "${exerciseRef}". Expected "33401:pubkey:d-tag" but got ${parts.length} parts. Remove extra comma-separated data.`);
      return { isValid: false, error: errors.join('; '), warnings };
    }
    
    if (parts[0] !== '33401') {
      errors.push(`Invalid exercise kind: "${parts[0]}". Exercise templates must use kind 33401.`);
    }
    
    if (parts[1].length !== 64) {
      errors.push(`Invalid pubkey length: "${parts[1]}" (${parts[1].length} chars). Pubkeys must be exactly 64 hex characters.`);
    }
    
    if (parts[2].includes(',')) {
      errors.push(`Invalid d-tag: "${parts[2]}". D-tags cannot contain commas. This looks like workout parameters mixed into the reference.`);
    }
    
    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      warnings
    };
  }

  /**
   * Helper: Check if event has a specific tag
   * Extracted from dependencyResolution.ts hasTag()
   */
  hasTag(event: NDKEvent, tagName: string): boolean {
    return event.tags.some(tag => tag[0] === tagName);
  }

  /**
   * Helper: Get all values for a specific tag
   * Extracted from dependencyResolution.ts getTagValues()
   */
  getTagValues(event: NDKEvent, tagName: string): string[] {
    const tag = event.tags.find(tag => tag[0] === tagName);
    return tag ? tag.slice(1) : [];
  }

  /**
   * Helper: Get d-tag value from event
   * Extracted from dependencyResolution.ts getEventDTag()
   */
  getEventDTag(event: NDKEvent): string {
    const dTag = event.tags.find(tag => tag[0] === 'd');
    return dTag ? dTag[1] : 'unknown';
  }

  /**
   * Parse multiple workout events in batch
   * Optimized batch parsing for social feeds and discovery
   */
  parseWorkoutEventsBatch(events: NDKEvent[]): ParsedWorkoutEvent[] {
    console.log(`[DataParsingService] Batch parsing ${events.length} workout events`);
    
    const startTime = Date.now();
    const parsed: ParsedWorkoutEvent[] = [];
    
    for (const event of events) {
      const parsedEvent = this.parseWorkoutEvent(event);
      if (parsedEvent) {
        parsed.push(parsedEvent);
      }
    }
    
    const parseTime = Date.now() - startTime;
    console.log(`[DataParsingService] ✅ Batch parsed ${parsed.length}/${events.length} workout events in ${parseTime}ms`);
    
    return parsed;
  }

  /**
   * Parse multiple exercise templates in batch
   * Optimized batch parsing for dependency resolution
   */
  parseExerciseTemplatesBatch(events: NDKEvent[]): Exercise[] {
    console.log(`[DataParsingService] Batch parsing ${events.length} exercise templates`);
    
    const startTime = Date.now();
    const parsed: Exercise[] = [];
    const errors: string[] = [];
    
    for (const event of events) {
      const validation = this.validateExerciseTemplate(event);
      if (validation.isValid) {
        const parsedExercise = this.parseExerciseTemplate(event);
        if (parsedExercise) {
          parsed.push(parsedExercise);
        }
      } else {
        const eventRef = `${event.kind}:${event.pubkey}:${this.getEventDTag(event)}`;
        errors.push(`❌ ${eventRef}: ${validation.error}`);
      }
    }
    
    // Enhanced error logging
    if (errors.length > 0) {
      console.group('[DataParsingService] ❌ NIP-101e Validation Failures');
      console.warn(`${errors.length} exercises skipped, ${parsed.length} loaded successfully`);
      errors.forEach(error => console.error(error));
      console.groupEnd();
    }
    
    const parseTime = Date.now() - startTime;
    console.log(`[DataParsingService] ✅ Batch parsed ${parsed.length}/${events.length} exercise templates in ${parseTime}ms`);
    
    return parsed;
  }

  /**
   * Parse multiple workout templates in batch
   * Optimized batch parsing for dependency resolution
   */
  parseWorkoutTemplatesBatch(events: NDKEvent[]): WorkoutTemplate[] {
    console.log(`[DataParsingService] Batch parsing ${events.length} workout templates`);
    
    const startTime = Date.now();
    const parsed: WorkoutTemplate[] = [];
    
    for (const event of events) {
      const parsedTemplate = this.parseWorkoutTemplate(event);
      if (parsedTemplate) {
        parsed.push(parsedTemplate);
      }
    }
    
    const parseTime = Date.now() - startTime;
    console.log(`[DataParsingService] ✅ Batch parsed ${parsed.length}/${events.length} workout templates in ${parseTime}ms`);
    
    return parsed;
  }

  /**
   * Parse multiple collections in batch
   * Optimized batch parsing for dependency resolution
   */
  parseCollectionsBatch(events: NDKEvent[]): Collection[] {
    console.log(`[DataParsingService] Batch parsing ${events.length} collections`);
    
    const startTime = Date.now();
    const parsed: Collection[] = [];
    
    for (const event of events) {
      const parsedCollection = this.parseCollection(event);
      if (parsedCollection) {
        parsed.push(parsedCollection);
      }
    }
    
    const parseTime = Date.now() - startTime;
    console.log(`[DataParsingService] ✅ Batch parsed ${parsed.length}/${events.length} collections in ${parseTime}ms`);
    
    return parsed;
  }
}

// Export singleton instance following service-layer-architecture.md
export const dataParsingService = new DataParsingService();
