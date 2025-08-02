/**
 * POWR UI Workout Components
 * 
 * Barrel exports for all workout-related components.
 */

export { CalendarBar } from './CalendarBar';
export { WorkoutCard } from './WorkoutCard';
export { ExerciseCard } from './ExerciseCard';
export { WorkoutImageHandler, extractImagesFromEvent, isValidImageUrl } from './WorkoutImageHandler';
export { 
  ScrollableGallery, 
  WorkoutGallery, 
  SocialGallery, 
  HeroGallery 
} from './ScrollableGallery';
export { FilterChips, workoutFilters, durationFilters } from './FilterChips';
export { FilterButton } from './FilterButton';
export { default as SearchableWorkoutDiscovery } from './SearchableWorkoutDiscovery';
export { WorkoutDetailModal } from './WorkoutDetailModal';
export { ActiveWorkoutInterface } from './ActiveWorkoutInterface';
export { SetRow } from './SetRow';
export { ExerciseSection } from './ExerciseSection';
export { WorkoutMiniBar } from './WorkoutMiniBar';
export { default as WorkoutCardSkeleton } from './WorkoutCardSkeleton';

// Types are available for import directly from individual components
