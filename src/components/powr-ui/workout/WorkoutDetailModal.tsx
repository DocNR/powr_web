import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, ArrowLeft, User, Settings, AlertCircle } from 'lucide-react';
import { WorkoutImageHandler } from './WorkoutImageHandler';

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  description?: string;
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
}

export const WorkoutDetailModal = ({
  isOpen,
  isLoading,
  templateData,
  error,
  onClose,
  onStartWorkout,
}: WorkoutDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 rounded-none border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Loading Workout</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Loading workout details...</h3>
              <p className="text-muted-foreground">Preparing your workout</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 rounded-none border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Workout Error</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Failed to load workout</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No data state
  if (!templateData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 rounded-none border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>No Workout Data</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full bg-background">
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-4">No workout data available</p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }


  // Extract data with priority: resolved template > machine context > fallback
  const title = templateData.resolvedTemplate?.name || 
                templateData.loadedTemplate?.name || 
                templateData.workoutData?.title || 
                templateData.template?.name || 
                templateData.title || 
                templateData.name || 
                'Untitled Workout';
                
  const description = templateData.resolvedTemplate?.description || 
                     templateData.loadedTemplate?.description || 
                     templateData.template?.description || 
                     templateData.description || 
                     templateData.content || 
                     '';
  
  // Use exercises from resolved exercises first, then machine context, then fallback
  const exercises = templateData.resolvedExercises || 
                   templateData.loadedExercises ||
                   templateData.workoutData?.exercises || 
                   templateData.exercises || 
                   [];
  
  // Aggregate equipment from resolved exercises first, then loaded exercises
  const equipment = templateData.resolvedExercises 
    ? [...new Set(templateData.resolvedExercises.map(ex => ex.equipment).filter(Boolean))]
    : templateData.loadedExercises 
      ? [...new Set(templateData.loadedExercises.map(ex => ex.equipment).filter(Boolean))]
      : templateData.equipment || [];



  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none" showCloseButton={false}>
          <div className="relative h-full bg-background overflow-hidden pb-[env(safe-area-inset-bottom)]">
          {/* Header Controls */}
          <div className="absolute top-2 left-0 right-0 z-50 flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary hover:bg-primary/20 rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/20 rounded-full"
              >
                <User className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/20 rounded-full"
              >
                <Settings className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Hero Background Image with Overlay Content */}
          <div className="relative h-1/3">
            <WorkoutImageHandler
              tags={templateData.tags}
              content={templateData.content || templateData.description}
              eventKind={templateData.eventKind || 33402}
              alt={title}
              className="w-full h-full"
              fill={true}
              priority={true}
            />
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Overlay Content - Title and Button */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 pb-8">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white leading-tight">
                  {title}
                </h1>
                <Button
                  onClick={onStartWorkout}
                  className="w-full h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-black font-semibold text-base rounded-s flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Start workout
                </Button>
              </div>
            </div>
          </div>

          {/* Content Below Image - Tabs and Content */}
          <div className="flex-1 bg-background flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-12 p-0 mb-6 border-b border-border">
                  <TabsTrigger 
                    value="overview" 
                    className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:border-b-offset-[-1px] rounded-none font-medium py-3 px-4 transition-colors hover:text-foreground"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="exercises"
                    className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:border-b-offset-[-1px] rounded-none font-medium py-3 px-4 transition-colors hover:text-foreground"
                  >
                    Exercises
                  </TabsTrigger>
                  <TabsTrigger 
                    value="equipment"
                    className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:border-b-offset-[-1px] rounded-none font-medium py-3 px-4 transition-colors hover:text-foreground"
                  >
                    Equipment
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content - Properly scrollable area */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-4">
                    {description ? (
                      <p className="text-foreground text-base leading-relaxed">
                        {description}
                      </p>
                    ) : (
                      <>
                        <p className="text-foreground text-base leading-relaxed">
                          Mike Mentzer&apos;s Chest and Back routine focuses on high-intensity, low-volume training to target the major muscles of the chest and back.
                        </p>
                        <p className="text-foreground text-base leading-relaxed">
                          Using compound exercises like bench presses and pull-ups, the workout emphasizes heavy sets performed to failure for maximum muscle stimulation and growth.
                        </p>
                        <p className="text-foreground text-base leading-relaxed">
                          This efficient approach ensures strength and size gains while minimizing workout time.
                        </p>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="exercises" className="mt-0">
                  <div className="space-y-3">
                    {exercises.length > 0 ? (
                      exercises.map((exercise: Exercise, index: number) => (
                        <div key={index} className="bg-muted/50 backdrop-blur-sm rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{exercise.name || `Exercise ${index + 1}`}</h4>
                            <span className="text-orange-500 text-sm font-medium">
                              {exercise.sets || 3} × {exercise.reps || 12}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {exercise.description || 'No description available'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Exercise details will be loaded when you start the workout</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="equipment" className="mt-0">
                  <div className="space-y-3">
                    {equipment.length > 0 ? (
                      equipment.map((item: string, index: number) => (
                        <div key={index} className="bg-muted/50 backdrop-blur-sm rounded-lg p-3">
                          <span className="text-foreground font-medium capitalize">{item}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Equipment information will be loaded with exercise details</p>
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
  );
};
