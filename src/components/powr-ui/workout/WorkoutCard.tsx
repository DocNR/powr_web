'use client';

/**
 * WorkoutCard Component
 * 
 * Multiple variants for different contexts: Hero, Social, Discovery, Compact.
 * Supports NIP-101e workout templates and records with beautiful design.
 * Now includes social proof support for template-focused social feed.
 */

import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/powr-ui/primitives/Avatar';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import { useProfile, getDisplayName, getAvatarUrl } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { MoreVertical, Play, Trash2, Eye, Copy, Share } from 'lucide-react';

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
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Made optional
  tags?: string[];
  author?: {
    pubkey: string;
    name?: string;
    picture?: string;
  };
  // ✅ NEW: Social proof for template-focused social feed
  socialProof?: {
    triedBy: string;
    triedByPubkey?: string;
    completedAt: Date;
    workoutRecordId?: string;
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

type WorkoutCardVariant = 'hero' | 'social' | 'discovery' | 'compact' | 'list' | 'table';

interface WorkoutCardProps {
  variant?: WorkoutCardVariant;
  workout: WorkoutTemplate | WorkoutRecord;
  onSelect?: (workoutId: string) => void;
  onAuthorClick?: (pubkey: string) => void;
  onMenuAction?: (action: string, workoutId: string) => void;
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
  onMenuAction,
  className,
  showImage = true,
  showAuthor = true,
  showStats = true
}: WorkoutCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isRecord = isWorkoutRecord(workout);
  const isTemplate = isWorkoutTemplate(workout);

  // Get author and social proof data
  const author = isRecord ? workout.author : workout.author;
  const socialProof = isTemplate ? workout.socialProof : null;
  
  // Profile hooks - must be called at top level
  const { profile: socialProofProfile } = useProfile(socialProof?.triedByPubkey);
  const socialProofDisplayName = getDisplayName(socialProofProfile, socialProof?.triedByPubkey);
  const socialProofAvatar = getAvatarUrl(socialProofProfile, socialProof?.triedByPubkey);
  
  const { profile: authorProfile } = useProfile(author?.pubkey);
  const authorDisplayName = getDisplayName(authorProfile, author?.pubkey);
  const authorAvatar = getAvatarUrl(authorProfile, author?.pubkey);

  // Calculate stats
  const exerciseCount = isRecord 
    ? workout.exercises.length 
    : workout.exercises.length;
  
  const duration = isRecord ? workout.duration : workout.estimatedDuration;

  // Get difficulty color - handle undefined
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get difficulty level number for dots - handle undefined
  const getDifficultyLevel = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 1;
      case 'intermediate': return 2;
      case 'advanced': return 3;
      default: return 2; // Default to intermediate
    }
  };

  // Get difficulty display name - handle undefined
  const getDifficultyDisplay = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'Low';
      case 'intermediate': return 'Medium';
      case 'advanced': return 'High';
      default: return 'Medium';
    }
  };

  const handleCardClick = () => {
    onSelect?.(workout.id);
  };

  // Hero variant - large featured card matching mockup
  if (variant === 'hero') {
    return (
      <Card 
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02] hover:ring-2 hover:ring-workout-active-border",
          "active:scale-[0.98] active:ring-2 active:ring-workout-active-border",
          "focus:ring-2 focus:ring-workout-active-border focus:outline-none",
          "w-full",
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
        {/* POWR WOD Badge */}
        <div className="absolute top-3 left-3 z-20">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            POWR WOD
          </div>
        </div>

        {/* Heart Icon */}
        <div className="absolute top-3 right-3 z-20">
          <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Image */}
        {showImage && (
          <div className="relative h-48 md:h-56 w-full">
            <WorkoutImageHandler
              tags={workout.eventTags}
              content={workout.eventContent}
              eventKind={workout.eventKind}
              alt={workout.title}
              width={600}
              height={300}
              className="w-full h-full object-cover"
              priority={true}
              lazy={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h2 className="text-xl font-bold mb-2 line-clamp-1">
            {workout.title}
          </h2>

          {showStats && (
            <div className="flex items-center gap-3 text-sm mb-2">
              <span>{exerciseCount} exercises</span>
              <span>•</span>
              <span>{duration} min</span>
              <span>•</span>
              <span>{Math.round(duration * 8)} cal</span>
            </div>
          )}

          {isTemplate && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span>Level:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        i <= getDifficultyLevel(workout.difficulty)
                          ? "bg-orange-400" 
                          : "bg-white/30"
                      )}
                    />
                  ))}
                </div>
                <span>{getDifficultyDisplay(workout.difficulty)}</span>
              </div>
              <span>•</span>
              <span>Rating: 9.3</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ✅ UPDATED: Social variant - now shows templates with social proof
  if (variant === 'social') {

    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 h-full flex flex-col",
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
        
        {/* Image with overlays */}
        {showImage && (
          <div className="relative h-48 w-full flex-shrink-0">
            <WorkoutImageHandler
              tags={workout.eventTags}
              content={workout.eventContent}
              eventKind={workout.eventKind}
              alt={workout.title}
              fill={true}
              className="w-full h-full object-cover rounded-t-lg"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
            
            {/* ✅ UPDATED: Social Proof Badge with real user data and avatar */}
            {socialProof && (
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-2 bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={socialProofAvatar} alt={socialProofDisplayName} />
                    <AvatarFallback className="bg-white/20 text-white text-xs">
                      {socialProofDisplayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white/90">Tried by</span>
                  <span className="font-semibold">{socialProofDisplayName}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content below image - flex-1 to fill remaining space with uniform height */}
        <CardContent className="p-4 flex-1 flex flex-col min-h-[140px]">
          {/* Title with wrapping - no fixed height to prevent gaps */}
          <h3 className="font-bold text-xl mb-1 line-clamp-2 leading-tight">
            {workout.title}
          </h3>

          {/* Author info with avatar - show template creator with real profile data */}
          {author && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={authorAvatar} alt={authorDisplayName} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {authorDisplayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>by {authorDisplayName}</span>
            </div>
          )}

          {/* Real metrics instead of hardcoded stats */}
          {showStats && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1.5">
              <span>{exerciseCount} exercises</span>
              <span>•</span>
              <span>{workout.exercises.reduce((total, ex) => {
                const setCount = Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 0);
                return total + setCount;
              }, 0)} sets</span>
              <span>•</span>
              <span>{duration} min</span>
            </div>
          )}

          {/* Keep the social proof completion date - push to bottom */}
          {socialProof && (
            <div className="text-xs text-muted-foreground mt-auto flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed {socialProof.completedAt.toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Discovery variant - template browsing with menu functionality
  if (variant === 'discovery') {
    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
    };

    const handleMenuAction = (action: string) => {
      setShowMenu(false);
      // ✅ FIX: Pass the workout ID, let the parent component handle the reference format
      onMenuAction?.(action, workout.id);
    };

    return (
      <div className="relative group">
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
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg line-clamp-1 flex-1 pr-2">
                {workout.title}
              </h3>
              
              {/* Menu Button - appears on hover/focus */}
              {onMenuAction && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex-shrink-0"
                  onClick={handleMenuClick}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showStats && (
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                  <span>{exerciseCount} exercises</span>
                  <span>•</span>
                  <span>{workout.exercises.reduce((total, ex) => {
                    const setCount = Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 0);
                    return total + setCount;
                  }, 0)} sets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{duration}m</span>
                  {isTemplate && (
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      getDifficultyColor(workout.difficulty)
                    )}>
                      {workout.difficulty || 'intermediate'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isTemplate && workout.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {workout.description}
              </p>
            )}
          </CardContent>
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
            <div className="absolute right-0 top-12 z-50 w-48 bg-background border border-border rounded-md shadow-lg">
              <div className="py-1">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  onClick={() => handleMenuAction('start')}
                >
                  <Play className="h-4 w-4" />
                  Start Workout
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  onClick={() => handleMenuAction('details')}
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2 text-destructive"
                  onClick={() => handleMenuAction('remove')}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from Library
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  onClick={() => handleMenuAction('copy')}
                >
                  <Copy className="h-4 w-4" />
                  Copy naddr
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
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

  // List variant (unchanged but with difficulty handling)
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
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base line-clamp-1 mb-1">
                {workout.title}
              </h4>
              
              {showStats && (
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                  <span>{exerciseCount} exercises</span>
                  <span>•</span>
                  <span>{workout.exercises.reduce((total, ex) => {
                    const setCount = Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 0);
                    return total + setCount;
                  }, 0)} sets</span>
                  <span>•</span>
                  <span>{duration} min</span>
                </div>
              )}

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
                            i <= getDifficultyLevel(workout.difficulty)
                              ? "bg-orange-400" 
                              : "bg-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="capitalize">{workout.difficulty || 'intermediate'}</span>
                  </div>
                  <span>•</span>
                  <span>Rating: 9.{Math.floor(Math.random() * 9) + 1}</span>
                </div>
              )}
            </div>

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

  // Table variant (unchanged but with difficulty handling)
  if (variant === 'table') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:bg-gray-50 hover:border-orange-200 hover:ring-2 hover:ring-ring",
          "active:ring-2 active:ring-ring",
          "focus:ring-2 focus:ring-ring focus:outline-none",
          "h-16",
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
        <CardContent className="p-3 h-full">
          <div className="flex items-center gap-3 h-full">
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

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-1 mb-0.5">
                {workout.title}
              </h4>
              
              {showStats && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{exerciseCount} exercises</span>
                  <span>•</span>
                  <span>{workout.exercises.reduce((total, ex) => {
                    const setCount = Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 0);
                    return total + setCount;
                  }, 0)} sets</span>
                  <span>•</span>
                  <span>{duration}m</span>
                  {isTemplate && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{workout.difficulty || 'intermediate'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

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

  // Compact variant with menu functionality (like CompactWorkoutCard)
  if (variant === 'compact') {
    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
    };

    const handleMenuAction = (action: string) => {
      setShowMenu(false);
      // ✅ FIX: Pass the workout ID, let the parent component handle the reference format
      onMenuAction?.(action, workout.id);
    };

    const formatDuration = (minutes: number) => {
      if (minutes < 60) {
        return `${minutes} min`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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
            {/* Workout Image/Icon */}
            {showImage && (
              <div className="flex-shrink-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                  <WorkoutImageHandler
                    tags={workout.eventTags}
                    eventKind={workout.eventKind}
                    fill={true}
                    className="w-full h-full"
                    alt={`${workout.title} workout`}
                  />
                </div>
              </div>
            )}

            {/* Workout Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {workout.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exerciseCount} exercises • {workout.exercises.reduce((total, ex) => {
                      const setCount = Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 0);
                      return total + setCount;
                    }, 0)} sets • {formatDuration(duration)}
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

              {/* Author info with avatar - replacing difficulty badge */}
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

WorkoutCard.displayName = 'WorkoutCard';
