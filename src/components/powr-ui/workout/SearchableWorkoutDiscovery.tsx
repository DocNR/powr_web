'use client';

/**
 * SearchableWorkoutDiscovery - Search-based workout template discovery
 * 
 * Features:
 * - Real-time search across Kind 33402 events
 * - Compact card layout
 * - Debounced search input
 * - Menu actions for each workout
 */

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/powr-ui/primitives/Input';
import { WorkoutCard } from './WorkoutCard';

interface SearchableWorkoutDiscoveryProps {
  workouts: Array<{
    id: string;
    title: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      weight: number;
    }>;
    estimatedDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    rating?: number;
    author: {
      pubkey: string;
      name: string;
      picture?: string;
    };
    eventId?: string;
    eventTags?: string[][];
  }>;
  onWorkoutSelect: (workoutId: string) => void;
  onMenuAction: (action: string, workoutId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const SearchableWorkoutDiscovery: React.FC<SearchableWorkoutDiscoveryProps> = ({
  workouts,
  onWorkoutSelect,
  onMenuAction,
  isLoading = false,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter workouts based on search query
  const filteredWorkouts = useMemo(() => {
    if (!searchQuery.trim()) {
      return workouts;
    }

    const query = searchQuery.toLowerCase();
    
    return workouts.filter(workout => {
      // Search in title
      if (workout.title.toLowerCase().includes(query)) {
        return true;
      }

      // Search in difficulty (with safety check)
      if (workout.difficulty && workout.difficulty.toLowerCase().includes(query)) {
        return true;
      }

      // Search in exercise names (with safety checks)
      if (workout.exercises && Array.isArray(workout.exercises) && workout.exercises.some(exercise => 
        exercise?.name?.toLowerCase().includes(query)
      )) {
        return true;
      }

      // Search in tags (if available)
      if (workout.eventTags) {
        const tagText = workout.eventTags
          .filter(tag => tag[0] === 't')
          .map(tag => tag[1])
          .join(' ')
          .toLowerCase();
        
        if (tagText.includes(query)) {
          return true;
        }
      }

      // Search in author name
      if (workout.author?.name?.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [workouts, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search workouts, exercises, or tags..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading workouts...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && (
        <>
          {/* Results Count */}
          {searchQuery.trim() && (
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">
                {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>
          )}

          {/* Workout Cards */}
          {filteredWorkouts.length > 0 ? (
            <div className="space-y-3">
              {filteredWorkouts.map((workout, index) => (
                <WorkoutCard
                  key={workout.eventId || workout.id || `workout-${index}`}
                  variant="compact"
                  workout={workout}
                  onSelect={onWorkoutSelect}
                  onMenuAction={onMenuAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {searchQuery.trim() ? (
                  <>
                    <p className="text-lg mb-2">🔍</p>
                    <p className="font-medium">No workouts found</p>
                    <p className="text-sm">Try searching for different terms</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">💪</p>
                    <p className="font-medium">No workouts available</p>
                    <p className="text-sm">Check back later for new content</p>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchableWorkoutDiscovery;
