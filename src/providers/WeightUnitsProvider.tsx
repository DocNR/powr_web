/**
 * Weight Units Provider
 * 
 * Provides shared weight unit state across all components.
 * Fixes the issue where multiple useWeightUnits() calls create isolated state.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WeightUnit } from '@/lib/utils/weightConversion';

const WEIGHT_UNIT_STORAGE_KEY = 'powr_weight_unit_preference';
const DEFAULT_UNIT: WeightUnit = 'kg'; // NIP-101e default

interface WeightUnitsContextType {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  toggleWeightUnit: () => void;
  isLoaded: boolean;
  isKg: boolean;
  isLbs: boolean;
}

const WeightUnitsContext = createContext<WeightUnitsContextType | undefined>(undefined);

interface WeightUnitsProviderProps {
  children: ReactNode;
}

export function WeightUnitsProvider({ children }: WeightUnitsProviderProps) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(DEFAULT_UNIT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WEIGHT_UNIT_STORAGE_KEY);
      if (stored && (stored === 'kg' || stored === 'lbs')) {
        setWeightUnitState(stored as WeightUnit);
      }
    } catch (error) {
      console.warn('Failed to load weight unit preference:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preference to localStorage when changed
  const setWeightUnit = (newUnit: WeightUnit) => {
    try {
      localStorage.setItem(WEIGHT_UNIT_STORAGE_KEY, newUnit);
      setWeightUnitState(newUnit);
      console.log(`🏋️ Weight unit preference updated to: ${newUnit}`);
    } catch (error) {
      console.error('Failed to save weight unit preference:', error);
    }
  };

  // Toggle between kg and lbs
  const toggleWeightUnit = () => {
    const newUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    console.log('🏋️ WeightUnitsProvider: Toggling weight unit', {
      from: weightUnit,
      to: newUnit,
      timestamp: new Date().toISOString()
    });
    setWeightUnit(newUnit);
  };

  const contextValue: WeightUnitsContextType = {
    weightUnit,
    setWeightUnit,
    toggleWeightUnit,
    isLoaded,
    isKg: weightUnit === 'kg',
    isLbs: weightUnit === 'lbs'
  };

  return (
    <WeightUnitsContext.Provider value={contextValue}>
      {children}
    </WeightUnitsContext.Provider>
  );
}

export function useWeightUnits(): WeightUnitsContextType {
  const context = useContext(WeightUnitsContext);
  if (context === undefined) {
    throw new Error('useWeightUnits must be used within a WeightUnitsProvider');
  }
  return context;
}
