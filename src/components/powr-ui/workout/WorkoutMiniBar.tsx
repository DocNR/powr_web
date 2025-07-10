'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutMiniBarProps {
  workoutTitle: string;
  elapsedTime: number; // in milliseconds
  isPaused?: boolean;
  onTogglePause?: () => void;
  onExpand?: () => void;
  className?: string;
}

export const WorkoutMiniBar: React.FC<WorkoutMiniBarProps> = ({
  workoutTitle,
  elapsedTime,
  isPaused = false,
  onTogglePause,
  onExpand,
  className
}) => {
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40",
      "safe-area-inset-bottom", // Handle safe area for mobile devices
      className
    )}>
      <div 
        className="flex items-center justify-between p-3 max-w-md mx-auto cursor-pointer"
        onClick={onExpand}
      >
        {/* Workout Title */}
        <div className="flex-1 min-w-0 mr-4">
          <h4 className="font-medium text-gray-900 truncate">
            {workoutTitle}
          </h4>
        </div>

        {/* Timer and Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Pause Indicator */}
          {isPaused && (
            <span className="text-orange-500 text-sm font-medium">
              Paused
            </span>
          )}
          
          {/* Timer Display */}
          <div className={cn(
            "font-mono text-lg font-semibold",
            isPaused ? "text-orange-500" : "text-gray-900"
          )}>
            {formatTime(elapsedTime)}
          </div>

          {/* Pause/Resume Button */}
          {onTogglePause && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering onExpand
                onTogglePause();
              }}
              className="h-8 w-8 text-gray-600 hover:text-gray-800"
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
