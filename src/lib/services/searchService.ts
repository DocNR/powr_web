// lib/services/searchService.ts
import { NDKFilter, NDKEvent, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';

export interface SearchOptions {
  searchTerm: string;
  maxResults?: number;
  timeoutMs?: number;
  searchScope?: 'templates' | 'exercises' | 'both';
}

export interface SearchResults {
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  totalFound: number;
  searchTime: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  author: string;
  exerciseRefs: string[];
  created_at: number;
  tags: string[];
  rating?: number;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  author: string;
  muscle_groups: string[];
  equipment: string[];
  created_at: number;
}

/**
 * Enhanced search service that searches cached NDK data
 * Leverages existing WorkoutDataProvider cache for efficient searching
 */
export class SearchService {
  private static instance: SearchService;
  
  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Search workout templates using cached NDK data + fallback network search
   * Much more efficient than pure network searching
   */
  async searchWorkoutTemplates(searchTerm: string, maxResults = 50): Promise<WorkoutTemplate[]> {
    const startTime = Date.now();
    console.log(`[SearchService] Searching workout templates for: "${searchTerm}"`);
    
    const ndk = getNDKInstance();
    if (!ndk) {
      throw new Error('NDK not initialized');
    }

    try {
      // Strategy 1: Search cached data first (fast)
      const cachedResults = await this.searchCachedTemplates(searchTerm, maxResults);
      
      // Strategy 2: If not enough results, do targeted network search
      if (cachedResults.length < Math.min(maxResults, 10)) {
        console.log(`[SearchService] Only found ${cachedResults.length} cached results, searching network...`);
        const networkResults = await this.searchNetworkTemplates(searchTerm, maxResults - cachedResults.length);
        
        // Merge results, avoiding duplicates
        const allResults = new Map<string, WorkoutTemplate>();
        cachedResults.forEach(template => allResults.set(template.id, template));
        networkResults.forEach(template => allResults.set(template.id, template));
        
        const finalResults = Array.from(allResults.values())
          .slice(0, maxResults)
          .sort((a, b) => b.created_at - a.created_at);
        
        const searchTime = Date.now() - startTime;
        console.log(`[SearchService] Found ${finalResults.length} templates total (${cachedResults.length} cached + ${networkResults.length} network) in ${searchTime}ms`);
        
        return finalResults;
      }
      
      const searchTime = Date.now() - startTime;
      console.log(`[SearchService] Found ${cachedResults.length} templates from cache in ${searchTime}ms`);
      
      return cachedResults;
      
    } catch (error) {
      console.error('[SearchService] Search failed:', error);
      return [];
    }
  }

  /**
   * Search cached templates (leverages NDK cache)
   */
  private async searchCachedTemplates(searchTerm: string, maxResults: number): Promise<WorkoutTemplate[]> {
    const ndk = getNDKInstance();
    if (!ndk) return [];
    
    console.log(`[SearchService] Searching cached templates for: "${searchTerm}"`);
    
    try {
      // Use ONLY_CACHE to search existing cached data
      const cachedEvents = await ndk.fetchEvents({
        kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
        limit: 200 // Get more to filter from
      }, {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE // Only search cache
      });
      
      console.log(`[SearchService] Found ${cachedEvents.size} cached template events`);
      
      if (cachedEvents.size === 0) {
        return [];
      }
      
      // Parse and filter templates with enhanced matching
      const searchLower = searchTerm.toLowerCase();
      const matchingTemplates: WorkoutTemplate[] = [];
      
      for (const event of cachedEvents) {
        const template = this.parseWorkoutTemplate(event);
        if (template && this.matchesSearchTerm(template, event, searchLower)) {
          matchingTemplates.push(template);
        }
      }
      
      console.log(`[SearchService] Found ${matchingTemplates.length} matching cached templates`);
      if (matchingTemplates.length > 0) {
        console.log(`[SearchService] Sample matches:`, matchingTemplates.slice(0, 3).map(t => t.name));
      }
      
      return matchingTemplates
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, maxResults);
        
    } catch (error) {
      console.error(`[SearchService] Error searching cached templates:`, error);
      return [];
    }
  }

  /**
   * Enhanced matching logic for search terms
   */
  private matchesSearchTerm(template: WorkoutTemplate, event: NDKEvent, searchLower: string): boolean {
    // 1. Match template name/title
    if (template.name.toLowerCase().includes(searchLower)) {
      return true;
    }

    // 2. Match description
    if (template.description.toLowerCase().includes(searchLower)) {
      return true;
    }

    // 3. Match hashtags (t tags)
    if (template.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
      return true;
    }

    // 4. Match exercise references (look for muscle groups in exercise names)
    const exerciseTags = event.tags.filter(tag => tag[0] === 'exercise');
    for (const exerciseTag of exerciseTags) {
      const exerciseRef = exerciseTag[1] || '';
      if (exerciseRef.toLowerCase().includes(searchLower)) {
        return true;
      }
    }

    // 5. Match muscle group aliases
    const muscleGroupAliases: Record<string, string[]> = {
      'chest': ['chest', 'pecs', 'pectoral', 'push'],
      'back': ['back', 'lats', 'latissimus', 'rhomboids', 'pull'],
      'legs': ['legs', 'quads', 'hamstrings', 'glutes', 'calves', 'leg'],
      'arms': ['arms', 'biceps', 'triceps', 'forearms', 'arm'],
      'shoulders': ['shoulders', 'delts', 'deltoids', 'shoulder'],
      'core': ['core', 'abs', 'abdominals', 'obliques']
    };

    for (const [, aliases] of Object.entries(muscleGroupAliases)) {
      if (aliases.includes(searchLower)) {
        // Check if any hashtags match this muscle group category
        if (template.tags.some(tag => aliases.includes(tag.toLowerCase()))) {
          return true;
        }
        // Also check exercise references for muscle group terms
        for (const exerciseTag of exerciseTags) {
          const exerciseRef = exerciseTag[1] || '';
          if (aliases.some(alias => exerciseRef.toLowerCase().includes(alias))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Search network templates (fallback when cache doesn't have enough results)
   */
  private async searchNetworkTemplates(searchTerm: string, maxResults: number): Promise<WorkoutTemplate[]> {
    const ndk = getNDKInstance();
    if (!ndk) return [];
    
    console.log(`[SearchService] Searching network templates for: "${searchTerm}"`);
    
    try {
      // Use a broader network search with timeout
      const networkEvents = await Promise.race([
        ndk.fetchEvents({
          kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
          limit: maxResults * 2, // Get more to filter from
          since: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60) // Last 30 days
        }, {
          closeOnEose: true,
          cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY // Only search network
        }),
        // 5 second timeout to prevent hanging
        new Promise<Set<NDKEvent>>((_, reject) => 
          setTimeout(() => reject(new Error('Network search timeout')), 5000)
        )
      ]);
      
      console.log(`[SearchService] Found ${networkEvents.size} network template events`);
      
      // Parse and filter templates
      const searchLower = searchTerm.toLowerCase();
      const matchingTemplates: WorkoutTemplate[] = [];
      
      for (const event of networkEvents) {
        const template = this.parseWorkoutTemplate(event);
        if (template && (
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )) {
          matchingTemplates.push(template);
        }
      }
      
      console.log(`[SearchService] Found ${matchingTemplates.length} matching network templates`);
      
      return matchingTemplates
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, maxResults);
        
    } catch (error) {
      console.error(`[SearchService] Network search failed:`, error);
      return [];
    }
  }

  /**
   * Search by name/title tags - most precise matches
   */
  private async searchByNameTags(searchTerm: string, maxResults: number): Promise<WorkoutTemplate[]> {
    const ndk = getNDKInstance();
    if (!ndk) return [];
    
    console.log(`[SearchService] Searching by name tags: "${searchTerm}"`);
    
    // First try exact title tag match
    const exactFilter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
      '#title': [searchTerm.toLowerCase()],
      limit: maxResults
    };
    
    console.log(`[SearchService] Trying exact title match with filter:`, exactFilter);
    
    try {
      const exactEvents = await ndk.fetchEvents(exactFilter, {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
      });
      
      console.log(`[SearchService] Exact title search returned ${exactEvents.size} events`);
      
      if (exactEvents.size > 0) {
        console.log(`[SearchService] Sample exact match events:`, Array.from(exactEvents).slice(0, 2).map(e => ({
          id: e.id,
          tags: e.tags,
          content: e.content?.slice(0, 100)
        })));
      }
      
      const templates = Array.from(exactEvents).map(event => this.parseWorkoutTemplate(event));
      
      // If no exact matches, try broader search
      if (templates.length === 0) {
        console.log(`[SearchService] No exact matches, trying broader search...`);
        const broadResults = await this.searchPartialNameMatch(searchTerm, maxResults);
        return [...templates, ...broadResults];
      }
      
      console.log(`[SearchService] Name search found ${templates.length} templates total`);
      return templates;
      
    } catch (error) {
      console.error(`[SearchService] Error in exact title search:`, error);
      console.log(`[SearchService] Falling back to partial search due to error...`);
      return await this.searchPartialNameMatch(searchTerm, maxResults);
    }
  }

  /**
   * Search by partial name matching (fallback for name search)
   */
  private async searchPartialNameMatch(searchTerm: string, maxResults: number): Promise<WorkoutTemplate[]> {
    const ndk = getNDKInstance();
    if (!ndk) return [];
    
    console.log(`[SearchService] Trying partial name match for: "${searchTerm}"`);
    
    // Get recent workout templates and filter client-side for partial matches
    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
      limit: 200, // Get more to filter from
      since: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60) // Last 30 days
    };
    
    console.log(`[SearchService] Fetching templates with filter:`, filter);
    
    const events = await ndk.fetchEvents(filter, {
      closeOnEose: true,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    });
    
    console.log(`[SearchService] Partial search fetched ${events.size} events`);
    
    const allTemplates = Array.from(events).map(event => this.parseWorkoutTemplate(event));
    console.log(`[SearchService] Parsed ${allTemplates.length} templates. Sample names:`, 
      allTemplates.slice(0, 5).map(t => t.name));
    
    const searchLower = searchTerm.toLowerCase();
    const matchingTemplates = allTemplates.filter(template => 
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower)
    );
    
    console.log(`[SearchService] Found ${matchingTemplates.length} matching templates for "${searchTerm}"`);
    if (matchingTemplates.length > 0) {
      console.log(`[SearchService] Matching template names:`, matchingTemplates.map(t => t.name));
    }
    
    return matchingTemplates.slice(0, maxResults);
  }

  /**
   * Search by description content
   */
  private async searchByDescription(searchTerm: string, maxResults: number): Promise<WorkoutTemplate[]> {
    const ndk = getNDKInstance();
    if (!ndk) return [];
    
    console.log(`[SearchService] Searching by description: "${searchTerm}"`);
    
    // Search for templates with description tags containing search term
    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
      '#description': [searchTerm.toLowerCase()],
      limit: maxResults
    };
    
    const events = await ndk.fetchEvents(filter, {
      closeOnEose: true,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    });
    
    const templates = Array.from(events).map(event => this.parseWorkoutTemplate(event));
    console.log(`[SearchService] Description search found ${templates.length} templates`);
    return templates;
  }

  /**
   * Search by muscle group tags
   */
  private async searchByMuscleGroups(searchTerm: string, maxResults: number): Promise<WorkoutTemplate[]> {
    const ndk = getNDKInstance();
    if (!ndk) return [];
    
    console.log(`[SearchService] Searching by muscle groups: "${searchTerm}"`);
    
    // Common muscle group mappings
    const muscleGroupAliases = {
      'chest': ['chest', 'pecs', 'pectoral'],
      'back': ['back', 'lats', 'latissimus', 'rhomboids'],
      'legs': ['legs', 'quads', 'hamstrings', 'glutes', 'calves'],
      'arms': ['arms', 'biceps', 'triceps', 'forearms'],
      'shoulders': ['shoulders', 'delts', 'deltoids'],
      'core': ['core', 'abs', 'abdominals', 'obliques']
    };
    
    const searchTerms = [searchTerm.toLowerCase()];
    
    // Add aliases if search term matches a muscle group
    for (const [, aliases] of Object.entries(muscleGroupAliases)) {
      if (aliases.includes(searchTerm.toLowerCase())) {
        searchTerms.push(...aliases);
        break;
      }
    }
    
    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
      '#t': searchTerms, // Use 't' tags for muscle groups
      limit: maxResults
    };
    
    const events = await ndk.fetchEvents(filter, {
      closeOnEose: true,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    });
    
    const templates = Array.from(events).map(event => this.parseWorkoutTemplate(event));
    console.log(`[SearchService] Muscle group search found ${templates.length} templates`);
    return templates;
  }

  /**
   * Search exercises across relays
   */
  async searchExercises(searchTerm: string, maxResults = 30): Promise<Exercise[]> {
    const ndk = getNDKInstance();
    if (!ndk) return [];
    
    console.log(`[SearchService] Searching exercises for: "${searchTerm}"`);
    
    const filter: NDKFilter = {
      kinds: [WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE as number],
      '#title': [searchTerm.toLowerCase()],
      limit: maxResults
    };
    
    const events = await ndk.fetchEvents(filter, {
      closeOnEose: true,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    });
    
    const exercises = Array.from(events).map(event => this.parseExercise(event));
    console.log(`[SearchService] Found ${exercises.length} exercises`);
    return exercises;
  }

  /**
   * Parse workout template from NDK event
   */
  private parseWorkoutTemplate(event: NDKEvent): WorkoutTemplate {
    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1] || '';
    const nameTag = event.tags.find(tag => tag[0] === 'title')?.[1] || 'Untitled Workout';
    const descTag = event.tags.find(tag => tag[0] === 'description')?.[1] || '';
    const exerciseRefs = event.tags.filter(tag => tag[0] === 'exercise').map(tag => tag[1]);
    const tags = event.tags.filter(tag => tag[0] === 't').map(tag => tag[1]);
    const ratingTag = event.tags.find(tag => tag[0] === 'rating')?.[1];

    // Debug logging for template parsing
    console.log(`[SearchService] Parsing template event ${event.id}:`, {
      dTag,
      nameTag,
      descTag,
      allTags: event.tags,
      exerciseRefs: exerciseRefs.length,
      hashtags: tags.length
    });

    return {
      id: dTag,
      name: nameTag,
      description: descTag,
      author: event.pubkey,
      exerciseRefs,
      created_at: event.created_at || 0,
      tags,
      rating: ratingTag ? parseFloat(ratingTag) : undefined
    };
  }

  /**
   * Parse exercise from NDK event
   */
  private parseExercise(event: NDKEvent): Exercise {
    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1] || '';
    const nameTag = event.tags.find(tag => tag[0] === 'title')?.[1] || 'Untitled Exercise';
    const descTag = event.tags.find(tag => tag[0] === 'description')?.[1] || '';
    const muscleGroups = event.tags.filter(tag => tag[0] === 't').map(tag => tag[1]);
    const equipment = event.tags.filter(tag => tag[0] === 'equipment').map(tag => tag[1]);

    return {
      id: dTag,
      name: nameTag,
      description: descTag,
      author: event.pubkey,
      muscle_groups: muscleGroups,
      equipment: equipment,
      created_at: event.created_at || 0
    };
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();
