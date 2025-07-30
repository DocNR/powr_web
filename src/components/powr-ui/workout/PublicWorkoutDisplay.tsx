/**
 * Public Workout Display Component
 * 
 * User-showcase focused design that celebrates the workout performer's achievement
 * while converting viewers into POWR users. No sharing functionality - this IS the shared content.
 * 
 * Key Features:
 * - Hero section showcasing the user who completed the workout
 * - Workout template card showing what they accomplished
 * - Clean, mobile-first layout with minimal containers
 * - Strong POWR conversion focus
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, ExternalLink, AlertCircle, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/powr-ui/primitives/Avatar';
import { WorkoutCard } from '@/components/powr-ui/workout/WorkoutCard';
import { socialSharingService } from '@/lib/services/socialSharingService';
import { workoutAnalyticsService } from '@/lib/services/workoutAnalytics';
import { getNDKInstance } from '@/lib/ndk';
import { useProfile, getDisplayName, getAvatarUrl } from '@/hooks/useProfile';
import type { DecodedNevent } from '@/lib/services/socialSharingService';
import type { ProcessedWorkoutData } from '@/lib/services/workoutAnalytics';
import type { ParsedWorkoutEvent, ParsedExerciseSet } from '@/lib/services/dataParsingService';

// Import NDK for data fetching
import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

interface PublicWorkoutDisplayProps {
  nevent: string;
  className?: string;
}

interface WorkoutLoadingState {
  isLoading: boolean;
  error: string | null;
  workoutData: ParsedWorkoutEvent | null;
  processedData: ProcessedWorkoutData | null;
}

export const PublicWorkoutDisplay: React.FC<PublicWorkoutDisplayProps> = ({
  nevent,
  className = ''
}) => {
  const [loadingState, setLoadingState] = useState<WorkoutLoadingState>({
    isLoading: true,
    error: null,
    workoutData: null,
    processedData: null
  });

  // Decode nevent to get event details
  const decodedNevent = useMemo<DecodedNevent | null>(() => {
    try {
      return socialSharingService.decodeWorkoutNevent(nevent);
    } catch (error) {
      console.error('[PublicWorkoutDisplay] Failed to decode nevent:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Invalid workout link'
      }));
      return null;
    }
  }, [nevent]);

  // Get user profile for the workout performer
  const { profile: userProfile } = useProfile(loadingState.workoutData?.authorPubkey);
  const userDisplayName = getDisplayName(userProfile, loadingState.workoutData?.authorPubkey);
  const userAvatarUrl = getAvatarUrl(userProfile, loadingState.workoutData?.authorPubkey);

  // Fetch workout data using NDK singleton pattern
  useEffect(() => {
    if (!decodedNevent) return;

    const fetchWorkoutData = async () => {
      try {
        const ndk = getNDKInstance();
        if (!ndk) {
          throw new Error('NDK not initialized');
        }

        // Create filter for workout data
        const filter: NDKFilter = {
          ids: [decodedNevent.eventId],
          kinds: [1301 as number], // NIP-101e workout record
          authors: [decodedNevent.authorPubkey]
        };

        // Fetch events from NDK
        const events = await ndk.fetchEvents([filter]);
        const eventArray = Array.from(events);

        if (eventArray.length === 0) {
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Workout not found. It may not be published to the Nostr network yet.'
          }));
          return;
        }

        const workoutEvent = eventArray[0];
        
        // Parse the workout event (simplified parsing for public display)
        const parsedWorkout = parseWorkoutEventForPublicDisplay(workoutEvent);
        
        // Create a simple resolved exercises map for public display
        // Extract exercise names from the exercise references
        const resolvedExercises = new Map<string, { name: string }>();
        parsedWorkout.exercises.forEach(exercise => {
          if (!resolvedExercises.has(exercise.exerciseRef)) {
            // Extract exercise name from reference (format: "33401:pubkey:exercise-name")
            const exerciseName = extractExerciseNameFromRef(exercise.exerciseRef);
            resolvedExercises.set(exercise.exerciseRef, { name: exerciseName });
          }
        });
        
        // Process the workout data using WorkoutAnalyticsService
        const processedData = workoutAnalyticsService.processWorkoutForHistory(parsedWorkout, resolvedExercises);
        
        setLoadingState({
          isLoading: false,
          error: null,
          workoutData: parsedWorkout,
          processedData
        });
      } catch (error) {
        console.error('[PublicWorkoutDisplay] Failed to fetch workout data:', error);
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load workout data. The workout may be malformed.'
        }));
      }
    };

    fetchWorkoutData();
  }, [decodedNevent]);

  // Extract exercise name from exercise reference
  const extractExerciseNameFromRef = (exerciseRef: string): string => {
    try {
      // Exercise reference format: "33401:pubkey:exercise-d-tag"
      const parts = exerciseRef.split(':');
      if (parts.length >= 3) {
        const dTag = parts[2];
        // Convert kebab-case to title case (e.g., "push-up" -> "Push Up")
        return dTag
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return 'Unknown Exercise';
    } catch {
      console.warn('[PublicWorkoutDisplay] Failed to extract exercise name from ref:', exerciseRef);
      return 'Unknown Exercise';
    }
  };

  // Parse NDK event to ParsedWorkoutEvent format (simplified for public display)
  const parseWorkoutEventForPublicDisplay = (event: NDKEvent): ParsedWorkoutEvent => {
    const tags = event.tags;
    const content = event.content;

    // Extract basic workout info from tags
    const titleTag = tags.find(t => t[0] === 'title');
    const startTag = tags.find(t => t[0] === 'start');
    const endTag = tags.find(t => t[0] === 'end');
    const durationTag = tags.find(t => t[0] === 'duration');

    // Extract exercise tags
    const exerciseTags = tags.filter(t => t[0] === 'exercise');
    
    const exercises: ParsedExerciseSet[] = exerciseTags.map((tag) => {
      // Exercise tag format: ['exercise', 'exerciseRef', 'relay', 'weight', 'reps', 'rpe', 'setType', 'setNumber']
      const [, exerciseRef, , weight, reps, rpe, setType, setNumber] = tag;
      
      // Ensure setType is one of the valid types
      const validSetType: 'normal' | 'warmup' | 'drop' | 'failure' = 
        ['normal', 'warmup', 'drop', 'failure'].includes(setType || '') 
          ? (setType as 'normal' | 'warmup' | 'drop' | 'failure')
          : 'normal';
      
      return {
        exerciseRef: exerciseRef || '',
        reps: parseInt(reps || '0', 10),
        weight: parseFloat(weight || '0'),
        rpe: rpe ? parseFloat(rpe) : undefined,
        setType: validSetType,
        setNumber: parseInt(setNumber || '1', 10)
      };
    });

    // Calculate duration from start/end or use duration tag
    let duration = 0;
    if (startTag && endTag) {
      const startTime = parseInt(startTag[1], 10);
      const endTime = parseInt(endTag[1], 10);
      duration = endTime - startTime;
    } else if (durationTag) {
      duration = parseInt(durationTag[1], 10);
    }

    return {
      id: event.id,
      eventId: event.id,
      title: titleTag?.[1] || 'Shared Workout',
      description: content || '',
      authorPubkey: event.pubkey,
      createdAt: event.created_at || Math.floor(Date.now() / 1000),
      startTime: startTag ? parseInt(startTag[1], 10) : event.created_at || Math.floor(Date.now() / 1000),
      endTime: endTag ? parseInt(endTag[1], 10) : (event.created_at || Math.floor(Date.now() / 1000)) + duration,
      duration,
      workoutType: 'strength', // Default type for public display
      completed: true, // Assume completed since it's published
      tags: tags,
      exercises
    };
  };

  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle POWR app link
  const handleJoinPOWR = () => {
    const powrUrl = `${window.location.origin}`;
    window.open(powrUrl, '_blank', 'noopener,noreferrer');
  };

  // Create template card data for WorkoutCard component
  const templateCardData = useMemo(() => {
    if (!loadingState.processedData?.template) return null;

    const template = loadingState.processedData.template;
    const [, authorPubkey, templateId] = template.reference.split(':');

    return {
      id: templateId,
      title: template.name || 'Workout Template',
      description: '',
      exercises: loadingState.processedData.exerciseSummary.map((exercise) => ({
        name: exercise.exerciseName,
        sets: exercise.totalSets,
        reps: Math.round(exercise.totalReps / exercise.totalSets),
        weight: 0
      })),
      estimatedDuration: Math.round(loadingState.processedData.stats.duration / 60),
      difficulty: 'intermediate' as const,
      tags: ['fitness'],
      author: {
        pubkey: authorPubkey,
        name: template.authorName || authorPubkey.slice(0, 8) + '...',
        picture: undefined
      },
      eventId: `${authorPubkey}-${templateId}`,
      eventTags: [
        ['d', templateId],
        ['title', template.name || 'Workout Template'],
        ['t', 'fitness']
      ],
      eventContent: '',
      eventKind: 33402
    };
  }, [loadingState.processedData]);

  // Loading state
  if (loadingState.isLoading) {
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <h2 className="text-xl font-semibold">Loading Workout...</h2>
                <p className="text-muted-foreground">
                  Fetching workout data from the Nostr network...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (loadingState.error || !loadingState.workoutData || !loadingState.processedData) {
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold">Workout Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {loadingState.error || 'This workout could not be loaded. It may not exist or may not be published to the Nostr network yet.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                  <Button onClick={handleJoinPOWR}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Try POWR
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { workoutData, processedData } = loadingState;

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header - POWR Branding Only */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Shared from POWR
            </div>
            <Button onClick={handleJoinPOWR} size="sm">
              Try POWR
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Single Column, Clean Layout */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* User Hero Section - The Star of the Show */}
        <div className="text-center space-y-4">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {userDisplayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {userDisplayName} crushed this workout!
            </h1>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(workoutData.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(workoutData.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Trophy className="h-3 w-3 mr-1" />
              Workout Complete
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Target className="h-3 w-3 mr-1" />
              {processedData.stats.exerciseCount} Exercises
            </Badge>
          </div>
        </div>

        {/* Featured Workout Template Card - What They Followed */}
        {templateCardData && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Workout Template</h2>
            <WorkoutCard
              variant="compact"
              workout={templateCardData}
              showAuthor={true}
              showImage={true}
              showStats={true}
            />
          </div>
        )}

        {/* Their Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {userDisplayName}&apos;s Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {workoutAnalyticsService.formatDuration(processedData.stats.duration)}
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {processedData.stats.totalReps}
                </div>
                <div className="text-sm text-muted-foreground">Total Reps</div>
              </div>
              
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">
                  {Math.round(processedData.stats.totalVolume)} kg
                </div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </div>
              
              {processedData.stats.averageRPE && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {processedData.stats.averageRPE.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Average RPE</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workout Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Workout Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedData.timeline.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{entry.exerciseName}</h4>
                      <p className="text-xs text-muted-foreground">Set {entry.setNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{entry.reps} reps</span>
                    <span className="text-muted-foreground">{entry.displayWeight}</span>
                    {entry.displayRPE && (
                      <span className="text-muted-foreground">{entry.displayRPE}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* POWR Conversion CTA */}
        <Card className="bg-muted/50 backdrop-blur-sm border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Want to track your workouts like {userDisplayName}?
            </h3>
            <p className="text-muted-foreground mb-4">
              Join POWR to track your fitness journey, share your achievements, and own your data on the decentralized web.
            </p>
            <Button 
              onClick={handleJoinPOWR}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
              size="lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Start Your Fitness Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
