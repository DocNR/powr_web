'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Label } from '@/components/powr-ui/primitives/Label';
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

  // Update inputs when defaultData changes (from machine context)
  useEffect(() => {
    if (defaultData && !isCompleted) {
      setWeight(defaultData.weight?.toString() || '');
      setReps(defaultData.reps?.toString() || '');
      setRpe(defaultData.rpe?.toString() || '7');
    }
  }, [defaultData, isCompleted]);

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

  const isValid = weight !== '' && reps !== '' && parseFloat(weight) >= 0 && parseInt(reps) > 0;

  // Display mode for completed sets - NOW FULLY EDITABLE
  if (isCompleted) {
    return (
      <div 
        className={cn(
          "flex items-start gap-3 p-3 bg-workout-success-bg border border-workout-success-border rounded-lg transition-colors",
          isActive && "ring-2 ring-workout-active-border ring-offset-2",
          className
        )}
        onClick={handleSetClick}
      >
        {/* Set Number - Perfect Circle */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div className="h-4"></div> {/* Spacer to align with label height */}
          <div className="flex items-center justify-center w-12 h-12 bg-workout-success text-white rounded-full text-sm font-semibold">
            {setNumber}
          </div>
        </div>

        {/* Previous Set Reference - Fixed width for consistent layout */}
        <div className="flex flex-col gap-1 w-20 flex-shrink-0">
          <div className="h-4"></div> {/* Spacer to align with label height */}
          <div className="h-12 flex items-center justify-center text-sm text-workout-text">
            {previousSetData 
              ? (previousSetData.weight > 0 ? `${previousSetData.weight} lb` : 'BW') + ` × ${previousSetData.reps}`
              : '---'
            }
          </div>
        </div>

        {/* Editable Weight */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <Label htmlFor={`completed-weight-${setNumber}`} className="text-xs text-workout-text">
            lbs
          </Label>
          <Input
            id={`completed-weight-${setNumber}`}
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              if (onEditCompleted && exerciseRef) {
                handleFieldEdit('weight', parseFloat(e.target.value) || 0);
              }
            }}
            onFocus={handleSetClick}
            className="h-12 text-lg font-semibold text-center bg-workout-surface border-workout-success-border focus:border-workout-success focus:ring-0"
          />
        </div>

        {/* Editable Reps */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <Label htmlFor={`completed-reps-${setNumber}`} className="text-xs text-[var(--workout-text)]">
            Reps
          </Label>
          <Input
            id={`completed-reps-${setNumber}`}
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => {
              setReps(e.target.value);
              if (onEditCompleted && exerciseRef) {
                handleFieldEdit('reps', parseInt(e.target.value) || 0);
              }
            }}
            onFocus={handleSetClick}
            className="h-12 text-lg font-semibold text-center bg-[var(--workout-surface)] border-[var(--workout-success-border)] focus:border-[var(--workout-success)]"
          />
        </div>

        {/* Editable RPE */}
        <div className="flex flex-col gap-1 min-w-0 w-16 flex-shrink-0">
          <Label htmlFor={`completed-rpe-${setNumber}`} className="text-xs text-[var(--workout-text)]">
            RPE
          </Label>
          <Input
            id={`completed-rpe-${setNumber}`}
            type="number"
            inputMode="decimal"
            value={rpe}
            onChange={(e) => {
              setRpe(e.target.value);
              if (onEditCompleted && exerciseRef) {
                handleFieldEdit('rpe', parseFloat(e.target.value) || 7);
              }
            }}
            onFocus={handleSetClick}
            min="1"
            max="10"
            step="0.5"
            className="h-12 text-lg font-semibold text-center bg-[var(--workout-surface)] border-[var(--workout-success-border)] focus:border-[var(--workout-success)]"
          />
        </div>

        {/* Filled Checkbox for Completed Sets - Aligned with inputs */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div className="h-4"></div> {/* Spacer to align with label height */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering handleSetClick
              handleUncomplete();
            }}
            className="h-12 w-12 flex items-center justify-center rounded border-2 border-[var(--workout-success)] bg-[var(--workout-success)] text-white hover:bg-[var(--workout-success)]/90 transition-colors"
            title="Click to uncomplete set"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // Input mode for incomplete sets - SIMPLIFIED: All incomplete sets look the same
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 cursor-pointer",
        "bg-[var(--workout-surface)] border-border hover:border-ring",
        className
      )}
      onClick={handleSetClick}
    >
      {/* Set Number - Perfect Circle - All incomplete sets use same neutral gray styling */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <div className="h-4"></div> {/* Spacer to align with label height */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold bg-muted-foreground text-white">
          {setNumber}
        </div>
      </div>

      {/* Previous Set Reference - Fixed width for consistent layout */}
      <div className="flex flex-col gap-1 w-20 flex-shrink-0">
        <div className="h-4"></div> {/* Spacer to align with label height */}
        <div className="h-12 flex items-center justify-center text-sm text-[var(--workout-text)]">
          {previousSetData 
            ? (previousSetData.weight > 0 ? `${previousSetData.weight} lb` : 'BW') + ` × ${previousSetData.reps}`
            : '---'
          }
        </div>
      </div>

      {/* Weight Input - Simplified: All inputs use same styling, focus provides the visual feedback */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <Label htmlFor={`weight-${setNumber}`} className="text-xs text-[var(--workout-text)]">
          lbs
        </Label>
        <Input
          id={`weight-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onFocus={handleSetClick}
          className="h-12 text-lg font-semibold text-center bg-[var(--workout-surface)] border-border focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200"
        />
      </div>

      {/* Reps Input - Simplified: All inputs use same styling, focus provides the visual feedback */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <Label htmlFor={`reps-${setNumber}`} className="text-xs text-[var(--workout-text)]">
          Reps
        </Label>
        <Input
          id={`reps-${setNumber}`}
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onFocus={handleSetClick}
          className="h-12 text-lg font-semibold text-center bg-[var(--workout-surface)] border-border focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200"
        />
      </div>

      {/* RPE Input - Simplified: All inputs use same styling, focus provides the visual feedback */}
      <div className="flex flex-col gap-1 min-w-0 w-16 flex-shrink-0">
        <Label htmlFor={`rpe-${setNumber}`} className="text-xs text-[var(--workout-text)]">
          RPE
        </Label>
        <Input
          id={`rpe-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder="7"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          onFocus={handleSetClick}
          min="1"
          max="10"
          step="0.5"
          className="h-12 text-lg font-semibold text-center bg-[var(--workout-surface)] border-border focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200"
        />
      </div>

      {/* Checkbox - Simplified: Clear valid/invalid states with subtle completion animation */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <div className="h-4"></div> {/* Spacer to align with label height */}
        <button
          onClick={isValid ? handleComplete : undefined}
          disabled={!isValid}
          className={cn(
            "h-12 w-12 flex items-center justify-center rounded border-2 transition-all duration-200",
            isValid 
              ? "border-[var(--workout-success)] bg-[var(--workout-surface)] text-[var(--workout-success)] hover:bg-[var(--workout-success)]/10 hover:scale-105 cursor-pointer" 
              : "border-border bg-[var(--workout-surface)] text-muted-foreground cursor-not-allowed opacity-50"
          )}
          title={isValid ? "Complete set" : "Fill in weight and reps to complete"}
        >
          <Check className={cn("h-5 w-5 transition-transform duration-200", isValid && "scale-110")} />
        </button>
      </div>
    </div>
  );
};
