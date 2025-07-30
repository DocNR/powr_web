'use client';

import { useState, useEffect } from 'react';
import { isAmberAvailable, getEnvironmentType } from '@/lib/utils/environment';

/**
 * React hook for environment detection that handles SSR/hydration properly
 * Prevents hydration mismatches by waiting for client-side detection
 */
export function useAmberAvailable(): boolean {
  const [isClient, setIsClient] = useState(false);
  const [amberAvailable, setAmberAvailable] = useState(false);

  useEffect(() => {
    // Mark as client-side and check Amber availability
    setIsClient(true);
    setAmberAvailable(isAmberAvailable());
  }, []);

  // During SSR and initial hydration, return false to prevent showing Amber button
  return isClient && amberAvailable;
}

/**
 * React hook for environment type detection
 */
export function useEnvironmentType() {
  const [isClient, setIsClient] = useState(false);
  const [environmentType, setEnvironmentType] = useState<'server' | 'web' | 'pwa' | 'capacitor' | 'react-native'>('server');

  useEffect(() => {
    setIsClient(true);
    setEnvironmentType(getEnvironmentType());
  }, []);

  return isClient ? environmentType : 'server';
}
