'use client';

/**
 * WorkoutsTab - Minimal Version for Debugging Horizontal Scroll
 * 
 * Starting with basic content to identify and fix horizontal scroll issues.
 */

import React from 'react';
import { ViewportDiagnostic } from '@/components/test/ViewportDiagnostic';

export default function WorkoutsTab() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Workouts Tab - Minimal Version</h1>
      <p>Testing for horizontal scroll issues...</p>
      
      {/* Test 1: Simple content */}
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h2>Test 1: Basic Content</h2>
        <p>This should not cause horizontal scrolling.</p>
      </div>
      
      {/* Test 2: Wide content */}
      <div className="bg-red-50 p-4 rounded mb-4">
        <h2>Test 2: Wide Content</h2>
        <div className="w-full bg-gray-200 h-4 rounded">
          <div className="bg-blue-500 h-4 rounded" style={{ width: '100%' }}>
            Full width content
          </div>
        </div>
      </div>
      
      {/* Test 3: Overflow content */}
      <div className="bg-yellow-50 p-4 rounded mb-4">
        <h2>Test 3: Potentially Problematic Content</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[800px] bg-gray-200 p-4 rounded">
            This content is 800px wide and should scroll horizontally within its container
          </div>
        </div>
      </div>
      
      {/* Development info */}
      <div className="bg-green-50 p-4 rounded border border-green-200">
        <h3 className="font-medium mb-2 text-green-900">🔍 Debug Status</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p>✅ Minimal component loaded</p>
          <p>🔄 Testing for horizontal scroll issues</p>
          <p>📱 Check on mobile and desktop</p>
        </div>
      </div>

      {/* Viewport Diagnostic Tool */}
      <ViewportDiagnostic />
    </div>
  );
}
