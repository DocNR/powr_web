'use client';

/**
 * WorkoutsTab - Gallery-Based Workout Discovery
 * 
 * Real Nostr integration with NDK for workout discovery interface.
 * Fetches recent 1301 workout records and 33402 templates from the network.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarBar, WorkoutCard, ScrollableGallery, SearchableWorkoutDiscovery, WorkoutDetailModal } from '@/components/powr-ui/workout';
import { getNDKInstance, WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import { parseWorkoutEvent, type WorkoutEvent } from '@/lib/workout-events';
import { useIsAuthenticated } from '@/lib/auth/hooks';
import { useMachine } from '@xstate/react';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';

interface SocialWorkout {
  id: string;
  title: string;
  completedAt: Date;
  duration: number;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: number;
      weight: number;
      rpe: number;
    }>;
  }>;
  author: {
    pubkey: string;
    name: string;
    picture: string;
  };
  notes: string;
  eventId?: string;
}

interface DiscoveryWorkout {
  id: string;
  title: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  calories: number;
  muscleGroups: string[];
  level: string;
  author: {
    pubkey: string;
    name: string;
    picture: string;
  };
  eventId?: string;
  eventTags?: string[][];
  eventKind?: number;
  templateRef?: string;
}

interface WorkoutIndicator {
  date: Date;
  count: number;
  type: 'completed';
}

export default function WorkoutsTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [socialWorkouts, setSocialWorkouts] = useState<SocialWorkout[]>([]);
  const [discoveryTemplates, setDiscoveryTemplates] = useState<DiscoveryWorkout[]>([]);
  const [workoutIndicators, setWorkoutIndicators] = useState<WorkoutIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedWorkout, setSelectedWorkout] = useState<Record<string, unknown> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | undefined>();

  const isAuthenticated = useIsAuthenticated();

  // Store raw event data for click logging
  const [rawEventData, setRawEventData] = useState<Map<string, Record<string, unknown>>>(new Map());

  // Workout Lifecycle Machine
  const [workoutState, workoutSend] = useMachine(workoutLifecycleMachine, {
    input: {
      userInfo: {
        pubkey: 'user-pubkey', // TODO: Get from auth context
        displayName: 'User'
      }
    }
  });

  // Machine state-based UI updates
  useEffect(() => {
    console.log('🔄 Workout machine state changed:', workoutState.value);
    
    if (workoutState.matches('setup')) {
      // Setup state - machine is resolving template, don't open modal yet
      console.log('📋 Machine in setup state - waiting for template resolution...');
      // Don't open modal until setup is complete
      
    } else if (workoutState.matches('setupComplete')) {
      // Setup complete - template is resolved, show modal with resolved data
      console.log('✅ Setup complete - template resolved:', workoutState.context.templateSelection);
      
      // NOW open modal with resolved data from machine state
      if (workoutState.context.templateSelection && workoutState.context.workoutData) {
        const resolvedWorkout = {
          title: workoutState.context.workoutData.title,
          description: `Template: ${workoutState.context.templateSelection.templateId}`,
          content: JSON.stringify(workoutState.context.workoutData),
          exercises: workoutState.context.workoutData.exercises || [],
          equipment: ['Various'],
          tags: [['t', 'fitness']],
          eventKind: 33402,
          templateRef: workoutState.context.templateSelection.templateReference
        };
        
        setSelectedWorkout(resolvedWorkout);
        setIsModalOpen(true); // Open modal NOW with resolved data
      }
      
    } else if (workoutState.matches('active')) {
      // Active state - activeWorkoutMachine is running
      console.log('🏃‍♂️ Machine in active state - workout is running');
      // Keep modal closed during active workout
      setIsModalOpen(false);
      
    } else if (workoutState.matches('completed')) {
      // Completed state - show completion UI or navigate back
      console.log('✅ Machine in completed state - workout finished');
      setIsModalOpen(false);
    } else if (workoutState.matches('idle')) {
      // Idle state - machine is ready for new workout
      console.log('💤 Machine in idle state - ready for new workout');
    }
  }, [workoutState]);

  // Load real Nostr data
  useEffect(() => {
    const loadNostrData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const ndk = getNDKInstance();
        if (!ndk) {
          console.warn('[WorkoutsTab] NDK not initialized');
          setIsLoading(false);
          return;
        }

        console.log('[WorkoutsTab] Loading real Nostr data...');

        // Load recent workout records (Kind 1301) for social feed
        console.log('[WorkoutsTab] Fetching recent workout records...');
        const workoutRecords = await ndk.fetchEvents({
          kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as number],
          '#t': ['fitness'],
          limit: 10,
          since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60) // Last 7 days
        });

        console.log('[WorkoutsTab] Found workout records:', workoutRecords.size);

        // Parse workout records for social feed
        const parsedWorkouts: SocialWorkout[] = [];
        const socialTemplateRefs = new Set<string>();
        const eventDataMap = new Map();

        for (const event of Array.from(workoutRecords)) {
          try {
            const workoutEvent: WorkoutEvent = {
              kind: event.kind!,
              content: event.content || '',
              tags: event.tags,
              created_at: event.created_at!,
              pubkey: event.pubkey,
              id: event.id
            };

            // Store raw event data for click logging (no console output during load)
            eventDataMap.set(event.id, {
              type: '1301_workout_record',
              hexId: event.id,
              nevent: event.encode ? event.encode() : 'encode() not available',
              pubkey: event.pubkey,
              created_at: event.created_at,
              tags: event.tags,
              rawEvent: event
            });

            const parsed = parseWorkoutEvent(workoutEvent);
            
            // Extract template references from this workout
            const templateTags = event.tags.filter(tag => tag[0] === 'template');
            let referencedTemplate = null;
            
            if (templateTags.length > 0) {
              const templateRef = templateTags[0][1]; // First template reference
              socialTemplateRefs.add(templateRef);
              
              // Try to fetch the referenced template immediately
              try {
                const [kind, pubkey, dTag] = templateRef.split(':');
                if (kind === '33402' && pubkey && dTag) {
                  const referencedTemplates = await ndk.fetchEvents({
                    kinds: [33402 as number],
                    authors: [pubkey],
                    '#d': [dTag],
                    limit: 1
                  });
                  
                  if (referencedTemplates.size > 0) {
                    const template = Array.from(referencedTemplates)[0];
                    referencedTemplate = {
                      hexId: template.id,
                      naddr: template.encode ? template.encode() : 'encode() not available',
                      title: template.tags.find(t => t[0] === 'title')?.[1] || 'Unknown Template',
                      pubkey: template.pubkey
                    };
                    
                    // Store referenced template data
                    eventDataMap.set(`${event.id}_template`, {
                      type: 'referenced_template',
                      templateRef,
                      ...referencedTemplate,
                      rawEvent: template
                    });
                  }
                }
              } catch (templateError) {
                console.warn('[WorkoutsTab] Failed to fetch referenced template:', templateRef, templateError);
              }
            }
            
            // Convert to social workout format
            const socialWorkout: SocialWorkout = {
              id: parsed.id,
              title: parsed.title,
              completedAt: new Date(parsed.endTime * 1000),
              duration: Math.floor(parsed.duration / 60), // Convert to minutes
              exercises: parsed.exercises.map(ex => ({
                name: `${parsed.exercises.length} exercises`, // Simple count instead of fake names
                sets: [{
                  reps: parseInt(ex.reps),
                  weight: parseInt(ex.weight),
                  rpe: parseInt(ex.rpe)
                }]
              })),
              author: {
                pubkey: parsed.pubkey,
                name: `${parsed.pubkey.slice(0, 8)}...`,
                picture: '/assets/workout-record-fallback.jpg'
              },
              notes: referencedTemplate 
                ? `${parsed.content || 'Completed workout'} (Template: ${referencedTemplate.title})`
                : parsed.content || 'Completed workout',
              eventId: parsed.eventId
            };

            parsedWorkouts.push(socialWorkout);

          } catch (parseError) {
            console.warn('[WorkoutsTab] Failed to parse workout:', event.id, parseError);
          }
        }

        // Sort by most recent
        parsedWorkouts.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
        setSocialWorkouts(parsedWorkouts.slice(0, 5)); // Limit to 5 for UI

        // Load workout templates - OPEN DISCOVERY (no author filtering)
        console.log('[WorkoutsTab] Fetching workout templates with open discovery...');
        const templateStartTime = Date.now();
        
        // Fetch ALL workout templates from the network (no filtering at all)
        const templates = await ndk.fetchEvents({
          kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
          limit: 50  // Increased limit for better discovery
        });

        console.log('[WorkoutsTab] Found templates:', templates.size);

        // Parse templates directly without dependency service (to avoid author filtering)
        const resolvedTemplates: Array<{
          id: string;
          name: string;
          exercises: Array<{ exerciseRef: string; sets: number; reps: number; weight?: number }>;
          estimatedDuration?: number;
          difficulty?: string;
          authorPubkey: string;
          eventId?: string;
          tags?: string[][];
        }> = [];
        
        for (const template of Array.from(templates)) {
          try {
            const dTag = template.tags.find(tag => tag[0] === 'd')?.[1];
            if (!dTag) continue;

            // Store raw template data for click logging
            const templateData = {
              type: '33402_workout_template',
              hexId: template.id,
              naddr: template.encode ? template.encode() : 'encode() not available',
              pubkey: template.pubkey,
              created_at: template.created_at,
              tags: template.tags,
              rawEvent: template
            };
            
            // Store using both the d-tag (template ID) and the hex event ID
            eventDataMap.set(template.id, templateData);
            eventDataMap.set(dTag, templateData);

            // Parse template directly
            const tagMap = new Map(template.tags.map(tag => [tag[0], tag]));
            
            const name = tagMap.get('title')?.[1] || tagMap.get('name')?.[1] || 'Untitled Template';
            const difficulty = tagMap.get('difficulty')?.[1] as 'beginner' | 'intermediate' | 'advanced' | undefined;
            const estimatedDuration = tagMap.get('duration')?.[1] ? parseInt(tagMap.get('duration')![1]) : undefined;
            
            // Extract exercise references
            const exerciseTags = template.tags.filter(tag => tag[0] === 'exercise');
            const exercises = exerciseTags.map(tag => ({
              exerciseRef: tag[1],
              sets: parseInt(tag[2]) || 3,
              reps: parseInt(tag[3]) || 10,
              weight: tag[4] ? parseInt(tag[4]) : undefined
            }));

            resolvedTemplates.push({
              id: dTag,
              name,
              exercises,
              estimatedDuration,
              difficulty,
              authorPubkey: template.pubkey,
              eventId: template.id,
              tags: template.tags
            });

          } catch (parseError) {
            console.warn('[WorkoutsTab] Failed to parse template:', template.id, parseError);
          }
        }
        
        const serviceLoadTime = Date.now() - templateStartTime;
        console.log(`[WorkoutsTab] ✅ Parsed ${resolvedTemplates.length} templates directly in ${serviceLoadTime}ms`);

        // Convert resolved templates to discovery format
        const discoveryWorkouts: DiscoveryWorkout[] = [];
        
        for (const template of resolvedTemplates) {
          try {
            // Store exercise data in event map
            eventDataMap.set(`${template.eventId || template.id}_exercises`, {
              type: 'template_exercises',
              count: template.exercises.length,
              exercises: template.exercises.map((ex) => ex.exerciseRef.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise')
            });

            const discoveryWorkout: DiscoveryWorkout = {
              id: template.id,
              title: template.name,
              exercises: template.exercises.map((ex) => ({
                name: ex.exerciseRef.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise',
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight || 0
              })),
              estimatedDuration: Math.round((template.estimatedDuration || 1800) / 60), // Convert to minutes
              difficulty: (template.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
              rating: 8.5 + Math.random() * 1.5, // Mock rating for now
              calories: Math.round(((template.estimatedDuration || 1800) / 60) * 4.5), // Rough estimate
              muscleGroups: ['full-body'], // Could be extracted from exercise data
              level: template.difficulty === 'beginner' ? 'low' : template.difficulty === 'advanced' ? 'hard' : 'moderate',
              author: {
                pubkey: template.authorPubkey,
                name: `${template.authorPubkey.slice(0, 8)}...`,
                picture: '/assets/workout-template-fallback.jpg'
              },
              eventId: template.eventId,
              eventTags: template.tags
            };

            discoveryWorkouts.push(discoveryWorkout);

          } catch (parseError) {
            console.warn('[WorkoutsTab] Failed to parse resolved template:', template.id, parseError);
          }
        }

        // Sort by rating (mock) and limit
        discoveryWorkouts.sort((a, b) => b.rating - a.rating);
        setDiscoveryTemplates(discoveryWorkouts.slice(0, 6));
        
        const totalTemplateTime = Date.now() - templateStartTime;
        console.log(`[WorkoutsTab] ✅ Template discovery complete in ${totalTemplateTime}ms (service: ${serviceLoadTime}ms)`);

        // Generate workout indicators from parsed workouts
        const indicators: WorkoutIndicator[] = parsedWorkouts.slice(0, 10).map(workout => ({
          date: workout.completedAt,
          count: 1,
          type: 'completed' as const
        }));
        setWorkoutIndicators(indicators);

        // Store all event data for click logging
        setRawEventData(eventDataMap);

        console.log('[WorkoutsTab] Data loading complete:', {
          socialWorkouts: parsedWorkouts.length,
          discoveryTemplates: discoveryWorkouts.length,
          indicators: indicators.length,
          optimizedService: serviceLoadTime > 0 ? `${serviceLoadTime}ms` : 'not used'
        });

      } catch (error) {
        console.error('[WorkoutsTab] Failed to load Nostr data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load workout data');
      } finally {
        setIsLoading(false);
      }
    };

    loadNostrData();
  }, []); // Load once on mount

  // POWR WOD - keep as featured content for now
  const powrWOD = useMemo(() => ({
    id: 'powr-wod-today',
    title: 'Upper Body Power',
    description: 'Build explosive upper body strength with this compound movement focused workout.',
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 12, weight: 0 },
      { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
      { name: 'Dips', sets: 3, reps: 10, weight: 0 },
      { name: 'Pike Push-ups', sets: 3, reps: 8, weight: 0 },
      { name: 'Plank', sets: 3, reps: 60, weight: 0 }
    ],
    estimatedDuration: 35,
    difficulty: 'intermediate' as const,
    tags: ['strength', 'upper-body', 'bodyweight'],
    author: {
      pubkey: 'powr-coach',
      name: 'POWR Coach',
      picture: '/assets/logos/powr-logo.svg'
    },
    eventId: 'powr-wod-event-id',
    eventTags: [
      ['d', 'upper-body-power'],
      ['title', 'Upper Body Power'],
      ['difficulty', 'intermediate'],
      ['duration', '35'],
      ['t', 'fitness']
    ],
    eventContent: JSON.stringify({
      description: 'Build explosive upper body strength with this compound movement focused workout.',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 12 },
        { name: 'Pull-ups', sets: 3, reps: 8 },
        { name: 'Dips', sets: 3, reps: 10 },
        { name: 'Pike Push-ups', sets: 3, reps: 8 },
        { name: 'Plank', sets: 3, reps: 60 }
      ]
    }),
    eventKind: 33402
  }), []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleWorkoutSelect = (workoutId: string) => {
    // Only log in development mode to avoid production performance impact
    if (process.env.NODE_ENV === 'development') {
      console.log('🏋️ Selected workout:', workoutId);
      
      // Log detailed event information for this specific workout
      const eventData = rawEventData.get(workoutId);
      if (eventData) {
        console.group(`📊 Detailed Event Info: ${workoutId}`);
        console.log('Event Type:', eventData.type);
        console.log('Hex ID:', eventData.hexId);
        
        if (eventData.type === '1301_workout_record') {
          console.log('Nevent:', eventData.nevent);
        } else if (eventData.type === '33402_workout_template') {
          console.log('Naddr:', eventData.naddr);
        }
        
        console.log('Pubkey:', eventData.pubkey);
        console.log('Created At:', new Date((eventData.created_at as number) * 1000).toLocaleString());
        console.log('Tags:', eventData.tags);
        
        // Check for referenced template
        const templateData = rawEventData.get(`${workoutId}_template`);
        if (templateData) {
          console.log('Referenced Template:', {
            title: templateData.title,
            hexId: templateData.hexId,
            naddr: templateData.naddr
          });
        }
        
        // Check for exercise data
        const exerciseData = rawEventData.get(`${workoutId}_exercises`);
        if (exerciseData) {
          console.log('Exercises:', exerciseData.exercises);
        }
        
        console.groupEnd();
      } else {
        console.warn('No event data found for workout:', workoutId);
      }
    }

    // NEW ARCHITECTURE: Start machine with preselected template
    // Find the template ID to pass to the machine
    let templateId = workoutId;
    
    // Check if it's the POWR WOD
    if (workoutId === powrWOD.id) {
      templateId = powrWOD.id;
    } else {
      // Check discovery templates
      const discoveryWorkout = discoveryTemplates.find(w => w.id === workoutId || w.eventId === workoutId);
      if (discoveryWorkout) {
        templateId = discoveryWorkout.id;
      } else {
        // Check social workouts - if they have a referenced template, use that
        const socialWorkout = socialWorkouts.find(w => w.id === workoutId || w.eventId === workoutId);
        if (socialWorkout) {
          const templateData = rawEventData.get(`${workoutId}_template`);
          if (templateData && templateData.hexId && typeof templateData.hexId === 'string') {
            // Use the referenced template ID
            templateId = templateData.hexId;
          }
        }
      }
    }

    // Extract template author pubkey for proper template reference
    let templateAuthorPubkey = 'user-pubkey'; // fallback
    
    // Check if it's the POWR WOD
    if (workoutId === powrWOD.id) {
      templateAuthorPubkey = 'powr-coach'; // POWR WOD author
    } else {
      // Check discovery templates for real author
      const discoveryWorkout = discoveryTemplates.find(w => w.id === workoutId || w.eventId === workoutId);
      if (discoveryWorkout) {
        templateAuthorPubkey = discoveryWorkout.author.pubkey;
        console.log('🔍 Found template author from discovery:', templateAuthorPubkey.slice(0, 8) + '...');
      } else {
        // Check raw event data for template author
        const eventData = rawEventData.get(workoutId);
        if (eventData && eventData.pubkey) {
          templateAuthorPubkey = eventData.pubkey as string;
          console.log('🔍 Found template author from event data:', templateAuthorPubkey.slice(0, 8) + '...');
        }
      }
    }

    console.log('🚀 Starting workout lifecycle machine with template:', templateId);
    console.log('📝 Template author pubkey:', templateAuthorPubkey.slice(0, 8) + '...');
    console.log('🔗 Will build template reference:', `33402:${templateAuthorPubkey}:${templateId}`);
    
    // Start the workout lifecycle machine with preselected template AND author info
    workoutSend({ 
      type: 'START_SETUP',
      preselectedTemplateId: templateId,
      templateAuthorPubkey: templateAuthorPubkey
    });
    
    // DON'T open modal yet - wait for setup machine to resolve template data
    // Modal will open when machine reaches 'active' state with resolved data
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
    setModalError(undefined);
  };

  const handleStartWorkout = () => {
    console.log('🚀 Starting workout from modal!');
    
    // Send event to machine to actually start the workout
    // This should trigger the activeWorkoutMachine to begin
    workoutSend({ type: 'START_WORKOUT' });
    
    // Close modal - the machine will handle the rest
    setIsModalOpen(false);
  };

  const handleAuthorClick = (pubkey: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 View author profile:', pubkey);
    }
    // TODO: Navigate to author profile
  };

  const handleMenuAction = (action: string, workoutId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Menu action:', action, 'for workout:', workoutId);
    }
    
    switch (action) {
      case 'details':
        handleWorkoutSelect(workoutId);
        break;
      case 'library':
        console.log('Add to library:', workoutId);
        // TODO: Add to user's library
        break;
      case 'copy':
        // Copy naddr to clipboard
        const eventData = rawEventData.get(workoutId);
        if (eventData?.naddr) {
          navigator.clipboard.writeText(eventData.naddr as string);
          console.log('Copied naddr to clipboard:', eventData.naddr);
        }
        break;
      case 'share':
        console.log('Share workout:', workoutId);
        // TODO: Open share dialog
        break;
      default:
        console.warn('Unknown menu action:', action);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Bar */}
      <CalendarBar
        selectedDate={selectedDate}
        workoutIndicators={workoutIndicators}
        onDateSelect={handleDateSelect}
      />

      {/* POWR WOD Hero Card */}
      <section>
        <WorkoutCard
          variant="hero"
          workout={powrWOD}
          onSelect={handleWorkoutSelect}
          onAuthorClick={handleAuthorClick}
          showImage={true}
          showAuthor={false}
          showStats={true}
        />
      </section>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading workout data from Nostr...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 rounded border border-red-200">
          <h3 className="font-medium mb-2 text-red-900">⚠️ Error Loading Data</h3>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-red-600 mt-2">
            Check console for details. Ensure NDK is initialized and connected.
          </p>
        </div>
      )}

      {/* Social Feed Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">What your friends are up to</h2>
          <button className="text-sm text-orange-600 hover:text-orange-700">
            View all
          </button>
        </div>
        
        {!isLoading && socialWorkouts.length === 0 ? (
          <div className="p-6 text-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">No recent workout records found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try publishing some workouts or check back later.
            </p>
          </div>
        ) : (
          <ScrollableGallery>
            {socialWorkouts.map((workout) => (
              <div key={workout.id} className="w-80 flex-shrink-0">
                <WorkoutCard
                  variant="social"
                  workout={workout}
                  onSelect={handleWorkoutSelect}
                  onAuthorClick={handleAuthorClick}
                  showImage={true}
                  showAuthor={true}
                  showStats={true}
                />
              </div>
            ))}
          </ScrollableGallery>
        )}
      </section>

      {/* Discovery Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Find workout</h2>
          <button className="text-sm text-orange-600 hover:text-orange-700">
            Browse all
          </button>
        </div>
        
        <SearchableWorkoutDiscovery
          workouts={discoveryTemplates}
          onWorkoutSelect={handleWorkoutSelect}
          onMenuAction={handleMenuAction}
          isLoading={isLoading}
        />
      </section>

      {/* Real Nostr Integration Status */}
      <div className="p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-medium mb-2 text-blue-900">🌐 Real Nostr Integration</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>✅ Phase 1: Calendar Bar - COMPLETE</p>
          <p>✅ Phase 2: POWR WOD Hero Card - COMPLETE</p>
          <p>✅ Phase 3: Social Feed Gallery with Beautiful Cards - COMPLETE</p>
          <p>✅ Phase 4: Discovery Section - COMPLETE</p>
          <p>✅ Phase 5: Mockup-Perfect Social Feed Design - COMPLETE</p>
          <p>✅ Phase 6: Real Nostr Integration - COMPLETE</p>
          <div className="mt-2 pt-2 border-t border-blue-200">
            <p className="font-medium">Live Data Sources:</p>
            <p>• Social Feed: Recent Kind 1301 workout records</p>
            <p>• Discovery: Kind 33402 workout templates</p>
            <p>• Calendar: Workout completion indicators</p>
            <p>• Authentication: {isAuthenticated ? '✅ Connected' : '❌ Not authenticated'}</p>
          </div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        isOpen={isModalOpen}
        isLoading={false}
        templateData={selectedWorkout || undefined}
        error={modalError}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
      />
    </div>
  );
}
