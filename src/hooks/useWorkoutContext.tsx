import { WorkoutContext } from '@/contexts/WorkoutContext';

/**
 * Convenience hook for accessing the global workout context
 * Wraps XState's createActorContext methods in a clean interface
 */
export const useWorkoutContext = () => {
  return {
    workoutState: WorkoutContext.useSelector(state => state),
    workoutSend: WorkoutContext.useActorRef().send,
    workoutActorRef: WorkoutContext.useActorRef()
  };
};
