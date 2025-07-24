/**
 * Workout Analytics Service
 * 
 * Pure business logic service for workout data processing, event generation,
 * and analytics. Follows service-layer-architecture.md patterns - no NDK
 * operations, only business logic.
 */

import { v4 as uuidv4 } from 'uuid';
import { WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import type { ValidationResult } from '@/lib/machines/workout/types/workoutTypes';

// Business logic types
export interface CompletedWorkout {
  workoutId: string;
  title: string;
  workoutType: 'strength' | 'circuit' | 'emom' | 'amrap';
  startTime: number;
  endTime: number;
  completedSets: CompletedSet[];
  notes?: string;
  templateId?: string;           // Keep for backward compatibility
  templateReference?: string;    // NEW: Full "33402:pubkey:d-tag" format
  templatePubkey?: string;       // NEW: Template author's pubkey
  templateRelayUrl?: string;     // NEW: Optional relay URL
}

export interface CompletedSet {
  exerciseRef: string;  // Format: "33401:pubkey:exercise-d-tag"
  setNumber: number;
  reps: number;
  weight: number;      // kg, 0 for bodyweight
  rpe?: number;        // 1-10 Rate of Perceived Exertion
  setType: 'warmup' | 'normal' | 'drop' | 'failure';
  completedAt: number; // timestamp
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  averageDuration: number;
  mostFrequentExercises: Array<{
    exerciseId: string;
    count: number;
  }>;
  totalSets: number;
  totalReps: number;
  averageRPE: number;
}

export interface WorkoutEventData {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
  pubkey: string;
}

/**
 * Workout Analytics Service
 * 
 * Pure business logic - no NDK operations, no external dependencies.
 * Services are called directly from XState actors.
 */
export class WorkoutAnalyticsService {
  
  /**
   * Generate NIP-101e workout record event (Kind 1301)
   * 
   * Core business logic for converting completed workout data into
   * valid NIP-101e event structure.
   */
  generateNIP101eEvent(workoutData: CompletedWorkout, userPubkey: string): WorkoutEventData {
    const duration = workoutData.endTime - workoutData.startTime;
    
    // Generate template-based d-tag for proper identification
    const dTag = workoutData.templateId 
      ? `${workoutData.templateId}-${workoutData.startTime}`
      : workoutData.workoutId;
    
    // Build tags following NIP-101e specification
    const tags: string[][] = [
      // Required tags - use template-based d-tag
      ['d', dTag],
      ['title', workoutData.title],
      ['type', workoutData.workoutType],
      ['start', workoutData.startTime.toString()],
      ['end', workoutData.endTime.toString()],
      ['completed', 'true'],
      
      // Duration in seconds
      ['duration', Math.floor(duration / 1000).toString()],
    ];
    
    // Template reference if used - CORRECTED FORMAT per NIP-101e specification
    if (workoutData.templateReference) {
      // Use full "33402:pubkey:d-tag" format with optional relay URL
      tags.push(['template', workoutData.templateReference, workoutData.templateRelayUrl || '']);
    } else if (workoutData.templateId && workoutData.templatePubkey) {
      // Fallback: construct reference from parts for backward compatibility
      const templateRef = `33402:${workoutData.templatePubkey}:${workoutData.templateId}`;
      tags.push(['template', templateRef, workoutData.templateRelayUrl || '']);
    }
    
    // Exercise sets - each completed set as separate exercise tag
    console.log('[WorkoutAnalytics] Processing completed sets for tags:', {
      totalSets: workoutData.completedSets.length,
      sets: workoutData.completedSets.map(set => ({
        exerciseRef: set.exerciseRef,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight
      }))
    });
    
    workoutData.completedSets.forEach((set, index) => {
      const exerciseTag = [
        'exercise',
        set.exerciseRef,
        '', // relay-url (empty for now)
        set.weight.toString(),
        set.reps.toString(),
        (set.rpe || 7).toString(),
        set.setType,
        set.setNumber.toString() // NEW: 8th parameter for NDK deduplication fix
      ];
      
      console.log(`[WorkoutAnalytics] Adding exercise tag ${index + 1} with set number ${set.setNumber}:`, exerciseTag);
      tags.push(exerciseTag);
    });
    
    console.log('[WorkoutAnalytics] Total exercise tags added:', tags.filter(t => t[0] === 'exercise').length);
    
    // Standard Nostr hashtags
    tags.push(['t', 'fitness']);
    tags.push(['t', workoutData.workoutType]);
    tags.push(['client', 'POWR Web']);
    
    // Build content with workout summary
    const content = this.generateWorkoutSummary(workoutData);
    
    console.log('[WorkoutAnalytics] Final event data before return:', {
      kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
      totalTags: tags.length,
      exerciseTagsCount: tags.filter(t => t[0] === 'exercise').length,
      allTags: tags.map((tag, i) => `${i}: [${tag.join(', ')}]`)
    });
    
    return {
      kind: WORKOUT_EVENT_KINDS.WORKOUT_RECORD,
      content,
      tags,
      created_at: Math.floor(workoutData.endTime / 1000),
      pubkey: userPubkey
    };
  }
  
  /**
   * Generate human-readable workout summary for event content
   */
  generateWorkoutSummary(workoutData: CompletedWorkout): string {
    const durationSeconds = Math.floor((workoutData.endTime - workoutData.startTime) / 1000);
    const totalSets = workoutData.completedSets.length;
    const totalReps = workoutData.completedSets.reduce((sum, set) => sum + set.reps, 0);
    
    // Format duration properly - show seconds for short workouts, minutes for longer ones
    let durationText: string;
    if (durationSeconds < 60) {
      durationText = `${durationSeconds} seconds`;
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60);
      const remainingSeconds = durationSeconds % 60;
      if (remainingSeconds === 0) {
        durationText = `${minutes} minutes`;
      } else {
        durationText = `${minutes}m ${remainingSeconds}s`;
      }
    } else {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      durationText = `${hours}h ${minutes}m`;
    }
    
    // Group sets by exercise
    const exerciseGroups = new Map<string, CompletedSet[]>();
    workoutData.completedSets.forEach(set => {
      const exerciseId = set.exerciseRef.split(':')[2]; // Extract d-tag
      if (!exerciseGroups.has(exerciseId)) {
        exerciseGroups.set(exerciseId, []);
      }
      exerciseGroups.get(exerciseId)!.push(set);
    });
    
    const exerciseSummaries = Array.from(exerciseGroups.entries()).map(([exerciseId, sets]) => {
      const setCount = sets.length;
      const repRange = sets.length > 1 
        ? `${Math.min(...sets.map(s => s.reps))}-${Math.max(...sets.map(s => s.reps))}`
        : sets[0].reps.toString();
      
      const hasWeight = sets.some(s => s.weight > 0);
      if (hasWeight) {
        const weightRange = sets.length > 1
          ? `${Math.min(...sets.map(s => s.weight))}-${Math.max(...sets.map(s => s.weight))}kg`
          : `${sets[0].weight}kg`;
        return `${exerciseId}: ${setCount}x${repRange} @ ${weightRange}`;
      } else {
        return `${exerciseId}: ${setCount}x${repRange}`;
      }
    });
    
    let summary = `Completed ${workoutData.title} in ${durationText}. `;
    summary += `${totalSets} sets, ${totalReps} total reps. `;
    summary += `Exercises: ${exerciseSummaries.join(', ')}.`;
    
    if (workoutData.notes) {
      summary += ` Notes: ${workoutData.notes}`;
    }
    
    return summary;
  }
  
  /**
   * Validate workout data before event generation
   */
  validateWorkoutData(workoutData: CompletedWorkout): ValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    if (!workoutData.workoutId) {
      errors.push('Missing workout ID');
    }
    
    if (!workoutData.title || workoutData.title.trim().length === 0) {
      errors.push('Missing workout title');
    }
    
    if (!workoutData.startTime || workoutData.startTime <= 0) {
      errors.push('Invalid start time');
    }
    
    if (!workoutData.endTime || workoutData.endTime <= workoutData.startTime) {
      errors.push('Invalid end time (must be after start time)');
    }
    
    if (!workoutData.completedSets || workoutData.completedSets.length === 0) {
      errors.push('Workout must include at least one completed set');
    }
    
    // Validate workout type
    const validTypes = ['strength', 'circuit', 'emom', 'amrap'];
    if (!validTypes.includes(workoutData.workoutType)) {
      errors.push(`Invalid workout type: ${workoutData.workoutType}`);
    }
    
    // Validate template reference format if provided
    if (workoutData.templateReference) {
      const templateRefPattern = /^33402:[a-f0-9]{64}:[a-zA-Z0-9\-_]+$/;
      if (!templateRefPattern.test(workoutData.templateReference)) {
        errors.push(`Invalid template reference format: ${workoutData.templateReference}. Must be "33402:pubkey:d-tag"`);
      }
    }
    
    // Validate template pubkey format if provided
    if (workoutData.templatePubkey) {
      const pubkeyPattern = /^[a-f0-9]{64}$/;
      if (!pubkeyPattern.test(workoutData.templatePubkey)) {
        errors.push(`Invalid template pubkey format: ${workoutData.templatePubkey}. Must be 64-character hex string`);
      }
    }
    
    // Validate completed sets
    workoutData.completedSets?.forEach((set, index) => {
      if (!set.exerciseRef || !set.exerciseRef.match(/^\d+:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$/)) {
        errors.push(`Invalid exercise reference format in set ${index + 1}: ${set.exerciseRef}`);
      }
      
      if (set.reps <= 0) {
        errors.push(`Invalid reps in set ${index + 1}: ${set.reps}`);
      }
      
      if (set.weight < 0) {
        errors.push(`Invalid weight in set ${index + 1}: ${set.weight}`);
      }
      
      if (set.rpe && (set.rpe < 1 || set.rpe > 10)) {
        errors.push(`Invalid RPE in set ${index + 1}: ${set.rpe} (must be 1-10)`);
      }
      
      const validSetTypes = ['warmup', 'normal', 'drop', 'failure'];
      if (!validSetTypes.includes(set.setType)) {
        errors.push(`Invalid set type in set ${index + 1}: ${set.setType}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  }
  
  /**
   * Calculate workout statistics from multiple workout events
   */
  calculateWorkoutStats(workouts: CompletedWorkout[]): WorkoutStats {
    if (workouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalDuration: 0,
        averageDuration: 0,
        mostFrequentExercises: [],
        totalSets: 0,
        totalReps: 0,
        averageRPE: 0
      };
    }
    
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.endTime - w.startTime), 0);
    const averageDuration = totalDuration / totalWorkouts;
    
    // Calculate exercise frequency
    const exerciseFrequency = new Map<string, number>();
    let totalSets = 0;
    let totalReps = 0;
    let totalRPE = 0;
    let rpeCount = 0;
    
    workouts.forEach(workout => {
      workout.completedSets.forEach(set => {
        const exerciseId = set.exerciseRef.split(':')[2]; // Extract d-tag
        const count = exerciseFrequency.get(exerciseId) || 0;
        exerciseFrequency.set(exerciseId, count + 1);
        
        totalSets++;
        totalReps += set.reps;
        
        if (set.rpe) {
          totalRPE += set.rpe;
          rpeCount++;
        }
      });
    });
    
    const mostFrequentExercises = Array.from(exerciseFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([exerciseId, count]) => ({ exerciseId, count }));
    
    const averageRPE = rpeCount > 0 ? totalRPE / rpeCount : 0;
    
    return {
      totalWorkouts,
      totalDuration,
      averageDuration,
      mostFrequentExercises,
      totalSets,
      totalReps,
      averageRPE
    };
  }
  
  /**
   * Generate workout ID for new workouts
   */
  generateWorkoutId(): string {
    return `workout_${Date.now()}_${uuidv4().slice(0, 8)}`;
  }
  
  /**
   * Create exercise reference string
   */
  createExerciseReference(exercisePubkey: string, exerciseId: string): string {
    return `${WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE}:${exercisePubkey}:${exerciseId}`;
  }
  
  /**
   * Parse exercise reference to components
   */
  parseExerciseReference(exerciseRef: string): { kind: number; pubkey: string; dTag: string } | null {
    const parts = exerciseRef.split(':');
    if (parts.length !== 3) {
      return null;
    }
    
    const [kindStr, pubkey, dTag] = parts;
    const kind = parseInt(kindStr);
    
    if (isNaN(kind) || !pubkey || !dTag) {
      return null;
    }
    
    return { kind, pubkey, dTag };
  }
  
  /**
   * Calculate workout intensity based on RPE and volume
   */
  calculateWorkoutIntensity(workoutData: CompletedWorkout): {
    averageRPE: number;
    totalVolume: number;
    intensityScore: number;
  } {
    const setsWithRPE = workoutData.completedSets.filter(set => set.rpe);
    const averageRPE = setsWithRPE.length > 0 
      ? setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0) / setsWithRPE.length
      : 0;
    
    // Calculate total volume (weight * reps for all sets)
    const totalVolume = workoutData.completedSets.reduce((sum, set) => {
      return sum + (set.weight * set.reps);
    }, 0);
    
    // Simple intensity score: RPE * volume / duration (in minutes)
    const durationMinutes = (workoutData.endTime - workoutData.startTime) / 1000 / 60;
    const intensityScore = durationMinutes > 0 ? (averageRPE * totalVolume) / durationMinutes : 0;
    
    return {
      averageRPE,
      totalVolume,
      intensityScore
    };
  }
}

// Export singleton instance following service-layer-architecture.md
export const workoutAnalyticsService = new WorkoutAnalyticsService();
