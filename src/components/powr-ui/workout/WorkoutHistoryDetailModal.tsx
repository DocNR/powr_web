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

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Copy, Calendar, Clock } from 'lucide-react';
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
import { showSuccessToast, showErrorToast } from '@/components/powr-ui/primitives/Toast';
import type { ProcessedWorkoutData } from '@/lib/services/workoutAnalytics';


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

  // Enhanced share workout method - directly copy public URL
  const handleShareWorkout = async () => {
    if (isSharing) return; // Prevent double-clicks
    
    setIsSharing(true);
    
    try {
      // Create a minimal ParsedWorkoutEvent for the sharing service
      const workoutForSharing = {
        id: processedWorkout.eventId, // Add required id property
        eventId: processedWorkout.eventId,
        authorPubkey: processedWorkout.authorPubkey,
        title: processedWorkout.title,
        description: '',
        createdAt: Math.floor(processedWorkout.createdAt / 1000), // Convert to seconds
        startTime: Math.floor(processedWorkout.createdAt / 1000),
        endTime: Math.floor(processedWorkout.createdAt / 1000) + Math.floor(processedWorkout.stats.duration / 1000),
        duration: Math.floor(processedWorkout.stats.duration / 1000),
        workoutType: 'strength' as const,
        completed: true,
        tags: [],
        exercises: []
      };
      
      // Generate the public workout URL
      const publicUrl = socialSharingService.generateWorkoutRecordURL(workoutForSharing);
      
      // Check if native share API is available and supported
      const hasNativeShare = typeof navigator !== 'undefined' && 
                            'share' in navigator && 
                            navigator.canShare && 
                            navigator.canShare({ url: publicUrl });
      
      if (hasNativeShare) {
        // Use native share API for mobile - just share the URL directly
        await navigator.share({
          title: `${processedWorkout.title} - POWR Workout`,
          url: publicUrl
        });
        
        showSuccessToast(
          "Workout Shared!",
          "Your workout has been shared successfully."
        );
      } else {
        // Fallback to clipboard for desktop
        await navigator.clipboard.writeText(publicUrl);
        
        showSuccessToast(
          "Link Copied!",
          "Workout link has been copied to your clipboard. Share it anywhere!"
        );
      }
    } catch (error) {
      console.error('Failed to share workout:', error);
      
      // Fallback error handling - try to copy to clipboard
      try {
        const workoutForSharing = {
          id: processedWorkout.eventId, // Add required id property
          eventId: processedWorkout.eventId,
          authorPubkey: processedWorkout.authorPubkey,
          title: processedWorkout.title,
          description: '',
          createdAt: Math.floor(processedWorkout.createdAt / 1000),
          startTime: Math.floor(processedWorkout.createdAt / 1000),
          endTime: Math.floor(processedWorkout.createdAt / 1000) + Math.floor(processedWorkout.stats.duration / 1000),
          duration: Math.floor(processedWorkout.stats.duration / 1000),
          workoutType: 'strength' as const,
          completed: true,
          tags: [],
          exercises: []
        };
        
        const publicUrl = socialSharingService.generateWorkoutRecordURL(workoutForSharing);
        await navigator.clipboard.writeText(publicUrl);
        
        showSuccessToast(
          "Link Copied!",
          "Workout link has been copied to your clipboard."
        );
      } catch {
        showErrorToast(
          "Share Failed",
          "Unable to share workout. Please try again or check your browser permissions."
        );
      }
    } finally {
      setIsSharing(false);
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

  // Extract exercise name from exercise reference (fallback strategy)
  const extractExerciseNameFromRef = (exerciseRef: string): string => {
    try {
      // Exercise reference format: "33401:pubkey:exercise-d-tag"
      const parts = exerciseRef.split(':');
      if (parts.length >= 3) {
        const dTag = parts[2];
        // Convert kebab-case to title case (e.g., "push-up" -> "Push Up")
        return dTag
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return 'Unknown Exercise';
    } catch {
      console.warn('[WorkoutHistoryDetailModal] Failed to extract exercise name from ref:', exerciseRef);
      return 'Unknown Exercise';
    }
  };

  // Get display name for exercise with fallback strategy
  const getExerciseDisplayName = (exerciseName: string, exerciseRef?: string): string => {
    // If we have a proper exercise name (not a reference), use it
    if (exerciseName && !exerciseName.includes(':') && exerciseName !== 'Unknown Exercise') {
      return exerciseName;
    }
    
    // Fallback to extracting name from reference
    if (exerciseRef) {
      return extractExerciseNameFromRef(exerciseRef);
    }
    
    // Last resort fallback
    return exerciseName || 'Unknown Exercise';
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
          {/* Header - Simplified without share button */}
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

            {/* Empty space for symmetry */}
            <div className="w-10 h-10"></div>
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
                          <h4 className="font-medium">{getExerciseDisplayName(entry.exerciseName, entry.exerciseRef)}</h4>
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
                        <h4 className="font-semibold text-lg">{getExerciseDisplayName(exercise.exerciseName, exercise.exerciseRef)}</h4>
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

              {/* Share Section - Single Clear Action */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Share This Workout</h3>
                
                <div className="p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your workout achievement with the community or save the link for your records.
                  </p>
                  
                  <Button
                    onClick={handleShareWorkout}
                    className="w-full h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2"
                  >
                    <Copy className="h-5 w-5" />
                    Share Workout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
