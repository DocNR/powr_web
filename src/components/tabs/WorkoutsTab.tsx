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
          kinds: [WORKOUT_EVENT_KINDS.WORKOUT_RECORD as any],
          '#t': ['fitness'],
          limit: 10,
          since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60) // Last 7 days
        });

        console.log('[WorkoutsTab] Found workout records:', workoutRecords.size);

        // Parse workout records for social feed
        const parsedWorkouts: SocialWorkout[] = [];
        const templateRefs = new Set<string>();
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
              templateRefs.add(templateRef);
              
              // Try to fetch the referenced template immediately
              try {
                const [kind, pubkey, dTag] = templateRef.split(':');
                if (kind === '33402' && pubkey && dTag) {
                  const referencedTemplates = await ndk.fetchEvents({
                    kinds: [33402 as any],
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
                name: ex.reference.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise',
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

        // Load workout templates (Kind 33402) for discovery section
        console.log('[WorkoutsTab] Fetching workout templates...');
        const templates = await ndk.fetchEvents({
          kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as any],
          '#t': ['fitness'],
          limit: 20
        });

        console.log('[WorkoutsTab] Found templates:', templates.size);

        // Parse templates for discovery section
        const discoveryWorkouts: DiscoveryWorkout[] = [];
        
        for (const template of Array.from(templates)) {
          try {
            // Store raw template data for click logging (no console output during load)
            eventDataMap.set(template.id, {
              type: '33402_workout_template',
              hexId: template.id,
              naddr: template.encode ? template.encode() : 'encode() not available',
              pubkey: template.pubkey,
              created_at: template.created_at,
              tags: template.tags,
              rawEvent: template
            });

            const tagMap = new Map(template.tags.map(tag => [tag[0], tag]));
            
            const title = tagMap.get('title')?.[1] || tagMap.get('d')?.[1] || 'Untitled Workout';
            const duration = parseInt(tagMap.get('duration')?.[1] || '1800') / 60; // Convert to minutes
            const difficulty = tagMap.get('difficulty')?.[1] || 'intermediate';
            
            // Extract exercises from template
            const exerciseTags = template.tags.filter(tag => tag[0] === 'exercise');
            const exercises = exerciseTags.map(tag => ({
              name: tag[1]?.split(':')[2]?.replace(/-/g, ' ') || 'Unknown Exercise',
              sets: parseInt(tag[2] || '3'),
              reps: parseInt(tag[3] || '10'),
              weight: parseInt(tag[4] || '0')
            }));

            // Store exercise data in event map
            eventDataMap.set(`${template.id}_exercises`, {
              type: 'template_exercises',
              count: exercises.length,
              exercises: exercises.map(e => e.name)
            });

            const discoveryWorkout: DiscoveryWorkout = {
              id: tagMap.get('d')?.[1] || template.id,
              title,
              exercises,
              estimatedDuration: Math.round(duration),
              difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
              rating: 8.5 + Math.random() * 1.5, // Mock rating for now
              calories: Math.round(duration * 4.5), // Rough estimate
              muscleGroups: ['full-body'], // Could be extracted from exercise tags
              level: difficulty === 'beginner' ? 'low' : difficulty === 'advanced' ? 'hard' : 'moderate',
              author: {
                pubkey: template.pubkey,
                name: `${template.pubkey.slice(0, 8)}...`,
                picture: '/assets/workout-template-fallback.jpg'
              },
              eventId: template.id,
              eventTags: template.tags
            };

            discoveryWorkouts.push(discoveryWorkout);

          } catch (parseError) {
            console.warn('[WorkoutsTab] Failed to parse template:', template.id, parseError);
          }
        }

        // Sort by rating (mock) and limit
        discoveryWorkouts.sort((a, b) => b.rating - a.rating);
        setDiscoveryTemplates(discoveryWorkouts.slice(0, 6));

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
          indicators: indicators.length
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
    
    // Find the workout data and open modal
    let workoutData = null;
    
    // Check if it's the POWR WOD
    if (workoutId === powrWOD.id) {
      workoutData = {
        title: powrWOD.title,
        description: powrWOD.description,
        content: powrWOD.eventContent,
        exercises: powrWOD.exercises,
        equipment: ['None - Bodyweight Only'],
        tags: powrWOD.eventTags,
        eventKind: powrWOD.eventKind
      };
    } else {
      // Check discovery templates
      const discoveryWorkout = discoveryTemplates.find(w => w.id === workoutId || w.eventId === workoutId);
      if (discoveryWorkout) {
        workoutData = {
          title: discoveryWorkout.title,
          description: `${discoveryWorkout.difficulty} level workout targeting ${discoveryWorkout.muscleGroups.join(', ')}`,
          content: JSON.stringify({
            exercises: discoveryWorkout.exercises,
            estimatedDuration: discoveryWorkout.estimatedDuration,
            difficulty: discoveryWorkout.difficulty
          }),
          exercises: discoveryWorkout.exercises,
          equipment: ['Various'], // Could be extracted from exercise data
          tags: discoveryWorkout.eventTags || [['t', 'fitness']],
          eventKind: 33402
        };
      } else {
        // Check social workouts (these are records, not templates)
        const socialWorkout = socialWorkouts.find(w => w.id === workoutId || w.eventId === workoutId);
        if (socialWorkout) {
          // First, check if this workout has a referenced template
          const templateData = rawEventData.get(`${workoutId}_template`);
          
          if (templateData) {
            // Use the referenced template data instead of the workout record
            workoutData = {
              title: templateData.title,
              description: `Template: ${templateData.title}`,
              content: `This is the template that was used for the workout completed by ${socialWorkout.author.name}`,
              exercises: [], // Template exercises would be loaded separately
              equipment: ['Various'],
              tags: [['t', 'fitness']],
              eventKind: 33402 // This is a template, not a workout record
            };
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🎯 Opening referenced template:', {
                templateTitle: templateData.title,
                templateId: templateData.hexId,
                originalWorkout: socialWorkout.title
              });
            }
          } else {
            // Fallback to workout record data if no template reference
            workoutData = {
              title: socialWorkout.title,
              description: `Completed workout by ${socialWorkout.author.name}`,
              content: socialWorkout.notes,
              exercises: socialWorkout.exercises.map(ex => ({
                name: ex.name,
                sets: ex.sets.length,
                reps: ex.sets[0]?.reps || 0,
                description: `${ex.sets.length} sets completed`
              })),
              equipment: ['Various'],
              tags: [['t', 'fitness']],
              eventKind: 1301
            };
            
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ No template reference found, showing workout record data');
            }
          }
        }
      }
    }
    
    if (workoutData) {
      setSelectedWorkout(workoutData);
      setIsModalOpen(true);
    } else {
      console.warn('Workout data not found for ID:', workoutId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
    setModalError(undefined);
  };

  const handleStartWorkout = () => {
    console.log('Starting workout!');
    alert('Workout started! This would normally navigate to the active workout screen.');
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
        templateData={selectedWorkout as any}
        error={modalError}
        onClose={handleCloseModal}
        onStartWorkout={handleStartWorkout}
      />
    </div>
  );
}
