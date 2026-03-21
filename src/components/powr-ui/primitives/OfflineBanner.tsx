'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-[rgba(255,145,83,0.1)] px-5 py-3 flex items-center gap-2">
      <span className="text-sm text-[var(--color-primary)]">
        Offline — workouts will publish when you&apos;re back online
      </span>
    </div>
  );
}
