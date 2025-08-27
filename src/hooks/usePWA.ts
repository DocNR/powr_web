'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if the app is running as a PWA (Progressive Web App)
 * in standalone mode, which affects how we handle safe areas and home indicators
 */
export function usePWA() {
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
                        document.referrer.includes('android-app://');

    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    setIsPWA(isStandalone);
    setIsIOS(isIOSDevice);
  }, []);

  return {
    isPWA,
    isIOS,
    isIOSPWA: isPWA && isIOS
  };
}
