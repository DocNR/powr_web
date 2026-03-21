'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeightUnits } from '@/providers/WeightUnitsProvider';
import { 
  convertWeightForDisplay, 
  convertWeightForStorage, 
  convertWeightForFinalStorage,
  formatWeightDisplay,
  parseWeightInput 
} from '@/lib/utils/weightConversion';

interface SetData {
  weight: number; // Always stored in kg (NIP-101e compliant)
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
  // Keep only the props that are actually used
  exerciseIndex?: number;
  setIndex?: number;
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
  // Keep only used props
  exerciseIndex,
  setIndex,
  onSelectSet
}) => {
  const { weightUnit } = useWeightUnits();

  // NEW: Separate input state from stored weight to prevent conversion feedback loops
  const [weightInputValue, setWeightInputValue] = useState('');
  const [weightInKg, setWeightInKg] = useState(
    defaultData?.weight || previousSetData?.weight || 0
  );
  const [reps, setReps] = useState(
    defaultData?.reps?.toString() || previousSetData?.reps?.toString() || ''
  );
  const [rpe, setRpe] = useState(
    defaultData?.rpe?.toString() || previousSetData?.rpe?.toString() || '7'
  );
  const [completed, setCompleted] = useState(isCompleted);

  // Track if user has modified values to prevent overriding their input
  const [lastInitializedSetNumber, setLastInitializedSetNumber] = useState(setNumber);

  // Update completed state when prop changes
  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  // Initialize weight input display when switching sets or weight unit changes
  useEffect(() => {
    if (setNumber !== lastInitializedSetNumber && !isCompleted) {
      // Reset for new set
      const initialWeight = defaultData?.weight || previousSetData?.weight || 0;
      setWeightInKg(initialWeight);
      setReps(defaultData?.reps?.toString() || previousSetData?.reps?.toString() || '');
      setRpe(defaultData?.rpe?.toString() || previousSetData?.rpe?.toString() || '7');
      setLastInitializedSetNumber(setNumber);
      
      // Set input display value
      if (initialWeight === 0) {
        setWeightInputValue('');
      } else {
        const displayWeight = convertWeightForDisplay(initialWeight, weightUnit);
        setWeightInputValue(displayWeight.toString());
      }
    }
  }, [setNumber, lastInitializedSetNumber, defaultData, previousSetData, isCompleted, weightUnit]);

  // Update weight input display when weight unit changes (but keep user's input if they're typing)
  useEffect(() => {
    if (weightInKg > 0 && weightInputValue === '') {
      const displayWeight = convertWeightForDisplay(weightInKg, weightUnit);
      setWeightInputValue(displayWeight.toString());
    }
  }, [weightUnit, weightInKg, weightInputValue]);

  // Enhanced input handlers - no real-time conversion, just input validation
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty, numbers, decimal points, and negative sign at start
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setWeightInputValue(value);
      // Only update stored weight for validation, no rounding yet
      const parsedWeight = parseWeightInput(value);
      const weightInKgValue = convertWeightForStorage(parsedWeight, weightUnit);
      setWeightInKg(weightInKgValue);
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

  // Handle completion and uncompletion
  const handleComplete = () => {
    if (completed) {
      // Uncomplete the set - use current stored weight (no rounding)
      const setData: SetData = {
        weight: weightInKg, // Current stored weight in kg
        reps: parseInt(reps) || 0,
        rpe: parseFloat(rpe) || 7,
        setType: defaultData?.setType || 'normal',
        completed: false
      };

      setCompleted(false);
      onComplete(setData);
    } else {
      // Complete the set - apply final storage rounding for NIP-101e compliance
      const parsedWeight = parseWeightInput(weightInputValue);
      const finalWeight = convertWeightForFinalStorage(parsedWeight, weightUnit);
      
      const setData: SetData = {
        weight: finalWeight, // Rounded weight for final storage
        reps: parseInt(reps) || 0,
        rpe: parseFloat(rpe) || 7,
        setType: defaultData?.setType || 'normal',
        completed: true
      };

      // Update internal state to match final storage
      setWeightInKg(finalWeight);
      setCompleted(true);
      onComplete(setData);
    }
  };

  // NEW: Handle clicking on the set row to select it
  const handleSetClick = () => {
    if (onSelectSet && exerciseIndex !== undefined && setIndex !== undefined) {
      onSelectSet(exerciseIndex, setIndex);
    }
  };

  // IMPROVED: More forgiving validation logic using weightInputValue
  const isWeightValid = () => {
    // Allow empty string (user is typing) or valid numbers (including negative)
    if (weightInputValue === '') return true; // Allow empty while typing
    const weightNum = parseFloat(weightInputValue);
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

  // Format previous set data for display with weight unit conversion
  const formatPreviousSetData = (data: SetData | undefined): string => {
    if (!data) return '---';
    
    const weightDisplay = formatWeightDisplay(data.weight, weightUnit);
    return `${weightDisplay} × ${data.reps}`;
  };

  // Display mode for completed sets - Compact mobile-optimized layout
  if (completed) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-1 bg-[var(--color-surface-card)] transition-colors cursor-pointer rounded-[var(--radius)]",
          className
        )}
        onClick={handleComplete}
      >
        {/* Set Number */}
        <div className="flex items-center justify-center w-8 h-8 bg-[var(--color-secondary)] text-white rounded-full text-sm font-[var(--font-numeric)] font-medium flex-shrink-0">
          {setNumber}
        </div>

        {/* Previous Set Reference */}
        <div className="w-16 flex items-center justify-center text-xs text-[var(--color-on-surface-variant)] font-[var(--font-numeric)] flex-shrink-0">
          {formatPreviousSetData(previousSetData)}
        </div>

        {/* Completed Weight */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <span className="text-base font-medium text-[var(--color-on-surface)] font-[var(--font-numeric)]">
            {formatWeightDisplay(weightInKg, weightUnit)}
          </span>
        </div>

        {/* Completed Reps */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <span className="text-base font-medium text-[var(--color-on-surface)] font-[var(--font-numeric)]">
            {reps}
          </span>
        </div>

        {/* Completed RPE */}
        <div className="w-12 flex-shrink-0 flex items-center justify-center">
          <span className="text-base font-medium text-[var(--color-on-surface)] font-[var(--font-numeric)]">
            {rpe}
          </span>
        </div>

        {/* Completed Checkbox */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 flex items-center justify-center rounded-[var(--radius)] bg-[var(--color-secondary)] text-white cursor-pointer hover:bg-[var(--color-secondary)]/80 transition-colors">
            <Check className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  // Input mode for incomplete sets - Compact mobile-optimized layout
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-1 transition-all duration-200 cursor-pointer rounded-[var(--radius)]",
        isActive
          ? "bg-[var(--color-surface-elevated)] shadow-[0_0_0_1px_rgba(255,145,83,0.3)]"
          : "bg-[var(--color-surface-card)] opacity-40",
        className
      )}
      onClick={handleSetClick}
    >
      {/* Set Number */}
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-[var(--font-numeric)] font-medium flex-shrink-0",
        isActive
          ? "bg-[var(--color-primary)] text-[#0e0e0e]"
          : "bg-[var(--color-surface-elevated)] text-[var(--color-on-surface-variant)]"
      )}>
        {setNumber}
      </div>

      {/* Previous Set Reference */}
      <div className="w-16 flex items-center justify-center text-xs text-[var(--color-on-surface-variant)] font-[var(--font-numeric)] flex-shrink-0">
        {formatPreviousSetData(previousSetData)}
      </div>

      {/* Weight Input */}
      <div className="flex-1 min-w-0">
        <Input
          id={`weight-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder={weightInKg === 0 ? 'BW' : '0'}
          value={weightInputValue}
          onChange={handleWeightChange}
          onFocus={handleSetClick}
          className={cn(
            "h-10 text-base font-medium text-center bg-[var(--color-surface-elevated)] rounded-[var(--radius)] font-[var(--font-numeric)]",
            isActive && "text-[var(--color-primary)]",
            !isWeightValid() && "ring-1 ring-[var(--color-error)]"
          )}
        />
      </div>

      {/* Reps Input */}
      <div className="flex-1 min-w-0">
        <Input
          id={`reps-${setNumber}`}
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={reps}
          onChange={handleRepsChange}
          onFocus={handleSetClick}
          className={cn(
            "h-10 text-base font-medium text-center bg-[var(--color-surface-elevated)] rounded-[var(--radius)] font-[var(--font-numeric)]",
            isActive && "text-[var(--color-primary)]",
            !isRepsValid() && reps !== '' && "ring-1 ring-[var(--color-error)]"
          )}
        />
      </div>

      {/* RPE Input */}
      <div className="w-12 flex-shrink-0">
        <Input
          id={`rpe-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder="7"
          value={rpe}
          onChange={handleRpeChange}
          onFocus={handleSetClick}
          min="1"
          max="10"
          step="0.5"
          className={cn(
            "h-10 text-base font-medium text-center bg-[var(--color-surface-elevated)] rounded-[var(--radius)] font-[var(--font-numeric)]",
            isActive && "text-[var(--color-primary)]",
            !isRpeValid() && rpe !== '' && "ring-1 ring-[var(--color-error)]"
          )}
        />
      </div>

      {/* Checkbox */}
      <div className="flex-shrink-0">
        <button
          onClick={canComplete ? handleComplete : undefined}
          disabled={!canComplete}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-[var(--radius)] transition-all duration-200",
            canComplete
              ? "bg-[rgba(255,145,83,0.1)] text-[var(--color-primary)] hover:bg-[rgba(255,145,83,0.2)] cursor-pointer"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-on-surface-variant)] cursor-not-allowed opacity-50"
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
