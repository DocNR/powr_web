/**
 * ExerciseListView Component
 * 
 * Mobile-optimized list view for exercise library.
 * Spotify-style design with equipment icons and full-width layout.
 * Uses the same menu pattern as ExerciseCard for consistency.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { Button } from '@/components/powr-ui/primitives/Button';
import { MoreVertical, Eye, Trash2, Copy, Share, Dumbbell } from 'lucide-react';
import type { ExerciseLibraryItem } from '@/hooks/useLibraryDataWithCollections';

interface ExerciseListViewProps {
  exercises: ExerciseLibraryItem[];
  isInLibrary: (exerciseRef: string) => boolean;
  onAdd: (exerciseRef: string) => void;
  onRemove: (exerciseRef: string) => void;
  onMenuAction: (action: string, exerciseId: string) => void;
  onExerciseClick?: (exerciseId: string) => void;
  isLoading?: boolean;
}

// Equipment icon mapping
const getEquipmentIcon = (equipment: string | undefined): string | null => {
  if (!equipment) return null;
  
  const equipmentLower = equipment.toLowerCase();
  
  if (equipmentLower.includes('barbell')) {
    return '/assets/barbell.svg';
  }
  if (equipmentLower.includes('dumbbell') || equipmentLower.includes('dumbell')) {
    return '/assets/dumbbells.svg';
  }
  if (equipmentLower.includes('kettlebell')) {
    return '/assets/kettlebell.svg';
  }
  if (equipmentLower.includes('bodyweight') || equipmentLower.includes('body weight') || equipmentLower === 'none') {
    return '/assets/bodyweight.svg';
  }
  
  // Add more mappings as we get more icons
  return null;
};

export function ExerciseListView({ 
  exercises, 
  isInLibrary, 
  onAdd, 
  onRemove, 
  onMenuAction,
  onExerciseClick,
  isLoading = false 
}: ExerciseListViewProps) {
  if (isLoading) {
    return <ExerciseListSkeleton />;
  }

  if (exercises.length === 0) {
    return <ExerciseListEmpty />;
  }

  return (
    <div className="space-y-0">
      {exercises.map((exercise) => (
        <ExerciseListItem
          key={exercise.exerciseRef}
          exercise={exercise}
          isInLibrary={isInLibrary(exercise.exerciseRef)}
          onAdd={onAdd}
          onRemove={onRemove}
          onMenuAction={onMenuAction}
          onExerciseClick={onExerciseClick}
        />
      ))}
    </div>
  );
}

interface ExerciseListItemProps {
  exercise: ExerciseLibraryItem;
  isInLibrary: boolean;
  onAdd: (exerciseRef: string) => void;
  onRemove: (exerciseRef: string) => void;
  onMenuAction: (action: string, exerciseId: string) => void;
  onExerciseClick?: (exerciseId: string) => void;
}

function ExerciseListItem({ 
  exercise, 
  isInLibrary, 
  onMenuAction,
  onExerciseClick
}: ExerciseListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const equipmentIcon = getEquipmentIcon(exercise.exercise.equipment);

  const handleExerciseClick = () => {
    onExerciseClick?.(exercise.exercise.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    onMenuAction(action, exercise.exercise.id);
  };

  return (
    <div className="relative">
      <div 
        className="py-2 transition-colors cursor-pointer hover:bg-muted/50"
        onClick={handleExerciseClick}
      >
        <div className="px-4 flex items-center gap-3">
        {/* Equipment Icon - Spotify "Album Cover" equivalent */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-workout-surface rounded-md">
          {equipmentIcon ? (
            <Image
              src={equipmentIcon}
              alt={exercise.exercise.equipment || 'Exercise'}
              width={equipmentIcon === '/assets/bodyweight.svg' ? 32 : 24}
              height={equipmentIcon === '/assets/bodyweight.svg' ? 32 : 24}
              className={`${equipmentIcon === '/assets/bodyweight.svg' ? "w-8 h-8" : "w-6 h-6"} brightness-0 invert-0`}
              style={{
                filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'
              }}
            />
          ) : (
            // Fallback icon for exercises without specific equipment icons
            <Dumbbell className="w-5 h-5 text-workout-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-foreground">
            {exercise.exercise.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1 overflow-hidden">
            <span className="text-sm text-muted-foreground flex-shrink-0">
              {exercise.exercise.equipment || 'General'}
            </span>
            {/* Show primary muscle group with truncation */}
            {exercise.exercise.muscleGroups && exercise.exercise.muscleGroups.length > 0 && (
              <>
                <span className="text-muted-foreground flex-shrink-0">•</span>
                <span className="text-xs text-muted-foreground min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {exercise.exercise.muscleGroups[0]}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center space-x-2 ml-3">
          {/* "In Library" badge */}
          {isInLibrary && (
            <Badge size="sm" variant="success" className="text-xs">
              In Library
            </Badge>
          )}
          
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleMenuClick}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </div>

      {/* Enhanced Dropdown Menu with improved styling */}
      {showMenu && (
        <>
          {/* Enhanced Backdrop */}
          <div 
            className="dropdown-backdrop"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Enhanced Menu */}
          <div className="dropdown-menu absolute right-4 top-12 w-48">
            <div className="py-1">
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('details')}
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('remove')}
              >
                <Trash2 className="h-4 w-4" />
                Remove from Library
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('copy')}
              >
                <Copy className="h-4 w-4" />
                Copy naddr
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleMenuAction('share')}
              >
                <Share className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ExerciseListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="py-3">
          <div className="px-4 flex items-center gap-3">
            {/* Icon skeleton */}
            <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md"></div>
            
            {/* Content skeleton */}
            <div className="flex-1">
              <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            
            {/* Actions skeleton */}
            <div className="flex space-x-2">
              <div className="h-8 w-16 bg-muted rounded"></div>
              <div className="h-8 w-8 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExerciseListEmpty() {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground mb-2">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">No exercises found</h3>
      <p className="text-muted-foreground">Try adjusting your search or filters</p>
    </div>
  );
}
