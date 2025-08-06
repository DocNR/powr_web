'use client';

/**
 * SupersetCreationModal Component
 * 
 * Intuitive superset creation with up/down arrow reordering.
 * Selected exercises move to top section and become immediately reorderable.
 * Mobile-optimized for gym environments.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/powr-ui/primitives/Dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Link, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutExercise {
  index: number;
  name: string;
  exerciseRef: string;
}

interface SupersetCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuperset: (exerciseIndices: number[]) => void;
  currentExercises: WorkoutExercise[];
  triggerExerciseIndex: number;
  className?: string;
}

interface ReorderableSelectedExerciseProps {
  exercise: WorkoutExercise;
  index: number;
  totalExercises: number;
  isTriggering: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const ReorderableSelectedExercise: React.FC<ReorderableSelectedExerciseProps> = ({
  exercise,
  index,
  totalExercises,
  isTriggering,
  onMoveUp,
  onMoveDown,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalExercises - 1;

  return (
    <div className={cn(
      "flex items-center space-x-3 py-2 px-3 rounded-lg border transition-all",
      "bg-workout-active-bg border-workout-active-border",
      "min-h-[44px] touch-manipulation" // Compact mobile-friendly height
    )}>
      {/* Exercise Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground text-sm">
          {exercise.name}
          {isTriggering && (
            <span className="ml-2 text-xs text-workout-active font-normal">
              (selected from menu)
            </span>
          )}
        </div>
      </div>

      {/* Position Indicator */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-workout-active text-workout-active-foreground text-xs font-medium flex items-center justify-center">
        {index + 1}
      </div>

      {/* Arrow Controls - Side by side for compact layout */}
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className={cn(
            "h-8 w-8 p-0 touch-manipulation",
            isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-workout-active/10"
          )}
          title="Move up"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          className={cn(
            "h-8 w-8 p-0 touch-manipulation",
            isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-workout-active/10"
          )}
          title="Move down"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export const SupersetCreationModal: React.FC<SupersetCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateSuperset,
  currentExercises,
  triggerExerciseIndex,
  className
}) => {
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const hasInitialized = useRef(false);

  // Pre-select the triggering exercise when modal opens (only once)
  useEffect(() => {
    if (isOpen && triggerExerciseIndex !== null && !hasInitialized.current) {
      const triggerExercise = currentExercises.find(ex => ex.index === triggerExerciseIndex);
      if (triggerExercise) {
        setSelectedExercises([triggerExercise]);
        hasInitialized.current = true;
      }
    } else if (!isOpen) {
      // Reset initialization flag when modal closes
      hasInitialized.current = false;
      setSelectedExercises([]);
    }
  }, [isOpen, triggerExerciseIndex, currentExercises]);

  const handleExerciseToggle = (exercise: WorkoutExercise) => {
    // Prevent deselecting the triggering exercise
    if (exercise.index === triggerExerciseIndex) {
      return;
    }
    
    setSelectedExercises(prev => {
      const isSelected = prev.some(ex => ex.index === exercise.index);
      
      if (isSelected) {
        // Remove from selected
        return prev.filter(ex => ex.index !== exercise.index);
      } else {
        // Add to selected (append to end)
        return [...prev, exercise];
      }
    });
  };

  const moveSelectedExerciseUp = (index: number) => {
    if (index === 0) return; // Can't move first item up
    
    setSelectedExercises(prev => {
      const newSelected = [...prev];
      // Swap with previous item
      [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
      return newSelected;
    });
  };

  const moveSelectedExerciseDown = (index: number) => {
    if (index === selectedExercises.length - 1) return; // Can't move last item down
    
    setSelectedExercises(prev => {
      const newSelected = [...prev];
      // Swap with next item
      [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
      return newSelected;
    });
  };

  const handleCreateSuperset = () => {
    if (selectedExercises.length >= 2) {
      const exerciseIndices = selectedExercises.map(ex => ex.index);
      onCreateSuperset(exerciseIndices);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedExercises([]);
    onClose();
  };

  // Get unselected exercises from current exercises
  const unselectedExercises = currentExercises.filter(
    exercise => !selectedExercises.some(selected => selected.index === exercise.index)
  );

  const isValidSelection = selectedExercises.length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "w-[95vw] max-w-md sm:w-full sm:max-w-lg",
          "max-h-[80vh] flex flex-col",
          className
        )}
      >
        <DialogHeader className="flex-shrink-0 pb-3">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Link className="h-5 w-5 text-workout-active" />
            Create Superset
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select exercises and use arrows to reorder (minimum 2 exercises)
          </DialogDescription>
        </DialogHeader>

        {/* Exercise Lists */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Selected Exercises Section */}
          {selectedExercises.length > 0 && (
            <div>
              <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span>Selected Exercises ({selectedExercises.length})</span>
                {selectedExercises.length >= 2 && (
                  <span className="text-xs text-workout-active">→ Ready to create superset</span>
                )}
              </div>
              <div className="space-y-2">
                {selectedExercises.map((exercise, index) => (
                  <ReorderableSelectedExercise
                    key={exercise.index}
                    exercise={exercise}
                    index={index}
                    totalExercises={selectedExercises.length}
                    isTriggering={exercise.index === triggerExerciseIndex}
                    onMoveUp={moveSelectedExerciseUp}
                    onMoveDown={moveSelectedExerciseDown}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Exercises Section */}
          {unselectedExercises.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Available Exercises
              </div>
              <div className="space-y-2">
                {unselectedExercises.map((exercise) => (
                  <div
                    key={exercise.index}
                    className={cn(
                      "flex items-center space-x-3 py-2 px-3 rounded-lg border transition-colors cursor-pointer",
                      "bg-background border-border hover:bg-muted/50",
                      "min-h-[44px] touch-manipulation" // Compact mobile-friendly height
                    )}
                    onClick={() => handleExerciseToggle(exercise)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">
                        {exercise.name}
                      </div>
                    </div>
                    
                    <div className="text-muted-foreground text-sm">
                      Click to add
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {currentExercises.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No exercises in current workout
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex-shrink-0 pt-3">
          <div className="flex items-center justify-between gap-4 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSuperset}
              disabled={!isValidSelection}
              className={cn(
                "flex-1",
                isValidSelection 
                  ? "bg-workout-active hover:bg-workout-active/90 text-white" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              Create Superset
              {selectedExercises.length > 0 && ` (${selectedExercises.length})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

SupersetCreationModal.displayName = 'SupersetCreationModal';
