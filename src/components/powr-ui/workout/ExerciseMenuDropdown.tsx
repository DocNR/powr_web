'use client';

/**
 * ExerciseMenuDropdown Component
 * 
 * Reusable dropdown menu for exercise-level operations during active workouts.
 * Provides CRUD operations and future extensibility for features like:
 * - Create Superset
 * - Add Note  
 * - Exercise Preferences (weight units, etc.)
 */

import React, { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, Replace, Trash2, Link } from 'lucide-react';
import { ExercisePicker } from './ExercisePicker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExerciseMenuDropdownProps {
  exerciseIndex: number;
  exerciseName: string;
  exerciseId: string;
  totalExercises: number;
  // CRUD operation handlers
  onSubstituteExercise?: (exerciseIndex: number, newExerciseRef: string) => void;
  onRemoveExercise?: (exerciseIndex: number) => void;
  onReorderExercises?: () => void; // NEW: Reorder exercises handler
  // Future extensibility props
  onCreateSuperset?: (exerciseIndex: number) => void;
  onAddNote?: (exerciseIndex: number) => void;
  onExercisePreferences?: (exerciseIndex: number) => void;
  className?: string;
}

export const ExerciseMenuDropdown: React.FC<ExerciseMenuDropdownProps> = ({
  exerciseIndex,
  exerciseName,
  exerciseId,
  totalExercises,
  onSubstituteExercise,
  onRemoveExercise,
  onReorderExercises,
  onCreateSuperset,
  onAddNote,
  onExercisePreferences,
  className = ''
}) => {
  // State for ExercisePicker
  const [showSubstitutePicker, setShowSubstitutePicker] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className={`text-primary hover:text-primary/80 transition-colors p-1 -m-1 cursor-pointer hover:bg-primary/10 rounded ${className}`}
            aria-label={`Exercise options for ${exerciseName}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Exercise Modification Section */}
          {onSubstituteExercise && (
            <DropdownMenuItem onClick={() => setShowSubstitutePicker(true)}>
              <Replace className="h-4 w-4 mr-2" />
              Substitute Exercise
            </DropdownMenuItem>
          )}
          
          {/* Create Superset - Temporarily Disabled */}
          {onCreateSuperset && (
            <DropdownMenuItem 
              disabled={true}
              className="opacity-50 cursor-not-allowed"
            >
              <Link className="h-4 w-4 mr-2" />
              Create Superset
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </DropdownMenuItem>
          )}
          
          {/* Future: Add Note */}
          {onAddNote && (
            <DropdownMenuItem onClick={() => onAddNote(exerciseIndex)}>
              <div className="h-4 w-4 mr-2 flex items-center justify-center">📝</div>
              Add Note
            </DropdownMenuItem>
          )}

          {(onSubstituteExercise || onCreateSuperset || onAddNote) && (
            <DropdownMenuSeparator />
          )}
          
          {/* Exercise Reordering Section */}
          {onReorderExercises && (
            <DropdownMenuItem onClick={onReorderExercises}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Reorder Exercises
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          {/* Future: Exercise Preferences */}
          {onExercisePreferences && (
            <>
              <DropdownMenuItem onClick={() => onExercisePreferences(exerciseIndex)}>
                <div className="h-4 w-4 mr-2 flex items-center justify-center">⚙️</div>
                Exercise Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Destructive Actions Section */}
          {onRemoveExercise && (
            <DropdownMenuItem 
              onClick={() => onRemoveExercise(exerciseIndex)}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Exercise
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Exercise Picker for Substitution */}
      {onSubstituteExercise && (
        <ExercisePicker
          isOpen={showSubstitutePicker}
          onClose={() => setShowSubstitutePicker(false)}
          onSelectExercise={(exerciseRef) => {
            onSubstituteExercise(exerciseIndex, exerciseRef);
            setShowSubstitutePicker(false);
          }}
          mode="single"
          title="Substitute Exercise"
          description={`Replace "${exerciseName}" with a different exercise`}
          excludeExerciseRefs={[exerciseId]} // Don't show current exercise
        />
      )}
    </>
  );
};

ExerciseMenuDropdown.displayName = 'ExerciseMenuDropdown';
