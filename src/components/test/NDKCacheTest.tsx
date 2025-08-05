/**
 * NDK Cache Test Component
 * 
 * Simple test component to verify the Universal NDK Caching Architecture
 * works correctly with ONLY_CACHE strategy for true offline functionality.
 */

import React, { useState, useMemo } from 'react';
import { useNDKDataWithCaching, useCacheAvailability } from '@/hooks/useNDKDataWithCaching';
import { dependencyResolutionService } from '@/lib/services/dependencyResolution';
import { WORKOUT_EVENT_KINDS } from '@/lib/ndk';
import type { NDKFilter } from '@nostr-dev-kit/ndk';

const NDKCacheTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // ✅ FIXED: Stabilize filter arrays to prevent infinite loops
  const exerciseFilters: NDKFilter[] = useMemo(() => [{
    kinds: [WORKOUT_EVENT_KINDS.EXERCISE_TEMPLATE as number],
    '#t': ['fitness'],
    limit: 5
  }], []); // Empty dependency array since these are static

  const templateFilters: NDKFilter[] = useMemo(() => [{
    kinds: [WORKOUT_EVENT_KINDS.WORKOUT_TEMPLATE as number],
    '#t': ['fitness'],
    limit: 3
  }], []); // Empty dependency array since these are static

  // Test cache availability
  const { availability: exerciseAvailability } = useCacheAvailability(exerciseFilters);
  const { availability: templateAvailability } = useCacheAvailability(templateFilters);

  // Test offline-first data fetching
  const { 
    events: offlineExercises, 
    isLoading: loadingOffline, 
    error: offlineError,
    refetch: refetchOffline 
  } = useNDKDataWithCaching(exerciseFilters, {
    strategy: 'cache-only',
    enabled: false // Start disabled
  });

  // Test cache-first data fetching
  const { 
    events: cacheFirstExercises, 
    isLoading: loadingCacheFirst, 
    error: cacheFirstError,
    refetch: refetchCacheFirst 
  } = useNDKDataWithCaching(exerciseFilters, {
    strategy: 'cache-first',
    enabled: false // Start disabled
  });

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runOfflineTest = async () => {
    setIsRunning(true);
    addResult('🔌 Starting offline functionality test...');

    try {
      // Test 1: Check cache availability
      addResult(`📦 Exercise cache availability: ${exerciseAvailability?.available ? 'YES' : 'NO'} (${exerciseAvailability?.count || 0} events)`);
      addResult(`📦 Template cache availability: ${templateAvailability?.available ? 'YES' : 'NO'} (${templateAvailability?.count || 0} events)`);

      // Test 2: Try offline-first dependency resolution
      addResult('🔧 Testing offline dependency resolution...');
      const templateRefs = ['33402:test:example-template'];
      const offlineTemplates = await dependencyResolutionService.resolveTemplateDependenciesOffline(templateRefs);
      addResult(`✅ Offline template resolution: ${offlineTemplates.length} templates found`);

      // Test 3: Try offline exercise resolution
      const exerciseRefs = ['33401:test:example-exercise'];
      const offlineExercises = await dependencyResolutionService.resolveExerciseReferencesOffline(exerciseRefs);
      addResult(`✅ Offline exercise resolution: ${offlineExercises.length} exercises found`);

      // Test 4: Test hook-based offline fetching
      addResult('🎣 Testing offline hook fetching...');
      await refetchOffline();
      addResult(`✅ Offline hook fetch: ${offlineExercises.length} events, error: ${offlineError ? 'YES' : 'NO'}`);

      addResult('🎉 Offline functionality test completed!');

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runCacheFirstTest = async () => {
    setIsRunning(true);
    addResult('📦 Starting cache-first functionality test...');

    try {
      // Test cache-first strategy
      addResult('🔧 Testing cache-first dependency resolution...');
      await refetchCacheFirst();
      addResult(`✅ Cache-first hook fetch: ${cacheFirstExercises.length} events, error: ${cacheFirstError ? 'YES' : 'NO'}`);

      addResult('🎉 Cache-first functionality test completed!');

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">NDK Cache Architecture Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Cache Status */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Cache Status</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Exercise Templates:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                exerciseAvailability?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {exerciseAvailability?.available ? `${exerciseAvailability.count} cached` : 'None cached'}
              </span>
            </div>
            <div>
              <span className="font-medium">Workout Templates:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                templateAvailability?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {templateAvailability?.available ? `${templateAvailability.count} cached` : 'None cached'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Test Controls</h3>
          <div className="space-y-2">
            <button
              onClick={runOfflineTest}
              disabled={isRunning}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : '🔌 Test Offline Functionality'}
            </button>
            <button
              onClick={runCacheFirstTest}
              disabled={isRunning}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : '📦 Test Cache-First'}
            </button>
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>

      {/* Hook Status */}
      <div className="border rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Hook Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Offline Hook (ONLY_CACHE)</h4>
            <div>Loading: {loadingOffline ? 'YES' : 'NO'}</div>
            <div>Events: {offlineExercises.length}</div>
            <div>Error: {offlineError ? 'YES' : 'NO'}</div>
          </div>
          <div>
            <h4 className="font-medium">Cache-First Hook</h4>
            <div>Loading: {loadingCacheFirst ? 'YES' : 'NO'}</div>
            <div>Events: {cacheFirstExercises.length}</div>
            <div>Error: {cacheFirstError ? 'YES' : 'NO'}</div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Test Results</h3>
        <div className="bg-gray-50 rounded p-3 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-500 text-sm">No test results yet. Run a test to see results.</div>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. First, browse some workout content to populate the cache</li>
          <li>2. Then run the &quot;Test Offline Functionality&quot; to verify ONLY_CACHE works</li>
          <li>3. Run &quot;Test Cache-First&quot; to verify the default strategy works</li>
          <li>4. Check the console for detailed logging from the cache services</li>
        </ol>
      </div>
    </div>
  );
};

export default NDKCacheTest;
