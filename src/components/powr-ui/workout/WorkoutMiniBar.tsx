'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Play, Pause, Timer } from 'lucide-react';
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
      {/* Main Content - No caret, just the workout info */}
      <div 
        className="flex items-center justify-between p-4 max-w-md mx-auto cursor-pointer group transition-all duration-200 hover:bg-accent/50"
        onClick={onExpand}
      >
        {/* Left Section: Title and Status */}
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1">
            {/* Activity indicator */}
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isPaused ? "bg-orange-500" : "bg-primary animate-pulse"
            )} />
            
            {/* Status text */}
            <span className={cn(
              "text-xs font-medium uppercase tracking-wide",
              isPaused ? "text-orange-500" : "text-primary"
            )}>
              {isPaused ? "Paused" : "Active"}
            </span>
          </div>
          
          {/* Workout title */}
          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {workoutTitle}
          </h4>
        </div>

        {/* Right Section: Timer and Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Timer with icon */}
          <div className="flex items-center gap-2 min-w-0">
            <Timer className={cn(
              "h-4 w-4 flex-shrink-0",
              isPaused ? "text-orange-500" : "text-primary"
            )} />
            
            <div className={cn(
              "font-mono text-lg font-bold tabular-nums",
              isPaused ? "text-orange-500" : "text-foreground"
            )}>
              {formatTime(elapsedTime)}
            </div>
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
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-200",
                "hover:bg-primary/10 hover:scale-105",
                "focus:bg-primary/10 focus:ring-2 focus:ring-primary/20",
                isPaused 
                  ? "text-orange-500 hover:text-orange-600" 
                  : "text-primary hover:text-primary/80"
              )}
            >
              {isPaused ? (
                <Play className="h-4 w-4 ml-0.5" /> // Slight offset for visual balance
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