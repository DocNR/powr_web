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
} from '@/components/powr-ui/primitives/Dialog';
import { socialSharingService } from '@/lib/services/socialSharingService';
import { useWeightUnits } from '@/providers/WeightUnitsProvider';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { CompletedWorkout } from '@/lib/services/workoutEventGeneration';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutData: CompletedWorkout;
  onShare: (content: string) => void;
  onSkipSharing: () => void;
  publishError?: string | null;
  onRetryPublish?: () => void;
  onDismissError?: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  isOpen,
  onClose,
  workoutData,
  onShare,
  onSkipSharing,
  publishError,
  onRetryPublish,
  onDismissError
}) => {
  const [socialContent, setSocialContent] = useState('');
  const { weightUnit } = useWeightUnits();
  const isOnline = useOnlineStatus();

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

        <div className="relative h-full bg-[var(--color-surface-base)] overflow-hidden pb-[env(safe-area-inset-bottom)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-card)] flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close summary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Workout Complete!</h2>
            <div className="w-10"></div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-6 pb-6 space-y-6">
              {/* Publish Error Banner */}
              {publishError && (
                <div className="bg-[rgba(239,68,68,0.1)] rounded-[var(--radius)] p-6">
                  <h4 className="text-[var(--color-error)] font-semibold mb-2">Publish Failed</h4>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
                    Your workout is saved locally.
                  </p>
                  <div className="flex gap-3">
                    {onRetryPublish && (
                      <Button variant="primary-gradient" size="sm" onClick={onRetryPublish}>
                        Retry
                      </Button>
                    )}
                    {onDismissError && (
                      <Button variant="ghost" size="sm" onClick={onDismissError}>
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Offline Queued Indicator */}
              {!isOnline && !publishError && (
                <div className="bg-[rgba(255,145,83,0.1)] rounded-[var(--radius)] px-5 py-3 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  <span className="text-sm text-[var(--color-primary)]">
                    Queued — will publish when online
                  </span>
                </div>
              )}

              {/* Workout Title */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">
                  {workoutData.title}
                </h3>
                <p className="text-[var(--color-on-surface-variant)]">
                  Great job completing your workout!
                </p>
              </div>

              {/* Workout Summary Stats */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-[var(--color-on-surface)]">Workout Summary</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-[var(--color-surface-card)] rounded-[var(--radius)]">
                    <div className="text-3xl font-bold text-[var(--color-primary)] font-[var(--font-numeric)] mb-1">
                      {formattedDuration}
                    </div>
                    <div className="text-sm text-[var(--color-on-surface-variant)]">Duration</div>
                  </div>

                  <div className="text-center p-4 bg-[var(--color-surface-card)] rounded-[var(--radius)]">
                    <div className="text-3xl font-bold text-[var(--color-primary)] font-[var(--font-numeric)] mb-1">
                      {workoutStats.exerciseCount}
                    </div>
                    <div className="text-sm text-[var(--color-on-surface-variant)]">Exercises</div>
                  </div>

                  <div className="text-center p-4 bg-[var(--color-surface-card)] rounded-[var(--radius)]">
                    <div className="text-3xl font-bold text-[var(--color-primary)] font-[var(--font-numeric)] mb-1">
                      {workoutStats.totalSets}
                    </div>
                    <div className="text-sm text-[var(--color-on-surface-variant)]">Total Sets</div>
                  </div>

                  <div className="text-center p-4 bg-[var(--color-surface-card)] rounded-[var(--radius)]">
                    <div className="text-3xl font-bold text-[var(--color-primary)] font-[var(--font-numeric)] mb-1">
                      {workoutStats.totalReps}
                    </div>
                    <div className="text-sm text-[var(--color-on-surface-variant)]">Total Reps</div>
                  </div>
                </div>

                {workoutStats.totalVolume > 0 && (
                  <div className="text-center p-4 bg-[var(--color-surface-card)] rounded-[var(--radius)]">
                    <div className="text-3xl font-bold text-[var(--color-primary)] font-[var(--font-numeric)] mb-1">
                      {Math.round(workoutStats.totalVolume)} kg
                    </div>
                    <div className="text-sm text-[var(--color-on-surface-variant)]">Total Volume</div>
                  </div>
                )}

                {workoutStats.averageRPE > 0 && (
                  <div className="text-center p-4 bg-[var(--color-surface-card)] rounded-[var(--radius)]">
                    <div className="text-3xl font-bold text-[var(--color-primary)] font-[var(--font-numeric)] mb-1">
                      {workoutStats.averageRPE.toFixed(1)}
                    </div>
                    <div className="text-sm text-[var(--color-on-surface-variant)]">Average RPE</div>
                  </div>
                )}
              </div>

              {/* Social Sharing Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-[var(--color-on-surface)]">Share Your Achievement</h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-on-surface)]">
                      Social Post Content
                    </label>
                    <Textarea
                      value={socialContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSocialContent(e.target.value)}
                      placeholder="Share your workout achievement..."
                      className="min-h-[120px] bg-[var(--color-surface-card)]"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-[var(--color-on-surface-variant)]">
                        Tap to edit your message
                      </p>
                      <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                        Reset to Default
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="primary-gradient"
                      onClick={handleShare}
                      className="flex-1 h-12 font-semibold text-base flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-5 w-5" />
                      Share to Nostr
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleSkip}
                      className="h-12 px-6 flex items-center gap-2"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip
                    </Button>
                  </div>

                  <p className="text-xs text-[var(--color-on-surface-variant)] text-center leading-relaxed">
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
