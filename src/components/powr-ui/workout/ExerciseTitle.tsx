'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ExerciseTitleProps {
  title: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  gymPersonality?: 'default' | 'hardcore' | 'zen' | 'corporate' | 'boutique';
}

export const ExerciseTitle: React.FC<ExerciseTitleProps> = ({
  title,
  onClick,
  isActive = false,
  className,
  gymPersonality = 'default'
}) => {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        "text-lg font-semibold transition-colors text-left",
        onClick && "cursor-pointer hover:text-workout-primary/80",
        isActive 
          ? "text-workout-timer" 
          : "text-workout-primary",
        gymPersonality === 'hardcore' && "font-black uppercase tracking-wide text-xl",
        gymPersonality === 'zen' && "font-light text-base",
        gymPersonality === 'corporate' && "font-semibold text-lg",
        gymPersonality === 'boutique' && "font-medium italic text-lg",
        className
      )}
      data-gym-personality={gymPersonality}
    >
      {title}
    </Component>
  );
};
