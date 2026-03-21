'use client';

import { LoginDialog } from './LoginDialog';

export function LoginWall() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-[var(--color-on-surface)] tracking-tight">
          POWR
        </h1>
        <p className="text-[var(--color-on-surface-variant)] mt-2">
          Track. Publish. Own your data.
        </p>
      </div>

      <LoginDialog mode="inline" defaultOpen={true} />
    </div>
  );
}
