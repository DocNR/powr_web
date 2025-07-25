/**
 * Workout Timing Service
 * 
 * Simple timing service focused on user control with optional smart features.
 * Users have ultimate control - smart features are just suggestions they can override.
 * 
 * Follows NDK-first service architecture - pure business logic only.
 */

export interface RestTimerConfig {
  // User's preferred rest times (in seconds)
  defaultRestTime: number;
  exerciseSpecificRest?: Record<string, number>; // exerciseRef -> rest time
  
  // Optional smart features (user can enable/disable)
  enableSmartTimer: boolean;
  smartTimerSettings?: {
    rpeBonus: number; // extra seconds per RPE point above 7
    setTypeMultipliers: {
      warmup: number;
      normal: number;
      drop: number;
      failure: number;
    };
  };
}

export interface WorkoutTimingData {
  startTime: number;
  currentTime: number;
  totalDuration: number;
  exerciseStartTime?: number;
  setStartTime?: number;
  restStartTime?: number;
}

export interface RestTimerResult {
  restTime: number; // seconds
  source: 'user-default' | 'exercise-specific' | 'smart-calculation';
  canSkip: boolean;
}

/**
 * Simple Workout Timing Service
 * 
 * Core principle: Users control their rest times. Smart features are optional suggestions.
 */
export class WorkoutTimingService {
  private defaultConfig: RestTimerConfig = {
    defaultRestTime: 90, // 90 seconds default
    enableSmartTimer: false, // Disabled by default - user choice
    smartTimerSettings: {
      rpeBonus: 15, // 15 seconds per RPE point above 7
      setTypeMultipliers: {
        warmup: 0.5,
        normal: 1.0,
        drop: 1.2,
        failure: 1.5
      }
    }
  };

  /**
   * Get rest time for a set - user preferences first, smart features optional
   */
  getRestTime(
    exerciseRef: string,
    rpe?: number,
    setType: 'warmup' | 'normal' | 'drop' | 'failure' = 'normal',
    config?: Partial<RestTimerConfig>
  ): RestTimerResult {
    const userConfig = { ...this.defaultConfig, ...config };
    
    // 1. Check for exercise-specific user preference first
    if (userConfig.exerciseSpecificRest?.[exerciseRef]) {
      return {
        restTime: userConfig.exerciseSpecificRest[exerciseRef],
        source: 'exercise-specific',
        canSkip: true
      };
    }
    
    // 2. If smart timer is enabled and we have RPE data, calculate suggestion
    if (userConfig.enableSmartTimer && rpe && userConfig.smartTimerSettings) {
      const baseTime = userConfig.defaultRestTime;
      const rpeBonus = Math.max(0, rpe - 7) * userConfig.smartTimerSettings.rpeBonus;
      const multiplier = userConfig.smartTimerSettings.setTypeMultipliers[setType];
      const smartTime = Math.round((baseTime + rpeBonus) * multiplier);
      
      return {
        restTime: smartTime,
        source: 'smart-calculation',
        canSkip: setType !== 'failure' // Don't allow skipping failure sets
      };
    }
    
    // 3. Fall back to user's default rest time
    return {
      restTime: userConfig.defaultRestTime,
      source: 'user-default',
      canSkip: true
    };
  }

  /**
   * Simple workout duration tracking
   */
  calculateWorkoutDuration(startTime: number, currentTime?: number): WorkoutTimingData {
    const now = currentTime || Date.now();
    return {
      startTime,
      currentTime: now,
      totalDuration: now - startTime
    };
  }

  /**
   * Update timing data with new timestamps
   */
  updateTiming(
    timingData: WorkoutTimingData,
    updates: Partial<Pick<WorkoutTimingData, 'exerciseStartTime' | 'setStartTime' | 'restStartTime'>>
  ): WorkoutTimingData {
    return {
      ...timingData,
      ...updates,
      currentTime: Date.now()
    };
  }

  /**
   * Format duration for display (e.g., "2:30" for 2 minutes 30 seconds)
   */
  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Check if rest period is complete
   */
  isRestComplete(restStartTime: number, restDuration: number, currentTime?: number): boolean {
    const now = currentTime || Date.now();
    const elapsed = (now - restStartTime) / 1000; // Convert to seconds
    return elapsed >= restDuration;
  }

  /**
   * Get rest period progress (0-1)
   */
  getRestProgress(restStartTime: number, restDuration: number, currentTime?: number): number {
    const now = currentTime || Date.now();
    const elapsed = (now - restStartTime) / 1000; // Convert to seconds
    return Math.min(1, elapsed / restDuration);
  }

  /**
   * Get remaining rest time in seconds
   */
  getRemainingRestTime(restStartTime: number, restDuration: number, currentTime?: number): number {
    const now = currentTime || Date.now();
    const elapsed = (now - restStartTime) / 1000; // Convert to seconds
    return Math.max(0, restDuration - elapsed);
  }

  /**
   * Simple workout summary
   */
  generateWorkoutSummary(
    startTime: number,
    endTime: number,
    totalSets: number
  ): {
    totalDuration: number;
    formattedDuration: string;
    averageSetTime: number;
    setsPerMinute: number;
  } {
    const totalDuration = endTime - startTime;
    const averageSetTime = totalSets > 0 ? totalDuration / totalSets : 0;
    const durationMinutes = totalDuration / (1000 * 60);
    const setsPerMinute = durationMinutes > 0 ? totalSets / durationMinutes : 0;
    
    return {
      totalDuration,
      formattedDuration: this.formatDuration(totalDuration),
      averageSetTime,
      setsPerMinute
    };
  }
}

// Export singleton instance following service-layer-architecture.md
export const workoutTimingService = new WorkoutTimingService();
