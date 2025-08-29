/**
 * Exercise Library Component
 * 
 * Displays the user's saved exercise collection (powr-exercise-list).
 * Auto-creates the collection if it doesn't exist and provides
 * functionality to add/remove exercises with filtering and search.
 * 
 * Features:
 * - Auto-creation of powr-exercise-list collection
 * - Exercise display using ExerciseCard component with click handling
 * - Filtering system (My Saved vs From Collections vs All)
 * - Search and sorting functionality
 * - Exercise detail modal integration
 * - Simple add/remove exercise actions (append-only for now)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Dumbbell, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Button } from '@/components/powr-ui/primitives/Button';
import { useLibraryData } from '@/providers/LibraryDataProvider';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import { usePubkey } from '@/lib/auth/hooks';
import { useToast } from '@/providers/ToastProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ExerciseCard } from '@/components/powr-ui/workout/ExerciseCard';
import { ExerciseListView } from './ExerciseListView';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ConfirmationDialog } from '@/components/powr-ui/primitives/ConfirmationDialog';
import { socialSharingService } from '@/lib/services/socialSharingService';
import { exerciseModalResolutionService } from '@/lib/services/exerciseModalResolution';
import type { ExerciseLibraryItem } from '@/hooks/useLibraryDataWithCollections';

interface ExerciseLibraryProps {
  onShowOnboarding?: () => void;
}

type FilterType = 'all' | 'my-saved' | 'from-collections';
export function ExerciseLibrary({ onShowOnboarding }: ExerciseLibraryProps) {
  const userPubkey = usePubkey();
  const { showToast } = useToast();
  // ✅ PERFORMANCE: Use shared library data from context (eliminates duplicate subscription)
  const { exerciseLibrary, error } = useLibraryData();
  
  // ✅ SIMPLE SOLUTION: Use JavaScript media query instead of complex Tailwind responsive classes
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  
  // Exercise detail modal state
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // CRUD operation state
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    exerciseRef: string;
    exerciseName: string;
  }>({
    isOpen: false,
    exerciseRef: '',
    exerciseName: ''
  });

  // Auto-create collection if it doesn't exist
  useEffect(() => {
    const createCollectionIfNeeded = async () => {
      if (!userPubkey || exerciseLibrary.isLoading || exerciseLibrary.content) {
        return;
      }

      // If we have no content and no error, the collection doesn't exist
      if (!exerciseLibrary.content && !error) {
        setIsCreatingCollection(true);
        
        try {
          await libraryManagementService.createLibraryCollection(
            userPubkey,
            'EXERCISE_LIBRARY',
            [] // Start with empty collection
          );
          
          // Collection will be automatically refetched by the hook
        } catch {
          // Collection creation failed - will be handled by error state
        } finally {
          setIsCreatingCollection(false);
        }
      }
    };

    createCollectionIfNeeded();
  }, [userPubkey, exerciseLibrary.isLoading, exerciseLibrary.content, error]);


  // Handle exercise click to open detail modal
  const handleExerciseClick = async (exerciseId: string) => {
    // Find the exercise item by ID
    const exerciseItem = exerciseLibrary.content?.find(item => 
      item.exercise.id === exerciseId || item.exerciseRef === exerciseId
    );
    
    if (exerciseItem) {
      try {
        // ✅ FACADE SERVICE: Use facade service to ensure consistent NIP-92 media preservation
        const modalData = await exerciseModalResolutionService.resolveFromLibraryExercise(exerciseItem.exercise);
        
        // Create a temporary exercise item with the resolved modal data
        const resolvedExerciseItem = {
          ...exerciseItem,
          exercise: {
            ...exerciseItem.exercise,
            // Ensure eventTags are properly set from the facade service
            eventTags: modalData.eventTags || exerciseItem.exercise.eventTags || []
          }
        };
        
        setSelectedExercise(resolvedExerciseItem);
        setIsModalOpen(true);
      } catch (error) {
        console.error('[ExerciseLibrary] Failed to resolve exercise for modal:', error);
        // Fallback to original behavior if facade service fails
        setSelectedExercise(exerciseItem);
        setIsModalOpen(true);
      }
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  // Handle remove exercise
  const handleRemoveExercise = (exerciseRef: string, exerciseName: string) => {
    setConfirmDialog({
      isOpen: true,
      exerciseRef,
      exerciseName
    });
  };

  // Confirm remove exercise
  const confirmRemoveExercise = async () => {
    if (!userPubkey || !confirmDialog.exerciseRef) return;

    setIsOperationLoading(true);
    try {
      await libraryManagementService.removeFromLibraryCollectionWithRefresh(
        userPubkey,
        'EXERCISE_LIBRARY',
        confirmDialog.exerciseRef
      );

      showToast(
        'Exercise removed',
        'success',
        `${confirmDialog.exerciseName} has been removed from your library`
      );

      // Close dialog
      setConfirmDialog({ isOpen: false, exerciseRef: '', exerciseName: '' });
      
      // Data will automatically refresh via LibraryDataProvider
    } catch {
      showToast(
        'Failed to remove exercise',
        'error',
        'Please try again'
      );
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Handle copy exercise NADDR
  const handleCopyExerciseNaddr = async (exerciseRef: string, exerciseName: string) => {
    try {
      const result = await socialSharingService.copyExerciseNaddr(exerciseRef);
      
      if (result.success) {
        showToast(
          'NADDR copied',
          'success',
          `${exerciseName} NADDR copied to clipboard`
        );
      } else {
        showToast(
          'Copy failed',
          'error',
          result.error || 'Failed to copy NADDR to clipboard'
        );
      }
    } catch {
      showToast(
        'Copy failed',
        'error',
        'Failed to copy NADDR to clipboard'
      );
    }
  };

  // Handle add exercise (placeholder for future implementation)
  const handleAddExercise = () => {
    showToast(
      'Add Exercise',
      'info',
      'Exercise discovery and adding functionality coming soon!'
    );
  };

  // Filter and sort exercises with enhanced content sources
  const processedExercises = React.useMemo(() => {
    if (!exerciseLibrary.content) return [];

    let filtered = exerciseLibrary.content;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.exercise.name.toLowerCase().includes(search) ||
        item.exercise.description?.toLowerCase().includes(search) ||
        item.exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(search))
      );
    }

    // ✅ ENHANCED: Apply type filter with actual content source differentiation
    switch (filterType) {
      case 'my-saved':
        // Show only exercises from user's personal collection
        // These are exercises where the user is the author OR explicitly saved to their collection
        filtered = filtered.filter(item => 
          item.exercise.authorPubkey === userPubkey || 
          item.exerciseRef.includes(`${userPubkey}:`)
        );
        break;
      case 'from-collections':
        // Show only exercises from subscribed collections (not user's own)
        filtered = filtered.filter(item => 
          item.exercise.authorPubkey !== userPubkey && 
          !item.exerciseRef.includes(`${userPubkey}:`)
        );
        break;
      case 'all':
      default:
        // Show all exercises (current behavior)
        break;
    }

    // Default sort by name, with secondary sort by author for consistency
    filtered.sort((a, b) => {
      const nameCompare = a.exercise.name.localeCompare(b.exercise.name);
      if (nameCompare !== 0) return nameCompare;
      return a.exercise.authorPubkey.localeCompare(b.exercise.authorPubkey);
    });

    return filtered;
  }, [exerciseLibrary.content, searchTerm, filterType, userPubkey]);

  // Loading state
  if (exerciseLibrary.isLoading || exerciseLibrary.isResolving || isCreatingCollection) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            {isCreatingCollection ? 'Setting up your exercise library...' : 'Loading exercises...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 rounded border border-destructive/20">
        <h3 className="font-medium mb-2 text-destructive">⚠️ Error Loading Exercise Library</h3>
        <p className="text-sm text-destructive/80 mb-3">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!exerciseLibrary.content || exerciseLibrary.content.length === 0) {
    return (
      <div className="text-center space-y-6 py-16">
        <Dumbbell className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">No Exercises Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your exercise library is ready! Add exercises from the Workouts tab or get started with our curated collection.
          </p>
        </div>
        {onShowOnboarding && (
          <Button onClick={onShowOnboarding} className="mt-4">
            Get Started with Exercises
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and controls */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Mobile: Compact dropdown, Desktop: Button group */}
        {isMobile ? (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All</option>
            <option value="my-saved">My Saved</option>
            <option value="from-collections">Collections</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              All
            </Button>
            <Button
              variant={filterType === 'my-saved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('my-saved')}
            >
              My Saved
            </Button>
            <Button
              variant={filterType === 'from-collections' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('from-collections')}
            >
              Collections
            </Button>
          </div>
        )}

        {/* Add Exercise Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-10 w-10 p-0 rounded-full flex-shrink-0"
          onClick={handleAddExercise}
          title="Add Exercise"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {processedExercises.length} result{processedExercises.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
        </div>
      )}

      {/* ✅ SIMPLE SOLUTION: JavaScript-based responsive rendering */}
      {processedExercises.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : isMobile ? (
        // Mobile: List View - Break out of container padding for full-width with bottom safe area
        <div className="-mx-6 pb-safe">
          <ExerciseListView
            exercises={processedExercises}
            isInLibrary={() => true} // All exercises in library are "in library"
            onAdd={() => {}} // Not used since all exercises are already in library
            onRemove={(exerciseRef) => {
              // Find the exercise to get its name
              const exerciseItem = exerciseLibrary.content?.find(item => 
                item.exerciseRef === exerciseRef
              );
              if (exerciseItem) {
                handleRemoveExercise(exerciseItem.exerciseRef, exerciseItem.exercise.name);
              }
            }}
            onMenuAction={(action, exerciseId) => {
              if (action === 'details') {
                handleExerciseClick(exerciseId);
              } else if (action === 'remove') {
                // Find the exercise to get its name and ref
                const exerciseItem = exerciseLibrary.content?.find(item => 
                  item.exercise.id === exerciseId || item.exerciseRef === exerciseId
                );
                if (exerciseItem) {
                  handleRemoveExercise(exerciseItem.exerciseRef, exerciseItem.exercise.name);
                }
              } else if (action === 'substitute') {
                // TODO: Implement substitute
              } else if (action === 'copy') {
                // Copy exercise NADDR to clipboard
                const exerciseItem = exerciseLibrary.content?.find(item => 
                  item.exercise.id === exerciseId || item.exerciseRef === exerciseId
                );
                if (exerciseItem) {
                  handleCopyExerciseNaddr(exerciseItem.exerciseRef, exerciseItem.exercise.name);
                }
              } else if (action === 'share') {
                // TODO: Implement share
              }
            }}
            onExerciseClick={handleExerciseClick}
            isLoading={exerciseLibrary.isLoading || exerciseLibrary.isResolving}
          />
        </div>
      ) : (
        // Desktop/Tablet: Card Grid with bottom safe area
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-safe">
          {processedExercises.map((item) => (
            <ExerciseCard
              key={item.exerciseRef}
              variant="discovery"
              exercise={{
                id: item.exercise.id,
                name: item.exercise.name,
                description: item.exercise.description,
                equipment: item.exercise.equipment,
                muscleGroups: item.exercise.muscleGroups,
                difficulty: item.exercise.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
                author: item.exercise.authorPubkey ? {
                  pubkey: item.exercise.authorPubkey,
                  name: undefined,
                  picture: undefined
                } : undefined,
                eventId: item.exercise.eventId,
                eventTags: item.exercise.eventTags || [],
                eventContent: item.exercise.description,
                eventKind: 33401
              }}
              onSelect={handleExerciseClick}
              onMenuAction={(action, exerciseId) => {
                if (action === 'details') {
                  handleExerciseClick(exerciseId);
                } else if (action === 'remove') {
                  // Find the exercise to get its name and ref
                  const exerciseItem = exerciseLibrary.content?.find(item => 
                    item.exercise.id === exerciseId || item.exerciseRef === exerciseId
                  );
                  if (exerciseItem) {
                    handleRemoveExercise(exerciseItem.exerciseRef, exerciseItem.exercise.name);
                  }
                } else if (action === 'copy') {
                  // Copy exercise NADDR to clipboard
                  const exerciseItem = exerciseLibrary.content?.find(item => 
                    item.exercise.id === exerciseId || item.exerciseRef === exerciseId
                  );
                  if (exerciseItem) {
                    handleCopyExerciseNaddr(exerciseItem.exerciseRef, exerciseItem.exercise.name);
                  }
                } else if (action === 'share') {
                  // TODO: Implement share
                }
              }}
              showAuthor={true}
              showEquipment={true}
            />
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={{
            id: selectedExercise.exercise.id,
            name: selectedExercise.exercise.name,
            description: selectedExercise.exercise.description,
            equipment: selectedExercise.exercise.equipment || '',
            difficulty: selectedExercise.exercise.difficulty,
            muscleGroups: selectedExercise.exercise.muscleGroups || [],
            format: selectedExercise.exercise.format,
            formatUnits: selectedExercise.exercise.format_units,
            authorPubkey: selectedExercise.exercise.authorPubkey || '',
            createdAt: selectedExercise.exercise.createdAt || Math.floor(Date.now() / 1000),
            eventId: selectedExercise.exercise.eventId,
            eventTags: selectedExercise.exercise.eventTags || [], // ✅ FIXED: Now passing the actual tags!
            eventContent: selectedExercise.exercise.description,
            eventKind: 33401
          }}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}

      {/* Remove Exercise Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, exerciseRef: '', exerciseName: '' })}
        onConfirm={confirmRemoveExercise}
        title="Remove Exercise"
        description={`Are you sure you want to remove "${confirmDialog.exerciseName}" from your exercise library? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isOperationLoading}
      />
    </div>
  );
}

export default ExerciseLibrary;
