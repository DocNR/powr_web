'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
  setType?: 'warmup' | 'normal' | 'drop' | 'failure';
  completed?: boolean;
}

interface SetRowProps {
  setNumber: number;
  previousSetData?: SetData;
  defaultData?: SetData;
  isCompleted?: boolean;
  isActive?: boolean;
  onComplete: (setData: SetData) => void;
  className?: string;
  // NEW: Flexible set interaction props
  exerciseRef?: string;
  exerciseIndex?: number;
  setIndex?: number;
  onCompleteSpecific?: (exerciseRef: string, setNumber: number, setData: SetData) => void;
  onUncompleteSpecific?: (exerciseRef: string, setNumber: number) => void;
  onEditCompleted?: (exerciseRef: string, setNumber: number, field: string, value: string | number) => void;
  onSelectSet?: (exerciseIndex: number, setIndex: number) => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  previousSetData,
  defaultData,
  isCompleted = false,
  isActive = false,
  onComplete,
  className,
  // NEW: Flexible set interaction props
  exerciseRef,
  exerciseIndex,
  setIndex,
  onCompleteSpecific,
  onUncompleteSpecific,
  onEditCompleted,
  onSelectSet
}) => {
  // Initialize with default data or previous set data
  const [weight, setWeight] = useState(
    defaultData?.weight?.toString() || previousSetData?.weight?.toString() || ''
  );
  const [reps, setReps] = useState(
    defaultData?.reps?.toString() || previousSetData?.reps?.toString() || ''
  );
  const [rpe, setRpe] = useState(
    defaultData?.rpe?.toString() || previousSetData?.rpe?.toString() || '7'
  );

  // Track if user has modified values to prevent overriding their input
  const [lastInitializedSetNumber, setLastInitializedSetNumber] = useState(setNumber);

  // Only update inputs when switching to a different set, not when user is actively editing
  useEffect(() => {
    // Only initialize values if:
    // 1. We're switching to a different set number (user navigated to different set)
    // 2. The set is not completed (completed sets have their own editing logic)
    if (setNumber !== lastInitializedSetNumber && !isCompleted) {
      // Reset for new set
      setWeight(defaultData?.weight?.toString() || previousSetData?.weight?.toString() || '');
      setReps(defaultData?.reps?.toString() || previousSetData?.reps?.toString() || '');
      setRpe(defaultData?.rpe?.toString() || previousSetData?.rpe?.toString() || '7');
      setLastInitializedSetNumber(setNumber);
    }
  }, [setNumber, lastInitializedSetNumber, defaultData, previousSetData, isCompleted]);

  // Enhanced input handlers to prevent invalid characters and improve UX
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty, numbers, decimal points, and negative sign at start
    // This regex allows: empty string, negative numbers, decimals
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setWeight(value);
    }
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers for reps (no decimals, no negatives)
    if (value === '' || /^\d+$/.test(value)) {
      setReps(value);
    }
  };

  const handleRpeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow RPE values with decimals (like 7.5)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setRpe(value);
    }
  };

  // NEW: Flexible set interaction handlers
  const handleComplete = () => {
    const setData: SetData = {
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe: parseFloat(rpe) || 7,
      setType: defaultData?.setType || 'normal',
      completed: true
    };

    // Use flexible interaction if available, otherwise fallback to legacy
    if (onCompleteSpecific && exerciseRef) {
      onCompleteSpecific(exerciseRef, setNumber, setData);
    } else {
      onComplete(setData);
    }
  };

  // NEW: Handle clicking on the set row to select it
  const handleSetClick = () => {
    if (onSelectSet && exerciseIndex !== undefined && setIndex !== undefined) {
      onSelectSet(exerciseIndex, setIndex);
    }
  };

  // NEW: Handle uncompleting a set
  const handleUncomplete = () => {
    if (onUncompleteSpecific && exerciseRef) {
      onUncompleteSpecific(exerciseRef, setNumber);
    }
  };

  // NEW: Handle direct editing of completed set fields
  const handleFieldEdit = (field: string, value: string | number) => {
    if (onEditCompleted && exerciseRef) {
      onEditCompleted(exerciseRef, setNumber, field, value);
    }
  };

  // IMPROVED: More forgiving validation logic
  const isWeightValid = () => {
    // Allow empty string (user is typing) or valid numbers (including negative)
    if (weight === '') return true; // Allow empty while typing
    const weightNum = parseFloat(weight);
    return !isNaN(weightNum); // Any valid number including negative
  };

  const isRepsValid = () => {
    // Require at least 1 rep for completion
    if (reps === '') return false; // Must have reps to complete
    const repsNum = parseInt(reps);
    return !isNaN(repsNum) && repsNum > 0;
  };

  const isRpeValid = () => {
    // RPE is optional, but if provided must be valid
    if (rpe === '') return true; // Empty RPE is okay
    const rpeNum = parseFloat(rpe);
    return !isNaN(rpeNum) && rpeNum >= 1 && rpeNum <= 10;
  };

  // FIXED: Complete validation - for completion, we need actual values (not just valid)
  const canComplete = reps !== '' && parseInt(reps) > 0 && isWeightValid() && isRpeValid();

  // Display mode for completed sets - Compact mobile-optimized layout
  if (isCompleted) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-1 bg-workout-success-bg/50 transition-colors",
          isActive && "ring-1 ring-workout-success",
          className
        )}
        onClick={handleSetClick}
      >
        {/* Set Number - Smaller circle */}
        <div className="flex items-center justify-center w-8 h-8 bg-workout-success text-white rounded-full text-sm font-medium flex-shrink-0">
          {setNumber}
        </div>

        {/* Previous Set Reference - Compact */}
        <div className="w-16 flex items-center justify-center text-xs text-workout-text flex-shrink-0">
          {previousSetData 
            ? (previousSetData.weight > 0 ? `${previousSetData.weight}` : 'BW') + ` × ${previousSetData.reps}`
            : '---'
          }
        </div>

        {/* Editable Weight - Compact */}
        <div className="flex-1 min-w-0">
          <Input
            id={`completed-weight-${setNumber}`}
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => {
              handleWeightChange(e);
              if (onEditCompleted && exerciseRef) {
                handleFieldEdit('weight', parseFloat(e.target.value) || 0);
              }
            }}
            onFocus={handleSetClick}
            className="h-10 text-base font-medium text-center bg-transparent border-0 focus:ring-1 focus:ring-workout-success rounded"
          />
        </div>

        {/* Editable Reps - Compact */}
        <div className="flex-1 min-w-0">
          <Input
            id={`completed-reps-${setNumber}`}
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => {
              handleRepsChange(e);
              if (onEditCompleted && exerciseRef) {
                handleFieldEdit('reps', parseInt(e.target.value) || 0);
              }
            }}
            onFocus={handleSetClick}
            className="h-10 text-base font-medium text-center bg-transparent border-0 focus:ring-1 focus:ring-workout-success rounded"
          />
        </div>

        {/* Editable RPE - Compact */}
        <div className="w-12 flex-shrink-0">
          <Input
            id={`completed-rpe-${setNumber}`}
            type="number"
            inputMode="decimal"
            value={rpe}
            onChange={(e) => {
              handleRpeChange(e);
              if (onEditCompleted && exerciseRef) {
                handleFieldEdit('rpe', parseFloat(e.target.value) || 7);
              }
            }}
            onFocus={handleSetClick}
            min="1"
            max="10"
            step="0.5"
            className="h-10 text-base font-medium text-center bg-transparent border-0 focus:ring-1 focus:ring-workout-success rounded"
          />
        </div>

        {/* Filled Checkbox for Completed Sets - Compact */}
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering handleSetClick
              handleUncomplete();
            }}
            className="h-10 w-10 flex items-center justify-center rounded border border-workout-success bg-workout-success text-white hover:bg-workout-success/90 transition-colors"
            title="Click to uncomplete set"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Input mode for incomplete sets - Compact mobile-optimized layout
  return (
    <div 
      className={cn(
        "flex items-center gap-2 py-2 px-1 transition-all duration-200 cursor-pointer",
        "hover:bg-muted/20",
        className
      )}
      onClick={handleSetClick}
    >
      {/* Set Number - Smaller circle */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium bg-muted text-muted-foreground flex-shrink-0">
        {setNumber}
      </div>

      {/* Previous Set Reference - Compact */}
      <div className="w-16 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
        {previousSetData 
          ? (previousSetData.weight > 0 ? `${previousSetData.weight}` : 'BW') + ` × ${previousSetData.reps}`
          : '---'
        }
      </div>

      {/* Weight Input - Compact */}
      <div className="flex-1 min-w-0">
        <Input
          id={`weight-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={weight}
          onChange={handleWeightChange}  // Use enhanced handler
          onFocus={handleSetClick}
          className={cn(
            "h-10 text-base font-medium text-center bg-transparent border-0 focus:ring-1 focus:ring-ring rounded",
            !isWeightValid() && "ring-1 ring-red-300" // Visual feedback for invalid weight
          )}
        />
      </div>

      {/* Reps Input - Compact */}
      <div className="flex-1 min-w-0">
        <Input
          id={`reps-${setNumber}`}
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={reps}
          onChange={handleRepsChange}  // Use enhanced handler
          onFocus={handleSetClick}
          className={cn(
            "h-10 text-base font-medium text-center bg-transparent border-0 focus:ring-1 focus:ring-ring rounded",
            !isRepsValid() && reps !== '' && "ring-1 ring-red-300" // Visual feedback for invalid reps
          )}
        />
      </div>

      {/* RPE Input - Compact */}
      <div className="w-12 flex-shrink-0">
        <Input
          id={`rpe-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder="7"
          value={rpe}
          onChange={handleRpeChange}  // Use enhanced handler
          onFocus={handleSetClick}
          min="1"
          max="10"
          step="0.5"
          className={cn(
            "h-10 text-base font-medium text-center bg-transparent border-0 focus:ring-1 focus:ring-ring rounded",
            !isRpeValid() && rpe !== '' && "ring-1 ring-red-300" // Visual feedback for invalid RPE
          )}
        />
      </div>

      {/* Checkbox - Compact */}
      <div className="flex-shrink-0">
        <button
          onClick={canComplete ? handleComplete : undefined}
          disabled={!canComplete}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded border transition-all duration-200",
            canComplete 
              ? "border-ring bg-transparent text-ring hover:bg-ring/10 cursor-pointer" 
              : "border-border bg-transparent text-muted-foreground cursor-not-allowed opacity-50"
          )}
          title={
            canComplete 
              ? "Complete set" 
              : reps === '' 
                ? "Enter reps to complete"
                : !isWeightValid()
                  ? "Enter valid weight"
                  : !isRpeValid()
                    ? "Enter valid RPE (1-10)"
                    : "Complete the form to continue"
          }
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};