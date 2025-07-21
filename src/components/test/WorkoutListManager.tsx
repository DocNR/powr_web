'use client';

/**
 * WorkoutListManager Test Component
 * 
 * Phase 2: Implements "List of Lists" user subscription architecture.
 * Tests Collections → Workout Templates → Exercises dependency resolution.
 * Validates cache-only hydration from fresh account with empty cache.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAccount, useIsAuthenticated } from '@/lib/auth/hooks';
import { getNDKInstance } from '@/lib/ndk';
import { NDKEvent, NDKFilter, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';

interface WorkoutListResult {
  success: boolean;
  listId?: string;
  eventCount?: number;
  error?: string;
}

interface WorkoutEventRef {
  eventId: string;
  relayHint: string;
  timestamp: number;
}

interface CollectionInfo {
  id: string;
  name: string;
  description: string;
  contentCount: number;
  author: string;
  created_at: number;
  contentRefs: string[];
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  author: string;
  exerciseRefs: string[];
  created_at: number;
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  author: string;
  created_at: number;
}

interface DependencyResolutionResult {
  success: boolean;
  timing: number;
  collections: CollectionInfo[];
  workoutTemplates: WorkoutTemplate[];
  exercises: Exercise[];
  error?: string;
}

// Phase 1 test publisher pubkey (replace with actual from Phase 1)
const PHASE_1_TEST_PUBKEY = '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21';

export function WorkoutListManager() {
  const account = useAccount();
  const isAuthenticated = useIsAuthenticated();
  const [listResults, setListResults] = useState<WorkoutListResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setWorkoutEvents] = useState<WorkoutEventRef[]>([]);
  const [currentList, setCurrentList] = useState<NDKEvent | null>(null);
  
  // Phase 2: Collection and dependency resolution state
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [resolutionResults, setResolutionResults] = useState<DependencyResolutionResult[]>([]);
  const [masterSubscriptionList, setMasterSubscriptionList] = useState<NDKEvent | null>(null);
  
  // Phase 2: Processed data cache to avoid re-parsing
  const [processedTemplatesCache, setProcessedTemplatesCache] = useState<Map<string, WorkoutTemplate[]>>(new Map());
  const [processedExercisesCache, setProcessedExercisesCache] = useState<Map<string, Exercise[]>>(new Map());

  // Phase 2: Discover Phase 1 test collections
  const discoverTestCollections = async (): Promise<CollectionInfo[]> => {
    try {
      console.log('[WorkoutListManager] Discovering Phase 1 test collections...');
      
      const ndk = getNDKInstance();
      if (!ndk) {
        throw new Error('NDK not initialized');
      }

      // Fetch collections from Phase 1 test publisher
      const filter: NDKFilter = {
        kinds: [30003],
        authors: [PHASE_1_TEST_PUBKEY],
        '#t': ['fitness']
      };

      const events = await ndk.fetchEvents(filter);
      console.log(`[WorkoutListManager] Found ${events.size} collections from test publisher`);

      const collectionInfos: CollectionInfo[] = Array.from(events).map(event => {
        const dTag = event.tags.find(tag => tag[0] === 'd')?.[1] || '';
        const titleTag = event.tags.find(tag => tag[0] === 'title')?.[1] || 'Untitled Collection';
        const descTag = event.tags.find(tag => tag[0] === 'description')?.[1] || '';
        const contentRefs = event.tags.filter(tag => tag[0] === 'a').map(tag => tag[1]);

        return {
          id: dTag,
          name: titleTag,
          description: descTag,
          contentCount: contentRefs.length,
          author: event.pubkey,
          created_at: event.created_at || 0,
          contentRefs
        };
      });

      console.log('[WorkoutListManager] Parsed collections:', collectionInfos);
      return collectionInfos;

    } catch (error) {
      console.error('[WorkoutListManager] Failed to discover collections:', error);
      throw error;
    }
  };

  // Phase 2: Create master subscription list (Kind 30003, d-tag: "powr-content")
  const createMasterSubscriptionList = async (): Promise<WorkoutListResult> => {
    try {
      console.log('[WorkoutListManager] Creating master subscription list...');

      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Discover available collections first
      const availableCollections = await discoverTestCollections();
      setCollections(availableCollections);

      if (availableCollections.length === 0) {
        return {
          success: false,
          error: 'No test collections found to subscribe to'
        };
      }

      // Create master subscription list with references to Phase 1 collections
      const masterListEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', 'powr-content'], // Master list identifier
          ['title', 'My POWR Workout Subscriptions'],
          ['description', 'Collections I follow for workout content'],
          // Add references to discovered collections
          ...availableCollections.map(collection => 
            ['a', `30003:${collection.author}:${collection.id}`]
          )
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: account.pubkey
      });

      console.log('[WorkoutListManager] Publishing master subscription list:', {
        kind: masterListEvent.kind,
        tags: masterListEvent.tags,
        collectionCount: availableCollections.length
      });

      // Publish the master list
      await masterListEvent.publish();
      setMasterSubscriptionList(masterListEvent);

      console.log('[WorkoutListManager] Master subscription list published successfully:', masterListEvent.id);

      return {
        success: true,
        listId: masterListEvent.id,
        eventCount: availableCollections.length
      };

    } catch (error) {
      console.error('[WorkoutListManager] Failed to create master subscription list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Phase 2: Use NDK's built-in CACHE_FIRST strategy
  const fetchEventsOptimized = async (filter: NDKFilter, description: string): Promise<Set<NDKEvent>> => {
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    console.log(`[WorkoutListManager] ${description} - using CACHE_FIRST strategy...`);
    
    // Use NDK's built-in cache-first strategy
    const events = await ndk.fetchEvents(filter, { 
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      closeOnEose: true 
    });
    
    console.log(`[WorkoutListManager] ${description} - found ${events.size} events (cache-first) ✅`);
    return events;
  };

  // Phase 2: Resolve collection content to workout templates (BATCHED)
  const resolveAllCollectionContent = async (collections: CollectionInfo[]): Promise<WorkoutTemplate[]> => {
    try {
      console.log('[WorkoutListManager] Resolving content for all collections (BATCHED)...');
      
      const ndk = getNDKInstance();
      if (!ndk) {
        throw new Error('NDK not initialized');
      }

      // Collect all unique workout template references from all collections
      const templateRefs = new Set<string>();
      const templateDTags: string[] = [];
      const templateAuthors = new Set<string>();

      for (const collection of collections) {
        for (const contentRef of collection.contentRefs) {
          const [kind, pubkey, dTag] = contentRef.split(':');
          
          if (kind === '33402' && !templateRefs.has(contentRef)) { // Workout template
            templateRefs.add(contentRef);
            templateDTags.push(dTag);
            templateAuthors.add(pubkey);
          }
        }
      }

      if (templateDTags.length === 0) {
        console.log('[WorkoutListManager] No workout templates to resolve');
        return [];
      }

      // BATCHED REQUEST: Fetch all workout templates in one query
      console.log(`[WorkoutListManager] Batching ${templateDTags.length} workout templates from ${templateAuthors.size} authors...`);
      
      const filter: NDKFilter = {
        kinds: [33402 as any],
        authors: Array.from(templateAuthors),
        '#d': templateDTags
      };

      const events = await ndk.fetchEvents(filter, { 
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true 
      });

      console.log(`[WorkoutListManager] Batched workout template fetch - found ${events.size} events (cache-first) ✅`);

      // Parse all workout templates from batched result
      const workoutTemplates: WorkoutTemplate[] = [];
      for (const event of events) {
        const dTag = event.tags.find(tag => tag[0] === 'd')?.[1] || '';
        const nameTag = event.tags.find(tag => tag[0] === 'name')?.[1] || 
                       event.tags.find(tag => tag[0] === 'title')?.[1] || 
                       'Untitled Workout';
        const descTag = event.tags.find(tag => tag[0] === 'description')?.[1] || '';
        const exerciseRefs = event.tags.filter(tag => tag[0] === 'exercise').map(tag => tag[1]);

        workoutTemplates.push({
          id: dTag,
          name: nameTag,
          description: descTag,
          author: event.pubkey,
          exerciseRefs,
          created_at: event.created_at || 0
        });
      }

      console.log(`[WorkoutListManager] Resolved ${workoutTemplates.length} workout templates from all collections`);
      return workoutTemplates;

    } catch (error) {
      console.error('[WorkoutListManager] Failed to resolve collection content:', error);
      throw error;
    }
  };

  // Phase 2: Resolve exercise dependencies from workout templates (BATCHED)
  const resolveExerciseDependencies = async (templates: WorkoutTemplate[]): Promise<Exercise[]> => {
    try {
      console.log('[WorkoutListManager] Resolving exercise dependencies...');
      
      const ndk = getNDKInstance();
      if (!ndk) {
        throw new Error('NDK not initialized');
      }

      // Collect all unique exercise d-tags and authors
      const exerciseRefs = new Set<string>();
      const exerciseDTags: string[] = [];
      const exerciseAuthors = new Set<string>();

      for (const template of templates) {
        for (const exerciseRef of template.exerciseRefs) {
          if (exerciseRefs.has(exerciseRef)) continue;
          exerciseRefs.add(exerciseRef);

          const [kind, pubkey, dTag] = exerciseRef.split(':');
          
          if (kind === '33401') { // Exercise template
            exerciseDTags.push(dTag);
            exerciseAuthors.add(pubkey);
          }
        }
      }

      if (exerciseDTags.length === 0) {
        console.log('[WorkoutListManager] No exercise dependencies to resolve');
        return [];
      }

      // BATCHED REQUEST: Fetch all exercises in one query
      console.log(`[WorkoutListManager] Batching ${exerciseDTags.length} exercises from ${exerciseAuthors.size} authors...`);
      
      const filter: NDKFilter = {
        kinds: [33401 as any],
        authors: Array.from(exerciseAuthors),
        '#d': exerciseDTags
      };

      const events = await ndk.fetchEvents(filter, { 
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true 
      });

      console.log(`[WorkoutListManager] Batched exercise fetch - found ${events.size} events (cache-first) ✅`);

      // Parse all exercises from batched result
      const exercises: Exercise[] = [];
      for (const event of events) {
        const dTag = event.tags.find(tag => tag[0] === 'd')?.[1] || '';
        const nameTag = event.tags.find(tag => tag[0] === 'name')?.[1] || 
                       event.tags.find(tag => tag[0] === 'title')?.[1] || 
                       'Untitled Exercise';
        const descTag = event.tags.find(tag => tag[0] === 'description')?.[1] || '';
        const muscleGroups = event.tags.filter(tag => tag[0] === 'muscle').map(tag => tag[1]);

        exercises.push({
          id: dTag,
          name: nameTag,
          description: descTag,
          muscleGroups,
          author: event.pubkey,
          created_at: event.created_at || 0
        });
      }

      console.log(`[WorkoutListManager] Resolved ${exercises.length} unique exercises`);
      return exercises;

    } catch (error) {
      console.error('[WorkoutListManager] Failed to resolve exercise dependencies:', error);
      throw error;
    }
  };

  // Phase 2: Complete dependency resolution test (OPTIMIZED)
  const testCompleteDependencyResolution = async (): Promise<DependencyResolutionResult> => {
    const startTime = performance.now();
    
    try {
      console.log('[WorkoutListManager] Starting complete dependency resolution test...');

      // Step 1: Use cached collections if available, otherwise discover
      let discoveredCollections = collections;
      if (discoveredCollections.length === 0) {
        console.log('[WorkoutListManager] No cached collections, discovering...');
        discoveredCollections = await discoverTestCollections();
        setCollections(discoveredCollections);
      } else {
        console.log('[WorkoutListManager] Using cached collections ✅');
      }

      const step1Time = performance.now();
      console.log(`[WorkoutListManager] Step 1 (Collections): ${(step1Time - startTime).toFixed(2)}ms`);

      // Step 2: Resolve all workout templates from all collections (BATCHED)
      const allWorkoutTemplates = await resolveAllCollectionContent(discoveredCollections);
      setWorkoutTemplates(allWorkoutTemplates);

      const step2Time = performance.now();
      console.log(`[WorkoutListManager] Step 2 (Templates): ${(step2Time - step1Time).toFixed(2)}ms`);

      // Step 3: Resolve all exercise dependencies (BATCHED)
      const allExercises = await resolveExerciseDependencies(allWorkoutTemplates);
      setExercises(allExercises);

      const step3Time = performance.now();
      console.log(`[WorkoutListManager] Step 3 (Exercises): ${(step3Time - step2Time).toFixed(2)}ms`);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('[WorkoutListManager] Complete dependency resolution completed:', {
        timing: `${totalTime.toFixed(2)}ms`,
        collections: discoveredCollections.length,
        workoutTemplates: allWorkoutTemplates.length,
        exercises: allExercises.length,
        breakdown: {
          collections: `${(step1Time - startTime).toFixed(2)}ms`,
          templates: `${(step2Time - step1Time).toFixed(2)}ms`,
          exercises: `${(step3Time - step2Time).toFixed(2)}ms`
        }
      });

      return {
        success: true,
        timing: totalTime,
        collections: discoveredCollections,
        workoutTemplates: allWorkoutTemplates,
        exercises: allExercises
      };

    } catch (error) {
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.error('[WorkoutListManager] Complete dependency resolution failed:', error);
      return {
        success: false,
        timing: totalTime,
        collections: [],
        workoutTemplates: [],
        exercises: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Auto-discover collections on component mount
  useEffect(() => {
    if (isAuthenticated) {
      discoverTestCollections()
        .then(setCollections)
        .catch(error => console.error('Failed to auto-discover collections:', error));
    }
  }, [isAuthenticated]);

  // Fetch workout events for list creation
  const fetchWorkoutEvents = async (): Promise<WorkoutEventRef[]> => {
    try {
      console.log('[WorkoutListManager] Fetching workout events for list creation...');
      
      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Fetch user's workout events (kind 1301)
      const filter: NDKFilter = {
        kinds: [1301 as any],
        authors: [account.pubkey],
        limit: 100 // Get up to 100 recent workouts
      };

      const events = await ndk.fetchEvents(filter);
      console.log(`[WorkoutListManager] Found ${events.size} workout events`);

      // Convert to WorkoutEventRef with relay hints
      const eventRefs: WorkoutEventRef[] = Array.from(events).map(event => ({
        eventId: event.id,
        relayHint: 'wss://nos.lol', // Default relay hint - could be improved to track actual source
        timestamp: event.created_at || 0
      }));

      // Sort by timestamp (newest first)
      eventRefs.sort((a, b) => b.timestamp - a.timestamp);

      console.log('[WorkoutListManager] Workout event refs:', eventRefs);
      return eventRefs;

    } catch (error) {
      console.error('[WorkoutListManager] Failed to fetch workout events:', error);
      throw error;
    }
  };

  // Create POWR History list (NIP-51 kind 30003)
  const createPOWRHistoryList = async (): Promise<WorkoutListResult> => {
    try {
      console.log('[WorkoutListManager] Creating POWR History list...');

      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Fetch current workout events
      const eventRefs = await fetchWorkoutEvents();
      setWorkoutEvents(eventRefs);

      if (eventRefs.length === 0) {
        return {
          success: false,
          error: 'No workout events found to add to list'
        };
      }

      // Create NIP-51 bookmark set (kind 30003) for POWR History
      const listEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', 'powr-history'], // Unique identifier for this list
          ['title', 'POWR History'],
          ['description', 'Complete workout history'],
          // Add workout event references with relay hints
          ...eventRefs.map(ref => ['e', ref.eventId, ref.relayHint])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: account.pubkey
      });

      console.log('[WorkoutListManager] Publishing POWR History list:', {
        kind: listEvent.kind,
        tags: listEvent.tags,
        eventCount: eventRefs.length
      });

      // Publish the list
      await listEvent.publish();
      setCurrentList(listEvent);

      console.log('[WorkoutListManager] POWR History list published successfully:', listEvent.id);

      return {
        success: true,
        listId: listEvent.id,
        eventCount: eventRefs.length
      };

    } catch (error) {
      console.error('[WorkoutListManager] Failed to create POWR History list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Fetch existing POWR History list
  const fetchPOWRHistoryList = async (): Promise<WorkoutListResult> => {
    try {
      console.log('[WorkoutListManager] Fetching existing POWR History list...');

      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Fetch POWR History list (kind 30003 with d tag "powr-history")
      const filter: NDKFilter = {
        kinds: [30003],
        authors: [account.pubkey],
        '#d': ['powr-history']
      };

      const events = await ndk.fetchEvents(filter);
      console.log(`[WorkoutListManager] Found ${events.size} POWR History lists`);

      if (events.size === 0) {
        return {
          success: false,
          error: 'No POWR History list found'
        };
      }

      // Get the most recent list (should only be one due to replaceable event)
      const listEvent = Array.from(events)[0];
      setCurrentList(listEvent);

      // Count workout event references
      const workoutRefs = listEvent.tags.filter(tag => tag[0] === 'e');
      
      console.log('[WorkoutListManager] POWR History list found:', {
        id: listEvent.id,
        workoutCount: workoutRefs.length,
        tags: listEvent.tags
      });

      return {
        success: true,
        listId: listEvent.id,
        eventCount: workoutRefs.length
      };

    } catch (error) {
      console.error('[WorkoutListManager] Failed to fetch POWR History list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Update existing list with new workouts
  const updatePOWRHistoryList = async (): Promise<WorkoutListResult> => {
    try {
      console.log('[WorkoutListManager] Updating POWR History list...');

      // Fetch current workout events
      const eventRefs = await fetchWorkoutEvents();
      setWorkoutEvents(eventRefs);

      if (!currentList) {
        throw new Error('No current list to update');
      }

      const ndk = getNDKInstance();
      if (!ndk || !account?.pubkey) {
        throw new Error('NDK not initialized or user not authenticated');
      }

      // Create updated list with all current workout events
      const updatedListEvent = new NDKEvent(ndk, {
        kind: 30003,
        content: '',
        tags: [
          ['d', 'powr-history'],
          ['title', 'POWR History'],
          ['description', 'Complete workout history'],
          // Add all current workout event references with relay hints
          ...eventRefs.map(ref => ['e', ref.eventId, ref.relayHint])
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: account.pubkey
      });

      console.log('[WorkoutListManager] Publishing updated POWR History list:', {
        kind: updatedListEvent.kind,
        eventCount: eventRefs.length,
        previousEventCount: currentList.tags.filter(tag => tag[0] === 'e').length
      });

      // Publish the updated list
      await updatedListEvent.publish();
      setCurrentList(updatedListEvent);

      console.log('[WorkoutListManager] POWR History list updated successfully:', updatedListEvent.id);

      return {
        success: true,
        listId: updatedListEvent.id,
        eventCount: eventRefs.length
      };

    } catch (error) {
      console.error('[WorkoutListManager] Failed to update POWR History list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const handleListOperation = async (operation: 'create' | 'fetch' | 'update' | 'master' | 'resolve') => {
    setIsProcessing(true);
    let result: WorkoutListResult | DependencyResolutionResult;

    try {
      switch (operation) {
        case 'create':
          result = await createPOWRHistoryList();
          setListResults(prev => [result as WorkoutListResult, ...prev]);
          break;
        case 'fetch':
          result = await fetchPOWRHistoryList();
          setListResults(prev => [result as WorkoutListResult, ...prev]);
          break;
        case 'update':
          result = await updatePOWRHistoryList();
          setListResults(prev => [result as WorkoutListResult, ...prev]);
          break;
        case 'master':
          result = await createMasterSubscriptionList();
          setListResults(prev => [result as WorkoutListResult, ...prev]);
          break;
        case 'resolve':
          result = await testCompleteDependencyResolution();
          setResolutionResults(prev => [result as DependencyResolutionResult, ...prev]);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

    } catch (error) {
      console.error('[WorkoutListManager] List operation failed:', error);
      if (operation === 'resolve') {
        setResolutionResults(prev => [{
          success: false,
          timing: 0,
          collections: [],
          workoutTemplates: [],
          exercises: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        }, ...prev]);
      } else {
        setListResults(prev => [{
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, ...prev]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setListResults([]);
    setResolutionResults([]);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout List Manager</CardTitle>
          <CardDescription>
            Please authenticate to test NIP-51 list functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Authentication required to manage workout lists.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase 2: Collection Discovery & Dependency Resolution */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 2: "List of Lists" User Subscription Architecture</CardTitle>
          <CardDescription>
            Test complete dependency resolution: Collections → Workout Templates → Exercises.
            Validates cache-only hydration from fresh account with empty cache.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="text-sm text-muted-foreground">
            <p>Authenticated as: {account?.pubkey?.slice(0, 16)}...</p>
            <p>NPub: {account?.npub?.slice(0, 20)}...</p>
            <p>Phase 1 Test Publisher: {PHASE_1_TEST_PUBKEY.slice(0, 16)}...</p>
          </div>

          {/* Phase 2 Operation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => handleListOperation('master')}
              disabled={isProcessing}
              variant="default"
            >
              Create Master Subscription List
            </Button>
            
            <Button 
              onClick={() => handleListOperation('resolve')}
              disabled={isProcessing}
              variant="secondary"
            >
              Test Complete Dependency Resolution
            </Button>
          </div>

          {/* Master Subscription List Status */}
          {masterSubscriptionList && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Master Subscription List Created:</strong></p>
                  <p className="text-xs font-mono">ID: {masterSubscriptionList.id.slice(0, 16)}...</p>
                  <p className="text-xs">
                    Subscribed Collections: {masterSubscriptionList.tags.filter(tag => tag[0] === 'a').length}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Discovered Collections */}
          {collections.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Discovered Collections ({collections.length})</h4>
              <div className="grid gap-2">
                {collections.map((collection, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">{collection.name}</h5>
                      <Badge variant="outline">{collection.contentCount} items</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{collection.description}</p>
                    <p className="text-xs font-mono">ID: {collection.id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Workout Templates */}
          {workoutTemplates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Resolved Workout Templates ({workoutTemplates.length})</h4>
              <div className="grid gap-2 max-h-32 overflow-y-auto">
                {workoutTemplates.map((template, index) => (
                  <div key={index} className="p-2 border rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">{template.name}</h5>
                      <Badge variant="secondary">{template.exerciseRefs.length} exercises</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Exercises */}
          {exercises.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Resolved Exercises ({exercises.length})</h4>
              <div className="grid gap-2 max-h-32 overflow-y-auto">
                {exercises.map((exercise, index) => (
                  <div key={index} className="p-2 border rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">{exercise.name}</h5>
                      <div className="flex gap-1">
                        {exercise.muscleGroups.map((muscle, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{muscle}</Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{exercise.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependency Resolution Results */}
          {resolutionResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Dependency Resolution Results</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {resolutionResults.map((result, index) => (
                  <Alert key={index} variant={result.success ? "default" : "destructive"}>
                    <AlertDescription>
                      <div className="space-y-1">
                        <p>
                          <strong>{result.success ? '✅ Success' : '❌ Failed'}</strong>
                          {result.success && (
                            <span className="ml-2 text-xs">
                              ({result.timing.toFixed(2)}ms)
                              {result.timing < 500 ? ' 🎯 Under 500ms target!' : ' ⚠️ Over 500ms target'}
                            </span>
                          )}
                        </p>
                        {result.success && (
                          <div className="text-xs space-y-1">
                            <p>Collections: {result.collections.length}</p>
                            <p>Workout Templates: {result.workoutTemplates.length}</p>
                            <p>Exercises: {result.exercises.length}</p>
                          </div>
                        )}
                        {result.error && (
                          <p className="text-xs text-red-600">
                            Error: {result.error}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Phase 1: Original NIP-51 List Management */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 1: Workout List Manager (NIP-51)</CardTitle>
          <CardDescription>
            Test NIP-51 list creation and management for POWR History.
            Check browser console for detailed logging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current List Status */}
          {currentList && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Current POWR History List:</strong></p>
                  <p className="text-xs font-mono">ID: {currentList.id.slice(0, 16)}...</p>
                  <p className="text-xs">
                    Workouts: {currentList.tags.filter(tag => tag[0] === 'e').length}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* List Operation Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={() => handleListOperation('create')}
              disabled={isProcessing}
              variant="default"
            >
              Create POWR History
            </Button>
            
            <Button 
              onClick={() => handleListOperation('fetch')}
              disabled={isProcessing}
              variant="outline"
            >
              Fetch Existing List
            </Button>
            
            <Button 
              onClick={() => handleListOperation('update')}
              disabled={isProcessing}
              variant="secondary"
            >
              Update List
            </Button>
          </div>

          {/* Results Management */}
          {(listResults.length > 0 || resolutionResults.length > 0) && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {listResults.length} list operations, {resolutionResults.length} resolution tests
              </p>
              <Button onClick={clearResults} variant="ghost" size="sm">
                Clear Results
              </Button>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Alert>
              <AlertDescription>
                Processing operation... Check console for details.
              </AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {listResults.map((result, index) => (
              <Alert key={index} variant={result.success ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-1">
                    <p>
                      <strong>{result.success ? '✅ Success' : '❌ Failed'}</strong>
                    </p>
                    {result.listId && (
                      <p className="text-xs font-mono">
                        List ID: {result.listId.slice(0, 16)}...
                      </p>
                    )}
                    {result.eventCount !== undefined && (
                      <p className="text-xs">
                        Events: {result.eventCount}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-xs text-red-600">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>NIP-51 List Testing:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Create:</strong> Creates new POWR History list with all workout events</li>
              <li><strong>Fetch:</strong> Retrieves existing POWR History list from Nostr</li>
              <li><strong>Update:</strong> Updates list with any new workout events</li>
              <li>Lists use kind 30003 (bookmark sets) with relay hints</li>
              <li>Check console for detailed NIP-51 event structure</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2 Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Fresh Account Testing Protocol:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Logout:</strong> Clear current authentication and cache</li>
              <li><strong>Fresh Account:</strong> Login with new account/keys</li>
              <li><strong>Create Master List:</strong> Subscribe to Phase 1 test collections</li>
              <li><strong>Test Resolution:</strong> Validate complete dependency chain resolution</li>
              <li><strong>Performance Check:</strong> Ensure resolution under 500ms target</li>
            </ol>
            
            <Separator className="my-2" />
            
            <p><strong>Success Criteria:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Fresh account creates master subscription list</li>
              <li>Cross-account collection subscription works</li>
              <li>Complete dependency resolution (Collections → Templates → Exercises)</li>
              <li>Cache-only operation after initial hydration</li>
              <li>Performance under 500ms for complete resolution</li>
            </ul>
            
            <Separator className="my-2" />
            
            <p><strong>Architecture Validation:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Proves NDK-first cache-only hydration works</li>
              <li>Validates "List of Lists" user subscription model</li>
              <li>Eliminates need for custom database complexity</li>
              <li>Foundation ready for golf app migration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
