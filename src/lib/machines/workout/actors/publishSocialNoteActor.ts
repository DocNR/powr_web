/**
 * Social Note Publishing Actor
 * 
 * Publishes kind 1 social notes for workout sharing using Global NDK Actor patterns.
 * Follows optimistic publishing approach with silent failure handling.
 * Privacy-first: no tracking, no analytics, no error notifications to user.
 */

import { fromPromise } from 'xstate';
import { publishEvent } from '@/lib/actors/globalNDKActor';

export interface PublishSocialNoteInput {
  content: string;
  userPubkey: string;
  workoutId?: string; // Optional for debugging/logging
}

export interface PublishSocialNoteOutput {
  success: boolean;
  eventId?: string;
  requestId: string;
  error?: string;
}

/**
 * Social Note Publishing Actor
 * 
 * Uses optimized Global NDK Actor for reliable event publishing
 * with optimistic UX and silent failure handling.
 */
export const publishSocialNoteActor = fromPromise(async ({ input }: {
  input: PublishSocialNoteInput
}): Promise<PublishSocialNoteOutput> => {
  console.log('[PublishSocialNoteActor] Starting social note publishing:', {
    contentLength: input.content.length,
    userPubkey: input.userPubkey.slice(0, 8) + '...',
    workoutId: input.workoutId
  });
  
  try {
    // Basic content validation
    if (!input.content || input.content.trim().length === 0) {
      const errorMessage = 'Social content cannot be empty';
      console.error('[PublishSocialNoteActor] Validation failed:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // Generate kind 1 social note event
    const eventData = {
      kind: 1,
      content: input.content.trim(),
      tags: [
        ['t', 'powr'], // Simple hashtag for community visibility
        // No tracking tags, no analytics - privacy-first approach
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: input.userPubkey
    };
    
    console.log('[PublishSocialNoteActor] Generated kind 1 event:', {
      kind: eventData.kind,
      contentLength: eventData.content.length,
      tags: eventData.tags.length,
      hasPowr: eventData.content.includes('#powr')
    });
    
    // Publish via optimized Global NDK Actor
    const requestId = `social_${input.workoutId || 'note'}_${Date.now()}`;
    const publishResult = await publishEvent(eventData, requestId);
    
    if (publishResult.success) {
      console.log('[PublishSocialNoteActor] Publishing successful:', {
        eventId: publishResult.eventId,
        requestId,
        workoutId: input.workoutId
      });
      
      return {
        success: true,
        eventId: publishResult.eventId,
        requestId
      };
    } else {
      console.warn('[PublishSocialNoteActor] Publishing failed but queued:', {
        error: publishResult.error,
        requestId,
        workoutId: input.workoutId
      });
      
      // Return success even if queued - NDK will handle retry
      // This maintains optimistic UX with no user error notifications
      return {
        success: true, // Consider queued as success for UX
        requestId,
        error: publishResult.error
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown publishing error';
    console.error('[PublishSocialNoteActor] Publishing failed:', {
      error: errorMessage,
      workoutId: input.workoutId,
      contentLength: input.content?.length || 0
    });
    
    // Even on error, return success for optimistic UX
    // Privacy-first: no error notifications to user
    return {
      success: true, // Optimistic UX - don't show errors to user
      requestId: `failed_social_${input.workoutId || 'note'}_${Date.now()}`,
      error: errorMessage
    };
  }
});
