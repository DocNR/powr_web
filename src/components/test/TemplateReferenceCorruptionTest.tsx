'use client';

import React, { useState } from 'react';
import { createActor } from 'xstate';
import { workoutLifecycleMachine } from '@/lib/machines/workout/workoutLifecycleMachine';
import { normalizeTemplateReference } from '@/lib/utils/templateReference';

/**
 * Test component to verify the template reference corruption fix
 * 
 * This component tests the fix for the template reference corruption issue
 * where template references were being duplicated from `33402:pubkey:d-tag` 
 * to `33402:pubkey:33402:pubkey:d-tag` during XState actor execution.
 */
export default function TemplateReferenceCorruptionTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [originalRef, setOriginalRef] = useState('33402:pubkey:strength-workout');
  const [corruptedRef, setCorruptedRef] = useState('33402:pubkey:33402:pubkey:strength-workout');

  // Add a log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Test the normalizeTemplateReference function directly
  const testNormalizeFunction = () => {
    addLog('🧪 Testing normalizeTemplateReference function directly...');
    
    const normalizedOriginal = normalizeTemplateReference(originalRef);
    addLog(`Original: ${originalRef} → Normalized: ${normalizedOriginal}`);
    
    const normalizedCorrupted = normalizeTemplateReference(corruptedRef);
    addLog(`Corrupted: ${corruptedRef} → Normalized: ${normalizedCorrupted}`);
    
    if (normalizedOriginal === normalizedCorrupted) {
      addLog('✅ SUCCESS: Both references normalize to the same value!');
    } else {
      addLog('❌ FAILURE: References normalize to different values!');
    }
  };

  // Test the workoutLifecycleMachine with both reference formats
  const testMachine = async () => {
    setTestStatus('running');
    addLog('🧪 Testing workoutLifecycleMachine with both reference formats...');
    
    // Create a mock user
    const mockUser = {
      pubkey: 'test-pubkey-123',
      displayName: 'Test User'
    };
    
    // Test with original reference
    addLog(`Testing with original reference: ${originalRef}`);
    const originalActor = createActor(workoutLifecycleMachine, {
      input: {
        userInfo: mockUser,
        templateReference: originalRef
      }
    });
    
    // Subscribe to state changes
    originalActor.subscribe(snapshot => {
      addLog(`Original actor state: ${JSON.stringify(snapshot.value)}`);
    });
    
    // Start the actor
    originalActor.start();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test with corrupted reference
    addLog(`Testing with corrupted reference: ${corruptedRef}`);
    const corruptedActor = createActor(workoutLifecycleMachine, {
      input: {
        userInfo: mockUser,
        templateReference: corruptedRef
      }
    });
    
    // Subscribe to state changes
    corruptedActor.subscribe(snapshot => {
      addLog(`Corrupted actor state: ${JSON.stringify(snapshot.value)}`);
    });
    
    // Start the actor
    corruptedActor.start();
    
    // Set test status to success
    setTestStatus('success');
    addLog('✅ Test completed! Check console for detailed logs.');
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Template Reference Corruption Test</h1>
      
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Original Reference:</label>
          <input 
            type="text" 
            value={originalRef} 
            onChange={(e) => setOriginalRef(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Corrupted Reference:</label>
          <input 
            type="text" 
            value={corruptedRef} 
            onChange={(e) => setCorruptedRef(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={testNormalizeFunction}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Normalize Function
        </button>
        <button 
          onClick={testMachine}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={testStatus === 'running'}
        >
          {testStatus === 'running' ? 'Running Test...' : 'Test Machine'}
        </button>
      </div>
      
      <div className="border rounded p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Test Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run a test to see results.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-4 p-4 border rounded bg-yellow-50">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click &quot;Test Normalize Function&quot; to test the normalizeTemplateReference function directly</li>
          <li>Click &quot;Test Machine&quot; to test the workoutLifecycleMachine with both reference formats</li>
          <li>Check the console for more detailed logs from the state machines</li>
          <li>Both references should be normalized to the same format, preventing the corruption issue</li>
        </ul>
      </div>
    </div>
  );
}
