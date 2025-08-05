/**
 * Workout Library Component
 * 
 * Displays the user's saved workout template collection (powr-workout-list).
 * Auto-creates the collection if it doesn't exist and provides
 * functionality to add/remove workout templates with filtering and search.
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
import { Search, Dumbbell, Plus, Trash2, Filter, Play } from 'lucide-react';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { useLibraryDataWithCollections } from '@/hooks/useLibraryDataWithCollections';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import { usePubkey } from '@/lib/auth/hooks';
import type { WorkoutLibraryItem } from '@/hooks/useLibraryDataWithCollections';

interface WorkoutLibraryProps {
  onShowOnboarding?: () => void;
  onStartWorkout?: (templateRef: string) => void;
}

type FilterType = 'all' | 'my-saved' | 'from-collections';
type SortType = 'name' | 'recent' | 'duration' | 'difficulty';

export function WorkoutLibrary({ onShowOnboarding, onStartWorkout }: WorkoutLibraryProps) {
  const userPubkey = usePubkey();
  const { workoutLibrary, error } = useLibraryDataWithCollections(userPubkey);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('name');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // Auto-create collection if it doesn't exist
  useEffect(() => {
    const createCollectionIfNeeded = async () => {
      if (!userPubkey || workoutLibrary.isLoading || workoutLibrary.content) {
        return;
      }

      // If we have no content and no error, the collection doesn't exist
      if (!workoutLibrary.content && !error) {
        console.log('[WorkoutLibrary] Auto-creating workout collection...');
        setIsCreatingCollection(true);
        
        try {
          await libraryManagementService.createLibraryCollection(
            userPubkey,
            'WORKOUT_LIBRARY',
            [] // Start with empty collection
          );
          
          console.log('[WorkoutLibrary] ✅ Workout collection created');
          
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

  // Handle remove workout (placeholder - not implemented in service yet)
  const handleRemoveWorkout = async (templateRef: string) => {
    console.log('[WorkoutLibrary] Remove workout not implemented yet:', templateRef);
    // TODO: Implement remove functionality when needed
  };

  // Handle start workout
  const handleStartWorkout = (templateRef: string) => {
    console.log('[WorkoutLibrary] Starting workout:', templateRef);
    onStartWorkout?.(templateRef);
  };

  // Filter and sort workouts
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

    // Apply type filter
    switch (filterType) {
      case 'my-saved':
        // For now, all workouts in the collection are "saved"
        // Future: could distinguish based on source
        break;
      case 'from-collections':
        // Future: filter workouts that came from subscribed collections
        break;
      case 'all':
      default:
        // Show all workouts
        break;
    }

    // Apply sorting
    switch (sortType) {
      case 'name':
        filtered.sort((a, b) => a.template.name.localeCompare(b.template.name));
        break;
      case 'recent':
        filtered.sort((a, b) => (b.template.createdAt || 0) - (a.template.createdAt || 0));
        break;
      case 'duration':
        filtered.sort((a, b) => (a.template.estimatedDuration || 0) - (b.template.estimatedDuration || 0));
        break;
      case 'difficulty':
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        filtered.sort((a, b) => {
          const aLevel = difficultyOrder[a.template.difficulty as keyof typeof difficultyOrder] || 0;
          const bLevel = difficultyOrder[b.template.difficulty as keyof typeof difficultyOrder] || 0;
          return aLevel - bLevel;
        });
        break;
    }

    return filtered;
  }, [workoutLibrary.content, searchTerm, filterType, sortType]);

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
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Workout Library</h2>
          <p className="text-sm text-muted-foreground">
            {workoutLibrary.content.length} workout{workoutLibrary.content.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Workout
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search workouts..."
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
            variant={sortType === 'duration' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('duration')}
          >
            Duration
          </Button>
          <Button
            variant={sortType === 'difficulty' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('difficulty')}
          >
            Difficulty
          </Button>
        </div>
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {processedWorkouts.length} result{processedWorkouts.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
        </div>
      )}

      {/* Workout grid */}
      {processedWorkouts.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workouts found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {processedWorkouts.map((item) => (
            <WorkoutCard
              key={item.templateRef}
              item={item}
              onRemove={() => handleRemoveWorkout(item.templateRef)}
              onStart={() => handleStartWorkout(item.templateRef)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Workout Card Component
 */
function WorkoutCard({ 
  item, 
  onRemove,
  onStart
}: { 
  item: WorkoutLibraryItem; 
  onRemove: () => void;
  onStart: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with actions */}
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {item.template.name}
            </h3>
            
            {showActions && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart();
                  }}
                  className="text-primary hover:text-primary"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Duration */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {formatDuration(item.template.estimatedDuration)}
            </Badge>
          </div>

          {/* Description */}
          {item.template.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.template.description}
            </p>
          )}

          {/* Exercise count and difficulty */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {item.template.exercises?.length || 0} exercise{(item.template.exercises?.length || 0) !== 1 ? 's' : ''}
            </span>
            
            {item.template.difficulty && (
              <Badge 
                variant={
                  item.template.difficulty === 'beginner' ? 'default' :
                  item.template.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                }
                className="text-xs"
              >
                {item.template.difficulty}
              </Badge>
            )}
          </div>

          {/* Start workout button (always visible on mobile) */}
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            className="w-full mt-2 gap-2 sm:hidden group-hover:flex"
            size="sm"
          >
            <Play className="h-4 w-4" />
            Start Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default WorkoutLibrary;
