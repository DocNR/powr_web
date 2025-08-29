'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/powr-ui/primitives/Tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/powr-ui/primitives/Avatar';
import { Badge } from '@/components/powr-ui/primitives/Badge';
import { ArrowLeft, TrendingUp, Calendar, Target, Plus, Check, Play } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { WorkoutImageHandler } from '@/components/powr-ui/workout/WorkoutImageHandler';
import { useProfile, getDisplayName, getAvatarUrl } from '@/hooks/useProfile';
import { usePubkey } from '@/lib/auth/hooks';
import { getNDKInstance } from '@/lib/ndk';
import { NDKFilter, NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { exerciseAnalyticsService } from '@/lib/services/workoutAnalytics';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import { useLibraryData } from '@/providers/LibraryDataProvider';
import { useToast } from '@/providers/ToastProvider';
import { prepareExerciseForModal, extractVideoUrls, extractYouTubeVideoId, type ExerciseModalData } from '@/lib/utils/exerciseModalData';
import type { ExercisePerformanceAnalysis } from '@/lib/services/workoutAnalytics';

interface ExerciseData {
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
}

interface ExerciseDetailModalProps {
  isOpen: boolean;
  exercise?: ExerciseData;
  onClose: () => void;
  hideBackground?: boolean; // NEW: Option to hide the background image
}

interface ExerciseUsage {
  date: number;
  weight: string;
  reps: string;
  rpe?: string;
  setType?: string;
  workoutTitle?: string;
}

export const ExerciseDetailModal = ({
  isOpen,
  exercise,
  onClose,
  hideBackground = false,
}: ExerciseDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const userPubkey = usePubkey();
  const { showToast } = useToast();
  const { exerciseLibrary } = useLibraryData();

  // Get author profile data
  const { profile: authorProfile } = useProfile(exercise?.authorPubkey);
  const authorDisplayName = getDisplayName(authorProfile, exercise?.authorPubkey);
  const authorAvatar = getAvatarUrl(authorProfile, exercise?.authorPubkey);

  // State for workout records and analysis
  const [workoutRecords, setWorkoutRecords] = useState<NDKEvent[]>([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<ExercisePerformanceAnalysis | null>(null);

  // Library state
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);

  // Prepare exercise data using centralized utility
  const exerciseModalData = useMemo(() => {
    if (!exercise) return null;
    
    try {
      // Ensure eventTags is defined for the utility function
      const exerciseWithTags = {
        ...exercise,
        eventTags: exercise.eventTags || []
      };
      return prepareExerciseForModal(exerciseWithTags);
    } catch {
      // Fallback to original exercise data
      return exercise as ExerciseModalData;
    }
  }, [exercise]);

  // Extract video data from prepared exercise
  const videoData = useMemo(() => {
    if (!exerciseModalData?.eventTags) return [];
    return extractVideoUrls(exerciseModalData.eventTags);
  }, [exerciseModalData]);

  // Check if exercise is in user's library
  const isInLibrary = useMemo(() => {
    if (!exercise || !exerciseLibrary.content) return false;
    
    // Create exercise reference in the format used by library
    const exerciseRef = `33401:${exercise.authorPubkey}:${exercise.id}`;
    
    return exerciseLibrary.content.some(item => 
      item.exerciseRef === exerciseRef || 
      item.exercise.id === exercise.id
    );
  }, [exercise, exerciseLibrary.content]);

  // Handle library toggle
  const handleLibraryToggle = useCallback(async () => {
    if (!exercise || !userPubkey) {
      showToast("Error", "error", "Unable to save exercise - missing exercise data or user not authenticated");
      return;
    }

    // Create exercise reference
    const exerciseRef = `33401:${exercise.authorPubkey}:${exercise.id}`;
    
    setIsAddingToLibrary(true);
    try {
      if (isInLibrary) {
        await libraryManagementService.removeFromLibraryCollectionWithRefresh(
          userPubkey,
          'EXERCISE_LIBRARY',
          exerciseRef
        );
        showToast(
          "Removed from Library",
          "success",
          `${exercise.name} has been removed from your exercise library`
        );
      } else {
        await libraryManagementService.addToLibraryCollectionWithRefresh(
          userPubkey,
          'EXERCISE_LIBRARY',
          exerciseRef
        );
        showToast(
          "Added to Library",
          "success",
          `${exercise.name} has been added to your exercise library`
        );
      }
    } catch {
      showToast(
        "Error",
        "error",
        `Failed to ${isInLibrary ? 'remove from' : 'add to'} library. Please try again.`
      );
    } finally {
      setIsAddingToLibrary(false);
    }
  }, [exercise, userPubkey, isInLibrary, showToast]);

  // Query user's workout records to get exercise history using NDK singleton
  useEffect(() => {
    if (!userPubkey || !exercise) {
      setWorkoutRecords([]);
      setPerformanceAnalysis(null);
      return;
    }

    const ndk = getNDKInstance();
    if (!ndk) {
      console.warn('[ExerciseDetailModal] NDK not initialized');
      return;
    }

    const filter: NDKFilter = {
      kinds: [1301 as NDKKind],
      authors: [userPubkey],
      limit: 100
    };

    const subscription = ndk.subscribe([filter]);

    subscription.on('event', (event: NDKEvent) => {
      setWorkoutRecords(prev => {
        // Avoid duplicates
        if (prev.some(existing => existing.id === event.id)) {
          return prev;
        }
        return [...prev, event];
      });
    });

    subscription.on('eose', () => {
      // Analysis will be triggered by workoutRecords change
    });

    // Cleanup
    return () => {
      subscription.stop();
    };
  }, [userPubkey, exercise]);

  // Analyze exercise performance when workout records change
  useEffect(() => {
    if (!exercise || !workoutRecords.length) {
      setPerformanceAnalysis(null);
      return;
    }

    const analysis = exerciseAnalyticsService.analyzeExercisePerformance(
      exercise.id,
      workoutRecords
    );
    
    setPerformanceAnalysis(analysis);
  }, [exercise, workoutRecords]);

  // Extract exercise usage history from workout records
  const exerciseHistory = useMemo(() => {
    if (!exercise || !workoutRecords) return [];

    const history: ExerciseUsage[] = [];
    
    workoutRecords.forEach((workout: NDKEvent) => {
      // Get workout title from tags
      const titleTag = workout.tags.find((tag: string[]) => tag[0] === 'title');
      const workoutTitle = titleTag?.[1] || 'Untitled Workout';
      
      // Find exercise tags that match this exercise
      const exerciseTags = workout.tags.filter((tag: string[]) => 
        tag[0] === 'exercise' && 
        tag[1] && 
        tag[1].includes(exercise.id)
      );
      
      exerciseTags.forEach((exerciseTag: string[]) => {
        history.push({
          date: workout.created_at || 0,
          weight: exerciseTag[3] || '0',
          reps: exerciseTag[4] || '0',
          rpe: exerciseTag[5],
          setType: exerciseTag[6],
          workoutTitle
        });
      });
    });

    // Sort by date (most recent first)
    return history.sort((a, b) => b.date - a.date);
  }, [exercise, workoutRecords]);

  // Calculate personal records and stats
  const personalStats = useMemo(() => {
    if (exerciseHistory.length === 0) return null;

    const weights = exerciseHistory
      .map(h => parseFloat(h.weight))
      .filter(w => w > 0);
    
    const reps = exerciseHistory
      .map(h => parseInt(h.reps))
      .filter(r => r > 0);

    const totalSets = exerciseHistory.length;
    const totalWorkouts = new Set(exerciseHistory.map(h => h.workoutTitle)).size;
    const lastPerformed = exerciseHistory[0]?.date;

    return {
      totalSets,
      totalWorkouts,
      lastPerformed,
      maxWeight: weights.length > 0 ? Math.max(...weights) : 0,
      maxReps: reps.length > 0 ? Math.max(...reps) : 0,
      averageWeight: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
      averageReps: reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0,
    };
  }, [exerciseHistory]);

  // Format parameter interpretation
  const parameterInfo = useMemo(() => {
    if (!exercise?.format || !exercise?.formatUnits) return [];

    return exercise.format.map((param, index) => {
      const unit = exercise.formatUnits?.[index] || '';
      
      let description = '';
      switch (param) {
        case 'weight':
          description = unit === 'bodyweight' ? 'Use your body weight' : `Weight in ${unit}`;
          break;
        case 'reps':
          description = 'Number of repetitions to perform';
          break;
        case 'rpe':
          description = 'Rate of Perceived Exertion (0-10 scale)';
          break;
        case 'set_type':
          description = 'Type of set (normal, warmup, drop, failure)';
          break;
        case 'duration':
          description = `Duration in ${unit}`;
          break;
        case 'distance':
          description = `Distance in ${unit}`;
          break;
        default:
          description = `${param} (${unit})`;
      }

      return {
        name: param,
        unit,
        description
      };
    });
  }, [exercise]);

  if (!exercise) {
    return null;
  }

  return (
    <>
      {/* Full-screen background image - only show if not hidden */}
      {isOpen && !hideBackground && (
        <div className="fixed inset-0 z-40 opacity-100">
          <WorkoutImageHandler
            tags={exerciseModalData?.eventTags || exercise.eventTags}
            content={exerciseModalData?.eventContent || exercise.eventContent || exercise.description}
            eventKind={exerciseModalData?.eventKind || exercise.eventKind || 33401}
            alt={exerciseModalData?.name || exercise.name}
            className="w-full h-full object-cover"
            fill={true}
            priority={true}
          />
          {/* Responsive overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 md:from-black/40 md:via-black/15 md:to-black/25" />
        </div>
      )}

      {/* Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{exercise.name}</DialogTitle>
            <DialogDescription>
              Exercise details, parameters, and personal history
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-full bg-background overflow-hidden pb-[env(safe-area-inset-bottom)] flex flex-col frosted-glass-gradient">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-foreground hover:text-foreground/80"
                title="Back to exercise library"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold">{exercise.name}</h2>
              </div>

              {/* Add to Library Button */}
              <Button
                variant={isInLibrary ? "default" : "outline"}
                size="icon"
                onClick={handleLibraryToggle}
                disabled={isAddingToLibrary}
                className="text-foreground hover:text-foreground/80"
                title={isInLibrary ? "Remove from Library" : "Add to Library"}
              >
                {isAddingToLibrary ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : isInLibrary ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Main content - Tabs moved directly below header */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                {/* Fixed Tab Headers with proper padding */}
                <div className="px-6 flex-shrink-0 pt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger 
                      value="overview"
                      className="data-[state=active]:ring-2 data-[state=active]:ring-workout-active-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="parameters"
                      className="data-[state=active]:ring-2 data-[state=active]:ring-workout-active-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      Parameters
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history"
                      className="data-[state=active]:ring-2 data-[state=active]:ring-workout-active-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      History
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Scrollable Tab Content */}
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="overview" className="mt-0 h-full overflow-y-auto data-[state=inactive]:hidden">
                    <div className="px-6 pt-4 pb-6 space-y-4">
                      {/* Author Attribution */}
                      <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={authorAvatar} alt={authorDisplayName} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                              {authorDisplayName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">Created by {authorDisplayName}</p>
                            {exercise.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(exercise.createdAt * 1000).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Exercise Description */}
                      {exerciseModalData?.description && (
                        <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                          <h4 className="text-foreground font-medium text-sm mb-3">Description</h4>
                          <p className="text-foreground text-sm leading-relaxed">
                            {exerciseModalData.description}
                          </p>
                        </div>
                      )}

                      {/* Video Demonstration Section */}
                      {videoData.length > 0 && (
                        <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                          <h4 className="text-foreground font-medium text-sm mb-3 flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Video Demonstration
                          </h4>
                          <div className="space-y-3">
                            {videoData.map((video, index) => (
                              <div key={index} className="border border-border rounded-lg overflow-hidden">
                                {video.isYouTube && video.videoId ? (
                                  <div className="relative aspect-video">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${video.videoId}`}
                                      title={`${exerciseModalData?.name} demonstration ${index + 1}`}
                                      className="w-full h-full"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                ) : video.isDirectVideo ? (
                                  <div className="relative aspect-video">
                                    <video
                                      src={video.url}
                                      className="w-full h-full object-cover"
                                      controls
                                      preload="metadata"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-background/50">
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline flex items-center gap-2"
                                    >
                                      <Play className="h-3 w-3" />
                                      View demonstration video
                                    </a>
                                    {video.purpose && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Purpose: {video.purpose}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                        <h4 className="text-foreground font-medium text-sm mb-3">Exercise Info</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Equipment</p>
                            <Badge variant="secondary" className="text-xs">
                              {exerciseModalData?.equipment || exercise.equipment}
                            </Badge>
                          </div>
                          {(exerciseModalData?.difficulty || exercise.difficulty) && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                              <Badge 
                                variant={
                                  (exerciseModalData?.difficulty || exercise.difficulty) === 'beginner' ? 'default' :
                                  (exerciseModalData?.difficulty || exercise.difficulty) === 'intermediate' ? 'secondary' : 'destructive'
                                }
                                className="text-xs"
                              >
                                {exerciseModalData?.difficulty || exercise.difficulty}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Muscle Groups */}
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Muscle Groups</p>
                          <div className="flex flex-wrap gap-1">
                            {(exerciseModalData?.muscleGroups || exercise.muscleGroups).map((muscle) => (
                              <Badge key={muscle} variant="outline" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Personal Stats Preview */}
                      {performanceAnalysis && performanceAnalysis.totalSets > 0 && (
                        <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                          <h4 className="text-foreground font-medium text-sm mb-3">Your Stats</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Sets</p>
                              <p className="font-medium">{performanceAnalysis.totalSets}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Workouts</p>
                              <p className="font-medium">{performanceAnalysis.totalWorkouts}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Max Weight</p>
                              <p className="font-medium">{performanceAnalysis.personalRecords?.maxWeight || 0}kg</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Max Reps</p>
                              <p className="font-medium">{performanceAnalysis.personalRecords?.maxReps || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="parameters" className="mt-0 h-full overflow-y-auto data-[state=inactive]:hidden">
                    <div className="px-6 pt-4 pb-6 space-y-4">
                      <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                        <h4 className="text-foreground font-medium text-sm mb-3">Exercise Parameters</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          This exercise uses the following parameters when performed in workouts:
                        </p>
                        
                        {parameterInfo.length > 0 ? (
                          <div className="space-y-3">
                            {parameterInfo.map((param, index) => (
                              <div key={index} className="border border-border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-sm capitalize">{param.name}</h5>
                                  {param.unit && (
                                    <Badge variant="outline" className="text-xs">
                                      {param.unit}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {param.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No parameter information available for this exercise.
                          </p>
                        )}
                      </div>

                      {/* Format Arrays Display */}
                      {exercise.format && (
                        <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                          <h4 className="text-foreground font-medium text-sm mb-3">Technical Format</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Format Array</p>
                              <code className="text-xs bg-background/50 px-2 py-1 rounded">
                                [{exercise.format.map(f => `"${f}"`).join(', ')}]
                              </code>
                            </div>
                            {exercise.formatUnits && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Units Array</p>
                                <code className="text-xs bg-background/50 px-2 py-1 rounded">
                                  [{exercise.formatUnits.map(u => `"${u}"`).join(', ')}]
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-0 h-full overflow-y-auto data-[state=inactive]:hidden">
                    <div className="px-6 pt-4 pb-6 space-y-4">
                      {personalStats ? (
                        <>
                          {/* Personal Records */}
                          <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="text-foreground font-medium text-sm mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Personal Records
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-background/50 rounded-lg">
                                <p className="text-lg font-bold text-primary">{personalStats.maxWeight}kg</p>
                                <p className="text-xs text-muted-foreground">Max Weight</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded-lg">
                                <p className="text-lg font-bold text-primary">{personalStats.maxReps}</p>
                                <p className="text-xs text-muted-foreground">Max Reps</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded-lg">
                                <p className="text-lg font-bold text-primary">{personalStats.totalSets}</p>
                                <p className="text-xs text-muted-foreground">Total Sets</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded-lg">
                                <p className="text-lg font-bold text-primary">{personalStats.totalWorkouts}</p>
                                <p className="text-xs text-muted-foreground">Workouts</p>
                              </div>
                            </div>
                          </div>

                          {/* Recent History */}
                          <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="text-foreground font-medium text-sm mb-3 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Recent History
                            </h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {exerciseHistory.slice(0, 10).map((usage, index) => (
                                <div key={index} className="border border-border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium">{usage.workoutTitle}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(usage.date * 1000).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{usage.weight}kg</span>
                                    <span>×</span>
                                    <span>{usage.reps} reps</span>
                                    {usage.rpe && (
                                      <>
                                        <span>•</span>
                                        <span>RPE {usage.rpe}</span>
                                      </>
                                    )}
                                    {usage.setType && usage.setType !== 'normal' && (
                                      <>
                                        <span>•</span>
                                        <Badge variant="outline" className="text-xs">
                                          {usage.setType}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-8 text-center">
                          <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h4 className="text-foreground font-medium text-sm mb-2">No History Yet</h4>
                          <p className="text-sm text-muted-foreground">
                            Start using this exercise in your workouts to see your progress and personal records here.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
