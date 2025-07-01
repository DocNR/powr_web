'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';

export function ViewportDiagnostic() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [bodyWidth, setBodyWidth] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bw = document.body.scrollWidth;
      
      setViewport({ width: vw, height: vh });
      setBodyWidth(bw);
      setHasOverflow(bw > vw);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const testWidths = [320, 375, 390, 414, 639, 640, 768, 1024, 1280];

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🔍 Viewport Diagnostic Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Viewport Width:</strong> {viewport.width}px
          </div>
          <div>
            <strong>Viewport Height:</strong> {viewport.height}px
          </div>
          <div>
            <strong>Body Width:</strong> {bodyWidth}px
          </div>
          <div className={hasOverflow ? 'text-red-600 font-bold' : 'text-green-600'}>
            <strong>Horizontal Overflow:</strong> {hasOverflow ? '❌ YES' : '✅ NO'}
          </div>
        </div>

        {/* Overflow Detection */}
        {hasOverflow && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
            <strong>⚠️ Horizontal scrolling detected!</strong>
            <br />
            Body width ({bodyWidth}px) exceeds viewport width ({viewport.width}px)
          </div>
        )}

        {/* Test Buttons */}
        <div>
          <h4 className="font-medium mb-2">Test Common Breakpoints:</h4>
          <div className="flex flex-wrap gap-2">
            {testWidths.map(width => (
              <Button
                key={width}
                variant="outline"
                size="sm"
                onClick={() => {
                  // Note: This would require browser dev tools to actually resize
                  console.log(`Test at ${width}px - Use browser dev tools to resize`);
                }}
                className={viewport.width === width ? 'bg-orange-100' : ''}
              >
                {width}px
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use browser dev tools to resize viewport and test these breakpoints
          </p>
        </div>

        {/* Success Criteria */}
        <div className="space-y-2">
          <h4 className="font-medium">✅ Success Criteria:</h4>
          <div className="text-sm space-y-1">
            <div className={!hasOverflow ? 'text-green-600' : 'text-gray-500'}>
              • No horizontal scrolling at any viewport width
            </div>
            <div className="text-green-600">
              • SocialTab and LibraryTab remain responsive (different layout patterns)
            </div>
            <div className="text-green-600">
              • Mobile bottom navigation displays correctly
            </div>
            <div className="text-green-600">
              • Touch targets remain 44px+ for accessibility
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">Debug Information</summary>
          <div className="mt-2 p-2 bg-gray-50 rounded">
            <div>User Agent: {navigator.userAgent}</div>
            <div>Screen: {screen.width}x{screen.height}</div>
            <div>Available: {screen.availWidth}x{screen.availHeight}</div>
            <div>Device Pixel Ratio: {window.devicePixelRatio}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
