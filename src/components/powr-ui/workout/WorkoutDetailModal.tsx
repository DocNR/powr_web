import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/powr-ui/primitives/Sheet';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/powr-ui/primitives/Tabs';
import { Play, ArrowLeft, User, Settings, AlertCircle } from 'lucide-react';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import { ExpandableExerciseCard } from './ExpandableExerciseCard';

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
}

export const WorkoutDetailModal = ({
  isOpen,
  isLoading,
  templateData,
  error,
  onClose,
  onStartWorkout,
  onExerciseClick,
}: WorkoutDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

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
  
  // Use exercises from resolved exercises first, then machine context, then fallback
  const exercises = templateData?.resolvedExercises || 
                   templateData?.loadedExercises ||
                   templateData?.workoutData?.exercises || 
                   templateData?.exercises || 
                   [];
  
  // Aggregate equipment from resolved exercises first, then loaded exercises
  const equipment = templateData?.resolvedExercises 
    ? [...new Set(templateData.resolvedExercises.map(ex => ex.equipment).filter(Boolean))]
    : templateData?.loadedExercises 
      ? [...new Set(templateData.loadedExercises.map(ex => ex.equipment).filter(Boolean))]
      : templateData?.equipment || [];

  return (
    <>
      {/* Full-screen background image */}
      <div 
        className={`fixed inset-0 z-40 transition-all duration-500 ease-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
        }`}
      >
        <WorkoutImageHandler
          tags={templateData?.tags}
          content={templateData?.content || templateData?.description}
          eventKind={templateData?.eventKind || 33402}
          alt={title}
          className="w-full h-full object-cover"
          fill={true}
          priority={true}
        />
        {/* Responsive overlay - lighter for desktop, darker for mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 md:from-black/40 md:via-black/15 md:to-black/25" />
      </div>

      {/* Header Controls - Fixed over background */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-500 ease-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full backdrop-blur-sm"
          >
            <User className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full backdrop-blur-sm"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className={`h-[85vh] md:h-[90vh] p-0 rounded-t-3xl border-none bg-background/95 backdrop-blur-md transition-transform duration-500 ease-out md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2 ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{
            // Ensure proper iOS/Android behavior
            WebkitTransform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            // iOS safe area support
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
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
            <div className="flex flex-col h-full">
              {/* Sheet Header with Title and Button */}
              <div className="flex-shrink-0 p-6 pb-4">
                {/* Drag handle */}
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />
                
                <div className="space-y-4">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold text-left">
                      {title}
                    </SheetTitle>
                  </SheetHeader>
                  
                  <Button
                    onClick={onStartWorkout}
                    className="w-full h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-black font-semibold text-base rounded-xl flex items-center justify-center gap-2"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    Start workout
                  </Button>
                </div>
              </div>

              {/* Tabs and Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  {/* Fixed Tab Headers */}
                  <div className="px-6 flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="exercises">Exercises</TabsTrigger>
                      <TabsTrigger value="equipment">Equipment</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Scrollable Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="overview" className="mt-0 h-full overflow-y-auto data-[state=inactive]:hidden">
                      <div className="px-6 pt-4 pb-6 space-y-4">
                        {description ? (
                          <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-foreground text-base leading-relaxed">
                              {description}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                              <h4 className="font-medium mb-3">About This Workout</h4>
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
                              <h4 className="font-medium mb-3">Training Guidelines</h4>
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
                              <h4 className="font-medium mb-3">Safety & Recovery</h4>
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
                          exercises.map((exercise: Exercise, index: number) => (
                            <ExpandableExerciseCard
                              key={index}
                              exercise={exercise}
                              index={index}
                              onExerciseClick={onExerciseClick}
                            />
                          ))
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
                              <span className="text-foreground font-medium capitalize">{item}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4 text-center">
                              <p className="text-muted-foreground">Equipment information will be loaded with exercise details</p>
                            </div>
                            {/* Add placeholder equipment to test scrolling */}
                            {['Barbell', 'Dumbbells', 'Pull-up Bar', 'Bench', 'Cable Machine', 'Resistance Bands', 'Kettlebells', 'Medicine Ball', 'Foam Roller', 'Weight Plates'].map((item, index) => (
                              <div key={index} className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                                <span className="text-foreground font-medium capitalize">{item}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
