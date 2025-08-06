'use client';

/**
 * ExerciseReorderModal Component
 * 
 * Full workout exercise reordering with up/down arrows.
 * Shows all exercises in current order and allows complete reordering.
 * Mobile-optimized for gym environments.
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/powr-ui/primitives/Dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutExercise {
  index: number;
  name: string;
  exerciseRef: string;
}

interface ExerciseReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReorderExercises: (newOrder: number[]) => void;
  currentExercises: WorkoutExercise[];
  className?: string;
}

interface ReorderableExerciseProps {
  exercise: WorkoutExercise;
  index: number;
  totalExercises: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const ReorderableExercise: React.FC<ReorderableExerciseProps> = ({
  exercise,
  index,
  totalExercises,
  onMoveUp,
  onMoveDown,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalExercises - 1;

  return (
    <div className={cn(
      "flex items-center space-x-3 py-2 px-3 rounded-lg border transition-all",
      "bg-background border-border hover:bg-muted/50",
      "min-h-[44px] touch-manipulation" // Compact mobile-friendly height
    )}>
      {/* Exercise Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground text-sm">
          {exercise.name}
        </div>
      </div>

      {/* Position Indicator */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
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
            isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"
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
            isLast ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"
          )}
          title="Move down"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export const ExerciseReorderModal: React.FC<ExerciseReorderModalProps> = ({
  isOpen,
  onClose,
  onReorderExercises,
  currentExercises,
  className
}) => {
  const [reorderedExercises, setReorderedExercises] = useState<WorkoutExercise[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize with current exercise order when modal opens (only once)
  useEffect(() => {
    if (isOpen) {
      setReorderedExercises([...currentExercises]);
      setHasChanges(false);
    }
  }, [isOpen]); // Removed currentExercises to prevent resetting on parent re-renders

  const moveExerciseUp = (index: number) => {
    if (index === 0) return; // Can't move first item up
    
    setReorderedExercises(prev => {
      const newOrder = [...prev];
      // Swap with previous item
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      
      // Check if order has changed from original
      const orderChanged = newOrder.some((exercise, idx) => 
        exercise.index !== currentExercises[idx]?.index
      );
      setHasChanges(orderChanged);
      
      return newOrder;
    });
  };

  const moveExerciseDown = (index: number) => {
    if (index === reorderedExercises.length - 1) return; // Can't move last item down
    
    setReorderedExercises(prev => {
      const newOrder = [...prev];
      // Swap with next item
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
      // Check if order has changed from original
      const orderChanged = newOrder.some((exercise, idx) => 
        exercise.index !== currentExercises[idx]?.index
      );
      setHasChanges(orderChanged);
      
      return newOrder;
    });
  };

  const handleSaveReorder = () => {
    if (hasChanges) {
      // Extract the new order of original indices
      const newOrder = reorderedExercises.map(exercise => exercise.index);
      onReorderExercises(newOrder);
    }
    onClose();
  };

  const handleClose = () => {
    setReorderedExercises([]);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setReorderedExercises([...currentExercises]);
    setHasChanges(false);
  };

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
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Reorder Exercises
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Use the arrow buttons to reorder exercises in your workout
          </DialogDescription>
        </DialogHeader>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto py-3">
          {reorderedExercises.length > 0 ? (
            <div className="space-y-3">
              {reorderedExercises.map((exercise, index) => (
                <ReorderableExercise
                  key={exercise.index}
                  exercise={exercise}
                  index={index}
                  totalExercises={reorderedExercises.length}
                  onMoveUp={moveExerciseUp}
                  onMoveDown={moveExerciseDown}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No exercises in current workout
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex-shrink-0 pt-3">
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            
            {hasChanges && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="flex-1 text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
            
            <Button
              onClick={handleSaveReorder}
              disabled={!hasChanges}
              className={cn(
                "flex-1",
                hasChanges 
                  ? "bg-primary hover:bg-primary/90" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              {hasChanges ? 'Save Order' : 'No Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ExerciseReorderModal.displayName = 'ExerciseReorderModal';
