'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Label } from '@/components/powr-ui/primitives/Label';
import { Check, Edit3 } from 'lucide-react';
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
  onEdit?: (setData: SetData) => void;
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
  onEdit,
  className
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

  const handleComplete = () => {
    const setData: SetData = {
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe: parseFloat(rpe) || 7,
      setType: defaultData?.setType || 'normal',
      completed: true
    };
    onComplete(setData);
  };

  const handleEdit = () => {
    if (onEdit && isCompleted) {
      const setData: SetData = {
        weight: parseFloat(weight) || 0,
        reps: parseInt(reps) || 0,
        rpe: parseFloat(rpe) || 7,
        setType: defaultData?.setType || 'normal',
        completed: false
      };
      onEdit(setData);
    }
  };

  const isValid = weight !== '' && reps !== '' && parseFloat(weight) >= 0 && parseInt(reps) > 0;

  // Display mode for completed sets
  if (isCompleted) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg",
        className
      )}>
        {/* Set Number */}
        <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-semibold flex-shrink-0">
          {setNumber}
        </div>

        {/* Previous Set Reference */}
        {previousSetData && (
          <div className="text-sm text-gray-500 min-w-0 flex-shrink-0">
            {previousSetData.weight > 0 ? `${previousSetData.weight} lb` : 'BW'} × {previousSetData.reps}
          </div>
        )}

        {/* Completed Values - Display Only */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="text-lg font-semibold text-gray-900">
            {parseFloat(weight) > 0 ? `${weight} lb` : 'BW'}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {reps} reps
          </div>
          {rpe && (
            <div className="text-sm text-gray-600">
              RPE {rpe}
            </div>
          )}
        </div>

        {/* Completion Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Check className="h-5 w-5 text-green-500" />
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Input mode for active/pending sets
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 border rounded-lg transition-colors",
      isActive ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200",
      className
    )}>
      {/* Set Number */}
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0",
        isActive ? "bg-orange-500 text-white" : "bg-gray-400 text-white"
      )}>
        {setNumber}
      </div>

      {/* Previous Set Reference */}
      {previousSetData && (
        <div className="text-sm text-gray-500 min-w-0 flex-shrink-0">
          {previousSetData.weight > 0 ? `${previousSetData.weight} lb` : 'BW'} × {previousSetData.reps}
        </div>
      )}

      {/* Weight Input */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <Label htmlFor={`weight-${setNumber}`} className="text-xs text-gray-600">
          Weight (lb)
        </Label>
        <Input
          id={`weight-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-12 text-lg font-semibold text-center border-gray-300 focus:border-orange-500"
          disabled={!isActive}
        />
      </div>

      {/* Reps Input */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <Label htmlFor={`reps-${setNumber}`} className="text-xs text-gray-600">
          Reps
        </Label>
        <Input
          id={`reps-${setNumber}`}
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="h-12 text-lg font-semibold text-center border-gray-300 focus:border-orange-500"
          disabled={!isActive}
        />
      </div>

      {/* RPE Input (Optional) */}
      <div className="flex flex-col gap-1 min-w-0 w-16 flex-shrink-0">
        <Label htmlFor={`rpe-${setNumber}`} className="text-xs text-gray-600">
          RPE
        </Label>
        <Input
          id={`rpe-${setNumber}`}
          type="number"
          inputMode="decimal"
          placeholder="7"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          min="1"
          max="10"
          step="0.5"
          className="h-12 text-sm font-semibold text-center border-gray-300 focus:border-orange-500"
          disabled={!isActive}
        />
      </div>

      {/* Complete Button */}
      {isActive && (
        <Button
          onClick={handleComplete}
          disabled={!isValid}
          variant={isValid ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-12 w-12 flex-shrink-0",
            isValid 
              ? "bg-green-500 hover:bg-green-600 text-white" 
              : "text-gray-400 border-gray-300"
          )}
        >
          <Check className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
