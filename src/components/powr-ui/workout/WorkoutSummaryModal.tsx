/**
 * Workout Summary Modal
 * 
 * Displays workout completion summary with optional social sharing.
 * Uses full-screen Dialog pattern consistent with WorkoutDetailModal.
 * Privacy-first: no tracking, no analytics, user controls all sharing.
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Share2, SkipForward } from 'lucide-react';
import { Button, Textarea } from '@/components/powr-ui';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { socialSharingService } from '@/lib/services/socialSharingService';
import { useWeightUnits } from '@/providers/WeightUnitsProvider';
import type { CompletedWorkout } from '@/lib/services/workoutEventGeneration';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutData: CompletedWorkout;
  onShare: (content: string) => void;
  onSkipSharing: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  isOpen,
  onClose,
  workoutData,
  onShare,
  onSkipSharing
}) => {
  const [socialContent, setSocialContent] = useState('');
  const { weightUnit } = useWeightUnits();

  // Calculate workout statistics using social sharing service
  const workoutStats = useMemo(() => {
    return socialSharingService.calculateSingleWorkoutStats(workoutData);
  }, [workoutData]);

  // Generate default social content with user's weight unit preference
  const defaultSocialContent = useMemo(() => {
    return socialSharingService.generateWorkoutSocialContent(workoutData, weightUnit);
  }, [workoutData, weightUnit]);

  // Initialize social content when modal opens
  React.useEffect(() => {
    if (isOpen && !socialContent) {
      setSocialContent(defaultSocialContent);
    }
  }, [isOpen, defaultSocialContent, socialContent]);

  // Format duration for display
  const formattedDuration = useMemo(() => {
    return socialSharingService.formatDuration(workoutStats.duration);
  }, [workoutStats.duration]);

  const handleShare = () => {
    const cleanContent = socialSharingService.cleanUserContent(socialContent);
    onShare(cleanContent);
  };

  const handleSkip = () => {
    onSkipSharing();
  };

  const handleReset = () => {
    setSocialContent(defaultSocialContent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Workout Complete</DialogTitle>
          <DialogDescription>
            Workout completion summary and social sharing options
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-full bg-background overflow-hidden pb-[env(safe-area-inset-bottom)] flex flex-col">
          {/* Header - Matches WorkoutDetailModal pattern */}
          <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border flex-shrink-0">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-foreground hover:text-foreground/80"
              title="Close summary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Title */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold">Workout Complete! 🎉</h2>
            </div>

            {/* Empty space for balance */}
            <div className="w-10"></div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-6 space-y-6">
              {/* Workout Title */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {workoutData.title}
                </h3>
                <p className="text-muted-foreground">
                  Great job completing your workout!
                </p>
              </div>

              {/* Workout Summary Stats */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Workout Summary</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {formattedDuration}
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
                      {workoutStats.totalSets}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Sets</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {workoutStats.totalReps}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Reps</div>
                  </div>
                </div>

                {/* Optional volume display if there's weight data */}
                {workoutStats.totalVolume > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center p-4 bg-muted/50 backdrop-blur-sm rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {Math.round(workoutStats.totalVolume)} kg
                      </div>
                      <div className="text-sm text-muted-foreground">Total Volume</div>
                    </div>
                  </div>
                )}

                {/* Optional RPE display if available */}
                {workoutStats.averageRPE > 0 && (
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

              {/* Social Sharing Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Share Your Achievement</h4>
                
                <div className="space-y-4">
                  {/* Editable Social Content - Always editable, no edit button needed */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Social Post Content
                    </label>
                    <Textarea
                      value={socialContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSocialContent(e.target.value)}
                      placeholder="Share your workout achievement..."
                      className="min-h-[120px] bg-muted/50 backdrop-blur-sm"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Tap to edit your message
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="text-xs"
                      >
                        Reset to Default
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleShare}
                      className="flex-1 h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-black font-semibold text-base rounded-xl flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-5 w-5" />
                      Share to Nostr
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="h-12 px-6 flex items-center gap-2"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Your workout data is already saved securely. Sharing is optional and posts to the Nostr network for the community to see.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
