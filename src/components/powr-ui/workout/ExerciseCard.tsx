'use client';

/**
 * ExerciseCard Component
 * 
 * Reusable card component for displaying exercise templates with click handling.
 * Follows the same patterns as WorkoutCard for consistency and accessibility.
 */

import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/powr-ui/primitives/Avatar';
import { useProfile, getDisplayName, getAvatarUrl } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

// Exercise data types
interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  equipment: string;
  muscleGroups: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: {
    pubkey: string;
    name?: string;
    picture?: string;
  };
  // Nostr event data
  eventId?: string;
  eventTags?: string[][];
  eventContent?: string;
  eventKind?: number;
}

type ExerciseCardVariant = 'discovery' | 'compact' | 'list';

interface ExerciseCardProps {
  variant?: ExerciseCardVariant;
  exercise: ExerciseTemplate;
  onSelect?: (exerciseId: string) => void;
  onMenuAction?: (action: string, exerciseId: string) => void;
  className?: string;
  showAuthor?: boolean;
  showEquipment?: boolean;
}

export const ExerciseCard = memo(function ExerciseCard({
  variant = 'discovery',
  exercise,
  onSelect,
  onMenuAction,
  className,
  showAuthor = true,
  showEquipment = true
}: ExerciseCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Get author data
  const author = exercise.author;
  const { profile: authorProfile } = useProfile(author?.pubkey);
  const authorDisplayName = getDisplayName(authorProfile, author?.pubkey);
  const authorAvatar = getAvatarUrl(authorProfile, author?.pubkey);

  // Get difficulty color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = () => {
    onSelect?.(exercise.id);
  };

  // Discovery variant - main library browsing
  if (variant === 'discovery') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:shadow-lg hover:ring-2 hover:ring-ring",
          "active:scale-[0.98] active:ring-2 active:ring-ring",
          "focus:ring-2 focus:ring-ring focus:outline-none",
          className
        )}
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with exercise name */}
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {exercise.name}
              </h3>
              
              {showEquipment && (
                <div className="text-sm text-muted-foreground">
                  {exercise.equipment}
                </div>
              )}
            </div>
            
            {/* Description */}
            {exercise.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {exercise.description}
              </p>
            )}

            {/* Muscle groups */}
            <div className="flex flex-wrap gap-1">
              {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                <span key={muscle} className="px-2 py-1 bg-muted rounded text-xs">
                  {muscle}
                </span>
              ))}
              {exercise.muscleGroups.length > 3 && (
                <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                  +{exercise.muscleGroups.length - 3} more
                </span>
              )}
            </div>

            {/* Footer with author and difficulty */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {showAuthor && author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={authorAvatar} alt={authorDisplayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {authorDisplayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>by {authorDisplayName}</span>
                </div>
              )}
              
              {exercise.difficulty && (
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  getDifficultyColor(exercise.difficulty)
                )}>
                  {exercise.difficulty}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List variant - compact horizontal layout
  if (variant === 'list') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:bg-gray-50 hover:border-orange-200 hover:ring-2 hover:ring-ring",
          "active:ring-2 active:ring-ring",
          "focus:ring-2 focus:ring-ring focus:outline-none",
          className
        )}
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base line-clamp-1 mb-1">
                {exercise.name}
              </h4>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                {showEquipment && (
                  <>
                    <span>{exercise.equipment}</span>
                    <span>•</span>
                  </>
                )}
                <span>{exercise.muscleGroups.slice(0, 2).join(', ')}</span>
                {exercise.muscleGroups.length > 2 && (
                  <span className="text-muted-foreground">+{exercise.muscleGroups.length - 2}</span>
                )}
              </div>

              {showAuthor && author && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-3 w-3">
                    <AvatarImage src={authorAvatar} alt={authorDisplayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {authorDisplayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>by {authorDisplayName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {exercise.difficulty && (
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  getDifficultyColor(exercise.difficulty)
                )}>
                  {exercise.difficulty}
                </span>
              )}
              
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant with menu functionality
  if (variant === 'compact') {
    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
    };

    const handleMenuAction = (action: string) => {
      setShowMenu(false);
      onMenuAction?.(action, exercise.id);
    };

    return (
      <div className="relative">
        <Card 
          className={cn(
            "p-3 cursor-pointer transition-all duration-200",
            "border border-border",
            "hover:shadow-lg hover:shadow-ring/20 hover:border-ring",
            "active:scale-[0.98] active:shadow-lg active:shadow-ring/20 active:border-ring",
            "focus:shadow-lg focus:shadow-ring/20 focus:border-ring focus:outline-none",
            className
          )}
          onClick={handleCardClick}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick();
            }
          }}
        >
          <div className="flex items-center gap-3">
            {/* Exercise Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {exercise.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exercise.equipment} • {exercise.muscleGroups.slice(0, 2).join(', ')}
                    {exercise.muscleGroups.length > 2 && ` +${exercise.muscleGroups.length - 2}`}
                  </p>
                </div>

                {/* Menu Button */}
                {onMenuAction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                    onClick={handleMenuClick}
                  >
                    <span className="text-muted-foreground">⋯</span>
                  </Button>
                )}
              </div>

              {/* Author info */}
              {showAuthor && author && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={authorAvatar} alt={authorDisplayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {authorDisplayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">by {authorDisplayName}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Dropdown Menu */}
        {showMenu && onMenuAction && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 bottom-full mb-1 z-50 w-48 bg-background border border-border rounded-md shadow-lg">
              <div className="py-1">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => handleMenuAction('details')}
                >
                  📋 View Details
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => handleMenuAction('library')}
                >
                  📚 Add to Library
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => handleMenuAction('copy')}
                >
                  🔗 Copy naddr
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => handleMenuAction('share')}
                >
                  📤 Share
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
});

ExerciseCard.displayName = 'ExerciseCard';
