'use client';

/**
 * CompactWorkoutCard - Compact workout template card for discovery
 * 
 * Features:
 * - Image/icon on left (48x48px)
 * - Title and subtitle in center
 * - "..." dropdown menu on right
 * - Click to open template details
 */

import React, { useState } from 'react';
import { Card } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import { cn } from '@/lib/utils';

interface CompactWorkoutCardProps {
  workout: {
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
  };
  onSelect: (workoutId: string) => void;
  onMenuAction: (action: string, workoutId: string) => void;
  className?: string;
}

const CompactWorkoutCard: React.FC<CompactWorkoutCardProps> = ({
  workout,
  onSelect,
  onMenuAction,
  className
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleCardClick = () => {
    onSelect(workout.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    onMenuAction(action, workout.id);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="relative">
      <Card 
        className={cn(
          "p-3 cursor-pointer hover:shadow-md transition-all duration-200",
          "border border-border hover:ring-2 hover:ring-ring",
          className
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3">
          {/* Workout Image/Icon */}
          <div className="flex-shrink-0">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
              <WorkoutImageHandler
                tags={workout.eventTags}
                eventKind={33402}
                fill={true}
                className="w-full h-full"
                alt={`${workout.title} workout`}
              />
            </div>
          </div>

          {/* Workout Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground truncate">
                  {workout.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {workout.exercises.length} exercises • {formatDuration(workout.estimatedDuration)}
                </p>
              </div>

              {/* Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                onClick={handleMenuClick}
              >
                <span className="text-muted-foreground">⋯</span>
              </Button>
            </div>

            {/* Difficulty Badge and Rating */}
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                getDifficultyColor(workout.difficulty)
              )}>
                {workout.difficulty}
              </span>
              {workout.rating && (
                <span className="text-xs text-muted-foreground">
                  ⭐ {workout.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-background border border-border rounded-md shadow-lg">
            <div className="py-1">

              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleMenuAction('details')}
              >
                📋 Open Details
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleMenuAction('library')}
              >
                📚 Add to Library
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleMenuAction('copy')}
              >
                🔗 Copy naddr
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleMenuAction('share')}
              >
                📤 Share
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompactWorkoutCard;
