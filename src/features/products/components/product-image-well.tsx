import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';
import { LeafMark } from './leaf-mark';

interface ProductImageWellProps {
  imageUrl: string | null;
  category: ProductCategory;
  name: string;
  className?: string;
}

// Without a photo the well carries the category colour as a field, so a grid still reads
// matcha vs hojicha at a glance.
export function ProductImageWell({ imageUrl, category, name, className }: ProductImageWellProps) {
  const style = CATEGORY_STYLES[category];

  if (imageUrl) {
    return (
      <div className={cn('bg-muted overflow-hidden', className)}>
        {/* Storage host is per-project, so next/image remotePatterns can't be fixed here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={cn('flex-center', style.tint, className)}>
      <LeafMark className={style.text} />
    </div>
  );
}
