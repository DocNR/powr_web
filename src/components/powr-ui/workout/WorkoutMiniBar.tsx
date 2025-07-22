'use client';

import React from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutMiniBarProps {
  workoutTitle: string;
  elapsedTime: number; // in milliseconds
  onExpand?: () => void;
  className?: string;
}

export const WorkoutMiniBar: React.FC<WorkoutMiniBarProps> = ({
  workoutTitle,
  elapsedTime,
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
      // Position - sits right above the new 64px bottom tabs
      "fixed left-0 right-0 z-40",
      "bottom-[64px]", // Now sits right above the taller bottom tabs
      // Background with proper backdrop blur and theme support
      "bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
      // Border and shadow with theme support
      "border-t border-border shadow-lg",
      // Ensure it works with safe area
      "safe-area-inset-x",
      className
    )}>
      {/* Main Content - Simple workout info display */}
      <div 
        className="flex items-center justify-between p-4 max-w-md mx-auto cursor-pointer group transition-all duration-200 hover:bg-accent/50"
        onClick={onExpand}
      >
        {/* Left Section: Title and Status */}
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1">
            {/* Activity indicator - always active (no pause) */}
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            
            {/* Status text - always active */}
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              Active
            </span>
          </div>
          
          {/* Workout title */}
          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {workoutTitle}
          </h4>
        </div>

        {/* Right Section: Timer Display */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Timer with icon */}
          <Timer className="h-4 w-4 flex-shrink-0 text-primary" />
          
          <div className="font-mono text-lg font-bold tabular-nums text-foreground">
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>
    </div>
  );
};
