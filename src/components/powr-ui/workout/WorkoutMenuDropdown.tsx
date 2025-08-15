/**
 * WorkoutMenuDropdown Component
 * 
 * Provides workout-level actions and settings in a dropdown menu.
 * Consistent with ExerciseMenuDropdown design patterns.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { MoreVertical, Info, Settings, FileText, Share, Scale } from 'lucide-react';
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
  className 
}: WorkoutMenuDropdownProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { weightUnit, toggleWeightUnit } = useWeightUnits();

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    onMenuAction(action);
  };

  const handleWeightUnitToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWeightUnit();
    // Keep menu open so user can toggle back if needed
  };

  return (
    <div className="relative">
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 p-0 ${className}`}
        onClick={handleMenuClick}
        title="Workout menu"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* Enhanced Dropdown Menu */}
      {showMenu && (
        <>
          {/* Enhanced Backdrop */}
          <div 
            className="dropdown-backdrop"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Enhanced Menu */}
          <div className="dropdown-menu absolute right-0 top-10 w-48 z-50">
            <div className="py-1">
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('template-info')}
              >
                <Info className="h-4 w-4" />
                Template Info
              </button>
              
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('workout-settings')}
              >
                <Settings className="h-4 w-4" />
                Workout Settings
              </button>
              
              <button
                className="dropdown-item"
                onClick={handleWeightUnitToggle}
              >
                <Scale className="h-4 w-4" />
                Weight Units ({weightUnit.toUpperCase()})
              </button>
              
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('workout-notes')}
              >
                <FileText className="h-4 w-4" />
                Workout Notes
              </button>
              
              <div className="dropdown-separator" />
              
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('share-workout')}
              >
                <Share className="h-4 w-4" />
                Share Workout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default WorkoutMenuDropdown;
