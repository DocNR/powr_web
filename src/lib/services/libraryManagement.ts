/**
 * Library Management Service (Facade)
 * 
 * FACADE PATTERN for backward compatibility.
 * Delegates to focused services while maintaining existing API:
 * - LibraryCollectionService: Collection CRUD operations
 * - LibraryOnboardingService: Starter content and onboarding
 * - TemplateManagementService: Template creation and analysis
 * 
 * Existing code continues to work: libraryManagementService.methodName()
 * But internally uses the refactored, focused services.
 */

import { libraryCollectionService } from './libraryCollectionService';
import { libraryOnboardingService } from './libraryOnboardingService';
import { templateManagementService } from './templateManagementService';

// Re-export types and constants from the focused services
export type {
  LibraryCollection,
  ExerciseLibraryItem,
  WorkoutLibraryItem,
  CollectionSubscription,
  LibraryState,
  StarterContentValidation,
  POWRCollectionType,
  TemplateAnalysis,
  TemplateStructure,
  TemplateChangeAnalysis,
  StarterLibraryResult
} from './types/libraryTypes';

export { POWR_COLLECTION_DTAGS } from './types/libraryTypes';

/**
 * Library Management Service Facade
 * 
 * Maintains backward compatibility by delegating to focused services:
 * - Collection operations → LibraryCollectionService
 * - Onboarding operations → LibraryOnboardingService  
 * - Template operations → TemplateManagementService
 */
export class LibraryManagementService {

  // ===== COLLECTION OPERATIONS (delegate to LibraryCollectionService) =====

  /**
   * Get user's library collection by type
   * FACADE: Delegates to LibraryCollectionService
   */
  async getUserLibraryCollection(
    userPubkey: string, 
    collectionType: import('./types/libraryTypes').POWRCollectionType
  ): Promise<import('./types/libraryTypes').LibraryCollection | null> {
    return libraryCollectionService.getUserCollection(userPubkey, collectionType);
  }

  /**
   * Create new library collection with initial content
   * FACADE: Delegates to LibraryCollectionService
   */
  async createLibraryCollection(
    userPubkey: string,
    collectionType: import('./types/libraryTypes').POWRCollectionType,
    initialContentRefs: string[] = []
  ): Promise<import('./types/libraryTypes').LibraryCollection> {
    return libraryCollectionService.createCollection(userPubkey, collectionType, initialContentRefs);
  }

  /**
   * Add item to existing library collection
   * FACADE: Delegates to LibraryCollectionService
   */
  async addToLibraryCollection(
    userPubkey: string,
    collectionType: import('./types/libraryTypes').POWRCollectionType,
    itemRef: string
  ): Promise<void> {
    return libraryCollectionService.addToCollection(userPubkey, collectionType, itemRef);
  }

  /**
   * Remove item from existing library collection
   * FACADE: Delegates to LibraryCollectionService
   */
  async removeFromLibraryCollection(
    userPubkey: string,
    collectionType: import('./types/libraryTypes').POWRCollectionType,
    itemRef: string
  ): Promise<void> {
    return libraryCollectionService.removeFromCollection(userPubkey, collectionType, itemRef);
  }

  /**
   * Resolve library content with full dependency chain
   * FACADE: Delegates to LibraryCollectionService
   */
  async resolveLibraryContent(
    collection: import('./types/libraryTypes').LibraryCollection
  ): Promise<{
    exercises: import('./types/libraryTypes').ExerciseLibraryItem[];
    workouts: import('./types/libraryTypes').WorkoutLibraryItem[];
  }> {
    return libraryCollectionService.resolveCollectionContent(collection);
  }

  // ===== ONBOARDING OPERATIONS (delegate to LibraryOnboardingService) =====

  /**
   * Setup starter library for new users
   * FACADE: Delegates to LibraryOnboardingService
   */
  async setupStarterLibrary(
    userPubkey: string
  ): Promise<import('./types/libraryTypes').StarterLibraryResult> {
    return libraryOnboardingService.setupStarterLibrary(userPubkey);
  }

  /**
   * Validate and discover POWR starter content
   * FACADE: Delegates to LibraryOnboardingService
   */
  async validateStarterContent(): Promise<import('./types/libraryTypes').StarterContentValidation> {
    return libraryOnboardingService.validateStarterContent();
  }

  /**
   * Check if user has empty library (all three collection types)
   * FACADE: Delegates to LibraryOnboardingService
   */
  async isLibraryEmpty(userPubkey: string): Promise<boolean> {
    return libraryOnboardingService.isLibraryEmpty(userPubkey);
  }

  /**
   * Get recommended content for user discovery
   * FACADE: Delegates to LibraryOnboardingService
   */
  async getRecommendedContent(): Promise<{
    exercises: import('./dependencyResolution').Exercise[];
    workouts: import('./dependencyResolution').WorkoutTemplate[];
    collections: import('./dependencyResolution').Collection[];
  }> {
    return libraryOnboardingService.getRecommendedContent();
  }

  // ===== TEMPLATE OPERATIONS (delegate to TemplateManagementService) =====

  /**
   * Analyze template modifications to determine if save prompt should be shown
   * FACADE: Delegates to TemplateManagementService
   */
  analyzeTemplateModifications(
    modifications: any,
    originalTemplate: any,
    userPubkey: string
  ): import('./types/libraryTypes').TemplateAnalysis {
    return templateManagementService.analyzeTemplateModifications(modifications, originalTemplate, userPubkey);
  }

  /**
   * Generate smart template name based on original template and modifications
   * FACADE: Delegates to TemplateManagementService
   */
  generateSmartTemplateName(originalTemplate: any, modifications: any): string {
    return templateManagementService.generateSmartTemplateName(originalTemplate, modifications);
  }

  /**
   * Build template from workout structure
   * FACADE: Delegates to TemplateManagementService
   */
  buildTemplateFromWorkoutStructure(workoutData: any): import('./types/libraryTypes').TemplateStructure {
    return templateManagementService.buildTemplateFromWorkoutStructure(workoutData);
  }

  /**
   * Create new modified template with NIP-101e compliance
   * FACADE: Delegates to TemplateManagementService
   */
  async createModifiedTemplate(workoutData: any, userPubkey: string): Promise<any> {
    return templateManagementService.createModifiedTemplate(workoutData, userPubkey);
  }

  /**
   * Update existing template (owner-only, replaceable event)
   * FACADE: Delegates to TemplateManagementService
   */
  async updateExistingTemplate(templateData: any, originalTemplate: any): Promise<any> {
    return templateManagementService.updateExistingTemplate(templateData, originalTemplate);
  }

  /**
   * Simple template modification analysis for save prompt
   * FACADE: Delegates to TemplateManagementService
   */
  analyzeWorkoutForTemplateChanges(workoutData: any): import('./types/libraryTypes').TemplateChangeAnalysis {
    return templateManagementService.analyzeWorkoutForTemplateChanges(workoutData);
  }

  /**
   * Create template from custom workout (no original template)
   * FACADE: Delegates to TemplateManagementService
   */
  async createCustomTemplate(
    templateName: string,
    templateDescription: string,
    workoutData: any,
    userPubkey: string
  ): Promise<any> {
    return templateManagementService.createCustomTemplate(templateName, templateDescription, workoutData, userPubkey);
  }

  /**
   * Validate template data before creation/update
   * FACADE: Delegates to TemplateManagementService
   */
  validateTemplateData(templateData: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return templateManagementService.validateTemplateData(templateData);
  }

  /**
   * Generate template preview for user confirmation
   * FACADE: Delegates to TemplateManagementService
   */
  generateTemplatePreview(templateData: import('./types/libraryTypes').TemplateStructure): {
    name: string;
    type: string;
    description: string;
    exerciseCount: number;
    totalSets: number;
    estimatedDuration: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      weight: number;
    }>;
  } {
    return templateManagementService.generateTemplatePreview(templateData);
  }
}

// Export singleton instance following service-layer-architecture.md
export const libraryManagementService = new LibraryManagementService();
