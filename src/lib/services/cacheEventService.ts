/**
 * Cache Event Service
 * 
 * Standardized event dispatching for NDK cache refresh operations.
 * Provides consistent event names, payload structure, and timing for
 * all operations that modify user collections or create new content.
 * 
 * Usage:
 * - After any NIP-51 collection modification
 * - After creating new content (templates, workouts, etc.)
 * - After completing workflows that affect cached data
 */

export interface CacheEventDetail {
  timestamp: number;
  [key: string]: unknown;
}

export interface LibraryUpdateDetail extends CacheEventDetail {
  operation: 'add' | 'remove';
  itemType: 'exercise' | 'workout' | 'collection';
  itemRef: string;
}

export interface WorkoutCompleteDetail extends CacheEventDetail {
  workoutId: string;
}

export interface TemplateSavedDetail extends CacheEventDetail {
  templateId: string;
  templateRef: string;
}

export interface OnboardingCompleteDetail extends CacheEventDetail {
  userPubkey: string;
  collectionsCreated: string[];
}

/**
 * Cache Event Service
 * 
 * Centralized service for dispatching cache refresh events.
 * Ensures consistent event structure and timing across the application.
 */
export class CacheEventService {
  /**
   * Dispatch library update event to trigger cache refresh
   * Used by library management operations to notify providers of changes
   */
  static dispatchLibraryUpdate(
    action: 'add' | 'remove',
    itemType: 'exercise' | 'workout' | 'collection',
    itemRef: string
  ): void {
    const event = new CustomEvent(CACHE_EVENTS.LIBRARY_UPDATED, {
      detail: { action, itemType, itemRef, timestamp: Date.now() }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Dispatch workout completion event
   * Triggers WorkoutHistoryProvider to refetch data after workout completion
   */
  static dispatchWorkoutComplete(workoutId: string): void {
    if (typeof window === 'undefined') return;
    
    const detail: WorkoutCompleteDetail = {
      workoutId,
      timestamp: Date.now()
    };
    
    window.dispatchEvent(new CustomEvent('powr-workout-complete', { detail }));
  }

  /**
   * Dispatch template saved event
   * Triggers LibraryDataProvider to refetch data after template creation
   */
  static dispatchTemplateSaved(templateId: string, templateRef: string): void {
    if (typeof window === 'undefined') return;
    
    const detail: TemplateSavedDetail = {
      templateId,
      templateRef,
      timestamp: Date.now()
    };
    
    window.dispatchEvent(new CustomEvent('powr-template-saved', { detail }));
  }

  /**
   * Dispatch onboarding completion event
   * Triggers LibraryDataProvider to refetch data after onboarding
   */
  static dispatchOnboardingComplete(userPubkey: string, collectionsCreated: string[]): void {
    if (typeof window === 'undefined') return;
    
    const detail: OnboardingCompleteDetail = {
      userPubkey,
      collectionsCreated,
      timestamp: Date.now()
    };
    
    window.dispatchEvent(new CustomEvent('powr-onboarding-complete', { detail }));
  }

  /**
   * Generic event dispatcher for custom cache refresh events
   * Use for specialized cases not covered by standard events
   */
  static dispatchCustomCacheEvent(eventName: string, detail: CacheEventDetail): void {
    if (typeof window === 'undefined') return;
    
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

/**
 * Event name constants for consistency
 */
export const CACHE_EVENTS = {
  LIBRARY_UPDATED: 'powr-library-updated',
  WORKOUT_COMPLETE: 'powr-workout-complete',
  TEMPLATE_SAVED: 'powr-template-saved',
  ONBOARDING_COMPLETE: 'powr-onboarding-complete'
} as const;

/**
 * Standard delay constants for cache refresh timing
 */
export const CACHE_REFRESH_DELAYS = {
  IMMEDIATE: 0,
  SHORT: 500,    // For onboarding, quick operations
  STANDARD: 1000, // For template saves, library updates
  LONG: 3000     // For workout completion, complex operations
} as const;
