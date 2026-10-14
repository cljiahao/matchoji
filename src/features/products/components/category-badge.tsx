import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';

interface CategoryBadgeProps {
  category: ProductCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[category];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        style.badge,
        className
      )}
    >
      {style.label}
    </span>
  );
}
