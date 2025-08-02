/**
 * Simple Library Onboarding Hook
 * 
 * Replaces the complex useLibraryOnboarding hook with a simple, predictable approach.
 * Follows the "simple solutions first" principle - no complex state synchronization,
 * no race conditions, just direct localStorage checks and simple modal state.
 */

import { useState, useEffect, useCallback } from 'react';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import { useAccount } from '@/lib/auth/hooks';

// Simple localStorage utilities
const getOnboardingKey = (pubkey: string) => `powr_onboarding_done_${pubkey}`;

const hasUserCompletedOnboarding = (pubkey: string): boolean => {
  try {
    return localStorage.getItem(getOnboardingKey(pubkey)) === 'true';
  } catch {
    return false;
  }
};

const markUserCompleted = (pubkey: string): void => {
  try {
    localStorage.setItem(getOnboardingKey(pubkey), 'true');
  } catch {
    // Ignore localStorage errors
  }
};

export interface OnboardingResult {
  exerciseLibrary: { id: string; itemCount: number };
  workoutLibrary: { id: string; itemCount: number };
  collectionSubscriptions: { id: string; itemCount: number };
  setupTime: number;
}

export interface SimpleOnboardingState {
  isModalOpen: boolean;
  isOnboarding: boolean;
  error: string | null;
  result: OnboardingResult | null;
}

export interface SimpleOnboardingActions {
  setIsModalOpen: (open: boolean) => void;
  checkShouldShowModal: () => Promise<boolean>;
  runOnboarding: () => Promise<void>;
  skipOnboarding: () => void;
}

/**
 * Simple Library Onboarding Hook
 * 
 * Provides straightforward onboarding state management with no complex synchronization.
 * Modal state lives in component, completion state in localStorage - simple and predictable.
 */
export function useSimpleLibraryOnboarding(): SimpleOnboardingState & SimpleOnboardingActions {
  const currentUser = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  /**
   * Check if modal should be shown
   * Simple logic: show if user hasn't completed AND library is empty
   */
  const checkShouldShowModal = useCallback(async (): Promise<boolean> => {
    if (!currentUser?.pubkey) {
      console.log('[SimpleOnboarding] No authenticated user');
      return false;
    }

    // Check localStorage first (instant)
    if (hasUserCompletedOnboarding(currentUser.pubkey)) {
      console.log('[SimpleOnboarding] User has completed onboarding');
      return false;
    }

    try {
      // Check if library is empty (only if needed)
      console.log('[SimpleOnboarding] Checking if library is empty...');
      const isEmpty = await libraryManagementService.isLibraryEmpty(currentUser.pubkey);
      console.log('[SimpleOnboarding] Library empty check result:', isEmpty);
      return isEmpty;
    } catch (error) {
      console.error('[SimpleOnboarding] Error checking library status:', error);
      setError(error instanceof Error ? error.message : 'Failed to check library status');
      return false;
    }
  }, [currentUser?.pubkey]);

  /**
   * Run the onboarding process
   */
  const runOnboarding = useCallback(async (): Promise<void> => {
    if (!currentUser?.pubkey) {
      throw new Error('No authenticated user for onboarding');
    }

    console.log('[SimpleOnboarding] Starting onboarding process...');
    const startTime = Date.now();
    setIsOnboarding(true);
    setError(null);
    setResult(null);

    try {
      // Use the existing library management service
      const results = await libraryManagementService.setupStarterLibrary(currentUser.pubkey);
      const setupTime = Date.now() - startTime;
      
      console.log('[SimpleOnboarding] Onboarding completed successfully:', results);
      
      // Create result object with actual counts
      const onboardingResult: OnboardingResult = {
        exerciseLibrary: {
          id: results.exerciseLibrary?.id || 'exercise-library',
          itemCount: results.exerciseLibrary?.itemCount || 0
        },
        workoutLibrary: {
          id: results.workoutLibrary?.id || 'workout-library', 
          itemCount: results.workoutLibrary?.itemCount || 0
        },
        collectionSubscriptions: {
          id: results.collectionSubscriptions?.id || 'collection-subscriptions',
          itemCount: results.collectionSubscriptions?.itemCount || 0
        },
        setupTime
      };
      
      setResult(onboardingResult);
      
      // Mark as completed but keep modal open to show success
      markUserCompleted(currentUser.pubkey);
      
    } catch (error) {
      console.error('[SimpleOnboarding] Onboarding failed:', error);
      setError(error instanceof Error ? error.message : 'Onboarding failed');
      throw error;
    } finally {
      setIsOnboarding(false);
    }
  }, [currentUser?.pubkey]);

  /**
   * Skip onboarding
   */
  const skipOnboarding = useCallback(() => {
    if (!currentUser?.pubkey) return;
    
    console.log('[SimpleOnboarding] User skipped onboarding');
    markUserCompleted(currentUser.pubkey);
    setIsModalOpen(false);
  }, [currentUser?.pubkey]);

  /**
   * Auto-check when user changes
   */
  useEffect(() => {
    if (currentUser?.pubkey) {
      console.log('[SimpleOnboarding] User authenticated, checking if modal should show...');
      
      checkShouldShowModal().then(shouldShow => {
        if (shouldShow) {
          console.log('[SimpleOnboarding] Showing onboarding modal');
          setIsModalOpen(true);
        } else {
          console.log('[SimpleOnboarding] Not showing onboarding modal');
        }
      });
    } else {
      // User logged out, close modal
      setIsModalOpen(false);
    }
  }, [currentUser?.pubkey, checkShouldShowModal]);

  return {
    // State
    isModalOpen,
    isOnboarding,
    error,
    result,
    
    // Actions
    setIsModalOpen,
    checkShouldShowModal,
    runOnboarding,
    skipOnboarding
  };
}
