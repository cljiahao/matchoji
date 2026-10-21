import { cn } from '@/lib/utils';

import type { ProductCategory } from '../types';
import { TeaTin } from './tea-tin';

interface ProductImageWellProps {
  imageUrl: string | null;
  category: ProductCategory;
  name: string;
  // Inside a card whose heading already names the product, the photo adds nothing for
  // screen readers.
  decorative?: boolean;
  // Passed to the drawn tin so each product without a photo looks like itself.
  seed?: string;
  mark?: string | null;
  className?: string;
}

// The product sits on a warm grey tile, like a tin on a shop shelf. Without a photo a tin
// drawn in the category's colours takes its place.
export function ProductImageWell({
  imageUrl,
  category,
  name,
  decorative = false,
  seed,
  mark,
  className,
}: ProductImageWellProps) {
  return (
    <div className={cn('bg-tile flex-center overflow-hidden rounded-2xl', className)}>
      {imageUrl ? (
        // Storage host is per-project, so next/image remotePatterns can't be fixed here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={decorative ? '' : name} className="h-full w-full object-cover" />
      ) : (
        <TeaTin category={category} seed={seed} mark={mark} className="w-[46%] max-w-40" />
      )}
    </div>
  );
}
