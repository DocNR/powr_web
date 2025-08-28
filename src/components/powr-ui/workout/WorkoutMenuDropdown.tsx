'use client';

/**
 * WorkoutMenuDropdown Component
 * 
 * Dropdown menu for workout-level operations during active workouts.
 * Uses Radix UI primitives for consistency with ExerciseMenuDropdown.
 * Provides access to workout-wide actions and settings.
 */

import React, { useState } from 'react';
import { MoreHorizontal, Info, FileText, Scale } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWeightUnits } from '@/providers/WeightUnitsProvider';

interface WorkoutMenuDropdownProps {
  onMenuAction: (action: string) => void;
  workoutData?: {
    title?: string;
    workoutId?: string;
  };
  templateData?: {
    title?: string;
    description?: string;
    tags?: string[][];
  };
  className?: string;
}

export function WorkoutMenuDropdown({ 
  onMenuAction, 
  workoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
  templateData, // eslint-disable-line @typescript-eslint/no-unused-vars
  className = ''
}: WorkoutMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { weightUnit, toggleWeightUnit } = useWeightUnits();

  const handleMenuAction = (action: string) => {
    setIsOpen(false);
    onMenuAction(action);
  };

  const handleWeightUnitToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWeightUnit();
    // Keep menu open so user can toggle back if needed
  };

  return (
    <>
      {/* Backdrop blur when dropdown is open */}
      {isOpen && (
        <div 
          className="dropdown-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className={`text-primary hover:text-primary/80 transition-colors p-1 -m-1 cursor-pointer hover:bg-primary/10 rounded ${className}`}
            aria-label="Workout options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Template Info */}
          <DropdownMenuItem onClick={() => handleMenuAction('template-info')}>
            <Info className="h-4 w-4 mr-2" />
            Template Info
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Weight Units Toggle */}
          <DropdownMenuItem onClick={handleWeightUnitToggle}>
            <Scale className="h-4 w-4 mr-2" />
            Weight Units ({weightUnit.toUpperCase()})
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Workout Notes - Coming Soon */}
          <DropdownMenuItem 
            disabled={true}
            className="opacity-50 cursor-not-allowed"
          >
            <FileText className="h-4 w-4 mr-2" />
            Workout Notes
            <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default WorkoutMenuDropdown;
