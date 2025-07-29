/**
 * Workout History Detail Modal
 * 
 * Full-screen modal for viewing completed workout records with sharing functionality.
 * Follows the same UI patterns as WorkoutDetailModal and WorkoutSummaryModal.
 * 
 * Phase 2 Implementation: Uses ProcessedWorkoutData from WorkoutAnalyticsService
 * - Pure display component - no business logic
 * - Timeline view showing chronological exercise progression
 * - Exercise summary section with grouped statistics
 * - Template attribution with NADDR sharing
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
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard';
import { socialSharingService } from '@/lib/services/socialSharingService';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import type { ProcessedWorkoutData } from '@/lib/services/workoutAnalytics';
import type { ParsedWorkoutEvent } from '@/lib/services/dataParsingService';


interface WorkoutHistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedWorkout: ProcessedWorkoutData;
}

export const WorkoutHistoryDetailModal: React.FC<WorkoutHistoryDetailModalProps> = ({
  isOpen,
  onClose,
  processedWorkout
}) => {
  const [isSharing, setIsSharing] = useState(false);

  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle sharing functionality
  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Create a ParsedWorkoutEvent object for sharing service compatibility
      const workoutForSharing: ParsedWorkoutEvent = {
        id: processedWorkout.eventId,
        eventId: processedWorkout.eventId,
        title: processedWorkout.title,
        description: '', // Not available in ProcessedWorkoutData
        authorPubkey: processedWorkout.authorPubkey,
        createdAt: processedWorkout.createdAt,
        startTime: processedWorkout.createdAt,
        endTime: processedWorkout.createdAt + Math.floor(processedWorkout.stats.duration / 1000),
        duration: Math.floor(processedWorkout.stats.duration / 1000), // Convert to seconds
        workoutType: 'strength', // Default type
        completed: true, // Workout is completed since it's in history
        tags: [['t', 'fitness']], // Basic tags
        exercises: processedWorkout.timeline.map(entry => ({
          exerciseRef: entry.exerciseRef,
          reps: entry.reps,
          weight: entry.weight,
          rpe: entry.rpe,
          setType: entry.setType || 'normal',
          setNumber: entry.setNumber
        }))
      };

      const shareText = socialSharingService.generateSocialShareText(workoutForSharing);
      const shareUrl = socialSharingService.generateWorkoutRecordURL(workoutForSharing);

      // Try native share API first
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `${processedWorkout.title} - POWR Workout`,
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
      // Create a ParsedWorkoutEvent-like object for sharing service compatibility
      const workoutForSharing = {
        eventId: processedWorkout.eventId,
        authorPubkey: processedWorkout.authorPubkey
      };
      
      const shareUrl = socialSharingService.generateWorkoutRecordURL(workoutForSharing as ParsedWorkoutEvent);
      await navigator.clipboard.writeText(shareUrl);
      // TODO: Add toast notification
      console.log('Link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      // TODO: Add error toast
    }
  };

  // Transform template data to WorkoutCard format (same as GlobalWorkoutSearch)
  const templateCardData = useMemo(() => {
    if (!processedWorkout.template) return null;

    // Extract template reference parts
    const templateRef = processedWorkout.template.reference;
    const [, authorPubkey, templateId] = templateRef.split(':');

    return {
      id: templateId,
      title: processedWorkout.template.name || 'Workout Template',
      description: '', // Template description not available in ProcessedWorkoutData
      exercises: processedWorkout.exerciseSummary.map((exercise) => ({
        name: exercise.exerciseName,
        sets: exercise.totalSets,
        reps: Math.round(exercise.totalReps / exercise.totalSets), // Average reps per set
        weight: 0 // We don't have template weight data
      })),
      estimatedDuration: Math.round(processedWorkout.stats.duration / 60), // Convert to minutes
      difficulty: 'intermediate' as const,
      tags: ['fitness'],
      author: {
        pubkey: authorPubkey,
        name: processedWorkout.template.authorName || authorPubkey.slice(0, 8) + '...',
        picture: undefined
      },
      eventId: `${authorPubkey}-${templateId}`,
      eventTags: [
        ['d', templateId],
        ['title', processedWorkout.template.name || 'Workout Template'],
        ['t', 'fitness']
      ],
      eventContent: '', // Template content not available in ProcessedWorkoutData
      eventKind: 33402
    };
  }, [processedWorkout.template, processedWorkout.exerciseSummary, processedWorkout.stats.duration]);

  // Handle template card selection (opens WorkoutDetailModal)
  const handleTemplateSelect = (templateId: string) => {
    // TODO: Implement WorkoutDetailModal opening
    console.log('Template selected:', templateId);
    // This would open the WorkoutDetailModal with the template data
  };

  // Handle template menu actions
  const handleTemplateMenuAction = (action: string, templateId: string) => {
    switch (action) {
      case 'details':
        handleTemplateSelect(templateId);
        break;
      case 'copy':
        handleCopyTemplateNADDR();
        break;
      case 'share':
        // TODO: Implement template sharing
        console.log('Share template:', templateId);
        break;
      case 'library':
        // TODO: Implement add to library
        console.log('Add to library:', templateId);
        break;
      default:
        console.log('Unknown template action:', action);
    }
  };

  // Handle template NADDR copying
  const handleCopyTemplateNADDR = async () => {
    if (!processedWorkout.template) return;
    
    try {
      const result = await socialSharingService.copyTemplateNaddr(processedWorkout.template.reference);
      
      if (result.success) {
        console.log('Template NADDR copied to clipboard');
        // TODO: Add success toast notification
      } else {
        console.error('Failed to copy template NADDR:', result.error);
        // TODO: Add error toast notification
      }
    } catch (error) {
      console.error('Failed to copy template NADDR:', error);
      // TODO: Add error toast notification
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{processedWorkout.title} - Workout Details</DialogTitle>
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
                  {processedWorkout.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(processedWorkout.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(processedWorkout.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Workout Stats - Using processed data */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Workout Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {workoutAnalyticsService.formatDuration(processedWorkout.stats.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {processedWorkout.stats.exerciseCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Exercises</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {processedWorkout.stats.totalReps}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Reps</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {Math.round(processedWorkout.stats.totalVolume)} kg
                    </div>
                    <div className="text-sm text-muted-foreground">Total Volume</div>
                  </div>
                </div>

                {/* Optional average RPE */}
                {processedWorkout.stats.averageRPE && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {processedWorkout.stats.averageRPE.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Average RPE</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline View - Phase 2 Implementation */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Workout Timeline</h3>
                
                <div className="space-y-3">
                  {processedWorkout.timeline.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-card border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{entry.exerciseName}</h4>
                          <p className="text-sm text-muted-foreground">Set {entry.setNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{entry.reps} reps</span>
                        <span className="text-muted-foreground">{entry.displayWeight}</span>
                        {entry.displayRPE && (
                          <span className="text-muted-foreground">{entry.displayRPE}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exercise Summary - Using processed data */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Exercise Summary</h3>
                
                <div className="space-y-4">
                  {processedWorkout.exerciseSummary.map((exercise, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{exercise.exerciseName}</h4>
                        <Badge variant="secondary">
                          {exercise.totalSets} set{exercise.totalSets > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Reps: </span>
                          <span className="font-medium">{exercise.totalReps}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight: </span>
                          <span className="font-medium">{exercise.weightRange}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volume: </span>
                          <span className="font-medium">{Math.round(exercise.totalVolume)} kg</span>
                        </div>
                        {exercise.averageRPE && (
                          <div>
                            <span className="text-muted-foreground">Avg RPE: </span>
                            <span className="font-medium">{exercise.averageRPE.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Attribution - Phase 3 Implementation with WorkoutCard */}
              {processedWorkout.template && templateCardData && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Workout Template</h3>
                  
                  <WorkoutCard
                    variant="compact"
                    workout={templateCardData}
                    onSelect={handleTemplateSelect}
                    onMenuAction={handleTemplateMenuAction}
                    showAuthor={true}
                    showImage={true}
                    showStats={true}
                  />
                </div>
              )}

              {/* Share Section - Simplified */}
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
