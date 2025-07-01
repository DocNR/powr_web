'use client';

/**
 * WorkoutCard Component
 * 
 * Multiple variants for different contexts: Hero, Social, Discovery, Compact.
 * Supports NIP-101e workout templates and records with beautiful design.
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/powr-ui/primitives/Avatar';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import { cn } from '@/lib/utils';

// Workout data types
interface WorkoutTemplate {
  id: string;
  title: string;
  description?: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
  estimatedDuration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
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

interface WorkoutRecord {
  id: string;
  title: string;
  completedAt: Date;
  duration: number; // minutes
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: number;
      weight: number;
      rpe?: number;
    }>;
  }>;
  author: {
    pubkey: string;
    name?: string;
    picture?: string;
  };
  notes?: string;
  // Nostr event data
  eventId?: string;
  eventTags?: string[][];
  eventContent?: string;
  eventKind?: number;
}

type WorkoutCardVariant = 'hero' | 'social' | 'discovery' | 'compact' | 'recommended' | 'list' | 'table';

interface WorkoutCardProps {
  variant?: WorkoutCardVariant;
  workout: WorkoutTemplate | WorkoutRecord;
  onSelect?: (workoutId: string) => void;
  onAuthorClick?: (pubkey: string) => void;
  className?: string;
  showImage?: boolean;
  showAuthor?: boolean;
  showStats?: boolean;
}

// Type guards
function isWorkoutRecord(workout: WorkoutTemplate | WorkoutRecord): workout is WorkoutRecord {
  return 'completedAt' in workout;
}

function isWorkoutTemplate(workout: WorkoutTemplate | WorkoutRecord): workout is WorkoutTemplate {
  return 'estimatedDuration' in workout;
}

export const WorkoutCard = memo(function WorkoutCard({
  variant = 'discovery',
  workout,
  onSelect,
  onAuthorClick,
  className,
  showImage = true,
  showAuthor = true,
  showStats = true
}: WorkoutCardProps) {
  const isRecord = isWorkoutRecord(workout);
  const isTemplate = isWorkoutTemplate(workout);

  // Calculate stats
  const exerciseCount = isRecord 
    ? workout.exercises.length 
    : workout.exercises.length;
  
  const totalSets = isRecord
    ? workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    : workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  const duration = isRecord ? workout.duration : workout.estimatedDuration;

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
    onSelect?.(workout.id);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const author = isRecord ? workout.author : workout.author;
    if (author) {
      onAuthorClick?.(author.pubkey);
    }
  };

  // Hero variant - large featured card
  if (variant === 'hero') {
    return (
      <Card 
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
          "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
          "w-full", // Ensure full width without max-w-none
          className
        )}
        onClick={handleCardClick}
      >
        {/* POWR WOD Badge */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            POWR WOD
          </div>
        </div>

        {/* Image */}
        {showImage && (
          <div className="relative h-24 md:h-32 w-full">
            <WorkoutImageHandler
              tags={workout.eventTags}
              content={workout.eventContent}
              eventKind={workout.eventKind}
              alt={workout.title}
              width={600}
              height={200}
              className="w-full h-full object-cover"
              priority={true}
              lazy={false}
            />
          </div>
        )}

        <CardContent className="p-3 md:p-4">
          {/* Title and Description */}
          <div className="mb-2 md:mb-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-1">
              {workout.title}
            </h2>
            {isTemplate && workout.description && (
              <p className="text-sm text-gray-600 line-clamp-1">
                {workout.description}
              </p>
            )}
            {isRecord && workout.notes && (
              <p className="text-sm text-gray-600 line-clamp-1">
                {workout.notes}
              </p>
            )}
          </div>

          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-base md:text-lg font-bold text-orange-600">{exerciseCount}</div>
                <div className="text-xs text-gray-500">Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-base md:text-lg font-bold text-orange-600">{duration}m</div>
                <div className="text-xs text-gray-500">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-base md:text-lg font-bold text-orange-600">{totalSets}</div>
                <div className="text-xs text-gray-500">Sets</div>
              </div>
            </div>
          )}

          {/* Difficulty Badge */}
          {isTemplate && (
            <div className="mb-3">
              <span className={cn(
                "inline-block px-2 py-1 rounded-full text-xs font-medium",
                getDifficultyColor(workout.difficulty)
              )}>
                {workout.difficulty}
              </span>
            </div>
          )}

          {/* Action Button */}
          <Button 
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 text-sm md:text-base shadow-lg min-h-[44px]"
            onClick={handleCardClick}
          >
            {isRecord ? 'View Workout' : 'Start Workout'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Social variant - workout records with author info
  if (variant === 'social') {
    const author = isRecord ? workout.author : workout.author;
    
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:bg-gray-50",
          className
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          {/* Author Info */}
          {showAuthor && author && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={handleAuthorClick}>
                <AvatarImage src={author.picture} alt={author.name || 'User'} />
                <AvatarFallback>{author.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {author.name || `${author.pubkey.slice(0, 8)}...`}
                </div>
                {isRecord && (
                  <div className="text-xs text-gray-500">
                    {workout.completedAt.toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight">
            {workout.title}
          </h3>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Image */}
          {showImage && (
            <div className="relative h-32 w-full mb-3 rounded-lg overflow-hidden">
              <WorkoutImageHandler
                tags={workout.eventTags}
                content={workout.eventContent}
                eventKind={workout.eventKind}
                alt={workout.title}
                width={400}
                height={200}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Stats */}
          {showStats && (
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>{exerciseCount} exercises</span>
              <span>{duration}m</span>
              <span>{totalSets} sets</span>
            </div>
          )}

          {/* Notes/Description */}
          {isRecord && workout.notes && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {workout.notes}
            </p>
          )}
          {isTemplate && workout.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {workout.description}
            </p>
          )}

          {/* Action */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            {isRecord ? 'View Details' : 'Use Template'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Discovery variant - template browsing
  if (variant === 'discovery') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:shadow-lg hover:border-orange-200",
          className
        )}
        onClick={handleCardClick}
      >
        {/* Image */}
        {showImage && (
          <div className="relative h-40 w-full">
            <WorkoutImageHandler
              tags={workout.eventTags}
              content={workout.eventContent}
              eventKind={workout.eventKind}
              alt={workout.title}
              width={400}
              height={240}
              className="w-full h-full rounded-t-lg"
            />
          </div>
        )}

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
            {workout.title}
          </h3>

          {/* Stats */}
          {showStats && (
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>{exerciseCount} exercises</span>
              <span>{duration}m</span>
              {isTemplate && (
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  getDifficultyColor(workout.difficulty)
                )}>
                  {workout.difficulty}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {isTemplate && workout.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {workout.description}
            </p>
          )}

          {/* Action Button */}
          <Button 
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            size="sm"
          >
            Start Workout
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Recommended variant - compact hero card matching mockup
  if (variant === 'recommended') {
    return (
      <Card 
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
          className
        )}
        onClick={handleCardClick}
      >
        {/* AI Coach Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            AI Coach recommends
          </div>
        </div>

        {/* Heart Icon */}
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Image */}
        {showImage && (
          <div className="relative h-32 w-full">
            <WorkoutImageHandler
              tags={workout.eventTags}
              content={workout.eventContent}
              eventKind={workout.eventKind}
              alt={workout.title}
              width={600}
              height={200}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardContent className="p-4">
          {/* Title */}
          <h2 className="text-lg font-bold text-white mb-2 line-clamp-1">
            {workout.title}
          </h2>

          {/* Stats */}
          {showStats && (
            <div className="flex items-center gap-4 text-sm text-white/90 mb-2">
              <span>{exerciseCount} exercises</span>
              <span>•</span>
              <span>{duration} min</span>
              <span>•</span>
              <span>{Math.round(duration * 8)} cal</span>
            </div>
          )}

          {/* Level and Rating */}
          {isTemplate && (
            <div className="flex items-center gap-4 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <span>Level:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        i <= (workout.difficulty === 'beginner' ? 1 : workout.difficulty === 'intermediate' ? 2 : 3)
                          ? "bg-orange-400" 
                          : "bg-white/30"
                      )}
                    />
                  ))}
                </div>
                <span className="capitalize">{workout.difficulty}</span>
              </div>
              <span>•</span>
              <span>Rating: 9.3</span>
            </div>
          )}
        </CardContent>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      </Card>
    );
  }

  // List variant - horizontal cards for discovery section
  if (variant === 'list') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:bg-gray-50 hover:border-orange-200",
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail Image */}
            {showImage && (
              <div className="relative h-16 w-16 flex-shrink-0">
                <WorkoutImageHandler
                  tags={workout.eventTags}
                  content={workout.eventContent}
                  eventKind={workout.eventKind}
                  alt={workout.title}
                  width={64}
                  height={64}
                  className="w-full h-full rounded-lg object-cover"
                />
                {/* Small logo overlay */}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base line-clamp-1 mb-1">
                {workout.title}
              </h4>
              
              {showStats && (
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                  <span>{exerciseCount} exercises</span>
                  <span>•</span>
                  <span>{duration} min</span>
                  <span>•</span>
                  <span>{Math.round(duration * 8)} cal</span>
                </div>
              )}

              {/* Level and Rating */}
              {isTemplate && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>Level:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            i <= (workout.difficulty === 'beginner' ? 1 : workout.difficulty === 'intermediate' ? 2 : 3)
                              ? "bg-orange-400" 
                              : "bg-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="capitalize">{workout.difficulty}</span>
                  </div>
                  <span>•</span>
                  <span>Rating: 9.{Math.floor(Math.random() * 9) + 1}</span>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Table variant - compact table-style layout matching mockups
  if (variant === 'table') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:bg-gray-50 hover:border-orange-200",
          "h-16", // Fixed compact height
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-3 h-full">
          <div className="flex items-center gap-3 h-full">
            {/* Small Thumbnail */}
            {showImage && (
              <div className="relative h-10 w-10 flex-shrink-0">
                <WorkoutImageHandler
                  tags={workout.eventTags}
                  content={workout.eventContent}
                  eventKind={workout.eventKind}
                  alt={workout.title}
                  width={40}
                  height={40}
                  className="w-full h-full rounded object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-1 mb-0.5">
                {workout.title}
              </h4>
              
              {showStats && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{exerciseCount} exercises</span>
                  <span>•</span>
                  <span>{duration}m</span>
                  {isTemplate && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{workout.difficulty}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Compact Action */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-orange-600 hover:bg-orange-50 px-2 h-8"
            >
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant - list view
  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:bg-gray-50 hover:border-orange-200",
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Small Image */}
            {showImage && (
              <div className="relative h-16 w-16 flex-shrink-0">
                <WorkoutImageHandler
                  tags={workout.eventTags}
                  content={workout.eventContent}
                  eventKind={workout.eventKind}
                  alt={workout.title}
                  width={64}
                  height={64}
                  className="w-full h-full rounded-lg"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-base line-clamp-1 mb-1">
                {workout.title}
              </h4>
              
              {showStats && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{exerciseCount} exercises</span>
                  <span>•</span>
                  <span>{duration}m</span>
                  {isTemplate && (
                    <>
                      <span>•</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        getDifficultyColor(workout.difficulty)
                      )}>
                        {workout.difficulty}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action */}
            <Button 
              variant="outline" 
              size="sm"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              {isRecord ? 'View' : 'Start'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
});

WorkoutCard.displayName = 'WorkoutCard';
