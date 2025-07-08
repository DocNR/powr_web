/**
 * Parameter Interpretation Service for NIP-101e Exercise Templates
 * 
 * Transforms raw exercise parameters into typed, validated parameter objects
 * based on exercise template format and format_units specifications.
 */

import type { Exercise } from './dependencyResolution';

// Core parameter value interface
export interface ParameterValue {
  value: string;
  unit: string;
  raw: string;
  isValid: boolean;
  validationError?: string;
}

// Parameter interpretation result
export interface ParameterInterpretationResult {
  parameters: Record<string, ParameterValue>;
  backwardCompatibility: {
    weight: string;
    reps: string;
    rpe: string;
    setType: string;
  };
  validationErrors: string[];
  isValid: boolean;
}

// Parameter validation function type
type ParameterValidator = (value: string, unit: string) => {
  isValid: boolean;
  normalizedValue?: string;
  error?: string;
};

// Parameter validation rules
const PARAMETER_VALIDATORS: Record<string, ParameterValidator> = {
  weight: (value: string, unit: string) => {
    const validUnits = ['kg', 'lbs', 'bodyweight'];
    if (!validUnits.includes(unit)) {
      return { isValid: false, error: `Invalid weight unit: ${unit}. Expected: ${validUnits.join(', ')}` };
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: `Invalid weight value: ${value}. Must be a number.` };
    }
    
    if (num < 0) {
      return { isValid: false, error: `Invalid weight value: ${value}. Must be >= 0.` };
    }
    
    return { isValid: true, normalizedValue: num.toString() };
  },

  reps: (value: string, unit: string) => {
    const validUnits = ['count', 'reps'];
    if (!validUnits.includes(unit)) {
      return { isValid: false, error: `Invalid reps unit: ${unit}. Expected: ${validUnits.join(', ')}` };
    }
    
    const num = parseInt(value);
    if (isNaN(num)) {
      return { isValid: false, error: `Invalid reps value: ${value}. Must be a whole number.` };
    }
    
    if (num <= 0) {
      return { isValid: false, error: `Invalid reps value: ${value}. Must be > 0.` };
    }
    
    return { isValid: true, normalizedValue: num.toString() };
  },

  rpe: (value: string, unit: string) => {
    const validUnits = ['0-10', 'rpe', '1-10'];
    if (!validUnits.includes(unit)) {
      return { isValid: false, error: `Invalid RPE unit: ${unit}. Expected: ${validUnits.join(', ')}` };
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: `Invalid RPE value: ${value}. Must be a number.` };
    }
    
    const minRpe = unit === '1-10' ? 1 : 0;
    const maxRpe = 10;
    
    if (num < minRpe || num > maxRpe) {
      return { isValid: false, error: `Invalid RPE value: ${value}. Must be between ${minRpe}-${maxRpe}.` };
    }
    
    return { isValid: true, normalizedValue: num.toString() };
  },

  set_type: (value: string, unit: string) => {
    const validUnits = ['enum', 'type'];
    if (!validUnits.includes(unit)) {
      return { isValid: false, error: `Invalid set_type unit: ${unit}. Expected: ${validUnits.join(', ')}` };
    }
    
    const validTypes = ['warmup', 'normal', 'drop', 'failure', 'working'];
    if (!validTypes.includes(value.toLowerCase())) {
      return { isValid: false, error: `Invalid set_type value: ${value}. Expected: ${validTypes.join(', ')}` };
    }
    
    return { isValid: true, normalizedValue: value.toLowerCase() };
  },

  duration: (value: string, unit: string) => {
    const validUnits = ['seconds', 'minutes', 'sec', 'min'];
    if (!validUnits.includes(unit)) {
      return { isValid: false, error: `Invalid duration unit: ${unit}. Expected: ${validUnits.join(', ')}` };
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: `Invalid duration value: ${value}. Must be a number.` };
    }
    
    if (num < 0) {
      return { isValid: false, error: `Invalid duration value: ${value}. Must be >= 0.` };
    }
    
    return { isValid: true, normalizedValue: num.toString() };
  },

  distance: (value: string, unit: string) => {
    const validUnits = ['meters', 'km', 'miles', 'yards', 'm'];
    if (!validUnits.includes(unit)) {
      return { isValid: false, error: `Invalid distance unit: ${unit}. Expected: ${validUnits.join(', ')}` };
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: `Invalid distance value: ${value}. Must be a number.` };
    }
    
    if (num < 0) {
      return { isValid: false, error: `Invalid distance value: ${value}. Must be >= 0.` };
    }
    
    return { isValid: true, normalizedValue: num.toString() };
  }
};

export class ParameterInterpretationService {
  /**
   * Interpret exercise parameters based on template format and format_units
   */
  interpretExerciseParameters(
    rawParameters: string[],
    exerciseTemplate: Exercise
  ): ParameterInterpretationResult {
    console.log(`[ParameterInterpretation] Interpreting parameters for exercise: ${exerciseTemplate.name}`);
    console.log(`[ParameterInterpretation] Raw parameters:`, rawParameters);
    console.log(`[ParameterInterpretation] Template format:`, exerciseTemplate.format);
    console.log(`[ParameterInterpretation] Template format_units:`, exerciseTemplate.format_units);

    const parameters: Record<string, ParameterValue> = {};
    const validationErrors: string[] = [];
    
    // Validate that we have format and format_units
    if (!exerciseTemplate.format || !exerciseTemplate.format_units) {
      const error = `Exercise template ${exerciseTemplate.name} missing format or format_units`;
      console.warn(`[ParameterInterpretation] ${error}`);
      validationErrors.push(error);
      
      return {
        parameters,
        backwardCompatibility: this.generateBackwardCompatibility(parameters),
        validationErrors,
        isValid: false
      };
    }

    // Validate parameter count matches format
    if (rawParameters.length !== exerciseTemplate.format.length) {
      const error = `Parameter count mismatch: got ${rawParameters.length}, expected ${exerciseTemplate.format.length}`;
      console.warn(`[ParameterInterpretation] ${error}`);
      validationErrors.push(error);
    }

    // Validate format_units count matches format
    if (exerciseTemplate.format_units.length !== exerciseTemplate.format.length) {
      const error = `Format units count mismatch: got ${exerciseTemplate.format_units.length}, expected ${exerciseTemplate.format.length}`;
      console.warn(`[ParameterInterpretation] ${error}`);
      validationErrors.push(error);
    }

    // Process each parameter
    const parameterCount = Math.min(
      rawParameters.length,
      exerciseTemplate.format.length,
      exerciseTemplate.format_units.length
    );

    for (let i = 0; i < parameterCount; i++) {
      const rawValue = rawParameters[i];
      const parameterName = exerciseTemplate.format[i];
      const unit = exerciseTemplate.format_units[i];

      console.log(`[ParameterInterpretation] Processing parameter ${i}: ${parameterName} = "${rawValue}" (${unit})`);

      const parameterValue = this.validateParameter(rawValue, parameterName, unit);
      parameters[parameterName] = parameterValue;

      if (!parameterValue.isValid && parameterValue.validationError) {
        validationErrors.push(`${parameterName}: ${parameterValue.validationError}`);
      }
    }

    const result = {
      parameters,
      backwardCompatibility: this.generateBackwardCompatibility(parameters),
      validationErrors,
      isValid: validationErrors.length === 0
    };

    console.log(`[ParameterInterpretation] Interpretation result:`, result);
    return result;
  }

  /**
   * Validate a single parameter value
   */
  private validateParameter(
    value: string,
    parameterName: string,
    unit: string
  ): ParameterValue {
    const validator = PARAMETER_VALIDATORS[parameterName];
    
    if (!validator) {
      console.warn(`[ParameterInterpretation] No validator for parameter: ${parameterName}`);
      return {
        value,
        unit,
        raw: value,
        isValid: true, // Allow unknown parameters to pass through
        validationError: `No validator available for parameter: ${parameterName}`
      };
    }

    const validation = validator(value, unit);
    
    return {
      value: validation.normalizedValue || value,
      unit,
      raw: value,
      isValid: validation.isValid,
      validationError: validation.error
    };
  }

  /**
   * Generate backward compatibility values for existing code
   */
  private generateBackwardCompatibility(
    parameters: Record<string, ParameterValue>
  ): { weight: string; reps: string; rpe: string; setType: string } {
    return {
      weight: parameters.weight?.value || '0',
      reps: parameters.reps?.value || '1',
      rpe: parameters.rpe?.value || '7',
      setType: parameters.set_type?.value || 'normal'
    };
  }

}

// Export singleton instance
export const parameterInterpretationService = new ParameterInterpretationService();
