/**
 * Library Onboarding Modal
 * 
 * Main onboarding modal component that guides new users through setting up
 * their library with starter content. Follows the onboarding flow from
 * library_onboarding_doc.md with progress feedback and success states.
 * 
 * Features:
 * - One-click setup with validated starter content
 * - Progress indicators during setup
 * - Success feedback with content summary
 * - Error handling with retry options
 * - Skip option for manual setup
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/powr-ui/primitives/Dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { 
  useLibraryOnboarding, 
  getOnboardingStepMessage, 
  getOnboardingSuccessSummary,
  type OnboardingState 
} from '@/hooks/useLibraryOnboarding';
import { CheckCircle, AlertCircle, Loader2, BookOpen, Dumbbell, Users } from 'lucide-react';

interface LibraryOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Progress indicator component
 */
function OnboardingProgress({ step, progress }: { step: OnboardingState['onboardingStep']; progress: number }) {
  const message = getOnboardingStepMessage(step);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Success summary component
 */
function OnboardingSuccess({ 
  summary, 
  onComplete 
}: { 
  summary: ReturnType<typeof getOnboardingSuccessSummary>; 
  onComplete: () => void;
}) {
  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Your library is ready!</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Dumbbell className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-semibold">{summary.totalExercises}</div>
            <div className="text-xs text-gray-500">Exercises</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-semibold">{summary.totalWorkouts}</div>
            <div className="text-xs text-gray-500">Workouts</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-6 w-6 mx-auto mb-1 text-purple-500" />
            <div className="text-lg font-semibold">{summary.totalCollections}</div>
            <div className="text-xs text-gray-500">Collections</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Added from POWR&apos;s curated fitness content. Setup completed in {Math.round(summary.setupTime / 1000)}s.
        </p>
        <Button onClick={onComplete} className="w-full">
          Start Browsing Your Library
        </Button>
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function OnboardingError({ 
  error, 
  onRetry, 
  onSkip 
}: { 
  error: string; 
  onRetry: () => void; 
  onSkip: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">Setup Failed</span>
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-sm text-red-700">{error}</p>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onRetry} variant="outline" className="flex-1">
          Try Again
        </Button>
        <Button onClick={onSkip} variant="ghost" className="flex-1">
          Skip Setup
        </Button>
      </div>
    </div>
  );
}

/**
 * Starter content preview component
 */
function StarterContentPreview({ starterContent }: { 
  starterContent: { 
    isValid: boolean; 
    validExercises: unknown[]; 
    validWorkouts: unknown[]; 
    validCollections: unknown[]; 
    warnings: string[] 
  } 
}) {
  if (!starterContent?.isValid) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">What you&apos;ll get:</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {starterContent.validExercises.length}
          </div>
          <div className="text-xs text-gray-500">Exercises</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {starterContent.validWorkouts.length}
          </div>
          <div className="text-xs text-gray-500">Workouts</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {starterContent.validCollections.length}
          </div>
          <div className="text-xs text-gray-500">Collections</div>
        </div>
      </div>
      
      {starterContent.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-xs text-yellow-700">
            {starterContent.warnings.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Main Library Onboarding Modal Component
 */
export function LibraryOnboarding({ open, onOpenChange }: LibraryOnboardingProps) {
  const {
    needsOnboarding,
    isCheckingEmpty,
    isOnboarding,
    onboardingStep,
    progress,
    starterContent,
    setupResults,
    error,
    hasCompletedOnboarding,
    runOnboarding,
    skipOnboarding,
    resetOnboarding
  } = useLibraryOnboarding();

  // ✅ SAFETY GUARD: Don't show modal if user has completed onboarding
  // BUT allow showing the completion summary if we're in the 'complete' step
  if (hasCompletedOnboarding && onboardingStep !== 'complete') {
    console.log('[LibraryOnboarding] 🛡️ Safety guard: User has completed onboarding, preventing modal display');
    return null;
  }

  // ✅ SAFETY GUARD: Don't show modal if library is not empty
  // This prevents the modal from appearing for users with existing content
  if (!needsOnboarding && !isOnboarding && onboardingStep !== 'complete') {
    console.log('[LibraryOnboarding] 🛡️ Safety guard: Library not empty, preventing modal display');
    return null;
  }

  // ✅ SAFETY GUARD: Don't show modal while checking library status
  if (isCheckingEmpty) {
    console.log('[LibraryOnboarding] 🛡️ Safety guard: Library check in progress, preventing modal display');
    return null;
  }

  // Remove auto-validation - only validate when user clicks "Get Started"
  // This prevents the progress bar from showing immediately when modal opens

  const handleGetStarted = async () => {
    try {
      await runOnboarding();
    } catch (error) {
      console.error('[LibraryOnboarding] Setup failed:', error);
      // Error state is handled by the hook
    }
  };

  const handleSkip = () => {
    console.log('[LibraryOnboarding] User skipped onboarding - closing modal immediately');
    // Close modal first to provide immediate feedback
    onOpenChange(false);
    // Then update hook state
    skipOnboarding();
  };

  const handleComplete = () => {
    console.log('[LibraryOnboarding] User completed onboarding - closing modal immediately');
    // Close modal first to provide immediate feedback
    onOpenChange(false);
    // The onboarding is already complete in the hook state
    // No additional action needed - the hook has already updated needsOnboarding to false
  };

  const handleRetry = () => {
    resetOnboarding();
    handleGetStarted();
  };

  const inProgress = isOnboarding || (onboardingStep !== 'idle' && onboardingStep !== 'complete' && onboardingStep !== 'error');

  const successSummary = getOnboardingSuccessSummary({ 
    setupResults 
  } as OnboardingState);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md sm:mx-0 sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Ready to start working out?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading/Progress State */}
          {inProgress && (
            <OnboardingProgress step={onboardingStep} progress={progress} />
          )}

          {/* Success State */}
          {onboardingStep === 'complete' && successSummary && (
            <OnboardingSuccess 
              summary={successSummary} 
              onComplete={handleComplete}
            />
          )}

          {/* Error State */}
          {onboardingStep === 'error' && error && (
            <OnboardingError 
              error={error}
              onRetry={handleRetry}
              onSkip={handleSkip}
            />
          )}

          {/* Initial Prompt State */}
          {onboardingStep === 'idle' && !error && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  We&apos;ll create a few POWR lists and add some curated exercises, workouts, and collections to your Library to get you started.
                </p>
                
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-xs">
                    From POWR&apos;s fitness experts
                  </Badge>
                </div>
              </div>

              {/* Starter Content Preview */}
              {starterContent && (
                <StarterContentPreview starterContent={starterContent} />
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleGetStarted} 
                  className="flex-1"
                >
                  Get Started
                </Button>
                <Button 
                  onClick={handleSkip} 
                  variant="ghost" 
                  className="flex-1"
                >
                  I&apos;ll do this later
                </Button>
              </div>

              {/* Additional Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  You can always add more content later or create your own collections.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LibraryOnboarding;
