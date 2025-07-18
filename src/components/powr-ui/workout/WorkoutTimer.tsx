'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface WorkoutTimerProps {
  elapsedTime: number;
  className?: string;
  gymPersonality?: 'default' | 'hardcore' | 'zen' | 'corporate' | 'boutique';
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  elapsedTime,
  className,
  gymPersonality = 'default'
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={cn(
        "text-2xl font-bold text-[var(--workout-timer)]",
        gymPersonality === 'hardcore' && "font-black text-3xl uppercase tracking-wider",
        gymPersonality === 'zen' && "font-light text-xl",
        gymPersonality === 'corporate' && "font-semibold text-2xl",
        gymPersonality === 'boutique' && "font-medium text-2xl italic",
        className
      )}
      data-gym-personality={gymPersonality}
    >
      {formatTime(elapsedTime)}
    </div>
  );
};
