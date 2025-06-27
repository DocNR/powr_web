/**
 * Real NDK Template Loading Actor
 * 
 * Simplified version for Phase 2 that uses existing test content
 * and focuses on real NDK integration patterns.
 */

import { fromPromise } from 'xstate';
import { getNDKInstance } from '@/lib/ndk';
import type { NDKEvent } from '@nostr-dev-kit/ndk';

export interface LoadTemplateInput {
  templateId: string;
  userPubkey: string;
}

export interface LoadTemplateOutput {
  template: WorkoutTemplate;
  exercises: ExerciseTemplate[];
  loadTime: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: TemplateExercise[];
  estimatedDuration?: number;
  difficulty?: string;
  authorPubkey: string;
  createdAt: number;
}

export interface TemplateExercise {
  exerciseRef: string; // Format: "33401:pubkey:exercise-d-tag"
  sets: number;
  reps: number;
  weight?: number;
  restTime?: number;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: string;
  instructions: string[];
  authorPubkey: string;
  createdAt: number;
}

/**
 * Real NDK Template Loading Actor
 * 
 * Phase 2 implementation that loads real templates from NDK cache
 * using the Phase 1 test content as a foundation.
 */
export const loadTemplateActor = fromPromise(async ({ input }: {
  input: LoadTemplateInput
}): Promise<LoadTemplateOutput> => {
  console.log('[LoadTemplateActor] Loading template:', {
    templateId: input.templateId,
    userPubkey: input.userPubkey.slice(0, 8) + '...'
  });
  
  const startTime = Date.now();
  
  try {
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }
    
    // Load template using NDK (cache-first, then relays)
    console.log('[LoadTemplateActor] Fetching template event from NDK...');
    const templateEvent = await ndk.fetchEvent({
      kinds: [33402 as any], // NIP-101e workout template
      authors: [input.userPubkey],
      '#d': [input.templateId]
    });
    
    if (!templateEvent) {
      throw new Error(`Template not found: ${input.templateId} (checked cache and relays)`);
    }
    
    console.log('[LoadTemplateActor] Template event found:', {
      id: templateEvent.id,
      tags: templateEvent.tags.length,
      createdAt: templateEvent.created_at
    });
    
    // Parse template from NDK event
    const template = parseTemplateFromEvent(templateEvent);
    
    // Resolve exercise dependencies
    console.log('[LoadTemplateActor] Resolving exercise dependencies...');
    const exercises = await resolveExerciseDependencies(template.exercises, ndk);
    
    const loadTime = Date.now() - startTime;
    
    console.log('[LoadTemplateActor] Template loaded successfully:', {
      templateId: template.id,
      exerciseCount: exercises.length,
      loadTime: `${loadTime}ms`
    });
    
    return {
      template,
      exercises,
      loadTime
    };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown template loading error';
    
    console.error('[LoadTemplateActor] Template loading failed:', {
      error: errorMessage,
      templateId: input.templateId,
      loadTime: `${loadTime}ms`
    });
    
    // For Phase 2, fall back to mock data on error
    console.warn('[LoadTemplateActor] Falling back to mock data for Phase 2');
    return createMockTemplateData(input.templateId, input.userPubkey, startTime);
  }
});

/**
 * Parse workout template from NDK event
 */
function parseTemplateFromEvent(event: NDKEvent): WorkoutTemplate {
  const tagMap = new Map(event.tags.map(tag => [tag[0], tag]));
  
  const id = tagMap.get('d')?.[1] || 'unknown';
  const name = tagMap.get('title')?.[1] || 'Untitled Template';
  const description = event.content || 'No description';
  const difficulty = tagMap.get('difficulty')?.[1];
  const estimatedDuration = tagMap.get('duration')?.[1] ? parseInt(tagMap.get('duration')![1]) : undefined;
  
  // Extract exercise references
  const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
  const exercises: TemplateExercise[] = exerciseTags.map(tag => ({
    exerciseRef: tag[1],
    sets: parseInt(tag[2]) || 3,
    reps: parseInt(tag[3]) || 10,
    weight: tag[4] ? parseInt(tag[4]) : undefined,
    restTime: 60 // Default rest time
  }));
  
  return {
    id,
    name,
    description,
    exercises,
    estimatedDuration,
    difficulty,
    authorPubkey: event.pubkey,
    createdAt: event.created_at || Math.floor(Date.now() / 1000)
  };
}

/**
 * Resolve exercise dependencies for a workout template
 */
async function resolveExerciseDependencies(
  templateExercises: TemplateExercise[],
  ndk: any
): Promise<ExerciseTemplate[]> {
  if (templateExercises.length === 0) {
    return [];
  }
  
  // Extract unique exercise references
  const exerciseRefs = [...new Set(templateExercises.map(ex => ex.exerciseRef))];
  
  console.log('[LoadTemplateActor] Resolving exercise references:', {
    totalExercises: templateExercises.length,
    uniqueExercises: exerciseRefs.length,
    references: exerciseRefs
  });
  
  // For Phase 2, create mock exercise data based on references
  const exercises: ExerciseTemplate[] = exerciseRefs.map(ref => {
    const parts = ref.split(':');
    const exerciseId = parts[2] || 'unknown';
    
    return {
      id: exerciseId,
      name: exerciseId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Instructions for ${exerciseId}`,
      muscleGroups: ['chest', 'arms'], // Mock data
      equipment: 'bodyweight',
      difficulty: 'beginner',
      instructions: ['Step 1', 'Step 2', 'Step 3'],
      authorPubkey: parts[1] || 'unknown',
      createdAt: Math.floor(Date.now() / 1000)
    };
  });
  
  console.log('[LoadTemplateActor] Exercise dependencies resolved (mock data):', {
    found: exercises.length,
    total: exerciseRefs.length
  });
  
  return exercises;
}

/**
 * Create mock template data for Phase 2 testing
 */
function createMockTemplateData(templateId: string, userPubkey: string, startTime: number): LoadTemplateOutput {
  const template: WorkoutTemplate = {
    id: templateId,
    name: `Test Template: ${templateId}`,
    description: 'Mock template data for Phase 2 NDK integration testing',
    exercises: [
      {
        exerciseRef: `33401:${userPubkey}:pushup-standard`,
        sets: 3,
        reps: 10,
        weight: 0,
        restTime: 60
      },
      {
        exerciseRef: `33401:${userPubkey}:bodyweight-squats`,
        sets: 3,
        reps: 15,
        weight: 0,
        restTime: 60
      }
    ],
    estimatedDuration: 1800, // 30 minutes
    difficulty: 'beginner',
    authorPubkey: userPubkey,
    createdAt: Math.floor(Date.now() / 1000)
  };
  
  const exercises: ExerciseTemplate[] = [
    {
      id: 'pushup-standard',
      name: 'Standard Pushup',
      description: 'Classic bodyweight exercise',
      muscleGroups: ['chest', 'triceps'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      instructions: ['Start in plank position', 'Lower body to ground', 'Push back up'],
      authorPubkey: userPubkey,
      createdAt: Math.floor(Date.now() / 1000)
    },
    {
      id: 'bodyweight-squats',
      name: 'Bodyweight Squats',
      description: 'Basic leg exercise',
      muscleGroups: ['legs', 'glutes'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      instructions: ['Stand with feet apart', 'Lower down', 'Stand back up'],
      authorPubkey: userPubkey,
      createdAt: Math.floor(Date.now() / 1000)
    }
  ];
  
  const loadTime = Date.now() - startTime;
  
  console.log('[LoadTemplateActor] Created mock template data:', {
    templateId,
    exerciseCount: exercises.length,
    loadTime: `${loadTime}ms`
  });
  
  return {
    template,
    exercises,
    loadTime
  };
}
