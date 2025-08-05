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
import { useLibraryDataWithCollections } from '@/hooks/useLibraryDataWithCollections';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import { usePubkey } from '@/lib/auth/hooks';
import { ExerciseCard } from '@/components/powr-ui/workout/ExerciseCard';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import type { ExerciseLibraryItem } from '@/hooks/useLibraryDataWithCollections';

interface ExerciseLibraryProps {
  onShowOnboarding?: () => void;
}

type FilterType = 'all' | 'my-saved' | 'from-collections';
type SortType = 'name' | 'recent' | 'muscle-group';

export function ExerciseLibrary({ onShowOnboarding }: ExerciseLibraryProps) {
  const userPubkey = usePubkey();
  const { exerciseLibrary, error } = useLibraryDataWithCollections(userPubkey);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('name');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  
  // Exercise detail modal state
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-create collection if it doesn't exist
  useEffect(() => {
    const createCollectionIfNeeded = async () => {
      if (!userPubkey || exerciseLibrary.isLoading || exerciseLibrary.content) {
        return;
      }

      // If we have no content and no error, the collection doesn't exist
      if (!exerciseLibrary.content && !error) {
        console.log('[ExerciseLibrary] Auto-creating exercise collection...');
        setIsCreatingCollection(true);
        
        try {
          await libraryManagementService.createLibraryCollection(
            userPubkey,
            'EXERCISE_LIBRARY',
            [] // Start with empty collection
          );
          
          console.log('[ExerciseLibrary] ✅ Exercise collection created');
          
          // Collection will be automatically refetched by the hook
        } catch (error) {
          console.error('[ExerciseLibrary] Failed to create collection:', error);
        } finally {
          setIsCreatingCollection(false);
        }
      }
    };

    createCollectionIfNeeded();
  }, [userPubkey, exerciseLibrary.isLoading, exerciseLibrary.content, error]);


  // Handle exercise click to open detail modal
  const handleExerciseClick = (exerciseId: string) => {
    console.log('[ExerciseLibrary] Opening exercise detail modal for ID:', exerciseId);
    
    // Find the exercise item by ID
    const exerciseItem = exerciseLibrary.content?.find(item => 
      item.exercise.id === exerciseId || item.exerciseRef === exerciseId
    );
    
    if (exerciseItem) {
      console.log('[ExerciseLibrary] Found exercise:', exerciseItem.exercise.name);
      setSelectedExercise(exerciseItem);
      setIsModalOpen(true);
    } else {
      console.warn('[ExerciseLibrary] Exercise not found for ID:', exerciseId);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  // Filter and sort exercises
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

    // Apply type filter
    switch (filterType) {
      case 'my-saved':
        // For now, all exercises in the collection are "saved"
        // Future: could distinguish based on source
        break;
      case 'from-collections':
        // Future: filter exercises that came from subscribed collections
        break;
      case 'all':
      default:
        // Show all exercises
        break;
    }

    // Apply sorting
    switch (sortType) {
      case 'name':
        filtered.sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));
        break;
      case 'recent':
        filtered.sort((a, b) => (b.exercise.createdAt || 0) - (a.exercise.createdAt || 0));
        break;
      case 'muscle-group':
        filtered.sort((a, b) => {
          const aGroup = a.exercise.muscleGroups[0] || '';
          const bGroup = b.exercise.muscleGroups[0] || '';
          return aGroup.localeCompare(bGroup);
        });
        break;
    }

    return filtered;
  }, [exerciseLibrary.content, searchTerm, filterType, sortType]);

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
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Exercise Library</h2>
          <p className="text-sm text-muted-foreground">
            {exerciseLibrary.content.length} exercise{exerciseLibrary.content.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter buttons */}
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

        {/* Sort buttons */}
        <div className="flex gap-2">
          <Button
            variant={sortType === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('name')}
          >
            Name
          </Button>
          <Button
            variant={sortType === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('recent')}
          >
            Recent
          </Button>
          <Button
            variant={sortType === 'muscle-group' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('muscle-group')}
          >
            Muscle
          </Button>
        </div>
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {processedExercises.length} result{processedExercises.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
        </div>
      )}

      {/* Exercise grid */}
      {processedExercises.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                eventTags: undefined,
                eventContent: item.exercise.description,
                eventKind: 33401
              }}
              onSelect={handleExerciseClick}
              onMenuAction={(action, exerciseId) => {
                console.log('[ExerciseLibrary] Menu action:', action, 'for exercise:', exerciseId);
                if (action === 'details') {
                  handleExerciseClick(exerciseId);
                } else if (action === 'library') {
                  // TODO: Implement add to library
                } else if (action === 'copy') {
                  // TODO: Implement copy naddr
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
          exercise={selectedExercise.exercise}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default ExerciseLibrary;
