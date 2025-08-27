/**
 * WorkoutListView Component
 * 
 * Mobile-optimized Spotify-style list view for workout templates.
 * Matches ExerciseListView design with workout cover images and dropdown menus.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/powr-ui/primitives/Button';
import { MoreVertical, Eye, Trash2, Copy, Clock } from 'lucide-react';

interface WorkoutListViewProps {
  workouts: Array<{
    templateRef: string;
    template: {
      id: string;
      name: string;
      description?: string;
      exercises: Array<{
        exerciseRef: string;
        sets?: number;
        reps?: number;
        weight?: number;
      }>;
      estimatedDuration?: number;
      difficulty?: string;
      authorPubkey: string;
      createdAt?: number;
    };
  }>;
  onWorkoutSelect?: (templateRef: string) => void;
  onMenuAction?: (action: string, templateRef: string) => void;
}

// Workout cover image logic (future NIP-92 integration ready)
const getWorkoutCoverImage = (): string => {
  // Future: Parse NIP-92 imeta tags when implemented
  // const imetaTag = parseImetaFromTags(template.tags);
  // if (imetaTag?.url) return imetaTag.url;
  
  // Current: Use fallback image
  return '/assets/workout-template-fallback.jpg';
};

export function WorkoutListView({ workouts, onWorkoutSelect, onMenuAction }: WorkoutListViewProps) {
  if (workouts.length === 0) {
    return <WorkoutListEmpty />;
  }

  return (
    <div className="space-y-0 min-h-screen">
      {workouts.map((item) => (
        <WorkoutListItem
          key={item.templateRef}
          workout={item}
          onWorkoutSelect={onWorkoutSelect}
          onMenuAction={onMenuAction}
        />
      ))}
      {/* Debug: Add some padding at bottom to ensure full height */}
      <div className="h-20"></div>
    </div>
  );
}

interface WorkoutListItemProps {
  workout: {
    templateRef: string;
    template: {
      id: string;
      name: string;
      description?: string;
      exercises: Array<{
        exerciseRef: string;
        sets?: number;
        reps?: number;
        weight?: number;
      }>;
      estimatedDuration?: number;
      difficulty?: string;
      authorPubkey: string;
      createdAt?: number;
    };
  };
  onWorkoutSelect?: (templateRef: string) => void;
  onMenuAction?: (action: string, templateRef: string) => void;
}

function WorkoutListItem({ 
  workout, 
  onWorkoutSelect,
  onMenuAction
}: WorkoutListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const coverImage = getWorkoutCoverImage();

  const handleWorkoutClick = () => {
    onWorkoutSelect?.(workout.templateRef);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    onMenuAction?.(action, workout.templateRef);
  };

  // Convert duration from seconds to minutes for display
  const durationInMinutes = workout.template.estimatedDuration 
    ? Math.round(workout.template.estimatedDuration / 60) 
    : null;

  return (
    <div className="relative">
      <div 
        className="py-2 transition-colors cursor-pointer hover:bg-muted/50"
        onClick={handleWorkoutClick}
      >
        <div className="px-4 flex items-center gap-3">
          {/* Workout Cover Image - Spotify "Album Cover" equivalent */}
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-workout-surface rounded-md overflow-hidden">
            <Image
              src={coverImage}
              alt={workout.template.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={() => {
                // Fallback handled by Next.js Image component
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-foreground">
              {workout.template.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1 overflow-hidden">
              {/* Primary stat - exercise count */}
              <span className="text-sm text-muted-foreground flex-shrink-0">
                {workout.template.exercises.length} exercises
              </span>
              
              {/* Additional stats with truncation */}
              <div className="flex items-center space-x-2 min-w-0 truncate">
                {durationInMinutes && (
                  <>
                    <span className="text-muted-foreground flex-shrink-0">•</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {durationInMinutes}min
                      </span>
                    </div>
                  </>
                )}
                
                {/* Difficulty text - with proper ellipsis */}
                {workout.template.difficulty && (
                  <>
                    <span className="text-muted-foreground flex-shrink-0">•</span>
                    <span className="text-xs text-muted-foreground min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {workout.template.difficulty}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2 ml-3">
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleMenuClick}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Dropdown Menu with improved styling */}
      {showMenu && (
        <>
          {/* Enhanced Backdrop */}
          <div 
            className="dropdown-backdrop"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Enhanced Menu */}
          <div className="dropdown-menu absolute right-4 top-12 w-48">
            <div className="py-1">
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('details')}
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('remove')}
              >
                <Trash2 className="h-4 w-4" />
                Remove from Library
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('copy')}
              >
                <Copy className="h-4 w-4" />
                Copy naddr
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function WorkoutListEmpty() {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground mb-2">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">No workouts found</h3>
      <p className="text-muted-foreground">Try adjusting your search or filters</p>
    </div>
  );
}

export default WorkoutListView;
