/**
 * WorkoutDescription Component
 * 
 * Displays workout description with truncation and expand functionality.
 * Provides visual context for what workout the user is performing.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutDescriptionProps {
  description: string;
  maxLines?: number;
  expandable?: boolean;
  className?: string;
}

export function WorkoutDescription({ 
  description, 
  maxLines = 2, 
  expandable = true,
  className 
}: WorkoutDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) {
    return null;
  }

  // Simple line estimation - more accurate would require measuring text
  const estimatedLines = Math.ceil(description.length / 50); // Rough estimate
  const shouldTruncate = estimatedLines > maxLines && !isExpanded;
  const canExpand = expandable && estimatedLines > maxLines;

  return (
    <div className={cn("space-y-2", className)}>
      <p 
        className={cn(
          "text-sm text-muted-foreground leading-relaxed",
          shouldTruncate && "line-clamp-2"
        )}
      >
        {description}
      </p>
      
      {canExpand && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default WorkoutDescription;
