// hooks/useNDKSearch.ts
import { useState, useCallback, useRef } from 'react';
import { searchService, WorkoutTemplate, Exercise } from '@/lib/services/searchService';

export interface SearchState {
  isSearching: boolean;
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  error: string | null;
  totalFound: number;
  lastSearchTerm: string;
  searchTime: number;
}

export interface UseNDKSearchReturn {
  searchState: SearchState;
  searchTemplates: (searchTerm: string) => Promise<void>;
  searchExercises: (searchTerm: string) => Promise<void>;
  searchBoth: (searchTerm: string) => Promise<void>;
  clearSearch: () => void;
  isSearchActive: boolean;
}

/**
 * React hook for searching Nostr relays using NDK
 * Provides search with loading states and error handling
 */
export function useNDKSearch(): UseNDKSearchReturn {
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    templates: [],
    exercises: [],
    error: null,
    totalFound: 0,
    lastSearchTerm: '',
    searchTime: 0
  });

  // Use ref to track latest search to prevent race conditions
  const latestSearchRef = useRef<string>('');

  /**
   * Clear search results and reset state
   */
  const clearSearch = useCallback(() => {
    latestSearchRef.current = '';
    setSearchState({
      isSearching: false,
      templates: [],
      exercises: [],
      error: null,
      totalFound: 0,
      lastSearchTerm: '',
      searchTime: 0
    });
  }, []);

  /**
   * Search workout templates with loading state and error handling
   */
  const searchTemplates = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }

    const trimmedTerm = searchTerm.trim();
    latestSearchRef.current = trimmedTerm;

    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      error: null,
      lastSearchTerm: trimmedTerm
    }));

    try {
      const startTime = Date.now();
      const templates = await searchService.searchWorkoutTemplates(trimmedTerm);
      const searchTime = Date.now() - startTime;

      // Only update if this is still the latest search
      if (latestSearchRef.current === trimmedTerm) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          templates,
          totalFound: templates.length,
          searchTime,
          error: null
        }));
      }
    } catch (error) {
      // Only update if this is still the latest search
      if (latestSearchRef.current === trimmedTerm) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          error: error instanceof Error ? error.message : 'Search failed',
          templates: [],
          totalFound: 0
        }));
      }
    }
  }, [clearSearch]);

  /**
   * Search exercises with loading state and error handling
   */
  const searchExercises = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }

    const trimmedTerm = searchTerm.trim();
    latestSearchRef.current = trimmedTerm;

    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      error: null,
      lastSearchTerm: trimmedTerm
    }));

    try {
      const startTime = Date.now();
      const exercises = await searchService.searchExercises(trimmedTerm);
      const searchTime = Date.now() - startTime;

      // Only update if this is still the latest search
      if (latestSearchRef.current === trimmedTerm) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          exercises,
          totalFound: exercises.length,
          searchTime,
          error: null
        }));
      }
    } catch (error) {
      // Only update if this is still the latest search
      if (latestSearchRef.current === trimmedTerm) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          error: error instanceof Error ? error.message : 'Search failed',
          exercises: [],
          totalFound: 0
        }));
      }
    }
  }, [clearSearch]);

  /**
   * Search both templates and exercises
   */
  const searchBoth = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }

    const trimmedTerm = searchTerm.trim();
    latestSearchRef.current = trimmedTerm;

    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      error: null,
      lastSearchTerm: trimmedTerm
    }));

    try {
      const startTime = Date.now();
      
      // Search both in parallel
      const [templates, exercises] = await Promise.all([
        searchService.searchWorkoutTemplates(trimmedTerm),
        searchService.searchExercises(trimmedTerm)
      ]);
      
      const searchTime = Date.now() - startTime;

      // Only update if this is still the latest search
      if (latestSearchRef.current === trimmedTerm) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          templates,
          exercises,
          totalFound: templates.length + exercises.length,
          searchTime,
          error: null
        }));
      }
    } catch (error) {
      // Only update if this is still the latest search
      if (latestSearchRef.current === trimmedTerm) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          error: error instanceof Error ? error.message : 'Search failed',
          templates: [],
          exercises: [],
          totalFound: 0
        }));
      }
    }
  }, [clearSearch]);

  const isSearchActive = searchState.lastSearchTerm.length > 0 || searchState.isSearching;

  return {
    searchState,
    searchTemplates,
    searchExercises,
    searchBoth,
    clearSearch,
    isSearchActive
  };
}
