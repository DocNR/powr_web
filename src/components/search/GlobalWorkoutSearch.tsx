'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, ArrowLeft, Link } from 'lucide-react';
import { useNDKSearch } from '@/hooks/useNDKSearch';
import { useNDKNaddrResolution } from '@/hooks/useNDKNaddrResolution';
import { WorkoutTemplate } from '@/lib/services/searchService';
import { WorkoutCard } from '@/components/powr-ui/workout';
import { ExerciseCard } from '@/components/powr-ui/workout/ExerciseCard';
import { ExerciseDetailModal } from '@/components/library/ExerciseDetailModal';
import { dataParsingService } from '@/lib/services/dataParsingService';
import { exerciseModalResolutionService } from '@/lib/services/exerciseModalResolution';
import { WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Input } from '@/components/powr-ui/primitives/Input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface GlobalWorkoutSearchProps {
  onTemplateSelect?: (template: WorkoutTemplate) => void;
  onWorkoutSelect?: (templateReference: string) => void;
  className?: string;
}

export function GlobalWorkoutSearch({ 
  onTemplateSelect,
  onWorkoutSelect,
  className = ""
}: GlobalWorkoutSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Exercise Detail Modal state
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string;
    name: string;
    description?: string;
    equipment: string;
    difficulty?: string;
    muscleGroups: string[];
    format?: string[];
    formatUnits?: string[];
    authorPubkey: string;
    createdAt?: number;
    eventId?: string;
    eventTags?: string[][];
    eventContent?: string;
    eventKind?: number;
  } | null>(null);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  
  const {
    searchState,
    searchTemplates,
    clearSearch,
    isSearchActive
  } = useNDKSearch();

  // Detect if input is NADDR - moved before hook usage
  const isNaddrInput = (input: string): boolean => {
    return input.trim().startsWith('naddr1') && input.trim().length > 20;
  };

  // NADDR resolution hook - pass the NADDR as parameter
  const naddrToResolve = isNaddrInput(searchTerm) ? searchTerm.trim() : null;
  const {
    resolve: resolveNaddr,
    loading: isResolvingNaddr,
    event: resolvedEvent,
    error: naddrError,
    reset: clearResolution
  } = useNDKNaddrResolution(naddrToResolve, { autoResolve: false });

  // Handle search with debouncing - supports both text and NADDR
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const trimmedTerm = searchTerm.trim();
      
      if (trimmedTerm.length === 0) {
        clearSearch();
        clearResolution();
        return;
      }

      if (isNaddrInput(trimmedTerm)) {
        // Handle NADDR resolution
        console.log('🔗 [Search] Detected NADDR input, resolving:', trimmedTerm);
        await resolveNaddr();
      } else if (trimmedTerm.length >= 2) {
        // Handle text search
        console.log('🔍 [Search] Text search for:', trimmedTerm);
        clearResolution(); // Clear any previous NADDR results
        searchTemplates(trimmedTerm);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchTemplates, clearSearch, resolveNaddr, clearResolution]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
    clearResolution();
    inputRef.current?.focus();
  };

  const handleWorkoutSelect = (workoutId: string) => {
    let selectedTemplate: WorkoutTemplate | null = null;

    // Check if this is from NADDR resolution - only for workout templates (33402)
    if (resolvedEvent && resolvedEvent.kind === WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE) {
      const parsedTemplate = dataParsingService.parseWorkoutTemplate(resolvedEvent);
      if (parsedTemplate && (resolvedEvent.id === workoutId || parsedTemplate.id === workoutId)) {
        selectedTemplate = {
          id: parsedTemplate.id,
          name: parsedTemplate.name,
          description: parsedTemplate.description,
          author: parsedTemplate.authorPubkey,
          exerciseRefs: parsedTemplate.exercises.map(ex => ex.exerciseRef),
          created_at: parsedTemplate.createdAt,
          tags: parsedTemplate.tags?.filter(tag => tag[0] === 't').map(tag => tag[1]) || [],
          rating: undefined
        };
        console.log('🔗 [Search] Selected NADDR-resolved template:', selectedTemplate);
      }
    }
    
    // If not found in NADDR results, check search results
    if (!selectedTemplate) {
      selectedTemplate = searchState.templates.find(t => t.id === workoutId) || null;
      if (selectedTemplate) {
        console.log('🔍 [Search] Selected text search template:', selectedTemplate);
      } else {
        console.error('❌ [Search] Template not found in either NADDR or search results:', workoutId);
        return;
      }
    }

    // If custom template handler provided, use it
    if (onTemplateSelect && selectedTemplate) {
      onTemplateSelect(selectedTemplate);
      setIsOpen(false);
      setSearchTerm('');
      clearSearch();
      clearResolution();
      return;
    }

    // If custom workout handler provided, use it
    if (onWorkoutSelect && selectedTemplate) {
      const templateReference = `33402:${selectedTemplate.author}:${selectedTemplate.id}`;
      console.log('🚀 [Search] Calling onWorkoutSelect with template:', templateReference);
      onWorkoutSelect(templateReference);
      setIsOpen(false);
      setSearchTerm('');
      clearSearch();
      clearResolution();
      return;
    }

    // Fallback: just log the selection
    console.log('🔍 [Search] Template selected but no handlers provided:', selectedTemplate);
    setIsOpen(false);
    setSearchTerm('');
    clearSearch();
    clearResolution();
  };


  // Transform search results to WorkoutCard format
  const transformTemplateToWorkoutCard = (template: WorkoutTemplate) => {
    return {
      id: template.id,
      title: template.name,
      description: template.description,
      exercises: template.exerciseRefs.map((ref, index) => ({
        name: `Exercise ${index + 1}`, // We don't have exercise names in search results
        sets: 3, // Default values since we don't have detailed exercise data
        reps: 10,
        weight: 0
      })),
      estimatedDuration: 30, // Default duration
      difficulty: 'intermediate' as const,
      tags: template.tags,
      author: {
        pubkey: template.author,
        name: template.author.slice(0, 8) + '...', // Truncated pubkey as name
        picture: undefined
      },
      eventId: `${template.author}-${template.id}`,
      // ✅ CRITICAL: Add missing fields for WorkoutDetailModal compatibility
      templateRef: `33402:${template.author}:${template.id}`, // Required for modal functionality
      eventTags: [
        ['d', template.id],
        ['title', template.name],
        ['t', 'fitness']
      ],
      eventContent: template.description || '',
      eventKind: 33402
    };
  };

  const getStatusText = () => {
    // NADDR resolution status
    if (isResolvingNaddr) {
      return "Resolving NADDR...";
    }
    
    if (naddrError) {
      return `NADDR Error: ${naddrError}`;
    }
    
    if (resolvedEvent) {
      return "✅ NADDR resolved successfully";
    }
    
    // Text search status
    if (searchState.isSearching) {
      return "Searching Nostr network...";
    }
    
    if (searchState.error) {
      return `Search Error: ${searchState.error}`;
    }
    
    if (isSearchActive && searchState.totalFound > 0) {
      return `Found ${searchState.totalFound} workout${searchState.totalFound === 1 ? '' : 's'} (${searchState.searchTime}ms)`;
    }
    
    if (isSearchActive && searchState.totalFound === 0 && searchTerm.length >= 2 && !isNaddrInput(searchTerm)) {
      return "No workouts found";
    }
    
    return "";
  };

  const statusText = getStatusText();

  return (
    <>
      {/* Search Trigger Button - Clean Design */}
      <Button
        variant="ghost"
        size="default"
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative h-10 px-4 rounded-lg",
          "hover:bg-muted/50",
          "transition-all duration-200",
          "flex items-center gap-2",
          "text-muted-foreground hover:text-foreground",
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">Search</span>
        <span className="sr-only">Search workouts across Nostr network</span>
      </Button>

      {/* Search Modal - Full Screen Dialog like ActiveWorkoutInterface */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search Workouts</DialogTitle>
            <DialogDescription>
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-full bg-background overflow-hidden pb-[env(safe-area-inset-bottom)] flex flex-col">
            {/* Header - Matches ActiveWorkoutInterface pattern with back button */}
            <div className="flex items-center justify-between p-4 bg-background border-b border-border flex-shrink-0">
              {/* Back Button - Matches ActiveWorkoutInterface */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                title="Back to previous screen"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Title */}
              <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold">Search Workouts</h2>
              </div>

              {/* Empty space for balance */}
              <div className="w-10"></div>
            </div>


            {/* Search Input */}
            <div className="relative mb-6 flex-shrink-0 px-6">
            <div className={`
              relative flex items-center
              bg-muted/50 
              border border-border
              rounded-lg transition-all duration-200
              ${isFocused ? 'ring-2 ring-primary border-primary' : 'hover:border-border/80'}
              ${searchState.isSearching ? 'bg-primary/5' : ''}
            `}>
              {/* Search Icon - changes based on input type */}
              {isNaddrInput(searchTerm) ? (
                <Link className={`
                  w-5 h-5 ml-3 transition-colors duration-200
                  ${isResolvingNaddr 
                    ? 'text-primary animate-pulse' 
                    : 'text-blue-500'
                  }
                `} />
              ) : (
                <Search className={`
                  w-5 h-5 ml-3 transition-colors duration-200
                  ${searchState.isSearching 
                    ? 'text-primary animate-pulse' 
                    : 'text-muted-foreground'
                  }
                `} />
              )}
              
              {/* Input Field */}
              <Input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search workouts or paste NADDR..."
                autoFocus
                className="
                  flex-1 border-none bg-transparent
                  focus-visible:ring-0 focus-visible:ring-offset-0
                  placeholder:text-muted-foreground/60
                  text-base md:text-sm
                "
              />
              
              {/* Clear Button */}
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="mr-1 h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>

            {/* Status/Results Info */}
            {statusText && (
              <div className={`
                mt-2 px-1 text-sm
                ${searchState.error 
                  ? 'text-destructive' 
                  : 'text-muted-foreground'
                }
              `}>
                {statusText}
              </div>
            )}
          </div>

            {/* Search Tips (shown when no search term) */}
            {!searchTerm && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50 mx-6">
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-2">Search Options:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Text Search:</strong> &ldquo;chest day&rdquo;, &ldquo;legs&rdquo;, &ldquo;beginner&rdquo;</li>
                    <li>• <strong>NADDR Resolution:</strong> Paste &ldquo;naddr1...&rdquo; for direct workout access</li>
                    <li>• Search by muscle group: &ldquo;chest&rdquo;, &ldquo;shoulders&rdquo;, &ldquo;core&rdquo;</li>
                    <li>• Results come from the entire Nostr network</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {(searchState.isSearching || isResolvingNaddr) && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  {isResolvingNaddr ? 'Resolving NADDR...' : 'Searching Nostr relays for workouts...'}
                </div>
              </div>
            )}

            {/* NADDR Resolution Result */}
            {resolvedEvent && (
              <div className="flex-1 overflow-y-auto px-6 py-1">
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Link className="h-4 w-4" />
                    <span className="font-medium">NADDR Resolved</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {resolvedEvent.kind === WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE 
                      ? 'Direct exercise access via Nostr address'
                      : 'Direct workout access via Nostr address'
                    }
                  </p>
                </div>
                <div className="space-y-3 pb-4">
                  {resolvedEvent.kind === WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE ? (
                    // Show workout template as WorkoutCard
                    (() => {
                      const parsedTemplate = dataParsingService.parseWorkoutTemplate(resolvedEvent);
                      if (parsedTemplate) {
                        const workoutTemplate: WorkoutTemplate = {
                          id: parsedTemplate.id,
                          name: parsedTemplate.name,
                          description: parsedTemplate.description,
                          author: parsedTemplate.authorPubkey,
                          exerciseRefs: parsedTemplate.exercises.map(ex => ex.exerciseRef),
                          created_at: parsedTemplate.createdAt,
                          tags: parsedTemplate.tags?.filter(tag => tag[0] === 't').map(tag => tag[1]) || [],
                          rating: undefined
                        };
                        const workoutCardData = transformTemplateToWorkoutCard(workoutTemplate);
                        return (
                          <WorkoutCard
                            key={`naddr-${resolvedEvent.id}`}
                            variant="compact"
                            workout={workoutCardData}
                            onSelect={handleWorkoutSelect}
                          />
                        );
                      }
                      return null;
                    })()
                  ) : resolvedEvent.kind === WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE ? (
                    // Show exercise template using ExerciseCard with compact variant to match WorkoutCard styling
                    (() => {
                      const parsedExercise = dataParsingService.parseExerciseTemplate(resolvedEvent);
                      if (parsedExercise) {
                        const exerciseData = {
                          id: parsedExercise.id,
                          name: parsedExercise.name,
                          description: parsedExercise.description,
                          equipment: parsedExercise.equipment,
                          difficulty: parsedExercise.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
                          muscleGroups: parsedExercise.muscleGroups,
                          author: {
                            pubkey: parsedExercise.authorPubkey,
                            name: parsedExercise.authorPubkey.slice(0, 8) + '...',
                            picture: undefined
                          },
                          eventId: parsedExercise.eventId,
                          eventTags: resolvedEvent.tags,
                          eventContent: resolvedEvent.content,
                          eventKind: resolvedEvent.kind
                        };
                        
                        return (
                          <ExerciseCard
                            key={`naddr-exercise-${resolvedEvent.id}`}
                            variant="compact"
                            exercise={exerciseData}
                            onSelect={async () => {
                        try {
                          // ✅ FACADE SERVICE: Use facade service for consistent NIP-92 media preservation
                          const exerciseRef = `33401:${parsedExercise.authorPubkey}:${parsedExercise.id}`;
                          const modalData = await exerciseModalResolutionService.resolveFromNaddr(exerciseRef);
                          
                          console.log('🔗 [GlobalWorkoutSearch] Resolved exercise via facade service:', {
                            exerciseRef,
                            hasEventTags: !!modalData.eventTags,
                            eventTagsCount: modalData.eventTags?.length || 0
                          });
                          
                          setSelectedExercise({
                            id: modalData.id || parsedExercise.id,
                            name: modalData.name || parsedExercise.name,
                            description: modalData.description || parsedExercise.description,
                            equipment: modalData.equipment || parsedExercise.equipment,
                            difficulty: modalData.difficulty || parsedExercise.difficulty,
                            muscleGroups: modalData.muscleGroups || parsedExercise.muscleGroups,
                            format: modalData.format || parsedExercise.format,
                            formatUnits: modalData.format_units || parsedExercise.format_units,
                            authorPubkey: modalData.authorPubkey || parsedExercise.authorPubkey,
                            createdAt: modalData.createdAt || parsedExercise.createdAt,
                            eventId: modalData.eventId || parsedExercise.eventId,
                            eventTags: modalData.eventTags, // ✅ CRITICAL: NIP-92 tags from facade service
                            eventContent: modalData.eventContent || resolvedEvent.content,
                            eventKind: modalData.eventKind || resolvedEvent.kind
                          });
                          setIsExerciseModalOpen(true);
                        } catch (error) {
                          console.error('🔗 [GlobalWorkoutSearch] Failed to resolve exercise via facade service:', error);
                          // Fallback to original behavior if facade service fails
                          const modalData = {
                            id: parsedExercise.id,
                            name: parsedExercise.name,
                            description: parsedExercise.description,
                            equipment: parsedExercise.equipment,
                            difficulty: parsedExercise.difficulty,
                            muscleGroups: parsedExercise.muscleGroups,
                            format: parsedExercise.format,
                            formatUnits: parsedExercise.format_units,
                            authorPubkey: parsedExercise.authorPubkey,
                            createdAt: parsedExercise.createdAt,
                            eventId: parsedExercise.eventId,
                            eventTags: resolvedEvent.tags,
                            eventContent: resolvedEvent.content,
                            eventKind: resolvedEvent.kind
                          };
                          setSelectedExercise(modalData);
                          setIsExerciseModalOpen(true);
                        }
                            }}
                            showAuthor={true}
                            showEquipment={true}
                          />
                        );
                      }
                      return null;
                    })()
                  ) : (
                    // Unsupported event kind
                    <div className="p-4 bg-muted/30 border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Unsupported event kind: {resolvedEvent.kind}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Search Results - Using WorkoutCard components with proper padding for hover effects */}
            {searchState.templates.length > 0 && !resolvedEvent && (
              <div className="flex-1 overflow-y-auto px-6 py-1">
                <div className="space-y-3 pb-4">
                  {searchState.templates.map((template) => {
                    const workoutCardData = transformTemplateToWorkoutCard(template);
                    return (
                      <WorkoutCard
                        key={`${template.author}-${template.id}`}
                        variant="compact"
                        workout={workoutCardData}
                        onSelect={handleWorkoutSelect}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {isSearchActive && searchState.totalFound === 0 && !searchState.isSearching && !isResolvingNaddr && !resolvedEvent && searchTerm.length >= 2 && !isNaddrInput(searchTerm) && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No workouts found</p>
                  <p className="text-sm">
                    Try different search terms or check your spelling
                  </p>
                </div>
              </div>
            )}

            {/* NADDR Resolution Failed */}
            {naddrError && isNaddrInput(searchTerm) && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">NADDR Resolution Failed</p>
                  <p className="text-sm">
                    {naddrError}
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground/70">
                    Check the NADDR format or try a text search instead
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          isOpen={isExerciseModalOpen}
          onClose={() => {
            setIsExerciseModalOpen(false);
            setSelectedExercise(null);
          }}
          exercise={selectedExercise}
        />
      )}
    </>
  );
}
