/**
 * Workout Analytics Service
 * 
 * Pure business logic service for workout data processing, event generation,
 * and analytics. Follows service-layer-architecture.md patterns - no NDK
 * operations, only business logic.
 */

import { v4 as uuidv4 } from 'uuid';
import { WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import type { ValidationResult } from '@/lib/workout-events';

// Business logic types
export interface CompletedWorkout {
  workoutId: string;
  title: string;
  workoutType: 'strength' | 'circuit' | 'emom' | 'amrap';
  startTime: number;
  endTime: number;
  completedSets: CompletedSet[];
  notes?: string;
  templateId?: string;
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
    
    // Build tags following NIP-101e specification
    const tags: string[][] = [
      // Required tags
      ['d', workoutData.workoutId],
      ['title', workoutData.title],
      ['type', workoutData.workoutType],
      ['start', workoutData.startTime.toString()],
      ['end', workoutData.endTime.toString()],
      ['completed', 'true'],
      
      // Duration in seconds
      ['duration', Math.floor(duration / 1000).toString()],
    ];
    
    // Template reference if used
    if (workoutData.templateId) {
      tags.push(['template', workoutData.templateId]);
    }
    
    // Exercise sets - each completed set as separate exercise tag
    workoutData.completedSets.forEach(set => {
      tags.push([
        'exercise',
        set.exerciseRef,
        '', // relay-url (empty for now)
        set.weight.toString(),
        set.reps.toString(),
        (set.rpe || 7).toString(),
        set.setType
      ]);
    });
    
    // Standard Nostr hashtags
    tags.push(['t', 'fitness']);
    tags.push(['t', workoutData.workoutType]);
    
    // Build content with workout summary
    const content = this.generateWorkoutSummary(workoutData);
    
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
    const duration = Math.floor((workoutData.endTime - workoutData.startTime) / 1000 / 60);
    const totalSets = workoutData.completedSets.length;
    const totalReps = workoutData.completedSets.reduce((sum, set) => sum + set.reps, 0);
    
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
    
    let summary = `Completed ${workoutData.title} in ${duration} minutes. `;
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
      errors
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
