'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNDKSearch } from '@/hooks/useNDKSearch';
import { WorkoutTemplate } from '@/lib/services/searchService';
import { WorkoutCard } from '@/components/powr-ui/workout';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Input } from '@/components/powr-ui/primitives/Input';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/powr-ui/primitives/Sheet';
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
  
  const {
    searchState,
    searchTemplates,
    clearSearch,
    isSearchActive
  } = useNDKSearch();

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchTemplates(searchTerm);
      } else if (searchTerm.trim().length === 0) {
        clearSearch();
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchTemplates, clearSearch]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
    inputRef.current?.focus();
  };

  const handleWorkoutSelect = (workoutId: string) => {
    // Find the selected template from search results
    const selectedTemplate = searchState.templates.find(t => t.id === workoutId);
    if (!selectedTemplate) {
      console.error('❌ [Search] Template not found in search results:', workoutId);
      return;
    }

    // If custom template handler provided, use it
    if (onTemplateSelect) {
      onTemplateSelect(selectedTemplate);
      setIsOpen(false);
      setSearchTerm('');
      clearSearch();
      return;
    }

    // If custom workout handler provided, use it
    if (onWorkoutSelect) {
      const templateReference = `33402:${selectedTemplate.author}:${selectedTemplate.id}`;
      console.log('🚀 [Search] Calling onWorkoutSelect with template:', templateReference);
      onWorkoutSelect(templateReference);
      setIsOpen(false);
      setSearchTerm('');
      clearSearch();
      return;
    }

    // Fallback: just log the selection
    console.log('🔍 [Search] Template selected but no handlers provided:', selectedTemplate);
    setIsOpen(false);
    setSearchTerm('');
    clearSearch();
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
    if (searchState.isSearching) {
      return "Searching Nostr network...";
    }
    
    if (searchState.error) {
      return `Error: ${searchState.error}`;
    }
    
    if (isSearchActive && searchState.totalFound > 0) {
      return `Found ${searchState.totalFound} workout${searchState.totalFound === 1 ? '' : 's'} (${searchState.searchTime}ms)`;
    }
    
    if (isSearchActive && searchState.totalFound === 0 && searchTerm.length >= 2) {
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

      {/* Search Modal - Full Screen */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="top" className="h-[100vh] w-[100vw] max-w-none bg-background border-none flex flex-col">
          <SheetHeader className="pb-4 flex-shrink-0">
            <SheetTitle>Search Workouts</SheetTitle>
            <SheetDescription>
              Search for workout templates across the Nostr network
            </SheetDescription>
          </SheetHeader>

          {/* Search Input */}
          <div className="relative mb-6 flex-shrink-0">
            <div className={`
              relative flex items-center
              bg-muted/50 
              border border-border
              rounded-lg transition-all duration-200
              ${isFocused ? 'ring-2 ring-primary border-primary' : 'hover:border-border/80'}
              ${searchState.isSearching ? 'bg-primary/5' : ''}
            `}>
              {/* Search Icon */}
              <Search className={`
                w-5 h-5 ml-3 transition-colors duration-200
                ${searchState.isSearching 
                  ? 'text-primary animate-pulse' 
                  : 'text-muted-foreground'
                }
              `} />
              
              {/* Input Field */}
              <Input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search workouts across Nostr network..."
                autoFocus
                className="
                  flex-1 border-none bg-transparent
                  focus-visible:ring-0 focus-visible:ring-offset-0
                  placeholder:text-muted-foreground/60
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
            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="text-sm text-muted-foreground">
                <div className="font-medium mb-2">Search Tips:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Search by workout name: &ldquo;chest day&rdquo;, &ldquo;leg workout&rdquo;</li>
                  <li>• Search by muscle group: &ldquo;chest&rdquo;, &ldquo;legs&rdquo;, &ldquo;shoulders&rdquo;</li>
                  <li>• Search by description: &ldquo;beginner&rdquo;, &ldquo;advanced&rdquo;, &ldquo;HIIT&rdquo;</li>
                  <li>• Results come from the entire Nostr network</li>
                </ul>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {searchState.isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Searching Nostr relays for workouts...
              </div>
            </div>
          )}

            {/* Search Results - Using WorkoutCard components with proper padding for hover effects */}
            {searchState.templates.length > 0 && (
              <div className="flex-1 overflow-y-auto px-1 py-1">
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
          {isSearchActive && searchState.totalFound === 0 && !searchState.isSearching && searchTerm.length >= 2 && (
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
        </SheetContent>
      </Sheet>
    </>
  );
}
