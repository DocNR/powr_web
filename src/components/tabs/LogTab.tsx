'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BookOpen, Search, Calendar, Dumbbell, Clock } from 'lucide-react';
import { useWorkoutHistory } from '@/providers/WorkoutHistoryProvider';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { WorkoutHistoryDetailModal } from '@/components/powr-ui/workout/WorkoutHistoryDetailModal';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import type { ParsedWorkoutEvent } from '@/lib/services/dataParsingService';
import type { ProcessedWorkoutData } from '@/lib/services/workoutAnalytics';

export function LogTab() {
  // Use WorkoutHistoryProvider for data management (following WorkoutsTab pattern)
  const {
    workoutRecords,
    resolvedExercises,
    isLoading,
    error,
    loadMoreRecords,
    hasMoreRecords,
    isLoadingMore,
    refreshData
  } = useWorkoutHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<ParsedWorkoutEvent | null>(null);
  const [processedWorkout, setProcessedWorkout] = useState<ProcessedWorkoutData | null>(null);
  
  // ✅ NEW: Pull-to-refresh state and functionality
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Pull-to-refresh handler
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    console.log('[LogTab] 🔄 Manual refresh triggered');
    setIsRefreshing(true);
    
    try {
      await refreshData();
      console.log('[LogTab] ✅ Refresh completed');
    } catch (error) {
      console.error('[LogTab] ❌ Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ✅ NEW: Touch-based pull-to-refresh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 100 && !isRefreshing) {
        // Visual feedback could be added here
        console.log('[LogTab] Pull-to-refresh threshold reached');
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      
      const pullDistance = currentY - startY;
      
      if (pullDistance > 100 && !isRefreshing) {
        console.log('[LogTab] 🔄 Pull-to-refresh triggered');
        handleRefresh();
      }
      
      isPulling = false;
      startY = 0;
      currentY = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, refreshData]);

  // Enhanced search with debouncing (reusing GlobalWorkoutSearch patterns)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400); // Same 400ms debouncing as GlobalWorkoutSearch

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Multi-level search functionality
  const filteredWorkouts = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return workoutRecords;

    const searchLower = debouncedSearchTerm.toLowerCase();

    return workoutRecords.filter(workout => {
      // Level 1: Workout title (highest priority)
      if (workout.title.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Level 2: Exercise names (medium priority)
      const hasMatchingExercise = workout.exercises.some(exercise => {
        const exerciseTemplate = resolvedExercises.get(exercise.exerciseRef);
        return exerciseTemplate?.name.toLowerCase().includes(searchLower);
      });

      if (hasMatchingExercise) return true;

      // Level 3: Exercise descriptions (lower priority)
      return workout.exercises.some(exercise => {
        const exerciseTemplate = resolvedExercises.get(exercise.exerciseRef);
        return exerciseTemplate?.description.toLowerCase().includes(searchLower);
      });
    });
  }, [workoutRecords, debouncedSearchTerm, resolvedExercises]);

  // Status text generation (reusing GlobalWorkoutSearch patterns)
  const getStatusText = () => {
    if (filteredWorkouts.length === 0 && debouncedSearchTerm) {
      return "No workouts found";
    }
    if (filteredWorkouts.length > 0) {
      return `${filteredWorkouts.length} workout${filteredWorkouts.length === 1 ? '' : 's'}`;
    }
    return "";
  };

  // Handle workout selection and processing
  const handleWorkoutSelect = async (workout: ParsedWorkoutEvent) => {
    setSelectedWorkout(workout);
    
    // Process the workout data using the analytics service
    try {
      const processed = workoutAnalyticsService.processWorkoutForHistory(workout, resolvedExercises);
      setProcessedWorkout(processed);
    } catch (error) {
      console.error('Failed to process workout data:', error);
      // Still show modal with raw data if processing fails
      setProcessedWorkout(null);
    }
  };

  // Calculate total volume for a workout
  const calculateWorkoutVolume = (workout: ParsedWorkoutEvent): number => {
    return workout.exercises.reduce((total, exercise) => {
      return total + (exercise.weight * exercise.reps);
    }, 0);
  };

  // Format duration helper
  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} min`;
  };

  // Format date helper - ParsedWorkoutEvent.createdAt is already in milliseconds
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // If no workout records and not loading, show empty state
  if (!isLoading && workoutRecords.length === 0) {
    return (
      <div className="text-center space-y-6 py-16">
        <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Workout Log</h2>
          <p className="text-muted-foreground">
            Complete your first workout to start building your history
          </p>
        </div>
        <Button 
          onClick={() => {
            console.log('Navigate to workouts tab');
          }}
          className="mt-4"
        >
          Browse Workouts
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Content */}
      <div className="space-y-6">
        {/* Search Input - matching LibraryTab styling */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your previous records"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Refresh indicator */}
        {isRefreshing && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              🔄 Refreshing workout history...
            </p>
          </div>
        )}

        {/* Status Text */}
        {getStatusText() && (
          <div className="text-sm text-muted-foreground text-center">
            {getStatusText()}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-destructive/10 rounded border border-destructive/20">
            <h3 className="font-medium mb-2 text-destructive">⚠️ Error Loading Data</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading workout history from Nostr...</p>
            </div>
          </div>
        )}

        {/* Workout History List */}
        {!isLoading && filteredWorkouts.length === 0 && debouncedSearchTerm ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6">
            <Search className="h-16 w-16 text-muted-foreground/20" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No workouts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => (
              <Card 
                key={workout.eventId} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleWorkoutSelect(workout)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{workout.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(workout.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(workout.duration)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Dumbbell className="h-4 w-4" />
                          {workout.exercises.length} exercises
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-[color:var(--workout-primary)]">
                        {calculateWorkoutVolume(workout).toLocaleString()} kg
                      </div>
                      <div className="text-xs text-muted-foreground">total volume</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {workout.exercises.slice(0, 3).map((exercise, index) => {
                      const exerciseTemplate = resolvedExercises.get(exercise.exerciseRef);
                      return (
                        <div 
                          key={index}
                          className="px-2 py-1 bg-muted rounded text-xs"
                        >
                          {exerciseTemplate?.name || 'Unknown Exercise'} - {exercise.reps} reps
                        </div>
                      );
                    })}
                    {workout.exercises.length > 3 && (
                      <div className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                        +{workout.exercises.length - 3} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMoreRecords && (
              <div className="text-center pt-6">
                <Button 
                  onClick={loadMoreRecords}
                  disabled={isLoadingMore}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Loading more...
                    </>
                  ) : (
                    'Load more workouts'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Workout History Detail Modal */}
        {selectedWorkout && processedWorkout && (
          <WorkoutHistoryDetailModal
            isOpen={!!selectedWorkout}
            onClose={() => {
              setSelectedWorkout(null);
              setProcessedWorkout(null);
            }}
            processedWorkout={processedWorkout}
          />
        )}
      </div>
    </>
  );
}
