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
      isSetCompleted && "bg-green-50",
      isCurrentSet && "bg-orange-50 ring-2 ring-orange-200"
    )}>
      {/* Set Number */}
      <div className="flex items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isSetCompleted ? "bg-green-500 text-white" : 
          isCurrentSet ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"
        )}>
          {setIndex + 1}
        </div>
      </div>

      {/* Previous Set */}
      <div className="flex items-center text-sm text-gray-500">
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
            className="h-10 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
            className="h-10 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
          />
        )}
      </div>

      {/* Complete Button */}
      <div className="flex items-center justify-center">
        {isSetCompleted ? (
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 border-gray-300 hover:bg-green-50 hover:border-green-300"
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
          className="text-blue-500 hover:text-blue-600 transition-colors p-2 -m-2"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Prescribed Sets Info */}
      <div className="text-sm text-gray-600 mb-4">
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
      <div className="grid grid-cols-5 gap-3 px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
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
            className="w-full h-12 border-dashed border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
        </div>
      )}
    </div>
  );
};
