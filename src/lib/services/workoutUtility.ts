/**
 * Workout Utility Service
 * 
 * Pure utility functions for workout data processing and ID generation.
 * Follows service-layer-architecture.md patterns - no NDK operations, only utility logic.
 */

/**
 * Workout Utility Service
 * 
 * Simple utility functions - no external dependencies or NDK operations.
 * Services are called directly from XState actors and components.
 */
export class WorkoutUtilityService {
  
  /**
   * Generate unique workout ID
   */
  generateWorkoutId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `workout_${timestamp}_${random}`;
  }
  
  /**
   * Generate template-based workout ID
   */
  generateTemplateBasedWorkoutId(templateId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${templateId}_${timestamp}_${random}`;
  }
  
  /**
   * Format duration from milliseconds to human-readable string
   */
  formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      if (remainingSeconds === 0) {
        return `${minutes}m`;
      }
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  
  /**
   * Format weight for display
   */
  formatWeight(weight: number): string {
    if (weight === 0) {
      return 'Bodyweight';
    }
    
    if (weight < 0) {
      return `Assisted (${Math.abs(weight)}kg)`;
    }
    
    return `${weight}kg`;
  }
  
  /**
   * Format RPE for display
   */
  formatRPE(rpe?: number): string {
    if (!rpe) {
      return 'N/A';
    }
    
    return `RPE ${rpe}/10`;
  }
  
  /**
   * Format set type for display
   */
  formatSetType(setType: string): string {
    const setTypeMap: Record<string, string> = {
      'warmup': 'Warm-up',
      'normal': 'Working',
      'drop': 'Drop Set',
      'failure': 'To Failure'
    };
    
    return setTypeMap[setType] || setType;
  }
  
  /**
   * Calculate total workout volume (weight × reps)
   */
  calculateWorkoutVolume(sets: Array<{ weight: number; reps: number }>): number {
    return sets.reduce((total, set) => {
      // Only count weighted sets for volume calculation
      if (set.weight > 0) {
        return total + (set.weight * set.reps);
      }
      return total;
    }, 0);
  }
  
  /**
   * Calculate total reps across all sets
   */
  calculateTotalReps(sets: Array<{ reps: number }>): number {
    return sets.reduce((total, set) => total + set.reps, 0);
  }
  
  /**
   * Calculate average RPE across sets
   */
  calculateAverageRPE(sets: Array<{ rpe?: number }>): number | null {
    const setsWithRPE = sets.filter(set => set.rpe && set.rpe > 0);
    
    if (setsWithRPE.length === 0) {
      return null;
    }
    
    const totalRPE = setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0);
    return Math.round((totalRPE / setsWithRPE.length) * 10) / 10; // Round to 1 decimal
  }
  
  /**
   * Group sets by exercise reference
   */
  groupSetsByExercise<T extends { exerciseRef: string }>(sets: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    
    sets.forEach(set => {
      const exerciseId = this.extractExerciseId(set.exerciseRef);
      if (!grouped.has(exerciseId)) {
        grouped.set(exerciseId, []);
      }
      grouped.get(exerciseId)!.push(set);
    });
    
    return grouped;
  }
  
  /**
   * Extract exercise ID (d-tag) from exercise reference
   */
  extractExerciseId(exerciseRef: string): string {
    // Format: "33401:pubkey:exercise-d-tag"
    const parts = exerciseRef.split(':');
    return parts.length >= 3 ? parts[2] : exerciseRef;
  }
  
  /**
   * Extract pubkey from exercise reference
   */
  extractExercisePubkey(exerciseRef: string): string {
    // Format: "33401:pubkey:exercise-d-tag"
    const parts = exerciseRef.split(':');
    return parts.length >= 2 ? parts[1] : '';
  }
  
  /**
   * Validate exercise reference format
   */
  isValidExerciseReference(exerciseRef: string): boolean {
    // Should match format: "kind:pubkey:d-tag"
    const parts = exerciseRef.split(':');
    return parts.length === 3 && 
           parts[0].match(/^\d+$/) !== null && // kind is numeric
           parts[1].length === 64 && // pubkey is 64 chars
           parts[2].length > 0; // d-tag is not empty
  }
  
  /**
   * Generate exercise reference from parts
   */
  buildExerciseReference(kind: number, pubkey: string, dTag: string): string {
    return `${kind}:${pubkey}:${dTag}`;
  }
  
  /**
   * Sort sets by completion time
   */
  sortSetsByCompletionTime<T extends { completedAt: number }>(sets: T[]): T[] {
    return [...sets].sort((a, b) => a.completedAt - b.completedAt);
  }
  
  /**
   * Sort sets by set number within exercise
   */
  sortSetsBySetNumber<T extends { setNumber: number }>(sets: T[]): T[] {
    return [...sets].sort((a, b) => a.setNumber - b.setNumber);
  }
  
  /**
   * Calculate workout intensity (average RPE across all sets)
   */
  calculateWorkoutIntensity(sets: Array<{ rpe?: number }>): {
    averageRPE: number | null;
    intensityLevel: 'low' | 'moderate' | 'high' | 'unknown';
  } {
    const averageRPE = this.calculateAverageRPE(sets);
    
    if (averageRPE === null) {
      return { averageRPE: null, intensityLevel: 'unknown' };
    }
    
    let intensityLevel: 'low' | 'moderate' | 'high';
    if (averageRPE < 6) {
      intensityLevel = 'low';
    } else if (averageRPE < 8) {
      intensityLevel = 'moderate';
    } else {
      intensityLevel = 'high';
    }
    
    return { averageRPE, intensityLevel };
  }
  
  /**
   * Generate workout summary statistics
   */
  generateWorkoutSummary(sets: Array<{ 
    exerciseRef: string; 
    reps: number; 
    weight: number; 
    rpe?: number;
    setType: string;
  }>): {
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    exerciseCount: number;
    averageRPE: number | null;
    intensityLevel: 'low' | 'moderate' | 'high' | 'unknown';
    setTypeBreakdown: Record<string, number>;
  } {
    const exerciseGroups = this.groupSetsByExercise(sets);
    const intensity = this.calculateWorkoutIntensity(sets);
    
    // Count sets by type
    const setTypeBreakdown: Record<string, number> = {};
    sets.forEach(set => {
      setTypeBreakdown[set.setType] = (setTypeBreakdown[set.setType] || 0) + 1;
    });
    
    return {
      totalSets: sets.length,
      totalReps: this.calculateTotalReps(sets),
      totalVolume: this.calculateWorkoutVolume(sets),
      exerciseCount: exerciseGroups.size,
      averageRPE: intensity.averageRPE,
      intensityLevel: intensity.intensityLevel,
      setTypeBreakdown
    };
  }
  
  /**
   * Convert timestamp to workout date string (YYYY-MM-DD)
   */
  timestampToDateString(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Convert date string to start-of-day timestamp
   */
  dateStringToTimestamp(dateString: string): number {
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.getTime();
  }
  
  /**
   * Check if two timestamps are on the same day
   */
  isSameDay(timestamp1: number, timestamp2: number): boolean {
    const date1 = this.timestampToDateString(timestamp1);
    const date2 = this.timestampToDateString(timestamp2);
    return date1 === date2;
  }
}

// Export singleton instance following service-layer-architecture.md
export const workoutUtilityService = new WorkoutUtilityService();
