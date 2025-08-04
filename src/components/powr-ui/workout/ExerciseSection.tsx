'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SetRow } from './SetRow';
import { ExerciseMenuDropdown } from './ExerciseMenuDropdown';

interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
  setType?: 'warmup' | 'normal' | 'drop' | 'failure';
  completed?: boolean;
}

interface ExerciseData {
  id: string;
  name: string;
  equipment?: string;
  notes?: string;
  sets: SetData[];
  prescribedSets?: number;
  prescribedReps?: number;
  prescribedWeight?: number;
  prescribedRpe?: number;
}

interface ExerciseSectionProps {
  exercise: ExerciseData;
  shouldHighlightAddSet?: boolean; // NEW PROP for smart Add Set highlighting
  onSetComplete: (exerciseId: string, setIndex: number, setData: SetData) => void;
  onAddSet?: (exerciseId: string) => void;
  onExerciseSelect?: () => void;
  onSelectSet?: (exerciseIndex: number, setIndex: number) => void; // NEW: Set selection handler
  exerciseIndex?: number; // NEW: Exercise index for set selection
  // CRUD operation props
  onRemoveExercise?: (exerciseIndex: number) => void;
  onSubstituteExercise?: (exerciseIndex: number, newExerciseRef: string) => void;
  onMoveExerciseUp?: (exerciseIndex: number) => void;
  onMoveExerciseDown?: (exerciseIndex: number) => void;
  totalExercises?: number; // For determining if move up/down should be disabled
  className?: string;
}

export const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  shouldHighlightAddSet = false, // NEW PROP with default value
  onSetComplete,
  onAddSet,
  onExerciseSelect,
  onSelectSet, // NEW: Set selection handler
  exerciseIndex, // NEW: Exercise index for set selection
  // CRUD operation props
  onRemoveExercise,
  onSubstituteExercise,
  onMoveExerciseUp,
  onMoveExerciseDown,
  totalExercises,
  className
}) => {
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const totalSets = exercise.sets.length;

  const handleSetComplete = (setIndex: number, setData: SetData) => {
    onSetComplete(exercise.id, setIndex, setData);
  };

  // Get previous set data for reference display
  const getPreviousSetData = (setIndex: number): SetData | undefined => {
    if (setIndex === 0) return undefined;
    return exercise.sets[setIndex - 1];
  };

  return (
    <div className={cn("py-4", className)}>
      {/* Exercise Header - Compact */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onExerciseSelect}
          className="text-base font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline text-left cursor-pointer"
        >
          {exercise.name} {exercise.equipment && `(${exercise.equipment})`}
        </button>
        
        <ExerciseMenuDropdown
          exerciseIndex={exerciseIndex!}
          exerciseName={exercise.name}
          exerciseId={exercise.id}
          totalExercises={totalExercises!}
          onSubstituteExercise={onSubstituteExercise}
          onRemoveExercise={onRemoveExercise}
          onMoveExerciseUp={onMoveExerciseUp}
          onMoveExerciseDown={onMoveExerciseDown}
        />
      </div>

      {/* Prescribed Sets Info - Compact */}
      <div className="text-xs text-muted-foreground mb-3">
        {exercise.prescribedSets && exercise.prescribedReps ? (
          `${exercise.prescribedSets} sets of ${exercise.prescribedReps} reps${exercise.prescribedRpe ? ` @ RPE ${exercise.prescribedRpe}` : ''}`
        ) : exercise.prescribedReps ? (
          `${exercise.prescribedReps} reps${exercise.prescribedRpe ? ` @ RPE ${exercise.prescribedRpe}` : ''}`
        ) : exercise.prescribedSets ? (
          `${exercise.prescribedSets} sets${exercise.prescribedRpe ? ` @ RPE ${exercise.prescribedRpe}` : ''}`
        ) : (
          `${completedSets}/${totalSets} sets`
        )}
      </div>

      {/* Table Headers - Compact mobile layout */}
      <div className="flex items-center gap-2 px-1 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <div className="w-8 text-center">Set</div>
        <div className="w-16 text-center">Previous</div>
        <div className="flex-1 text-center">lbs</div>
        <div className="flex-1 text-center">Reps</div>
        <div className="w-12 text-center">RPE</div>
        <div className="w-10 text-center">✓</div>
      </div>

      {/* Set Rows - Compact spacing */}
      <div className="space-y-1">
        {exercise.sets.map((set, index) => {
          const isSetCompleted = set.completed || false;
          const previousSetData = getPreviousSetData(index);

          return (
            <SetRow
              key={index}
              setNumber={index + 1}
              previousSetData={previousSetData}
              defaultData={{
                weight: set.weight,
                reps: set.reps,
                rpe: set.rpe,
                setType: set.setType,
                completed: set.completed
              }}
              isCompleted={isSetCompleted}
              isActive={false}
              onComplete={(setData) => handleSetComplete(index, setData)}
              exerciseIndex={exerciseIndex}
              setIndex={index}
              onSelectSet={onSelectSet}
            />
          );
        })}
      </div>

      {/* Add Set Button - Compact */}
      {onAddSet && (
        <div className="mt-3">
          <Button
            variant="outline"
            onClick={() => onAddSet(exercise.id)}
            className={cn(
              "w-full h-10 border-dashed transition-all duration-200 text-sm",
              shouldHighlightAddSet 
                ? "border-[var(--workout-active-border)] bg-[var(--workout-active-bg)] text-[var(--workout-active)] ring-1 ring-[var(--workout-active-border)] animate-pulse" 
                : "border-border text-muted-foreground hover:text-foreground hover:border-border bg-transparent hover:bg-muted/20"
            )}
          >
            <Plus className="h-3 w-3 mr-2" />
            Add Set
          </Button>
        </div>
      )}

    </div>
  );
};
