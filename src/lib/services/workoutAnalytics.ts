/**
 * Workout Analytics Service
 * 
 * Pure business logic for calculating workout statistics and analytics.
 * Follows service-layer-architecture.md patterns - no NDK operations, only analytics logic.
 * 
 * Extended for Workout History Modal support with timeline processing.
 */

import type { ParsedWorkoutEvent, ParsedExerciseSet } from '@/lib/services/dataParsingService';

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

// Timeline data structures for Workout History Modal
export interface WorkoutTimelineEntry {
  exerciseRef: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
  setType: 'warmup' | 'normal' | 'drop' | 'failure';
  completedAt?: number;
  // For display
  displayWeight: string; // "60kg" or "bodyweight"
  displayRPE: string; // "RPE 7" or ""
}

export interface ProcessedWorkoutData {
  // Basic workout info
  id: string;
  title: string;
  description: string;
  workoutType: string;
  duration: number;
  startTime: number;
  endTime: number;
  completed: boolean;
  authorPubkey: string;
  createdAt: number;
  eventId: string;
  
  // Timeline data (chronological order from NIP-101e tags)
  timeline: WorkoutTimelineEntry[];
  
  // Calculated statistics
  stats: {
    totalVolume: number;
    totalReps: number;
    totalSets: number;
    averageRPE: number | null;
    exerciseCount: number;
    duration: number;
  };
  
  // Exercise summary (grouped for stats section)
  exerciseSummary: Array<{
    exerciseName: string;
    exerciseRef: string;
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    averageRPE: number | null;
    weightRange: string; // "60-80kg" or "bodyweight"
  }>;
  
  // Template information
  template?: {
    reference: string;
    pubkey: string;
    dTag: string;
    name?: string; // Resolved from template data
    authorName?: string; // For attribution
  };
}

export interface TemplateAttribution {
  reference: string;
  pubkey: string;
  dTag: string;
  name: string;
  authorName?: string;
  naddr: string; // For sharing
}

export interface WorkoutIntensityAnalysis {
  averageRPE: number;
  totalVolume: number;
  intensityScore: number;
  intensityLevel: 'low' | 'moderate' | 'high' | 'unknown';
}

export interface ExerciseFrequencyData {
  exerciseId: string;
  exerciseName?: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  averageRPE: number;
  lastPerformed: number;
  frequency: number; // workouts per week
}

/**
 * Workout Analytics Service
 * 
 * Pure business logic for calculating workout statistics and analytics.
 * No NDK operations - only analytics calculations.
 */
export class WorkoutAnalyticsService {
  
  /**
   * Process workout for history modal display
   * Main method for Phase 1 - moves business logic out of modal
   */
  processWorkoutForHistory(
    workout: ParsedWorkoutEvent, 
    resolvedExercises: Map<string, { name: string }>
  ): ProcessedWorkoutData {
    console.log(`[WorkoutAnalyticsService] Processing workout for history: ${workout.title}`);
    
    // Create timeline from exercises array (chronological order from NIP-101e tags)
    const timeline: WorkoutTimelineEntry[] = workout.exercises.map((exercise) => {
      const exerciseName = resolvedExercises.get(exercise.exerciseRef)?.name || 'Unknown Exercise';
      
      return {
        exerciseRef: exercise.exerciseRef,
        exerciseName,
        setNumber: exercise.setNumber,
        reps: exercise.reps,
        weight: exercise.weight,
        rpe: exercise.rpe,
        setType: exercise.setType,
        completedAt: exercise.completedAt,
        // Display formatting
        displayWeight: exercise.weight === 0 ? 'bodyweight' : `${exercise.weight}kg`,
        displayRPE: exercise.rpe ? `RPE ${exercise.rpe}` : ''
      };
    });
    
    // Calculate statistics
    const totalReps = workout.exercises.reduce((sum, ex) => sum + ex.reps, 0);
    const totalSets = workout.exercises.length;
    const totalVolume = workout.exercises.reduce((sum, ex) => sum + (ex.weight * ex.reps), 0);
    const rpeValues = workout.exercises.filter(ex => ex.rpe).map(ex => ex.rpe!);
    const averageRPE = rpeValues.length > 0 ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length : null;
    
    // Group exercises for summary
    const exerciseGroups = new Map<string, {
      exerciseName: string;
      exerciseRef: string;
      sets: ParsedExerciseSet[];
    }>();
    
    workout.exercises.forEach(exercise => {
      const exerciseName = resolvedExercises.get(exercise.exerciseRef)?.name || 'Unknown Exercise';
      
      if (!exerciseGroups.has(exercise.exerciseRef)) {
        exerciseGroups.set(exercise.exerciseRef, {
          exerciseName,
          exerciseRef: exercise.exerciseRef,
          sets: []
        });
      }
      exerciseGroups.get(exercise.exerciseRef)!.sets.push(exercise);
    });
    
    const exerciseSummary = Array.from(exerciseGroups.values()).map(group => {
      const totalSets = group.sets.length;
      const totalReps = group.sets.reduce((sum, set) => sum + set.reps, 0);
      const totalVolume = group.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
      const rpeValues = group.sets.filter(set => set.rpe).map(set => set.rpe!);
      const averageRPE = rpeValues.length > 0 ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length : null;
      
      // Calculate weight range
      const weights = group.sets.map(set => set.weight).filter(w => w > 0);
      let weightRange: string;
      if (weights.length === 0) {
        weightRange = 'bodyweight';
      } else if (weights.length === 1) {
        weightRange = `${weights[0]}kg`;
      } else {
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        weightRange = minWeight === maxWeight ? `${minWeight}kg` : `${minWeight}-${maxWeight}kg`;
      }
      
      return {
        exerciseName: group.exerciseName,
        exerciseRef: group.exerciseRef,
        totalSets,
        totalReps,
        totalVolume,
        averageRPE,
        weightRange
      };
    });
    
    // Parse template information
    let template: ProcessedWorkoutData['template'] | undefined;
    if (workout.templateReference && workout.templatePubkey) {
      const templateParts = workout.templateReference.split(':');
      template = {
        reference: workout.templateReference,
        pubkey: workout.templatePubkey,
        dTag: templateParts[2] || 'unknown'
      };
    }
    
    const uniqueExercises = new Set(workout.exercises.map(ex => ex.exerciseRef));
    
    return {
      // Basic workout info
      id: workout.id,
      title: workout.title,
      description: workout.description,
      workoutType: workout.workoutType,
      duration: workout.duration,
      startTime: workout.startTime,
      endTime: workout.endTime,
      completed: workout.completed,
      authorPubkey: workout.authorPubkey,
      createdAt: workout.createdAt,
      eventId: workout.eventId,
      
      // Timeline data (chronological order)
      timeline,
      
      // Calculated statistics
      stats: {
        totalVolume,
        totalReps,
        totalSets,
        averageRPE,
        exerciseCount: uniqueExercises.size,
        duration: workout.duration
      },
      
      // Exercise summary (grouped)
      exerciseSummary,
      
      // Template information
      template
    };
  }
  
  /**
   * Format duration for display (fixes the duration bug)
   */
  formatDuration(durationMs: number): string {
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * Calculate comprehensive workout statistics
   */
  calculateWorkoutStats(workouts: ParsedWorkoutEvent[]): WorkoutStats {
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
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const averageDuration = totalDuration / totalWorkouts;
    
    // Calculate exercise frequency and totals
    const exerciseFrequency = new Map<string, number>();
    let totalSets = 0;
    let totalReps = 0;
    let totalRPE = 0;
    let rpeCount = 0;
    
    workouts.forEach(workout => {
      // Count exercises from exercises array (ParsedExerciseSet[])
      workout.exercises.forEach(exercise => {
        const exerciseId = exercise.exerciseRef.split(':')[2]; // Extract d-tag
        const count = exerciseFrequency.get(exerciseId) || 0;
        exerciseFrequency.set(exerciseId, count + 1); // Count individual sets
        totalSets += 1;
        totalReps += exercise.reps;
        
        if (exercise.rpe) {
          totalRPE += exercise.rpe;
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
   * Calculate workout intensity analysis (using exercises array)
   */
  calculateWorkoutIntensity(workout: ParsedWorkoutEvent): WorkoutIntensityAnalysis {
    if (!workout.exercises || workout.exercises.length === 0) {
      return {
        averageRPE: 0,
        totalVolume: 0,
        intensityScore: 0,
        intensityLevel: 'unknown'
      };
    }
    
    const setsWithRPE = workout.exercises.filter(exercise => exercise.rpe);
    const averageRPE = setsWithRPE.length > 0 
      ? setsWithRPE.reduce((sum, exercise) => sum + (exercise.rpe || 0), 0) / setsWithRPE.length
      : 0;
    
    // Calculate total volume (weight * reps for all sets)
    const totalVolume = workout.exercises.reduce((sum, exercise) => {
      return sum + (exercise.weight * exercise.reps);
    }, 0);
    
    // Simple intensity score: RPE * volume / duration (in minutes)
    const durationMinutes = workout.duration / 1000 / 60;
    const intensityScore = durationMinutes > 0 ? (averageRPE * totalVolume) / durationMinutes : 0;
    
    // Determine intensity level
    let intensityLevel: 'low' | 'moderate' | 'high' | 'unknown';
    if (averageRPE === 0) {
      intensityLevel = 'unknown';
    } else if (averageRPE < 6) {
      intensityLevel = 'low';
    } else if (averageRPE < 8) {
      intensityLevel = 'moderate';
    } else {
      intensityLevel = 'high';
    }
    
    return {
      averageRPE,
      totalVolume,
      intensityScore,
      intensityLevel
    };
  }
}

// Export singleton instance following service-layer-architecture.md
export const workoutAnalyticsService = new WorkoutAnalyticsService();
