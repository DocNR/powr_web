/**
 * Workout Analytics Service
 * 
 * Pure business logic for calculating workout statistics and analytics.
 * Follows service-layer-architecture.md patterns - no NDK operations, only analytics logic.
 */

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

export interface ParsedWorkoutEvent {
  id: string;
  title: string;
  duration: number;
  exercises: Array<{ reference: string; sets: number }>;
  startTime: number;
  endTime: number;
  completedSets?: Array<{
    exerciseRef: string;
    reps: number;
    weight: number;
    rpe?: number;
    setType: string;
    completedAt: number;
  }>;
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
      // Count exercises from exercise array
      workout.exercises.forEach(exercise => {
        const exerciseId = exercise.reference.split(':')[2]; // Extract d-tag
        const count = exerciseFrequency.get(exerciseId) || 0;
        exerciseFrequency.set(exerciseId, count + exercise.sets);
        totalSets += exercise.sets;
      });
      
      // If detailed set data is available, use it for reps and RPE
      if (workout.completedSets) {
        workout.completedSets.forEach(set => {
          totalReps += set.reps;
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      }
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
   * Calculate workout intensity analysis
   */
  calculateWorkoutIntensity(workout: ParsedWorkoutEvent): WorkoutIntensityAnalysis {
    if (!workout.completedSets || workout.completedSets.length === 0) {
      return {
        averageRPE: 0,
        totalVolume: 0,
        intensityScore: 0,
        intensityLevel: 'unknown'
      };
    }
    
    const setsWithRPE = workout.completedSets.filter(set => set.rpe);
    const averageRPE = setsWithRPE.length > 0 
      ? setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0) / setsWithRPE.length
      : 0;
    
    // Calculate total volume (weight * reps for all sets)
    const totalVolume = workout.completedSets.reduce((sum, set) => {
      return sum + (set.weight * set.reps);
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
  
  /**
   * Analyze exercise frequency and performance over time
   */
  analyzeExerciseFrequency(workouts: ParsedWorkoutEvent[], timeWindowDays: number = 30): ExerciseFrequencyData[] {
    const cutoffTime = Date.now() - (timeWindowDays * 24 * 60 * 60 * 1000);
    const recentWorkouts = workouts.filter(w => w.startTime >= cutoffTime);
    
    if (recentWorkouts.length === 0) {
      return [];
    }
    
    const exerciseData = new Map<string, {
      totalSets: number;
      totalReps: number;
      totalVolume: number;
      totalRPE: number;
      rpeCount: number;
      lastPerformed: number;
      workoutCount: number;
    }>();
    
    recentWorkouts.forEach(workout => {
      const workoutExercises = new Set<string>();
      
      // Track exercises from completed sets
      if (workout.completedSets) {
        workout.completedSets.forEach(set => {
          const exerciseId = set.exerciseRef.split(':')[2];
          workoutExercises.add(exerciseId);
          
          if (!exerciseData.has(exerciseId)) {
            exerciseData.set(exerciseId, {
              totalSets: 0,
              totalReps: 0,
              totalVolume: 0,
              totalRPE: 0,
              rpeCount: 0,
              lastPerformed: 0,
              workoutCount: 0
            });
          }
          
          const data = exerciseData.get(exerciseId)!;
          data.totalSets++;
          data.totalReps += set.reps;
          data.totalVolume += set.weight * set.reps;
          data.lastPerformed = Math.max(data.lastPerformed, workout.startTime);
          
          if (set.rpe) {
            data.totalRPE += set.rpe;
            data.rpeCount++;
          }
        });
      }
      
      // Count workouts per exercise
      workoutExercises.forEach(exerciseId => {
        const data = exerciseData.get(exerciseId);
        if (data) {
          data.workoutCount++;
        }
      });
    });
    
    // Convert to frequency data
    const weeksInPeriod = timeWindowDays / 7;
    
    return Array.from(exerciseData.entries()).map(([exerciseId, data]) => ({
      exerciseId,
      totalSets: data.totalSets,
      totalReps: data.totalReps,
      totalVolume: data.totalVolume,
      averageRPE: data.rpeCount > 0 ? data.totalRPE / data.rpeCount : 0,
      lastPerformed: data.lastPerformed,
      frequency: data.workoutCount / weeksInPeriod
    })).sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Calculate progression metrics for a specific exercise
   */
  calculateExerciseProgression(workouts: ParsedWorkoutEvent[], exerciseId: string): {
    trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    volumeChange: number; // percentage change
    strengthChange: number; // percentage change in max weight
    enduranceChange: number; // percentage change in max reps
    consistencyScore: number; // 0-1 score based on frequency
  } {
    const exerciseSets = workouts
      .filter(w => w.completedSets)
      .flatMap(w => w.completedSets!.filter(set => 
        set.exerciseRef.split(':')[2] === exerciseId
      ))
      .sort((a, b) => a.completedAt - b.completedAt);
    
    if (exerciseSets.length < 4) {
      return {
        trend: 'insufficient_data',
        volumeChange: 0,
        strengthChange: 0,
        enduranceChange: 0,
        consistencyScore: 0
      };
    }
    
    // Split into first and second half for comparison
    const midPoint = Math.floor(exerciseSets.length / 2);
    const firstHalf = exerciseSets.slice(0, midPoint);
    const secondHalf = exerciseSets.slice(midPoint);
    
    // Calculate metrics for each half
    const firstHalfVolume = firstHalf.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    const secondHalfVolume = secondHalf.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    
    const firstHalfMaxWeight = Math.max(...firstHalf.map(set => set.weight));
    const secondHalfMaxWeight = Math.max(...secondHalf.map(set => set.weight));
    
    const firstHalfMaxReps = Math.max(...firstHalf.map(set => set.reps));
    const secondHalfMaxReps = Math.max(...secondHalf.map(set => set.reps));
    
    // Calculate percentage changes
    const volumeChange = firstHalfVolume > 0 
      ? ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100 
      : 0;
    
    const strengthChange = firstHalfMaxWeight > 0 
      ? ((secondHalfMaxWeight - firstHalfMaxWeight) / firstHalfMaxWeight) * 100 
      : 0;
    
    const enduranceChange = firstHalfMaxReps > 0 
      ? ((secondHalfMaxReps - firstHalfMaxReps) / firstHalfMaxReps) * 100 
      : 0;
    
    // Determine overall trend
    const positiveChanges = [volumeChange > 5, strengthChange > 5, enduranceChange > 5].filter(Boolean).length;
    const negativeChanges = [volumeChange < -5, strengthChange < -5, enduranceChange < -5].filter(Boolean).length;
    
    let trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    if (positiveChanges >= 2) {
      trend = 'improving';
    } else if (negativeChanges >= 2) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    // Calculate consistency score based on frequency
    const timeSpan = exerciseSets[exerciseSets.length - 1].completedAt - exerciseSets[0].completedAt;
    const weeksSpanned = timeSpan / (7 * 24 * 60 * 60 * 1000);
    const expectedSessions = weeksSpanned * 2; // Assume 2x per week is good
    const consistencyScore = Math.min(1, exerciseSets.length / expectedSessions);
    
    return {
      trend,
      volumeChange,
      strengthChange,
      enduranceChange,
      consistencyScore
    };
  }
  
  /**
   * Generate workout performance summary
   */
  generatePerformanceSummary(workouts: ParsedWorkoutEvent[], timeWindowDays: number = 30): {
    totalWorkouts: number;
    averageWorkoutsPerWeek: number;
    totalTrainingTime: number;
    averageWorkoutDuration: number;
    topExercises: ExerciseFrequencyData[];
    overallIntensity: 'low' | 'moderate' | 'high' | 'unknown';
    consistencyScore: number;
  } {
    const cutoffTime = Date.now() - (timeWindowDays * 24 * 60 * 60 * 1000);
    const recentWorkouts = workouts.filter(w => w.startTime >= cutoffTime);
    
    if (recentWorkouts.length === 0) {
      return {
        totalWorkouts: 0,
        averageWorkoutsPerWeek: 0,
        totalTrainingTime: 0,
        averageWorkoutDuration: 0,
        topExercises: [],
        overallIntensity: 'unknown',
        consistencyScore: 0
      };
    }
    
    const totalWorkouts = recentWorkouts.length;
    const weeksInPeriod = timeWindowDays / 7;
    const averageWorkoutsPerWeek = totalWorkouts / weeksInPeriod;
    
    const totalTrainingTime = recentWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const averageWorkoutDuration = totalTrainingTime / totalWorkouts;
    
    const topExercises = this.analyzeExerciseFrequency(workouts, timeWindowDays).slice(0, 5);
    
    // Calculate overall intensity
    const intensityAnalyses = recentWorkouts.map(w => this.calculateWorkoutIntensity(w));
    const avgRPE = intensityAnalyses.reduce((sum, analysis) => sum + analysis.averageRPE, 0) / intensityAnalyses.length;
    
    let overallIntensity: 'low' | 'moderate' | 'high' | 'unknown';
    if (avgRPE === 0) {
      overallIntensity = 'unknown';
    } else if (avgRPE < 6) {
      overallIntensity = 'low';
    } else if (avgRPE < 8) {
      overallIntensity = 'moderate';
    } else {
      overallIntensity = 'high';
    }
    
    // Calculate consistency score (0-1 based on workout frequency)
    const idealWorkoutsPerWeek = 3;
    const consistencyScore = Math.min(1, averageWorkoutsPerWeek / idealWorkoutsPerWeek);
    
    return {
      totalWorkouts,
      averageWorkoutsPerWeek,
      totalTrainingTime,
      averageWorkoutDuration,
      topExercises,
      overallIntensity,
      consistencyScore
    };
  }
}

// Export singleton instance following service-layer-architecture.md
export const workoutAnalyticsService = new WorkoutAnalyticsService();
