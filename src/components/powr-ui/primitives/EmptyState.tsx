'use client';

import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  heading: string;
  description: string;
  actionLabel?: string;
  actionVariant?: 'gradient' | 'secondary';
  onAction?: () => void;
}

export function EmptyState({
  icon,
  heading,
  description,
  actionLabel,
  actionVariant = 'gradient',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="text-4xl mb-4 opacity-30">{icon}</div>
      <h3 className="text-lg font-semibold text-[var(--color-on-surface)] mb-2">
        {heading}
      </h3>
      <p className="text-sm text-[var(--color-on-surface-variant)] max-w-[240px] mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant={actionVariant === 'gradient' ? 'primary-gradient' : 'secondary'}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
