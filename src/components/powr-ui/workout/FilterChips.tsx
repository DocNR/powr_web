'use client';

/**
 * FilterChips Component
 * 
 * Horizontal scrollable filter chips for workout discovery.
 * Matches mockup design with rounded chips and selection states.
 */

import { Button } from '@/components/powr-ui/primitives/Button';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterChipsProps {
  filters: FilterOption[];
  selectedFilters: string[];
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export function FilterChips({
  filters,
  selectedFilters,
  onFilterChange,
  className
}: FilterChipsProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {filters.map((filter) => {
        const isSelected = selectedFilters.includes(filter.id);
        
        return (
          <Button
            key={filter.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              "min-h-[44px] touch-manipulation", // Ensure 44px touch target
              isSelected
                ? "bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-orange-300 hover:text-orange-600"
            )}
          >
            {filter.icon && (
              <span className="mr-2">{filter.icon}</span>
            )}
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}

// Predefined filter options for workout discovery
export const workoutFilters: FilterOption[] = [
  {
    id: 'whole-body',
    label: 'Whole body',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  {
    id: 'chest',
    label: 'Chest'
  },
  {
    id: 'back',
    label: 'Back'
  },
  {
    id: 'shoulders',
    label: 'Shoulders'
  },
  {
    id: 'arms',
    label: 'Arms'
  },
  {
    id: 'legs',
    label: 'Legs'
  },
  {
    id: 'core',
    label: 'Core'
  }
];

export const durationFilters: FilterOption[] = [
  {
    id: 'any',
    label: 'Any',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: '15min',
    label: '15 min'
  },
  {
    id: '30min',
    label: '30 min'
  },
  {
    id: '45min',
    label: '45 min'
  },
  {
    id: '60min',
    label: '60+ min'
  }
];
