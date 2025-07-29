/**
 * Workout History Detail Modal
 * 
 * Full-screen modal for viewing completed workout records with sharing functionality.
 * Follows the same UI patterns as WorkoutDetailModal and WorkoutSummaryModal.
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Share2, Copy, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { socialSharingService } from '@/lib/services/socialSharingService';
import type { ParsedWorkoutEvent } from '@/lib/services/dataParsingService';
import type { Exercise } from '@/lib/services/dependencyResolution';

interface WorkoutHistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: ParsedWorkoutEvent;
  resolvedExercises: Map<string, Exercise>;
}

export const WorkoutHistoryDetailModal: React.FC<WorkoutHistoryDetailModalProps> = ({
  isOpen,
  onClose,
  workout,
  resolvedExercises
}) => {
  const [isSharing, setIsSharing] = useState(false);

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    const totalVolume = workout.exercises.reduce((total, exercise) => {
      return total + (exercise.weight * exercise.reps);
    }, 0);

    const totalReps = workout.exercises.reduce((total, exercise) => {
      return total + exercise.reps;
    }, 0);

    const averageRPE = workout.exercises.length > 0 
      ? workout.exercises.reduce((total, exercise) => total + (exercise.rpe || 0), 0) / workout.exercises.length
      : 0;

    return {
      totalVolume,
      totalReps,
      averageRPE: averageRPE > 0 ? averageRPE : null,
      exerciseCount: workout.exercises.length,
      duration: workout.duration
    };
  }, [workout]);

  // Format duration for display
  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / (1000 * 60));
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Format date for display - ParsedWorkoutEvent.createdAt is already in milliseconds
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp); // No need to multiply by 1000
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display - ParsedWorkoutEvent.createdAt is already in milliseconds
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp); // No need to multiply by 1000
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle sharing functionality
  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Use the social sharing service methods that work with ParsedWorkoutEvent
      const shareText = socialSharingService.generateSocialShareText(workout);
      const shareUrl = socialSharingService.generateWorkoutRecordURL(workout);

      // Try native share API first
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `${workout.title} - POWR Workout`,
          text: shareText,
          url: shareUrl
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      // TODO: Add toast notification
      console.log('Workout shared to clipboard');

    } catch (error) {
      console.error('Failed to share workout:', error);
      // TODO: Add error toast
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = socialSharingService.generateWorkoutRecordURL(workout);
      await navigator.clipboard.writeText(shareUrl);
      // TODO: Add toast notification
      console.log('Link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      // TODO: Add error toast
    }
  };

  // Group exercises by name for better display
  const exerciseGroups = useMemo(() => {
    const groups = new Map<string, typeof workout.exercises>();
    
    workout.exercises.forEach(exercise => {
      const exerciseTemplate = resolvedExercises.get(exercise.exerciseRef);
      const exerciseName = exerciseTemplate?.name || 'Unknown Exercise';
      
      if (!groups.has(exerciseName)) {
        groups.set(exerciseName, []);
      }
      groups.get(exerciseName)!.push(exercise);
    });

    return groups;
  }, [workout.exercises, resolvedExercises]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{workout.title} - Workout Details</DialogTitle>
          <DialogDescription>
            Detailed view of completed workout with sharing options
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-full bg-background overflow-hidden pb-[env(safe-area-inset-bottom)] flex flex-col">
          {/* Header - Matches other modal patterns */}
          <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border flex-shrink-0">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-foreground hover:text-foreground/80"
              title="Back to workout log"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Title */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold">Workout Details</h2>
            </div>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              disabled={isSharing}
              className="text-foreground hover:text-foreground/80"
              title="Share workout"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-6 space-y-6">
              
              {/* Workout Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {workout.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(workout.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(workout.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Workout Stats */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Workout Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {formatDuration(workoutStats.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {workoutStats.exerciseCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Exercises</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {workoutStats.totalReps}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Reps</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {Math.round(workoutStats.totalVolume)} kg
                    </div>
                    <div className="text-sm text-muted-foreground">Total Volume</div>
                  </div>
                </div>

                {/* Optional average RPE */}
                {workoutStats.averageRPE && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {workoutStats.averageRPE.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Average RPE</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Exercise Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Exercises Completed</h3>
                
                <div className="space-y-4">
                  {Array.from(exerciseGroups.entries()).map(([exerciseName, sets]) => {
                    const exerciseTemplate = resolvedExercises.get(sets[0].exerciseRef);
                    const hasWeight = sets.some(set => set.weight > 0);
                    
                    return (
                      <div key={exerciseName} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg">{exerciseName}</h4>
                          <Badge variant="secondary">
                            {sets.length} set{sets.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        {/* Exercise equipment/description */}
                        {exerciseTemplate?.equipment && (
                          <p className="text-sm text-muted-foreground mb-3">
                            Equipment: {exerciseTemplate.equipment}
                          </p>
                        )}
                        
                        {/* Sets breakdown */}
                        <div className="space-y-2">
                          {sets.map((set, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                              <span className="font-medium">Set {index + 1}</span>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium">{set.reps} reps</span>
                                {hasWeight && (
                                  <span className="text-muted-foreground">
                                    {set.weight > 0 ? `${set.weight}kg` : 'bodyweight'}
                                  </span>
                                )}
                                {set.rpe && (
                                  <span className="text-muted-foreground">
                                    RPE {set.rpe}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Share Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Share This Workout</h3>
                
                <div className="p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your workout achievement with the community or save the link for your records.
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="flex-1 h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-black font-semibold text-base rounded-xl flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-5 w-5" />
                      {isSharing ? 'Sharing...' : 'Share Workout'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="h-12 px-6 flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
