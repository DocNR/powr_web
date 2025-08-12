/**
 * ActionButton Component
 * 
 * Reusable button for add/remove actions in library components.
 * Shows different states based on whether item is already in library.
 */

import React from 'react';
import { Button } from './Button';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  isInLibrary: boolean;
  onAdd: () => void;
  onRemove: () => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'ghost';
  className?: string;
}

export function ActionButton({ 
  isInLibrary, 
  onAdd, 
  onRemove, 
  size = 'sm',
  variant = 'default',
  className = ''
}: ActionButtonProps) {
  if (isInLibrary) {
    return (
      <Button
        size={size}
        variant="ghost"
        onClick={onRemove}
        className={cn(
          "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/30",
          className
        )}
      >
        <Check className="w-4 h-4" />
        {size !== 'icon' && <span className="ml-1">Added</span>}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={onAdd}
      className={className}
    >
      <Plus className="w-4 h-4" />
      {size !== 'icon' && <span className="ml-1">Add</span>}
    </Button>
  );
}
