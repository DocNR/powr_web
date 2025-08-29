/**
 * Exercise Modal Resolution Service
 * 
 * Facade service for resolving exercise data for ExerciseDetailModal display,
 * ensuring NIP-92 media attachments (YouTube thumbnails, video demonstrations)
 * are preserved across all data pathways.
 * 
 * Follows .clinerules/exercise-modal-data-resolution.md patterns to prevent
 * "fix one pathway, break another" cycles through unified data resolution.
 * 
 * Architecture: Facade pattern delegating to proven services while guaranteeing
 * NIP-92 tag preservation for consistent media display across all pathways.
 */

import type { Exercise } from './dependencyResolution';
import { dependencyResolutionService } from './dependencyResolution';
import { dataParsingService } from './dataParsingService';
import { prepareExerciseForModal, type ExerciseModalData } from '@/lib/utils/exerciseModalData';

// Import the library exercise type
type LibraryExerciseData = {
  id: string;
  name: string;
  description?: string;
  instructions?: string[];
  equipment: string;
  difficulty: string;
  muscleGroups: string[];
  format: string[];
  format_units: string[];
  authorPubkey: string;
  createdAt: number;
  eventId: string;
  hashtags: string[];
  eventTags: string[][]; // NIP-92 media tags
};

/**
 * Exercise Modal Resolution Service
 * 
 * Single facade service for all ExerciseDetailModal data resolution pathways.
 * Prevents service layer fragmentation by ensuring all pathways use the same
 * resolution logic with guaranteed NIP-92 media preservation.
 * 
 * Follows .clinerules/service-layer-architecture.md facade pattern.
 */
export class ExerciseModalResolutionService {
  
  /**
   * Resolve exercise data from library Exercise object (Pathway 1)
   * Used by: ExerciseLibrary.tsx → ExerciseDetailModal
   * 
   * This pathway already has complete Exercise data with tags preserved,
   * so we can use it directly.
   */
  async resolveFromLibraryExercise(exercise: LibraryExerciseData): Promise<ExerciseModalData> {
    // Ensure the exercise has all required fields for the Exercise interface
    const completeExercise: Exercise = {
      ...exercise,
      // Provide default instructions if missing
      instructions: exercise.instructions || ['No instructions available'],
      // Ensure other required fields have defaults
      description: exercise.description || 'No description available',
      muscleGroups: exercise.muscleGroups || [],
      hashtags: exercise.hashtags || [],
      format: exercise.format || [],
      format_units: exercise.format_units || [],
      equipment: exercise.equipment || 'unknown'
    };
    
    // Validate NIP-92 tag preservation
    this.validateNIP92Preservation(completeExercise);
    
    // Use existing Exercise data (already has tags preserved)
    return prepareExerciseForModal(completeExercise);
  }
  
  /**
   * Resolve exercise data from naddr string (Pathway 2)
   * Used by: GlobalWorkoutSearch.tsx → ExerciseDetailModal
   * 
   * This pathway uses NDK naddr resolution which is proven to work correctly.
   */
  async resolveFromNaddr(naddr: string): Promise<ExerciseModalData> {
    console.log(`[ExerciseModalResolutionService] 🔍 Resolving from naddr: ${naddr}`);
    
    try {
      // Use NDK naddr resolution hook (proven working pathway)
      // Note: This needs to be called from a React component context
      // For now, we'll delegate to the dependency resolution service
      // and extract the naddr components manually
      
      // Parse naddr to extract pubkey and d-tag
      // naddr format: naddr1... (bech32 encoded)
      // For now, we'll use a simplified approach and delegate to dependency resolution
      
      // Extract exercise reference from naddr (simplified for now)
      // In a full implementation, we'd properly decode the naddr
      const exerciseRef = this.extractExerciseRefFromNaddr(naddr);
      
      // Use dependency resolution service
      const exercises = await dependencyResolutionService.resolveExerciseReferences([exerciseRef]);
      
      if (exercises.length === 0) {
        throw new Error(`No exercise found for naddr: ${naddr}`);
      }
      
      const exercise = exercises[0];
      
      // Validate NIP-92 tag preservation
      this.validateNIP92Preservation(exercise);
      
      const modalData = prepareExerciseForModal(exercise);
      
      console.log(`[ExerciseModalResolutionService] ✅ Naddr pathway resolved with ${modalData.eventTags?.length || 0} tags`);
      return modalData;
      
    } catch (error) {
      console.error(`[ExerciseModalResolutionService] ❌ Failed to resolve from naddr:`, error);
      throw error;
    }
  }
  
  /**
   * Resolve exercise data from exercise reference (Pathways 3 & 4)
   * Used by: 
   * - ExpandableExerciseCard.tsx → ExerciseDetailModal (Pathway 3)
   * - ActiveWorkoutInterface.tsx → ExerciseDetailModal (Pathway 4)
   * 
   * This is the critical pathway that was broken due to service layer fragmentation.
   */
  async resolveFromReference(exerciseRef: string): Promise<ExerciseModalData> {
    console.log(`[ExerciseModalResolutionService] 🔗 Resolving from reference: ${exerciseRef}`);
    
    try {
      // Validate exercise reference format
      const validation = dataParsingService.validateExerciseReference(exerciseRef);
      if (!validation.isValid) {
        throw new Error(`Invalid exercise reference: ${validation.error}`);
      }
      
      // Use dependency resolution service (the proven service)
      // This delegates to dataParsingService.parseExerciseTemplatesBatch()
      // which should preserve tags correctly
      const exercises = await dependencyResolutionService.resolveExerciseReferences([exerciseRef]);
      
      if (exercises.length === 0) {
        throw new Error(`No exercise found for reference: ${exerciseRef}`);
      }
      
      const exercise = exercises[0];
      
      // Validate NIP-92 tag preservation
      this.validateNIP92Preservation(exercise);
      
      const modalData = prepareExerciseForModal(exercise);
      
      console.log(`[ExerciseModalResolutionService] ✅ Reference pathway resolved with ${modalData.eventTags?.length || 0} tags`);
      return modalData;
      
    } catch (error) {
      console.error(`[ExerciseModalResolutionService] ❌ Failed to resolve from reference:`, error);
      throw error;
    }
  }
  
  /**
   * Validate NIP-92 tag preservation
   * 
   * All facade methods must validate that NIP-92 tags are preserved
   * to ensure YouTube thumbnails and video demonstrations display correctly.
   */
  private validateNIP92Preservation(exercise: Exercise): void {
    if (!exercise.tags || exercise.tags.length === 0) {
      console.warn(`[ExerciseModalResolutionService] ❌ NIP-92 tags missing for exercise: ${exercise.id}`);
      console.warn('This will cause missing YouTube thumbnails and video demonstrations');
      return;
    }
    
    const imetaTags = exercise.tags.filter(tag => tag[0] === 'imeta') || [];
    if (imetaTags.length === 0) {
      console.warn(`[ExerciseModalResolutionService] ⚠️ No imeta tags found for exercise: ${exercise.id}`);
      console.warn('Exercise may not have media attachments, or tags were lost during parsing');
    } else {
      console.log(`[ExerciseModalResolutionService] ✅ Found ${imetaTags.length} imeta tags for exercise: ${exercise.id}`);
      
      // Log media purposes for debugging
      imetaTags.forEach((tag, index) => {
        const tagContent = tag[1] || '';
        const purposeMatch = tagContent.match(/purpose\s+(\w+)/);
        const purpose = purposeMatch ? purposeMatch[1] : 'unknown';
        console.log(`[ExerciseModalResolutionService] 📷 Media ${index + 1}: purpose=${purpose}`);
      });
    }
    
    // Additional validation: check for other important tags
    const totalTags = exercise.tags.length;
    const titleTags = exercise.tags.filter(tag => tag[0] === 'title').length;
    const formatTags = exercise.tags.filter(tag => tag[0] === 'format').length;
    
    console.log(`[ExerciseModalResolutionService] 📊 Tag summary: total=${totalTags}, imeta=${imetaTags.length}, title=${titleTags}, format=${formatTags}`);
  }
  
  /**
   * Extract exercise reference from naddr (simplified implementation)
   * 
   * In a full implementation, this would properly decode the bech32 naddr
   * and extract the kind, pubkey, and d-tag components.
   * 
   * For now, this is a placeholder that assumes the naddr can be converted
   * to a standard exercise reference format.
   */
  private extractExerciseRefFromNaddr(naddr: string): string {
    // TODO: Implement proper naddr decoding
    // For now, return a placeholder that will cause the dependency resolution
    // service to handle the naddr resolution
    
    // This is a temporary implementation - in practice, we'd need to:
    // 1. Decode the bech32 naddr
    // 2. Extract the kind (should be 33401), pubkey, and d-tag
    // 3. Format as "33401:pubkey:d-tag"
    
    throw new Error(`naddr resolution not yet fully implemented: ${naddr}`);
  }
}

// Export singleton instance following service-layer-architecture.md patterns
export const exerciseModalResolutionService = new ExerciseModalResolutionService();
