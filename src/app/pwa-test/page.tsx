'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PWATestPage() {
  const [manifestData, setManifestData] = useState<Record<string, unknown> | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('checking...');

  useEffect(() => {
    // Test manifest accessibility
    fetch('/manifest.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setManifestData(data);
        setManifestError(null);
      })
      .catch(error => {
        setManifestError(error.message);
        setManifestData(null);
      });

    // Test service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          if (registration) {
            setServiceWorkerStatus('registered');
          } else {
            setServiceWorkerStatus('not registered');
          }
        })
        .catch(() => {
          setServiceWorkerStatus('error');
        });
    } else {
      setServiceWorkerStatus('not supported');
    }
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">PWA Configuration Test</h1>
      
      <div className="space-y-6">
        {/* Manifest Test */}
        <Card>
          <CardHeader>
            <CardTitle>Manifest Test</CardTitle>
          </CardHeader>
          <CardContent>
            {manifestError ? (
              <div className="text-destructive">
                <p className="font-medium">❌ Manifest Error:</p>
                <p>{manifestError}</p>
              </div>
            ) : manifestData ? (
              <div className="text-green-600 dark:text-green-400">
                <p className="font-medium">✅ Manifest Loaded Successfully</p>
                <pre className="mt-2 text-sm bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(manifestData, null, 2)}
                </pre>
              </div>
            ) : (
              <p>Loading manifest...</p>
            )}
          </CardContent>
        </Card>

        {/* Service Worker Test */}
        <Card>
          <CardHeader>
            <CardTitle>Service Worker Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              Status: <Badge variant={serviceWorkerStatus === 'registered' ? 'default' : 'destructive'}>
                {serviceWorkerStatus}
              </Badge>
            </p>
          </CardContent>
        </Card>

        {/* Icons Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Icons Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: '/apple-touch-icon-180x180.png', size: '180x180' },
              { src: '/apple-touch-icon-152x152.png', size: '152x152' },
              { src: '/apple-touch-icon-167x167.png', size: '167x167' },
              { src: '/apple-touch-icon.png', size: '180x180 (default)' },
              { src: '/icon-192.png', size: '192x192' },
              { src: '/icon-512.png', size: '512x512' },
            ].map((icon) => (
              <div key={icon.src} className="text-center">
                <Image 
                  src={icon.src} 
                  alt={`Icon ${icon.size}`}
                  width={64}
                  height={64}
                  className="mx-auto mb-2 border rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.border = '2px solid red';
                  }}
                />
                <p className="text-sm">{icon.size}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PWA Installation Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">PWA Installation</h2>
          <div className="space-y-2">
            <p><strong>iOS Safari:</strong> Look for &ldquo;Add to Home Screen&rdquo; in the share menu</p>
            <p><strong>Android Chrome:</strong> Look for install prompt or &ldquo;Add to Home Screen&rdquo; in menu</p>
            <p><strong>Desktop:</strong> Look for install icon in address bar</p>
          </div>
        </div>

        {/* Browser Info */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Browser Info</h2>
          <div className="text-sm space-y-1">
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Platform:</strong> {navigator.platform}</p>
            <p><strong>Standalone Mode:</strong> {window.matchMedia('(display-mode: standalone)').matches ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
