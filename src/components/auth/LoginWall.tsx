'use client';

import { Logo } from '@/components/ui/logo';
import { LoginDialog } from './LoginDialog';

export function LoginWall() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-3">
          <Logo width={200} height={68} priority />
        </div>
        <p className="text-[var(--color-on-surface-variant)] mt-2">
          Track. Publish. Own your data.
        </p>
      </div>

      <LoginDialog mode="inline" defaultOpen={true} />
    </div>
  );
}
