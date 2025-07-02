'use client';

/**
 * FilterButton Component
 * 
 * Filter button for workout discovery section matching the mockup design.
 * Shows filter type and current selection with proper styling.
 */

import { Button } from '@/components/powr-ui/primitives/Button';
import { cn } from '@/lib/utils';

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  className?: string;
}

export function FilterButton({ 
  icon, 
  label, 
  value, 
  onClick, 
  className 
}: FilterButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 h-auto",
        "bg-gray-800 border-gray-700 text-white",
        "hover:bg-gray-700 hover:border-gray-600",
        "justify-start text-left",
        className
      )}
    >
      <span className="text-gray-400">{icon}</span>
      <div className="flex flex-col items-start">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
    </Button>
  );
}
