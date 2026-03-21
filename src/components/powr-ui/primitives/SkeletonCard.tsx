'use client';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--color-surface-card)] rounded-[var(--radius)] p-5 border-l-[3px] border-l-[var(--color-surface-elevated)]"
          style={{ opacity: 1 - i * 0.3 }}
        >
          <div className="bg-[var(--color-surface-elevated)] rounded-lg h-4 w-3/5 mb-3 animate-pulse" />
          <div className="bg-[var(--color-surface-elevated)] rounded-md h-3 w-2/5 opacity-50" />
        </div>
      ))}
    </div>
  );
}
