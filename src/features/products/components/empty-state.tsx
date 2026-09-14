import type { ReactNode } from 'react';

interface EmptyStateProps {
  children: ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="flex-center flex-col gap-4 rounded-lg border border-dashed py-20 text-center">
      <p className="text-muted-foreground max-w-sm">
        No tastings logged yet. Be the first to rate a hojicha or matcha.
      </p>
      {children}
    </div>
  );
}
