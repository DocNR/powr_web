/**
 * Exercise Filter Constants
 * 
 * Centralized constants for exercise filtering across the application.
 * Used by ExercisePicker and other exercise-related components.
 */

export const EQUIPMENT_OPTIONS = [
  'bodyweight',
  'barbell',
  'dumbbell',
  'kettlebell',
  'machine',
  'cable',
  'resistance_band'
] as const;

export const MUSCLE_GROUP_OPTIONS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio'
] as const;

export const DIFFICULTY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'expert'
] as const;

export const SET_TYPES = [
  'warmup',
  'normal',
  'drop',
  'failure'
] as const;

// Type exports for TypeScript
export type EquipmentType = typeof EQUIPMENT_OPTIONS[number];
export type MuscleGroupType = typeof MUSCLE_GROUP_OPTIONS[number];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
export type SetType = typeof SET_TYPES[number];
