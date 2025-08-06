'use client';

/**
 * SupersetGroup Component
 * 
 * Visual container for grouped exercises in a superset with ordering indicators,
 * remove functionality, and clear visual grouping.
 */

import React, { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Link, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupersetGroupProps {
  groupId: string;
  exerciseNames: string[]; // Exercise names in superset order
  onRemoveSuperset: (groupId: string) => void;
  children: React.ReactNode; // ExerciseSection components
  className?: string;
}

export const SupersetGroup: React.FC<SupersetGroupProps> = ({
  groupId,
  exerciseNames,
  onRemoveSuperset,
  children,
  className
}) => {
  const [showBreakConfirmation, setShowBreakConfirmation] = useState(false);
  
  // Generate superset display text with arrows
  const supersetDisplayText = exerciseNames.join(' → ');

  const handleBreakSuperset = () => {
    onRemoveSuperset(groupId);
    setShowBreakConfirmation(false);
  };

  return (
    <div 
      className={cn(
        "relative border-l-4 border-workout-active bg-workout-active-bg/30 rounded-r-lg overflow-hidden",
        className
      )}
    >
      {/* Superset Header */}
      <div className="flex items-center justify-between p-3 bg-workout-active-bg border-b border-workout-active-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link className="h-4 w-4 text-workout-active flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="text-sm font-medium text-workout-active">
              Superset
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {supersetDisplayText}
            </div>
          </div>
        </div>
        
        {/* Remove Superset Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBreakConfirmation(true)}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
          title="Remove superset grouping"
        >
          <Unlink className="h-4 w-4" />
        </Button>
      </div>

      {/* Grouped Exercises */}
      <div className="space-y-2 p-2">
        {React.Children.map(children, (child, index) => (
          <div key={index} className="relative">
            {child}
            {/* Subtle divider between exercises (except last) */}
            {index < React.Children.count(children) - 1 && (
              <div className="absolute -bottom-1 left-4 right-4 h-px bg-workout-active-border/30" />
            )}
          </div>
        ))}
      </div>

      {/* Instructional Text */}
      <div className="px-3 pb-2">
        <div className="text-xs text-muted-foreground italic">
          Perform exercises back-to-back. Rest, then repeat.
        </div>
      </div>

      {/* Break Superset Confirmation Dialog */}
      <Dialog open={showBreakConfirmation} onOpenChange={setShowBreakConfirmation}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Break Superset?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              {supersetDisplayText}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBreakConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBreakSuperset}
            >
              Break Apart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

SupersetGroup.displayName = 'SupersetGroup';
