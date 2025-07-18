'use client';

import React from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Plus, Check, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  isActive?: boolean;
  currentSetIndex?: number;
  onSetComplete: (exerciseId: string, setIndex: number, setData: SetData) => void;
  onAddSet?: (exerciseId: string) => void;
  onExerciseSelect?: () => void;
  className?: string;
}

// Separate component for set row to handle state properly
interface SetRowProps {
  set: SetData;
  setIndex: number;
  isCurrentSet: boolean;
  isSetCompleted: boolean;
  previousSetData?: SetData;
  onComplete: (setData: SetData) => void;
}

const SetRowComponent: React.FC<SetRowProps> = ({
  set,
  setIndex,
  isCurrentSet,
  isSetCompleted,
  previousSetData,
  onComplete
}) => {
  const [weight, setWeight] = React.useState(set.weight.toString());
  const [reps, setReps] = React.useState(set.reps.toString());

  // Format previous set display
  const formatPreviousSet = (setData: SetData | undefined): string => {
    if (!setData) return '';
    if (setData.weight === 0) {
      return `${setData.reps} reps`;
    }
    return `${setData.weight} lb × ${setData.reps}`;
  };

  return (
    <div className={cn(
      "grid grid-cols-5 gap-3 px-3 py-3 rounded-lg transition-colors",
      isSetCompleted && "bg-green-50 dark:bg-green-950/20",
      isCurrentSet && "bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-200 dark:ring-blue-800"
    )}>
      {/* Set Number */}
      <div className="flex items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isSetCompleted ? "bg-green-600 text-white" : 
          isCurrentSet ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        )}>
          {setIndex + 1}
        </div>
      </div>

      {/* Previous Set */}
      <div className="flex items-center text-sm text-muted-foreground">
        {formatPreviousSet(previousSetData)}
      </div>

      {/* Weight Input */}
      <div className="flex items-center">
        {isSetCompleted ? (
          <div className="text-sm font-medium">{set.weight || 'BW'}</div>
        ) : (
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="h-10 text-center border-border focus:border-primary focus:ring-primary"
            placeholder="0"
          />
        )}
      </div>

      {/* Reps Input */}
      <div className="flex items-center">
        {isSetCompleted ? (
          <div className="text-sm font-medium">{set.reps}</div>
        ) : (
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="h-10 text-center border-border focus:border-primary focus:ring-primary"
            placeholder="0"
          />
        )}
      </div>

      {/* Complete Button */}
      <div className="flex items-center justify-center">
        {isSetCompleted ? (
          <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 border-border hover:bg-green-50 hover:border-green-600 dark:hover:bg-green-950/20"
            onClick={() => onComplete({
              weight: parseFloat(weight) || 0,
              reps: parseInt(reps) || 0,
              rpe: 7,
              setType: 'normal',
              completed: true
            })}
            disabled={!weight || !reps}
          >
            <Check className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  isActive = false,
  currentSetIndex = 0,
  onSetComplete,
  onAddSet,
  onExerciseSelect,
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
        <h3 className="text-lg font-semibold">
          {exercise.name} {exercise.equipment && `(${exercise.equipment})`}
        </h3>
        
        <button
          onClick={onExerciseSelect}
          className="text-primary hover:text-primary/80 transition-colors p-2 -m-2"
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

      {/* Table Headers */}
      <div className="grid grid-cols-5 gap-3 px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border">
        <div>Set</div>
        <div>Previous</div>
        <div>-lbs</div>
        <div>Reps</div>
        <div className="text-center">✓</div>
      </div>

      {/* Set Rows */}
      <div className="space-y-2 mt-2">
        {exercise.sets.map((set, index) => {
          const isCurrentSet = isActive && index === currentSetIndex;
          const isSetCompleted = set.completed || false;
          const previousSetData = getPreviousSetData(index);

          return (
            <SetRowComponent
              key={index}
              set={set}
              setIndex={index}
              isCurrentSet={isCurrentSet}
              isSetCompleted={isSetCompleted}
              previousSetData={previousSetData}
              onComplete={(setData) => handleSetComplete(index, setData)}
            />
          );
        })}
      </div>

      {/* Add Set Button */}
      {onAddSet && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => onAddSet(exercise.id)}
            className="w-full h-12 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
        </div>
      )}
    </div>
  );
};
