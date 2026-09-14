import { cn } from '@/lib/utils';

import type { ProductCategory } from '../types';

const LABEL: Record<ProductCategory, string> = {
  matcha: 'Matcha',
  hojicha: 'Hojicha',
};

interface CategoryBadgeProps {
  category: ProductCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        category === 'matcha'
          ? 'bg-matcha text-matcha-foreground'
          : 'bg-hojicha text-hojicha-foreground',
        className
      )}
    >
      {LABEL[category]}
    </span>
  );
}
