import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, ArrowLeft, User, Settings, AlertCircle } from 'lucide-react';
import { WorkoutImageHandler } from './WorkoutImageHandler';
import { ActiveWorkoutInterface } from './ActiveWorkoutInterface';

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
}

interface WorkoutDetailModalProps {
  isOpen: boolean;
  isLoading: boolean;
  templateData?: TemplateData;
  error?: string;
  isWorkoutActive?: boolean;
  userPubkey?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workoutMachineState?: any; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workoutMachineSend?: any;
  onClose: () => void;
  onStartWorkout: () => void;
}

export const WorkoutDetailModal = ({
  isOpen,
  isLoading,
  templateData,
  error,
  isWorkoutActive,
  workoutMachineState,
  workoutMachineSend,
  onClose,
  onStartWorkout,
}: WorkoutDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 rounded-none border-none">
          <div className="flex items-center justify-center h-full bg-black">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2 text-white">Loading workout details...</h3>
              <p className="text-white/70">Preparing your workout</p>
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
          <div className="flex items-center justify-center h-full bg-black">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">Failed to load workout</h3>
              <p className="text-white/70 mb-4">{error}</p>
              <Button onClick={onClose} variant="outline" className="text-white border-white">
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
          <div className="flex items-center justify-center h-full bg-black">
            <div className="text-center p-6">
              <p className="text-white/70 mb-4">No workout data available</p>
              <Button onClick={onClose} variant="outline" className="text-white border-white">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Extract data from existing template structure
  const title = templateData.title || templateData.name || 'Untitled Workout';
  const description = templateData.description || templateData.content || '';
  const exercises = templateData.exercises || [];
  const equipment = templateData.equipment || [];

  // ✅ FIXED: If workout is active, show ActiveWorkoutInterface using the machine's data
  if (isWorkoutActive && workoutMachineState && workoutMachineSend) {
    console.log('🔧 WorkoutDetailModal: Rendering ActiveWorkoutInterface with machine data');
    console.log('🔧 Machine state:', workoutMachineState.value);
    console.log('🔧 Machine context:', workoutMachineState.context);

    // Get the activeWorkoutActor from the WorkoutLifecycleMachine context
    const activeWorkoutActor = workoutMachineState.context?.activeWorkoutActor;
    
    if (!activeWorkoutActor) {
      console.error('🔧 No activeWorkoutActor found in machine context');
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 rounded-none border-none">
            <div className="flex items-center justify-center h-full bg-black">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Starting workout...</h3>
                <p className="text-white/70">Please wait while we initialize your workout</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none" showCloseButton={false}>
          <ActiveWorkoutInterface 
            // ✅ Use the existing activeWorkoutActor from WorkoutLifecycleMachine
            activeWorkoutActor={activeWorkoutActor}
            onClose={onClose}
            onWorkoutComplete={(workoutData) => {
              console.log('🔧 Workout completed, sending to lifecycle machine:', workoutData);
              // Send completion event to the WorkoutLifecycleMachine
              workoutMachineSend({ 
                type: 'WORKOUT_COMPLETED', 
                workoutData 
              });
              onClose();
            }}
            onWorkoutCancel={() => {
              console.log('🔧 Workout cancelled, sending to lifecycle machine');
              // Send cancellation event to the WorkoutLifecycleMachine
              workoutMachineSend({ 
                type: 'WORKOUT_CANCELLED' 
              });
              onClose();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-full max-h-full w-screen h-[100dvh] supports-[height:100dvh]:h-[100dvh] p-0 m-0 rounded-none border-none" showCloseButton={false}>
          <div className="relative h-full bg-black overflow-hidden pb-[env(safe-area-inset-bottom)]">
          {/* Header Controls */}
          <div className="absolute top-2 left-0 right-0 z-50 flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-orange-500 hover:bg-orange-500/20 rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-orange-500 hover:bg-orange-500/20 rounded-full"
              >
                <User className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-orange-500 hover:bg-orange-500/20 rounded-full"
              >
                <Settings className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Hero Background Image - Fixed to top 50% of screen */}
          <div className="absolute inset-0 h-1/2">
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
          </div>

          {/* Fixed Layout Grid */}
          <div className="relative z-10 h-full grid grid-rows-[auto_auto_auto_auto_auto_1fr] p-6">
            {/* Row 1: Header Spacer */}
            <div className="h-16"></div>

            {/* Row 2: Title - Fixed position at 1/3 down from top */}
            <div className="flex items-start pt-8">
              <h1 className="text-3xl font-bold text-white leading-tight">
                {title}
              </h1>
            </div>

            {/* Row 3: Spacer between title and button */}
            <div className="h-8"></div>

            {/* Row 4: Start Workout Button - Fixed position, smaller size */}
            <div className="pb-6">
              <Button
                onClick={onStartWorkout}
                className="w-full h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-black font-semibold text-base rounded-xl flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5 fill-current" />
                Start workout
              </Button>
            </div>

            {/* Row 5: Tab Navigation - Fixed position */}
            <div className="pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-12 p-0">
                  <TabsTrigger 
                    value="overview" 
                    className="text-orange-500 data-[state=active]:text-orange-500 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none font-medium"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="exercises"
                    className="text-white/60 data-[state=active]:text-orange-500 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none font-medium"
                  >
                    Exercises
                  </TabsTrigger>
                  <TabsTrigger 
                    value="equipment"
                    className="text-white/60 data-[state=active]:text-orange-500 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none font-medium"
                  >
                    Equipment
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Row 6: Tab Content - Scrollable area with fixed height */}
            <div className="overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                {/* Tab Content - Fixed height scrollable container */}
                <div className="h-full overflow-y-auto">
                  <TabsContent value="overview" className="mt-0 h-full">
                    <div className="space-y-4 pb-6">
                      <p className="text-white text-base leading-relaxed">
                        {description || "Mike Mentzer's Chest and Back routine focuses on high-intensity, low-volume training to target the major muscles of the chest and back."}
                      </p>
                      <p className="text-white text-base leading-relaxed">
                        Using compound exercises like bench presses and pull-ups, the workout emphasizes heavy sets performed to failure for maximum muscle stimulation and growth.
                      </p>
                      <p className="text-white text-base leading-relaxed">
                        This efficient approach ensures strength and size gains while minimizing workout time.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="exercises" className="mt-0 h-full">
                    <div className="space-y-3 pb-6">
                      {exercises.length > 0 ? (
                        exercises.map((exercise: Exercise, index: number) => (
                          <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-white">{exercise.name || `Exercise ${index + 1}`}</h4>
                              <span className="text-orange-500 text-sm font-medium">
                                {exercise.sets || 3} × {exercise.reps || 12}
                              </span>
                            </div>
                            <p className="text-white/70 text-sm">
                              {exercise.description || 'No description available'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-white/70">Exercise details will be loaded when you start the workout</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="equipment" className="mt-0 h-full">
                    <div className="space-y-3 pb-6">
                      {equipment.length > 0 ? (
                        equipment.map((item: string, index: number) => (
                          <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <span className="text-white font-medium capitalize">{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-white/70">Equipment information will be loaded with exercise details</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};