'use client';

import React, { useState } from 'react';
import { parameterInterpretationService, type ParameterInterpretationResult } from '@/lib/services/parameterInterpretation';
import { dependencyResolutionService, type Exercise } from '@/lib/services/dependencyResolution';

interface TestResult {
  exerciseName: string;
  exerciseId: string;
  rawParameters: string[];
  interpretationResult: ParameterInterpretationResult;
  exerciseTemplate: Exercise;
}

// Generate sample parameters for testing based on exercise type
function generateSampleParameters(exercise: Exercise): string[] {
  // For bodyweight exercises (typical leg workout exercises)
  if (exercise.equipment === 'none' || exercise.equipment === 'bodyweight') {
    return ['0', '12', '7', 'normal']; // bodyweight, 12 reps, RPE 7, normal set
  }
  
  // For weighted exercises
  if (exercise.muscleGroups.includes('legs')) {
    return ['60', '8', '8', 'normal']; // 60kg, 8 reps, RPE 8, normal set
  }
  
  // Default parameters
  return ['20', '10', '7', 'normal'];
}

export default function ParameterInterpretationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [basicTestResults, setBasicTestResults] = useState<string | null>(null);

  // Test with real Bitcoin workout data
  const testWithRealData = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults([]);

    try {
      console.log('[ParameterInterpretationTest] Testing with real Bitcoin workout data...');

      // Use the new HODL Strength Workout template with standardized enum format
      const templateRef = '33402:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:hodl-strength-workout';
      
      console.log('[ParameterInterpretationTest] Resolving template:', templateRef);
      const resolved = await dependencyResolutionService.resolveSingleTemplate(templateRef);
      
      console.log('[ParameterInterpretationTest] Resolved template:', resolved.template);
      console.log('[ParameterInterpretationTest] Resolved exercises:', resolved.exercises);

      const results: TestResult[] = [];

      // Test parameter interpretation for each exercise in the template
      for (const templateExercise of resolved.template.exercises) {
        console.log('[ParameterInterpretationTest] Processing template exercise:', templateExercise);

        // Find the corresponding exercise template
        const exerciseTemplate = resolved.exercises.find(ex => 
          templateExercise.exerciseRef.endsWith(`:${ex.id}`)
        );

        if (!exerciseTemplate) {
          console.warn('[ParameterInterpretationTest] No exercise template found for:', templateExercise.exerciseRef);
          continue;
        }

        // Create sample parameters for testing (since template exercises don't have raw parameters yet)
        // For bodyweight exercises, use typical values
        const sampleParameters = generateSampleParameters(exerciseTemplate);
        
        console.log('[ParameterInterpretationTest] Testing with sample parameters:', sampleParameters);

        // Test parameter interpretation
        const interpretationResult = parameterInterpretationService.interpretExerciseParameters(
          sampleParameters,
          exerciseTemplate
        );

        results.push({
          exerciseName: exerciseTemplate.name,
          exerciseId: exerciseTemplate.id,
          rawParameters: sampleParameters,
          interpretationResult,
          exerciseTemplate
        });
      }

      setTestResults(results);
      console.log('[ParameterInterpretationTest] All test results:', results);

    } catch (err) {
      console.error('[ParameterInterpretationTest] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run basic test cases with our Bitcoin workout data
  const runBasicTests = () => {
    console.log('[ParameterInterpretationTest] Running basic test cases with Bitcoin workout data...');
    
    // Test case 1: Real Satoshi Squats (weighted exercise)
    const satoshiSquats: Exercise = {
      id: 'satoshi-squats',
      name: 'Satoshi Squats',
      description: 'Squats to honor the Bitcoin creator. Build your foundation like the blockchain.',
      format: ['weight', 'reps', 'rpe', 'set_type'],
      format_units: ['kg', 'count', '0-10', 'enum'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      hashtags: ['strength', 'compound', 'bitcoin'],
      muscleGroups: ['legs'],
      instructions: ['Stand with feet shoulder-width apart', 'Lower into squat position', 'Drive through heels to stand'],
      authorPubkey: '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21',
      createdAt: Math.floor(Date.now() / 1000),
      eventId: '0dfeb35b554876a055c6b815b2bf53f83c232811e08fbf3529eda42458e3d0c6'
    };

    const squatParams = ['60', '5', '8', 'normal'];
    const squatResult = parameterInterpretationService.interpretExerciseParameters(squatParams, satoshiSquats);
    console.log(`[ParameterInterpretation] 🟠 Satoshi Squats test result:`, squatResult);

    // Test case 2: Real Bitcoin Push-ups (bodyweight exercise)
    const bitcoinPushups: Exercise = {
      id: 'bitcoin-pushups',
      name: 'Bitcoin Push-ups',
      description: 'Push-ups powered by Bitcoin energy. Each rep builds strength and conviction.',
      format: ['weight', 'reps', 'rpe', 'set_type'],
      format_units: ['kg', 'count', '0-10', 'enum'],
      equipment: 'none',
      difficulty: 'beginner',
      hashtags: ['bodyweight', 'compound', 'bitcoin'],
      muscleGroups: ['chest'],
      instructions: ['Start in plank position', 'Lower chest to ground', 'Push back to starting position'],
      authorPubkey: '55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21',
      createdAt: Math.floor(Date.now() / 1000),
      eventId: 'c4dd2576f0f638825a2984497c678b55a0d4c72fc65110c75550a2ce8bdeb4de'
    };

    const pushupParams = ['0', '10', '7', 'normal'];
    const pushupResult = parameterInterpretationService.interpretExerciseParameters(pushupParams, bitcoinPushups);
    console.log(`[ParameterInterpretation] 🟠 Bitcoin Push-ups test result:`, pushupResult);

    // Test case 3: Invalid parameters (using real exercise for error testing)
    const invalidParams = ['invalid', '-5', '15', 'unknown'];
    const invalidResult = parameterInterpretationService.interpretExerciseParameters(invalidParams, satoshiSquats);
    console.log(`[ParameterInterpretation] ❌ Invalid parameters test result:`, invalidResult);

    setBasicTestResults('Basic tests completed with Bitcoin workout data - check console for results');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Parameter Interpretation Test</h2>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runBasicTests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Run Basic Tests
        </button>
        
        <button
          onClick={testWithRealData}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test with HODL Strength Workout'}
        </button>
      </div>

      {basicTestResults && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">Basic Test Results</h3>
          <p className="text-blue-700">{basicTestResults}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Real Data Test Results ({testResults.length} exercises)</h3>
          
          {testResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2">{result.exerciseName}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exercise Template Info */}
                <div>
                  <h5 className="font-medium mb-2">Exercise Template</h5>
                  <div className="text-sm space-y-1">
                    <p><strong>ID:</strong> {result.exerciseTemplate.id}</p>
                    <p><strong>Equipment:</strong> {result.exerciseTemplate.equipment}</p>
                    <p><strong>Format:</strong> {JSON.stringify(result.exerciseTemplate.format)}</p>
                    <p><strong>Format Units:</strong> {JSON.stringify(result.exerciseTemplate.format_units)}</p>
                    <p><strong>Muscle Groups:</strong> {result.exerciseTemplate.muscleGroups.join(', ')}</p>
                  </div>
                </div>

                {/* Parameter Interpretation */}
                <div>
                  <h5 className="font-medium mb-2">Parameter Interpretation</h5>
                  <div className="text-sm space-y-1">
                    <p><strong>Raw Parameters:</strong> {JSON.stringify(result.rawParameters)}</p>
                    <p><strong>Valid:</strong> 
                      <span className={result.interpretationResult.isValid ? 'text-green-600' : 'text-red-600'}>
                        {result.interpretationResult.isValid ? ' ✅ Yes' : ' ❌ No'}
                      </span>
                    </p>
                    
                    {result.interpretationResult.validationErrors.length > 0 && (
                      <div>
                        <strong>Errors:</strong>
                        <ul className="list-disc list-inside text-red-600">
                          {result.interpretationResult.validationErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interpreted Parameters */}
              {Object.keys(result.interpretationResult.parameters).length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Interpreted Parameters</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {Object.entries(result.interpretationResult.parameters).map(([name, param]) => (
                      <div key={name} className="border border-gray-100 rounded p-2">
                        <div className="font-medium">{name}</div>
                        <div>Value: {param.value}</div>
                        <div>Unit: {param.unit}</div>
                        <div>Raw: {param.raw}</div>
                        <div className={param.isValid ? 'text-green-600' : 'text-red-600'}>
                          {param.isValid ? '✅' : '❌'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Backward Compatibility */}
              <div className="mt-4">
                <h5 className="font-medium mb-2">Backward Compatibility</h5>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>Weight: {result.interpretationResult.backwardCompatibility.weight}</div>
                  <div>Reps: {result.interpretationResult.backwardCompatibility.reps}</div>
                  <div>RPE: {result.interpretationResult.backwardCompatibility.rpe}</div>
                  <div>Set Type: {result.interpretationResult.backwardCompatibility.setType}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-semibold mb-2">Test Information</h3>
        <p className="text-sm text-gray-700">
          This test uses the real &quot;HODL Strength Workout&quot; template with the new standardized enum format.
          It resolves the Bitcoin-themed exercises (Bitcoin Push-ups, Satoshi Squats)
          and tests parameter interpretation with the new &quot;enum&quot; format_units pattern.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          Check the browser console for detailed logging of the parameter interpretation process.
        </p>
      </div>
    </div>
  );
}
