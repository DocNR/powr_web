'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SetRow } from './SetRow';

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
  // NEW: Flexible set interaction props
  onCompleteSpecific?: (exerciseRef: string, setNumber: number, setData: SetData) => void;
  onUncompleteSpecific?: (exerciseRef: string, setNumber: number) => void;
  onEditCompleted?: (exerciseRef: string, setNumber: number, field: string, value: string | number) => void;
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
  // NEW: Flexible set interaction props
  onCompleteSpecific,
  onUncompleteSpecific,
  onEditCompleted,
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
    <div className={cn("py-6", className)}>
      {/* Exercise Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onExerciseSelect}
          className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline text-left cursor-pointer"
        >
          {exercise.name} {exercise.equipment && `(${exercise.equipment})`}
        </button>
        
        <button
          onClick={onExerciseSelect}
          className="text-primary hover:text-primary/80 transition-colors p-2 -m-2 cursor-pointer hover:bg-primary/10 rounded"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Prescribed Sets Info */}
      <div className="text-sm text-muted-foreground mb-4">
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

      {/* Set Rows - Using Flexible SetRow Component */}
      <div className="space-y-2 mt-2">
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
              isActive={false} // SIMPLIFIED: No more active set highlighting
              onComplete={(setData) => handleSetComplete(index, setData)}
              // NEW: Flexible set interaction props
              exerciseRef={exercise.id}
              exerciseIndex={exerciseIndex}
              setIndex={index}
              onCompleteSpecific={onCompleteSpecific}
              onUncompleteSpecific={onUncompleteSpecific}
              onEditCompleted={onEditCompleted}
              onSelectSet={onSelectSet}
            />
          );
        })}
      </div>

      {/* Add Set Button with Smart Highlighting */}
      {onAddSet && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => onAddSet(exercise.id)}
            className={cn(
              "w-full h-12 border-dashed transition-all duration-200",
              shouldHighlightAddSet 
                ? "border-[var(--workout-active-border)] bg-[var(--workout-active-bg)] text-[var(--workout-active)] ring-2 ring-[var(--workout-active-border)] animate-pulse" 
                : "border-border text-muted-foreground hover:text-foreground hover:border-border bg-[var(--workout-surface)] hover:bg-[var(--workout-surface-hover)]"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
        </div>
      )}
    </div>
  );
};
