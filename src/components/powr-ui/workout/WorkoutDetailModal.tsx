import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/powr-ui/primitives/Tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/powr-ui/primitives/Avatar';
import { Play, ArrowLeft, AlertCircle, Plus, Check } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import { ExpandableExerciseCard } from './ExpandableExerciseCard';
import { useProfile, getDisplayName, getAvatarUrl } from '@/hooks/useProfile';
import { useToast } from '@/providers/ToastProvider';
import { useLibraryData } from '@/providers/LibraryDataProvider';
import { libraryManagementService } from '@/lib/services/libraryManagement';
import { usePubkey } from '@/lib/auth/hooks';
import { cn } from '@/lib/utils';

interface PersonalRecord {
  oneRM?: number;
  maxWeight?: number;
  maxVolume?: number;
}

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  description?: string;
  // New fields for expanded functionality
  gifUrl?: string;
  personalRecords?: PersonalRecord;
  muscleGroups?: string[];
  equipment?: string;
  difficulty?: string;
}

interface TemplateData {
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  exercises?: Exercise[];
  equipment?: string[];
  tags?: string[][];
  eventKind?: number;
  templateRef?: string;
  // NEW: Support for ResolvedTemplate structure from dependency resolution service
  template?: {
    name: string;
    description: string;
    exercises: Array<{
      exerciseRef: string;
      sets?: number;
      reps?: number;
      weight?: number;
    }>;
  };
  // This is the resolved exercises from dependency resolution service
  resolvedExercises?: Array<{
    id: string;
    name: string;
    equipment: string;
    description: string;
    muscleGroups: string[];
    difficulty?: string;
  }>;
  // NEW: Support for workout machine context data
  workoutData?: {
    title: string;
    exercises: Array<{
      name: string;
      sets?: number;
      reps?: number;
      weight?: number;
      description?: string;
      exerciseRef?: string;
    }>;
  };
  // NEW: Support for loaded template and exercises from setup machine
  loadedTemplate?: {
    name: string;
    description: string;
    exercises: Array<{
      exerciseRef: string;
      sets?: number;
      reps?: number;
      weight?: number;
    }>;
  };
  loadedExercises?: Array<{
    id: string;
    name: string;
    equipment: string;
    description: string;
    muscleGroups: string[];
  }>;
  // NEW: Direct resolved template and exercises access
  resolvedTemplate?: {
    name: string;
    description: string;
    exercises: Array<{
      exerciseRef: string;
      sets?: number;
      reps?: number;
      weight?: number;
    }>;
  };
}

interface WorkoutDetailModalProps {
  isOpen: boolean;
  isLoading: boolean;
  templateData?: TemplateData;
  error?: string;
  onClose: () => void;
  onStartWorkout: () => void;
  onExerciseClick?: (exercise: Exercise) => void;
  hideStartButton?: boolean; // NEW: Hide start button for active workouts
}

export const WorkoutDetailModal = ({
  isOpen,
  isLoading,
  templateData,
  error,
  onClose,
  onStartWorkout,
  onExerciseClick,
  hideStartButton = false,
}: WorkoutDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const { showToast } = useToast();
  
  // Get current user's pubkey for library operations
  const userPubkey = usePubkey();
  
  // Get library data to check if workout is already in library
  const { workoutLibrary } = useLibraryData();

  // Extract data with priority: resolved template > machine context > fallback
  const title = templateData?.resolvedTemplate?.name || 
                templateData?.loadedTemplate?.name || 
                templateData?.workoutData?.title || 
                templateData?.template?.name || 
                templateData?.title || 
                templateData?.name || 
                'Untitled Workout';
                
  const description = templateData?.resolvedTemplate?.description || 
                     templateData?.loadedTemplate?.description || 
                     templateData?.template?.description || 
                     templateData?.description || 
                     templateData?.content || 
                     '';

  // Extract author information from templateRef
  const authorPubkey = useMemo(() => {
    const templateRef = templateData?.templateRef;
    if (templateRef) {
      // Template ref format: "33402:pubkey:d-tag"
      const parts = templateRef.split(':');
      if (parts.length >= 2) {
        return parts[1];
      }
    }
    return null;
  }, [templateData?.templateRef]);

  // Get author profile data
  const { profile: authorProfile } = useProfile(authorPubkey || undefined);
  const authorDisplayName = getDisplayName(authorProfile, authorPubkey || undefined);
  const authorAvatar = getAvatarUrl(authorProfile, authorPubkey || undefined);
  
  // Check if workout is already in user's library
  const isInLibrary = useMemo(() => {
    if (!templateData?.templateRef || !workoutLibrary.content) return false;
    return workoutLibrary.content.some((template: any) => 
      template.templateRef === templateData.templateRef
    );
  }, [templateData?.templateRef, workoutLibrary.content]);
  
  // Handle adding/removing workout to/from library
  const handleLibraryToggle = useCallback(async () => {
    if (!templateData?.templateRef || !userPubkey) {
      showToast("Error", "error", "Unable to save workout - missing template reference or user not authenticated");
      return;
    }

    setIsAddingToLibrary(true);
    
    try {
      if (isInLibrary) {
        // Remove from library
        await libraryManagementService.removeFromLibraryCollectionWithRefresh(
          userPubkey,
          'WORKOUT_LIBRARY',
          templateData.templateRef
        );
        showToast("Removed from Library", "success", `"${title}" has been removed from your workout library`);
      } else {
        // Add to library
        await libraryManagementService.addToLibraryCollectionWithRefresh(
          userPubkey,
          'WORKOUT_LIBRARY',
          templateData.templateRef
        );
        showToast("Added to Library", "success", `"${title}" has been saved to your workout library`);
      }
    } catch (error) {
      console.error('Library operation failed:', error);
      showToast(
        "Error", 
        "error", 
        isInLibrary 
          ? "Failed to remove workout from library" 
          : "Failed to add workout to library"
      );
    } finally {
      setIsAddingToLibrary(false);
    }
  }, [templateData?.templateRef, userPubkey, isInLibrary, title, showToast]);
  
  // QUICK FIX: Map resolved template data to Exercise interface for ExpandableExerciseCard
  const exercises = useMemo(() => {
    // Priority 1: Extract from resolvedTemplate.exercises (has correct sets/reps data)
    if (templateData?.resolvedTemplate?.exercises) {
      return templateData.resolvedTemplate.exercises.map((templateExercise, index) => {
        // Find matching resolved exercise for additional details
        const resolvedExercise = templateData.resolvedExercises?.find(ex => 
          ex.id === templateExercise.exerciseRef.split(':')[2]
        );
        
        return {
          name: resolvedExercise?.name || `Exercise ${index + 1}`,
          sets: templateExercise.sets || 1, // Use actual sets from template
          reps: templateExercise.reps || 1, // Use actual reps from template
          weight: templateExercise.weight,
          description: resolvedExercise?.description || 'No description available',
          equipment: resolvedExercise?.equipment,
          difficulty: resolvedExercise?.difficulty,
          muscleGroups: resolvedExercise?.muscleGroups || []
        };
      });
    }
    
    // Priority 2: Use resolved exercises directly (fallback)
    if (templateData?.resolvedExercises) {
      return templateData.resolvedExercises.map(ex => ({
        name: ex.name,
        sets: 3, // Fallback - will be fixed by service layer
        reps: 12, // Fallback - will be fixed by service layer
        description: ex.description,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        muscleGroups: ex.muscleGroups || []
      }));
    }
    
    // Priority 3: Other fallbacks
    return templateData?.loadedExercises ||
           templateData?.workoutData?.exercises || 
           templateData?.exercises || 
           [];
  }, [templateData]);
  
  // Aggregate equipment from resolved exercises first, then loaded exercises
  const equipment = templateData?.resolvedExercises 
    ? [...new Set(templateData.resolvedExercises.map(ex => ex.equipment).filter(Boolean))]
    : templateData?.loadedExercises 
      ? [...new Set(templateData.loadedExercises.map(ex => ex.equipment).filter(Boolean))]
      : templateData?.equipment || [];

  return (
    <>
      {/* Desktop-only background image - matches ActiveWorkoutInterface */}
      {isOpen && (
        <div className="fixed inset-0 z-40 opacity-100 hidden md:block">
          <WorkoutImageHandler
            tags={templateData?.tags}
            content={templateData?.content || templateData?.description}
            eventKind={templateData?.eventKind || 33402}
            alt={title}
            className="w-full h-full object-cover"
            fill={true}
            priority={true}
          />
          {/* Enhanced overlay with frosted glass effect for readability - matches ActiveWorkoutInterface */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/65 backdrop-blur-sm md:backdrop-blur-md" />
        </div>
      )}

      {/* Dialog Modal - Full Screen like ActiveWorkoutInterface */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Workout template details and exercise information
            </DialogDescription>
          </DialogHeader>

          <div className={cn(
            "relative h-full bg-background/90 backdrop-blur-md overflow-hidden pb-[env(safe-area-inset-bottom)] flex flex-col",
            "md:bg-background/80 md:backdrop-blur-lg"
          )}>
            {/* Header - Matches ActiveWorkoutInterface pattern with back button */}
            <div className="flex items-center justify-between p-4 bg-background border-b border-border flex-shrink-0">
              {/* Back Button - Matches ActiveWorkoutInterface */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-foreground hover:text-foreground/80"
                title="Back to previous screen"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Title */}
              <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>

              {/* Empty space for balance */}
              <div className="w-10"></div>
            </div>

            {/* Template Image - Standard size below header */}
            {templateData && !isLoading && !error && (
              <div className="flex-shrink-0 px-6 pt-4">
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted/30">
                  <WorkoutImageHandler
                    tags={templateData?.tags}
                    content={templateData?.content || templateData?.description}
                    eventKind={templateData?.eventKind || 33402}
                    alt={title}
                    className="w-full h-full object-cover"
                    fill={true}
                  />
                  {/* Subtle overlay for better contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
              </div>
            )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Loading workout details...</h3>
                <p className="text-muted-foreground">Preparing your workout</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Failed to load workout</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* No data state */}
          {!templateData && !isLoading && !error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <p className="text-muted-foreground mb-4">No workout data available</p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Main content */}
          {templateData && !isLoading && !error && (
            <>
              {/* Action Buttons - 3/4 Start Workout + 1/4 Add to Library */}
              {!hideStartButton && (
                <div className="flex-shrink-0 p-6 pb-4">
                  <div className="flex gap-3">
                    {/* Start Workout Button - 3/4 width */}
                    <Button
                      onClick={onStartWorkout}
                      className="flex-[3] h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-black font-semibold text-base rounded-xl flex items-center justify-center gap-2"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      Start workout
                    </Button>
                    
                    {/* Add to Library Button - 1/4 width */}
                    <Button
                      onClick={handleLibraryToggle}
                      disabled={isAddingToLibrary}
                      variant={isInLibrary ? "default" : "outline"}
                      size="icon"
                      className="flex-[1] h-12 rounded-xl text-foreground hover:text-foreground/80"
                      title={isInLibrary ? "Remove from Library" : "Add to Library"}
                    >
                      {isAddingToLibrary ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : isInLibrary ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tabs and Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  {/* Fixed Tab Headers with spacing from image */}
                  <div className="px-6 pt-4 flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger 
                        value="overview"
                        className="data-[state=active]:ring-2 data-[state=active]:ring-workout-active-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="exercises"
                        className="data-[state=active]:ring-2 data-[state=active]:ring-workout-active-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                      >
                        Exercises
                      </TabsTrigger>
                      <TabsTrigger 
                        value="equipment"
                        className="data-[state=active]:ring-2 data-[state=active]:ring-workout-active-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                      >
                        Equipment
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Scrollable Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="overview" className="mt-0 h-full overflow-y-auto data-[state=inactive]:hidden">
                      <div className="px-6 pt-4 pb-6 space-y-3">
                        {/* Author Attribution */}
                        {authorPubkey && (
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
                                <p className="text-xs text-muted-foreground">
                                  Workout template
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {description ? (
                          <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-foreground text-sm leading-relaxed">
                              {description}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                              <h4 className="text-foreground font-medium text-sm mb-3">About This Workout</h4>
                              <div className="space-y-3 text-sm leading-relaxed">
                                <p className="text-foreground">
                                  Mike Mentzer&apos;s Chest and Back routine focuses on high-intensity, low-volume training to target the major muscles of the chest and back.
                                </p>
                                <p className="text-foreground">
                                  Using compound exercises like bench presses and pull-ups, the workout emphasizes heavy sets performed to failure for maximum muscle stimulation and growth.
                                </p>
                                <p className="text-foreground">
                                  This efficient approach ensures strength and size gains while minimizing workout time.
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                              <h4 className="text-foreground font-medium text-sm mb-3">Training Guidelines</h4>
                              <div className="space-y-3 text-sm leading-relaxed">
                                <p className="text-foreground">
                                  This workout is designed for intermediate to advanced trainees who can handle high-intensity training.
                                </p>
                                <p className="text-foreground">
                                  Rest periods between sets should be 2-3 minutes to allow for full recovery. Focus on perfect form and controlled movements throughout each exercise.
                                </p>
                                <p className="text-foreground">
                                  Progressive overload is key - gradually increase weight or reps each session while maintaining proper form and technique.
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                              <h4 className="text-foreground font-medium text-sm mb-3">Safety & Recovery</h4>
                              <div className="space-y-3 text-sm leading-relaxed">
                                <p className="text-foreground">
                                  Remember to warm up properly before starting your workout and cool down with light stretching afterwards.
                                </p>
                                <p className="text-foreground">
                                  Track your progress and adjust weights accordingly. Listen to your body and take rest days when needed.
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="exercises" className="mt-0 h-full overflow-y-auto data-[state=inactive]:hidden">
                      <div className="px-6 pt-4 pb-6 space-y-3">
                        {exercises.length > 0 ? (
                          exercises.map((exercise: Exercise, index: number) => {
                            console.log('[WorkoutDetailModal] Rendering exercise card with onExerciseClick:', !!onExerciseClick, 'for exercise:', exercise.name);
                            return (
                              <ExpandableExerciseCard
                                key={index}
                                exercise={exercise}
                                index={index}
                                onExerciseClick={onExerciseClick}
                              />
                            );
                          })
                        ) : (
                          <>
                            <div className="p-4 border border-border rounded-lg bg-muted/30 text-center">
                              <p className="text-muted-foreground">Exercise details will be loaded when you start the workout</p>
                            </div>
                            {/* Add placeholder exercises to test scrolling and expansion */}
                            {Array.from({ length: 10 }, (_, i) => (
                              <ExpandableExerciseCard
                                key={i}
                                exercise={{
                                  name: `Sample Exercise ${i + 1}`,
                                  sets: 3,
                                  reps: 12,
                                  description: `This is a sample exercise to test the scrolling functionality. In a real workout, this would contain the actual exercise details and instructions.`,
                                  // Add some sample data for testing expansion
                                  gifUrl: i % 3 === 0 ? 'https://nostr.build/sample-exercise.gif' : undefined,
                                  personalRecords: i % 2 === 0 ? {
                                    oneRM: 185 + (i * 5),
                                    maxWeight: 175 + (i * 3),
                                    maxVolume: 2400 + (i * 100)
                                  } : undefined,
                                  muscleGroups: i % 4 === 0 ? ['Chest', 'Triceps', 'Shoulders'] : 
                                               i % 4 === 1 ? ['Back', 'Biceps'] :
                                               i % 4 === 2 ? ['Legs', 'Glutes'] : ['Core'],
                                  equipment: i % 3 === 0 ? 'Barbell' : i % 3 === 1 ? 'Dumbbells' : 'Bodyweight',
                                  difficulty: i % 3 === 0 ? 'Beginner' : i % 3 === 1 ? 'Intermediate' : 'Advanced'
                                }}
                                index={i}
                                onExerciseClick={onExerciseClick}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="equipment" className="mt-0 h-full overflow-y-auto data-[state=inactive]:hidden">
                      <div className="px-6 pt-4 pb-6 space-y-3">
                        {equipment.length > 0 ? (
                          equipment.map((item: string, index: number) => (
                            <div key={index} className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                              <span className="text-foreground font-medium text-sm capitalize">{item}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4 text-center">
                              <p className="text-muted-foreground text-sm">Equipment information will be loaded with exercise details</p>
                            </div>
                            {/* Add placeholder equipment to test scrolling */}
                            {['Barbell', 'Dumbbells', 'Pull-up Bar', 'Bench', 'Cable Machine', 'Resistance Bands', 'Kettlebells', 'Medicine Ball', 'Foam Roller', 'Weight Plates'].map((item, index) => (
                              <div key={index} className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                                <span className="text-foreground font-medium text-sm capitalize">{item}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
