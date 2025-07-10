'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';
import { SetRow } from './SetRow';
import { Plus, MoreHorizontal } from 'lucide-react';
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
}

interface ExerciseSectionProps {
  exercise: ExerciseData;
  isActive?: boolean;
  currentSetIndex?: number;
  onSetComplete: (exerciseId: string, setIndex: number, setData: SetData) => void;
  onSetEdit?: (exerciseId: string, setIndex: number, setData: SetData) => void;
  onAddSet?: (exerciseId: string) => void;
  className?: string;
}

export const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  isActive = false,
  currentSetIndex = 0,
  onSetComplete,
  onSetEdit,
  onAddSet,
  className
}) => {
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const totalSets = exercise.sets.length;

  const handleSetComplete = (setIndex: number, setData: SetData) => {
    onSetComplete(exercise.id, setIndex, setData);
  };

  const handleSetEdit = (setIndex: number, setData: SetData) => {
    if (onSetEdit) {
      onSetEdit(exercise.id, setIndex, setData);
    }
  };

  const handleAddSet = () => {
    if (onAddSet) {
      onAddSet(exercise.id);
    }
  };

  // Get default data for new sets (from prescribed values or last completed set)
  const getDefaultSetData = (setIndex: number): SetData | undefined => {
    // Use prescribed values if available
    if (exercise.prescribedWeight !== undefined || exercise.prescribedReps !== undefined) {
      return {
        weight: exercise.prescribedWeight || 0,
        reps: exercise.prescribedReps || 0,
        rpe: 7,
        setType: 'normal'
      };
    }

    // Otherwise use last completed set as reference
    const lastCompletedSet = exercise.sets
      .slice(0, setIndex)
      .reverse()
      .find(set => set.completed);

    return lastCompletedSet;
  };

  // Get previous set data for reference display
  const getPreviousSetData = (setIndex: number): SetData | undefined => {
    if (setIndex === 0) return undefined;
    return exercise.sets[setIndex - 1];
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive ? "ring-2 ring-orange-500 ring-opacity-50" : "",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {exercise.name}
            </h3>
            {exercise.equipment && (
              <p className="text-sm text-gray-600 mt-1">
                {exercise.equipment}
              </p>
            )}
            {exercise.notes && (
              <p className="text-sm text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                {exercise.notes}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {/* Set Progress */}
            <div className="text-sm text-gray-600">
              {completedSets}/{totalSets} sets
            </div>
            
            {/* More Options */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Set List */}
        {exercise.sets.map((set, index) => {
          const isCurrentSet = isActive && index === currentSetIndex;
          const isSetCompleted = set.completed;
          const previousSetData = getPreviousSetData(index);
          const defaultSetData = getDefaultSetData(index);

          return (
            <SetRow
              key={index}
              setNumber={index + 1}
              previousSetData={previousSetData}
              defaultData={defaultSetData}
              isCompleted={isSetCompleted}
              isActive={isCurrentSet}
              onComplete={(setData) => handleSetComplete(index, setData)}
              onEdit={onSetEdit ? (setData) => handleSetEdit(index, setData) : undefined}
            />
          );
        })}

        {/* Add Set Button */}
        {onAddSet && (
          <Button
            variant="outline"
            onClick={handleAddSet}
            className="w-full h-12 border-dashed border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
