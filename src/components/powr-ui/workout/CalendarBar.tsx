'use client';

/**
 * CalendarBar Component
 * 
 * Horizontal 7-day calendar matching mockup design with orange checkmarks,
 * "Today" header, and navigation arrows. Optimized for mobile touch interaction.
 */

import { useState } from 'react';
import { format, addDays, subDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { Button } from '@/components/powr-ui/primitives/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutIndicator {
  date: Date;
  count: number;
  type: 'completed' | 'scheduled';
}

interface CalendarBarProps {
  selectedDate: Date;
  workoutIndicators?: WorkoutIndicator[];
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function CalendarBar({
  selectedDate,
  workoutIndicators = [],
  onDateSelect,
  className
}: CalendarBarProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate));

  // Generate 7 days starting from current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeek(subDays(currentWeek, 7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  // Get workout indicator for a specific date
  const getWorkoutIndicator = (date: Date) => {
    return workoutIndicators.find(indicator => isSameDay(indicator.date, date));
  };

  return (
    <div className={cn("bg-black text-white", className)}>
      {/* Header with "Today" and navigation */}
      <div className="flex items-center justify-between px-3 py-3 md:px-4 md:py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousWeek}
          className="h-8 w-8 md:h-10 md:w-10 p-0 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        
        <div className="text-center">
          <h2 className="text-lg md:text-xl font-bold text-white">
            Today
          </h2>
          <p className="text-xs md:text-sm text-gray-400">
            {format(selectedDate, 'EEEE, d MMMM')}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextWeek}
          className="h-8 w-8 md:h-10 md:w-10 p-0 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </div>

      {/* Days of the week */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3 md:px-4 md:pb-4 max-w-full overflow-hidden">
        {weekDays.map((date, index) => {
          const isCurrentDay = isToday(date);
          const workoutIndicator = getWorkoutIndicator(date);
          
          return (
            <div key={index} className="flex flex-col items-center">
              {/* Day letter */}
              <div className="text-xs text-gray-400 mb-1 md:mb-2 font-medium">
                {format(date, 'EEEEE')}
              </div>
              
              {/* Date circle */}
              <button
                onClick={() => onDateSelect(date)}
                className={cn(
                  "relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  "touch-manipulation", // Touch-friendly without fixed min-width
                  isCurrentDay
                    ? "border-2 border-orange-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                {/* Date number */}
                <span className="text-sm md:text-base font-medium">
                  {format(date, 'd')}
                </span>
                
                {/* Orange checkmark for completed workouts */}
                {workoutIndicator && workoutIndicator.type === 'completed' && (
                  <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
