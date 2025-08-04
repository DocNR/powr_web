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
import { MoreHorizontal, ArrowUp, ArrowDown, Replace, Trash2 } from 'lucide-react';
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
  onMoveExerciseUp?: (exerciseIndex: number) => void;
  onMoveExerciseDown?: (exerciseIndex: number) => void;
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
  onMoveExerciseUp,
  onMoveExerciseDown,
  onCreateSuperset,
  onAddNote,
  onExercisePreferences,
  className = ''
}) => {
  // State for ExercisePicker
  const [showSubstitutePicker, setShowSubstitutePicker] = useState(false);

  const isFirstExercise = exerciseIndex === 0;
  const isLastExercise = exerciseIndex === totalExercises - 1;

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
          
          {/* Future: Create Superset */}
          {onCreateSuperset && (
            <DropdownMenuItem onClick={() => onCreateSuperset(exerciseIndex)}>
              <div className="h-4 w-4 mr-2 flex items-center justify-center text-xs font-bold">SS</div>
              Create Superset
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
          {onMoveExerciseUp && (
            <DropdownMenuItem 
              onClick={() => onMoveExerciseUp(exerciseIndex)}
              disabled={isFirstExercise}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Move Up
            </DropdownMenuItem>
          )}
          
          {onMoveExerciseDown && (
            <DropdownMenuItem 
              onClick={() => onMoveExerciseDown(exerciseIndex)}
              disabled={isLastExercise}
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Move Down
            </DropdownMenuItem>
          )}

          {(onMoveExerciseUp || onMoveExerciseDown) && (
            <DropdownMenuSeparator />
          )}
          
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
