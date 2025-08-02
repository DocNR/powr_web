/**
 * Simple Library Onboarding Modal
 * 
 * Simplified onboarding modal that works with the new useSimpleLibraryOnboarding hook.
 * Follows the "simple solutions first" principle - no complex state management,
 * just straightforward onboarding flow.
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/powr-ui/primitives/Dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react';

interface OnboardingResult {
  exerciseLibrary: { id: string; itemCount: number };
  workoutLibrary: { id: string; itemCount: number };
  collectionSubscriptions: { id: string; itemCount: number };
  setupTime: number;
}

interface SimpleLibraryOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => Promise<void>;
  onSkip: () => void;
  isLoading: boolean;
  error: string | null;
  result?: OnboardingResult | null;
}

/**
 * Simple Library Onboarding Modal Component
 */
export function SimpleLibraryOnboarding({ 
  open, 
  onOpenChange, 
  onComplete, 
  onSkip, 
  isLoading, 
  error,
  result 
}: SimpleLibraryOnboardingProps) {
  const handleGetStarted = async () => {
    try {
      await onComplete();
    } catch (error) {
      console.error('[SimpleLibraryOnboarding] Setup failed:', error);
      // Error is handled by the hook and passed as prop
    }
  };

  const handleSkip = () => {
    console.log('[SimpleLibraryOnboarding] User skipped onboarding');
    onSkip();
  };

  const handleRetry = () => {
    handleGetStarted();
  };

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
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">Setting up your library...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Setup Failed</span>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleSkip} variant="ghost" className="flex-1">
                  Skip Setup
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {result && !isLoading && !error && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium text-lg">Library Setup Complete!</span>
                </div>
                
                <p className="text-gray-600">
                  Your workout library has been created with curated content from POWR&apos;s fitness experts.
                </p>
              </div>

              {/* Success Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">What was added:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{result.exerciseLibrary.itemCount}</div>
                    <div className="text-xs text-green-600">Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{result.workoutLibrary.itemCount}</div>
                    <div className="text-xs text-green-600">Workouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">{result.collectionSubscriptions.itemCount}</div>
                    <div className="text-xs text-green-600">Collections</div>
                  </div>
                </div>
                
                <div className="mt-3 text-center">
                  <Badge variant="secondary" className="text-xs">
                    Setup completed in {Math.round(result.setupTime / 1000)}s
                  </Badge>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => onOpenChange(false)} 
                  className="w-full"
                >
                  Start Working Out!
                </Button>
              </div>
            </div>
          )}

          {/* Initial Prompt State */}
          {!result && !isLoading && !error && (
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
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">What you&apos;ll get:</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">~12</div>
                    <div className="text-xs text-gray-500">Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">~3</div>
                    <div className="text-xs text-gray-500">Workouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">~2</div>
                    <div className="text-xs text-gray-500">Collections</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleGetStarted} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Get Started
                </Button>
                <Button 
                  onClick={handleSkip} 
                  variant="ghost" 
                  className="flex-1"
                  disabled={isLoading}
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

export default SimpleLibraryOnboarding;
