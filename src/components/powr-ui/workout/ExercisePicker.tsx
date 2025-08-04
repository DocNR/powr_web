'use client';

/**
 * ExercisePicker Component
 * 
 * Modal exercise picker for adding/substituting exercises during active workouts.
 * Uses Sheet primitive for mobile-optimized interface with search and filtering.
 * Integrates with useLibraryCollections for exercise data access.
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/powr-ui/primitives/Sheet';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { ExerciseCard } from './ExerciseCard';
import { useLibraryCollections } from '@/hooks/useLibraryCollections';
import { usePubkey } from '@/lib/auth/hooks';
import { cn } from '@/lib/utils';
import { 
  EQUIPMENT_OPTIONS, 
  MUSCLE_GROUP_OPTIONS,
  type EquipmentType,
  type MuscleGroupType
} from '@/lib/constants/exerciseFilters';

// Exercise data types (matching ExerciseCard exactly)
interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  equipment: string;
  muscleGroups: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: {
    pubkey: string;
    name?: string;
    picture?: string;
  };
  eventId?: string;
  eventTags?: string[][];
  eventContent?: string;
  eventKind?: number;
}

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseRef: string) => void;
  onSelectMultipleExercises?: (exerciseRefs: string[]) => void;
  mode: 'single' | 'multiple';
  title?: string;
  description?: string;
  excludeExerciseRefs?: string[];
  filterByEquipment?: EquipmentType[];
  filterByMuscleGroups?: MuscleGroupType[];
  className?: string;
}

export const ExercisePicker = memo(function ExercisePicker({
  isOpen,
  onClose,
  onSelectExercise,
  onSelectMultipleExercises,
  mode = 'single',
  title = 'Select Exercise',
  description = 'Choose an exercise from your library',
  excludeExerciseRefs = [],
  filterByEquipment = [],
  filterByMuscleGroups = [],
  className
}: ExercisePickerProps) {
  const userPubkey = usePubkey();
  const { exerciseLibrary } = useLibraryCollections(userPubkey);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(filterByEquipment);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>(filterByMuscleGroups);
  const [selectedExerciseRefs, setSelectedExerciseRefs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Convert library exercises to ExerciseTemplate format
  const exercises: ExerciseTemplate[] = useMemo(() => {
    if (!exerciseLibrary.content) return [];
    
    return exerciseLibrary.content.map(item => ({
      id: item.exercise.id,
      name: item.exercise.name,
      description: item.exercise.description,
      equipment: item.exercise.equipment || 'bodyweight',
      muscleGroups: item.exercise.muscleGroups || [],
      difficulty: (item.exercise.difficulty === 'expert' ? 'advanced' : item.exercise.difficulty) as 'beginner' | 'intermediate' | 'advanced' | undefined,
      author: {
        pubkey: item.exercise.authorPubkey,
        name: undefined,
        picture: undefined
      },
      eventId: item.exercise.eventId,
      eventTags: undefined,
      eventContent: item.exercise.description,
      eventKind: 33401
    }));
  }, [exerciseLibrary.content]);

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    // Exclude specified exercises
    if (excludeExerciseRefs.length > 0) {
      filtered = filtered.filter(exercise => {
        const exerciseRef = `33401:${exercise.author?.pubkey}:${exercise.id}`;
        return !excludeExerciseRefs.includes(exerciseRef);
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.description?.toLowerCase().includes(query) ||
        exercise.equipment.toLowerCase().includes(query) ||
        exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(query))
      );
    }

    // Equipment filter
    if (selectedEquipment.length > 0) {
      filtered = filtered.filter(exercise =>
        selectedEquipment.includes(exercise.equipment)
      );
    }

    // Muscle group filter
    if (selectedMuscleGroups.length > 0) {
      filtered = filtered.filter(exercise =>
        exercise.muscleGroups.some(muscle => selectedMuscleGroups.includes(muscle))
      );
    }

    return filtered;
  }, [exercises, searchQuery, selectedEquipment, selectedMuscleGroups, excludeExerciseRefs]);

  // Handle exercise selection
  const handleExerciseSelect = useCallback((exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise || !exercise.author?.pubkey) return;

    const exerciseRef = `33401:${exercise.author.pubkey}:${exercise.id}`;

    if (mode === 'single') {
      onSelectExercise(exerciseRef);
      onClose();
    } else {
      // Multiple selection mode
      setSelectedExerciseRefs(prev => {
        if (prev.includes(exerciseRef)) {
          return prev.filter(ref => ref !== exerciseRef);
        } else {
          return [...prev, exerciseRef];
        }
      });
    }
  }, [exercises, mode, onSelectExercise, onClose]);

  // Handle multiple selection confirmation
  const handleConfirmMultipleSelection = useCallback(() => {
    if (selectedExerciseRefs.length > 0 && onSelectMultipleExercises) {
      onSelectMultipleExercises(selectedExerciseRefs);
      setSelectedExerciseRefs([]);
      onClose();
    }
  }, [selectedExerciseRefs, onSelectMultipleExercises, onClose]);

  // Handle equipment filter toggle
  const toggleEquipmentFilter = useCallback((equipment: string) => {
    setSelectedEquipment(prev => {
      if (prev.includes(equipment)) {
        return prev.filter(eq => eq !== equipment);
      } else {
        return [...prev, equipment];
      }
    });
  }, []);

  // Handle muscle group filter toggle
  const toggleMuscleGroupFilter = useCallback((muscleGroup: string) => {
    setSelectedMuscleGroups(prev => {
      if (prev.includes(muscleGroup)) {
        return prev.filter(mg => mg !== muscleGroup);
      } else {
        return [...prev, muscleGroup];
      }
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedEquipment([]);
    setSelectedMuscleGroups([]);
  }, []);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setSelectedExerciseRefs([]);
    onClose();
  }, [onClose]);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className={cn(
          // Override the default bottom sheet positioning
          "!inset-x-4 !bottom-4 !left-1/2 !-translate-x-1/2 !w-auto !max-w-md",
          "max-h-[60vh] sm:max-h-[50vh] flex flex-col",
          "modal-scrollable-content rounded-t-2xl border-t-2 border-border",
          className
        )}
      >
        <SheetHeader className="flex-shrink-0 pb-3">
          <SheetTitle className="text-workout-text">{title}</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {description}
          </SheetDescription>
        </SheetHeader>

        {/* Search and Compact Filters */}
        <div className="flex-shrink-0 space-y-3 pb-3 border-b border-border">
          {/* Search Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              🔍
            </div>
          </div>

          {/* Compact Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm"
            >
              Filters {(selectedEquipment.length + selectedMuscleGroups.length > 0) && `(${selectedEquipment.length + selectedMuscleGroups.length})`}
            </Button>
            
            {/* Quick filter summary */}
            {(selectedEquipment.length > 0 || selectedMuscleGroups.length > 0 || searchQuery.trim()) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {filteredExercises.length} found
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              {/* Equipment Filters - Compact */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-workout-text uppercase tracking-wide">Equipment</h4>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT_OPTIONS.map(equipment => (
                    <Badge
                      key={equipment}
                      variant={selectedEquipment.includes(equipment) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-colors text-xs px-2 py-1",
                        selectedEquipment.includes(equipment) 
                          ? "bg-workout-active text-white border-workout-active" 
                          : "hover:bg-workout-surface border-border"
                      )}
                      onClick={() => toggleEquipmentFilter(equipment)}
                    >
                      {equipment.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Muscle Group Filters - Compact */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-workout-text uppercase tracking-wide">Muscle Groups</h4>
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLE_GROUP_OPTIONS.map(muscleGroup => (
                    <Badge
                      key={muscleGroup}
                      variant={selectedMuscleGroups.includes(muscleGroup) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-colors text-xs px-2 py-1",
                        selectedMuscleGroups.includes(muscleGroup) 
                          ? "bg-workout-active text-white border-workout-active" 
                          : "hover:bg-workout-surface border-border"
                      )}
                      onClick={() => toggleMuscleGroupFilter(muscleGroup)}
                    >
                      {muscleGroup}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exercise List - More space for content */}
        <div className="flex-1 overflow-y-auto space-y-2 py-3 px-1">
          {exerciseLibrary.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-workout-active mx-auto mb-3"></div>
                <div className="text-muted-foreground text-sm">Loading exercises...</div>
              </div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-2">
                {exercises.length === 0 ? 'No exercises in your library' : 'No exercises match your filters'}
              </div>
              {exercises.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Add exercises to your library from the Library tab
                </div>
              )}
            </div>
          ) : (
            filteredExercises.map(exercise => {
              const exerciseRef = `33401:${exercise.author?.pubkey}:${exercise.id}`;
              const isSelected = selectedExerciseRefs.includes(exerciseRef);
              
              return (
                <div
                  key={exercise.id}
                  className={cn(
                    "relative",
                    mode === 'multiple' && isSelected && "ring-2 ring-workout-active rounded-lg"
                  )}
                >
                  <ExerciseCard
                    variant="list"
                    exercise={exercise}
                    onSelect={handleExerciseSelect}
                    showAuthor={true}
                    showEquipment={true}
                    className={cn(
                      "transition-colors",
                      mode === 'multiple' && isSelected && "bg-workout-surface"
                    )}
                  />
                  {mode === 'multiple' && isSelected && (
                    <div className="absolute top-2 right-2 bg-workout-active text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                      ✓
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Multiple Selection Footer */}
        {mode === 'multiple' && (
          <div className="flex-shrink-0 pt-3 border-t border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {selectedExerciseRefs.length} exercise{selectedExerciseRefs.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmMultipleSelection}
                  disabled={selectedExerciseRefs.length === 0}
                  className="bg-workout-active hover:bg-workout-active/90 text-white"
                  size="sm"
                >
                  Add {selectedExerciseRefs.length > 0 ? `(${selectedExerciseRefs.length})` : ''}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});

ExercisePicker.displayName = 'ExercisePicker';
