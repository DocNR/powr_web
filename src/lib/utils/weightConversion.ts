/**
 * Weight Conversion Utilities
 * 
 * Handles conversion between kg and lbs while maintaining NIP-101e compliance.
 * All weights are stored in kg internally, but can be displayed in user's preferred unit.
 */

export type WeightUnit = 'kg' | 'lbs';

// Conversion factors
const KG_TO_LBS_FACTOR = 2.20462;
const LBS_TO_KG_RATIO = 1 / KG_TO_LBS_FACTOR;

/**
 * Convert weight from kg to lbs
 */
export function kgToLbs(weightInKg: number): number {
  return weightInKg * KG_TO_LBS_FACTOR;
}

/**
 * Convert weight from lbs to kg
 */
export function lbsToKg(weightInLbs: number): number {
  return weightInLbs * LBS_TO_KG_RATIO;
}

/**
 * Convert weight for display based on user's preferred unit
 * @param weightInKg - Weight stored in kg (NIP-101e standard)
 * @param displayUnit - User's preferred display unit
 * @returns Weight in display unit, rounded to 1 decimal place
 */
export function convertWeightForDisplay(weightInKg: number, displayUnit: WeightUnit): number {
  if (displayUnit === 'lbs') {
    return Math.round(kgToLbs(weightInKg) * 10) / 10; // Round to 1 decimal place
  }
  return Math.round(weightInKg * 10) / 10; // Round kg to 1 decimal place too
}

/**
 * Format weight for display with unit
 * @param weightInKg - Weight stored in kg
 * @param displayUnit - User's preferred display unit
 * @returns Formatted weight string with unit
 */
export function formatWeightDisplay(weightInKg: number, displayUnit: WeightUnit): string {
  const displayWeight = convertWeightForDisplay(weightInKg, displayUnit);
  if (displayWeight === 0) {
    return 'BW'; // Bodyweight
  }
  return `${displayWeight} ${displayUnit}`;
}

/**
 * Round weight to nearest 0.025 kg for clean storage values
 * This eliminates long decimal precision issues in NIP-101e events
 * while providing excellent precision for lbs users (0.025 kg ≈ 0.055 lbs)
 * Only used when completing sets, not during real-time input
 */
function roundToFortiethKg(weightInKg: number): number {
  return Math.round(weightInKg * 40) / 40;
}

/**
 * Convert weight from display unit to storage (always kg)
 * NO rounding during input - only stores exact converted values
 */
export function convertWeightForStorage(weight: number, fromUnit: WeightUnit): number {
  if (fromUnit === 'kg') {
    return weight; // Store exact value, no rounding
  } else {
    // Convert lbs to kg, store exact value
    return weight * LBS_TO_KG_RATIO;
  }
}

/**
 * Convert and round weight for final storage (on set completion)
 * This is where we apply the 0.025 kg rounding for clean NIP-101e events
 */
export function convertWeightForFinalStorage(weight: number, fromUnit: WeightUnit): number {
  const weightInKg = convertWeightForStorage(weight, fromUnit);
  return roundToFortiethKg(weightInKg);
}

/**
 * Parse weight input string to number, handling various formats
 * @param input - User input string
 * @returns Parsed weight number or 0 if invalid
 */
export function parseWeightInput(input: string): number {
  if (!input || input.trim() === '' || input.toLowerCase() === 'bw') {
    return 0; // Bodyweight
  }
  
  const parsed = parseFloat(input.trim());
  return isNaN(parsed) ? 0 : parsed;
}
