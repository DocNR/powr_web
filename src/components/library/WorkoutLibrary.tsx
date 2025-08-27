/**
 * Workout Library Component
 * 
 * Displays the user's saved workout template collection (powr-workout-list).
 * Auto-creates the collection if it doesn't exist and provides
 * functionality to add/remove workout templates with filtering and search.
 * 
 * REWRITTEN FROM SCRATCH: Based on working ExerciseLibrary.tsx pattern
 * 
 * Features:
 * - Auto-creation of powr-workout-list collection
 * - Workout template display using WorkoutCard discovery variant
 * - Filtering system (My Saved vs From Collections vs All)
 * - Search and sorting functionality
 * - Template preview and "Start Workout" integration
 * - Simple add/remove workout actions (append-only for now)
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
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard';
import { WorkoutListView } from './WorkoutListView';
import { ConfirmationDialog } from '@/components/powr-ui/primitives/ConfirmationDialog';
import { socialSharingService } from '@/lib/services/socialSharingService';

interface WorkoutLibraryProps {
  onShowOnboarding?: () => void;
  onStartWorkout?: (templateRef: string) => void;
}

type FilterType = 'all' | 'my-saved' | 'from-collections';
export function WorkoutLibrary({ onShowOnboarding, onStartWorkout }: WorkoutLibraryProps) {
  const userPubkey = usePubkey();
  const { showToast } = useToast();
  // ✅ PERFORMANCE: Use shared library data from context (eliminates duplicate subscription)
  const { workoutLibrary, error } = useLibraryData();
  
  // Responsive behavior - same as ExerciseLibrary
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // CRUD operation state
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    templateRef: string;
    templateName: string;
  }>({
    isOpen: false,
    templateRef: '',
    templateName: ''
  });

  // Auto-create collection if it doesn't exist
  useEffect(() => {
    const createCollectionIfNeeded = async () => {
      if (!userPubkey || workoutLibrary.isLoading || workoutLibrary.content) {
        return;
      }

      // If we have no content and no error, the collection doesn't exist
      if (!workoutLibrary.content && !error) {
        setIsCreatingCollection(true);
        
        try {
          await libraryManagementService.createLibraryCollection(
            userPubkey,
            'WORKOUT_LIBRARY',
            [] // Start with empty collection
          );
          
          // Collection will be automatically refetched by the hook
        } catch (error) {
          console.error('[WorkoutLibrary] Failed to create collection:', error);
        } finally {
          setIsCreatingCollection(false);
        }
      }
    };

    createCollectionIfNeeded();
  }, [userPubkey, workoutLibrary.isLoading, workoutLibrary.content, error]);

  // Handle remove workout
  const handleRemoveWorkout = (templateRef: string, templateName: string) => {
    setConfirmDialog({
      isOpen: true,
      templateRef,
      templateName
    });
  };

  // Confirm remove workout - EXACT SAME PATTERN AS EXERCISELIBRARY
  const confirmRemoveWorkout = async () => {
    if (!userPubkey || !confirmDialog.templateRef) return;

    setIsOperationLoading(true);
    try {
      await libraryManagementService.removeFromLibraryCollectionWithRefresh(
        userPubkey,
        'WORKOUT_LIBRARY',
        confirmDialog.templateRef
      );

      showToast(
        'Workout removed',
        'success',
        `${confirmDialog.templateName} has been removed from your library`
      );

      // Close dialog
      setConfirmDialog({ isOpen: false, templateRef: '', templateName: '' });
      
      // Data will automatically refresh via LibraryDataProvider
    } catch (error) {
      console.error('[WorkoutLibrary] Failed to remove workout:', error);
      showToast(
        'Failed to remove workout',
        'error',
        'Please try again'
      );
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Handle copy NADDR functionality
  const handleCopyNaddr = async (templateRef: string, templateName: string) => {
    try {
      const result = await socialSharingService.copyTemplateNaddr(templateRef);
      
      if (result.success) {
        showToast(
          'NADDR Copied!',
          'success',
          `${templateName} link copied to clipboard`
        );
      } else {
        showToast(
          'Copy Failed',
          'error',
          result.error || 'Failed to copy NADDR to clipboard'
        );
      }
    } catch (error) {
      console.error('[WorkoutLibrary] Failed to copy NADDR:', error);
      showToast(
        'Copy Failed',
        'error',
        'An unexpected error occurred'
      );
    }
  };

  // Handle add workout (placeholder for future implementation)
  const handleAddWorkout = () => {
    showToast(
      'Add Workout',
      'info',
      'Workout discovery and adding functionality coming soon!'
    );
  };

  // Filter and sort workouts - ENHANCED FOR ITEM 10: Content source differentiation
  const processedWorkouts = React.useMemo(() => {
    if (!workoutLibrary.content) return [];

    let filtered = workoutLibrary.content;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.template.name.toLowerCase().includes(search) ||
        item.template.description?.toLowerCase().includes(search)
      );
    }

    // ✅ ITEM 10: Enhanced content source filtering
    switch (filterType) {
      case 'my-saved':
        // Show only user's own workout templates
        filtered = filtered.filter(item => 
          item.template.authorPubkey === userPubkey || 
          item.templateRef.includes(`${userPubkey}:`)
        );
        break;
      case 'from-collections':
        // Show only workouts from subscribed collections (not user's own)
        filtered = filtered.filter(item => 
          item.template.authorPubkey !== userPubkey && 
          !item.templateRef.includes(`${userPubkey}:`)
        );
        break;
      case 'all':
      default:
        // Show all workouts (user's saved + from collections)
        break;
    }

    // Default sort by name
    filtered.sort((a, b) => a.template.name.localeCompare(b.template.name));

    return filtered;
  }, [workoutLibrary.content, searchTerm, filterType, userPubkey]);

  // Loading state
  if (workoutLibrary.isLoading || workoutLibrary.isResolving || isCreatingCollection) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            {isCreatingCollection ? 'Setting up your workout library...' : 'Loading workouts...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 rounded border border-destructive/20">
        <h3 className="font-medium mb-2 text-destructive">⚠️ Error Loading Workout Library</h3>
        <p className="text-sm text-destructive/80 mb-3">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!workoutLibrary.content || workoutLibrary.content.length === 0) {
    return (
      <div className="text-center space-y-6 py-16">
        <Dumbbell className="h-16 w-16 text-muted-foreground/50 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">No Workouts Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your workout library is ready! Save workout templates from the Workouts tab or get started with our curated collection.
          </p>
        </div>
        {onShowOnboarding && (
          <Button onClick={onShowOnboarding} className="mt-4">
            Get Started with Workouts
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
            placeholder="Search workouts..."
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

        {/* Add Workout Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-10 w-10 p-0 rounded-full flex-shrink-0"
          onClick={handleAddWorkout}
          title="Add Workout"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {processedWorkouts.length} result{processedWorkouts.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
        </div>
      )}

      {/* Responsive workout display - same pattern as ExerciseLibrary */}
      {processedWorkouts.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workouts found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : isMobile ? (
        // Mobile: List view - Break out of container padding for full-width + bottom safe area
        <div className="-mx-6 pb-safe">
          <WorkoutListView
            workouts={processedWorkouts}
            onWorkoutSelect={onStartWorkout}
            onMenuAction={async (action, templateRef) => {
              const workoutItem = workoutLibrary.content?.find(item => 
                item.templateRef === templateRef || item.template.id === templateRef
              );
              
              if (!workoutItem) {
                console.error('❌ [WorkoutLibrary] Workout not found for ref:', templateRef);
                return;
              }
              
              if (action === 'remove') {
                handleRemoveWorkout(workoutItem.templateRef, workoutItem.template.name);
              } else if (action === 'start' || action === 'menu') {
                onStartWorkout?.(workoutItem.templateRef);
              } else if (action === 'details') {
                // Open workout detail modal - same as clicking the workout item
                onStartWorkout?.(workoutItem.templateRef);
              } else if (action === 'copy') {
                await handleCopyNaddr(workoutItem.templateRef, workoutItem.template.name);
              }
            }}
          />
        </div>
      ) : (
        // Desktop: Grid view with bottom safe area padding
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-safe">
          {processedWorkouts.map((item) => (
            <WorkoutCard
              key={item.templateRef}
              variant="discovery"
              workout={{
                ...item.template,
                title: item.template.name, // Map name to title for WorkoutCard
                estimatedDuration: item.template.estimatedDuration || 30, // Provide default
                difficulty: (item.template.difficulty === 'beginner' || item.template.difficulty === 'intermediate' || item.template.difficulty === 'advanced') 
                  ? item.template.difficulty 
                  : 'intermediate', // Cast to valid difficulty or default
                tags: item.template.tags.flat(), // Flatten tags array
                exercises: item.template.exercises.map(ex => ({
                  name: ex.exerciseRef, // Use exerciseRef as name for now
                  sets: ex.sets || 3,
                  reps: ex.reps || 10,
                  weight: ex.weight
                }))
              }}
              onSelect={() => onStartWorkout?.(item.templateRef)}
              onMenuAction={async (action, workoutId) => {
                // ✅ FIX: More robust lookup like ExerciseLibrary - dual lookup prevents failures
                const workoutItem = workoutLibrary.content?.find(item => 
                  item.template.id === workoutId || item.templateRef === workoutId
                );
                
                if (!workoutItem) {
                  console.error('❌ [WorkoutLibrary] Workout not found for ID:', workoutId);
                  return;
                }
                
                if (action === 'remove') {
                  handleRemoveWorkout(workoutItem.templateRef, workoutItem.template.name);
                } else if (action === 'start') {
                  onStartWorkout?.(workoutItem.templateRef);
                } else if (action === 'details') {
                  // Open workout detail modal - same as clicking the workout item
                  onStartWorkout?.(workoutItem.templateRef);
                } else if (action === 'copy') {
                  await handleCopyNaddr(workoutItem.templateRef, workoutItem.template.name);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Remove Workout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, templateRef: '', templateName: '' })}
        onConfirm={confirmRemoveWorkout}
        title="Remove Workout"
        description={`Are you sure you want to remove "${confirmDialog.templateName}" from your workout library? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isOperationLoading}
      />
    </div>
  );
}

export default WorkoutLibrary;
