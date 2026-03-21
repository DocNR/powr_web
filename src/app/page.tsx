'use client';

import { useEffect, useState } from 'react';
import { useIsAuthenticated, useAutoLogin } from '@/lib/auth/hooks';
import { initializeNDK } from '@/lib/ndk';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginWall } from '@/components/auth/LoginWall';

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const autoLogin = useAutoLogin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeApp = async () => {
      try {
        await initializeNDK();
        await autoLogin();
      } catch (error) {
        console.error('[App] Initialization failed:', error);
      }
    };

    initializeApp();
  }, [mounted, autoLogin]);

  if (!mounted) return null;

  if (isAuthenticated) {
    return <AppLayout />;
  }

  return <LoginWall />;
}
