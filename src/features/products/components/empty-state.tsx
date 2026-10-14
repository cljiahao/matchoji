import type { ReactNode } from 'react';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';

interface EmptyStateProps {
  category?: ProductCategory;
  children: ReactNode;
}

export function EmptyState({ category, children }: EmptyStateProps) {
  const name = category ? CATEGORY_STYLES[category].label.toLowerCase() : null;
  return (
    <div className="flex-center flex-col gap-4 rounded-lg border border-dashed py-20 text-center">
      <p className="text-muted-foreground max-w-sm">
        {name
          ? `No ${name} logged yet. Be the first to rate one.`
          : 'No tastings logged yet. Be the first to rate a hojicha or matcha.'}
      </p>
      {children}
    </div>
  );
}
