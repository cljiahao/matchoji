import Link from 'next/link';

import { cn } from '@/lib/utils';

import type { Product } from '../types';
import { CategoryBadge } from './category-badge';
import { StarRatingDisplay } from './star-rating-display';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        'bg-card block rounded-lg border-y border-r border-l-4 p-4 shadow-sm transition-shadow hover:shadow-md',
        product.category === 'matcha' ? 'border-l-matcha' : 'border-l-hojicha'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="leading-tight font-semibold">{product.name}</h2>
          {product.brand && <p className="text-muted-foreground text-sm">{product.brand}</p>}
        </div>
        <CategoryBadge category={product.category} />
      </div>

      {(product.grade || product.regionName) && (
        <p className="text-muted-foreground mt-2 text-xs">
          {[product.grade, product.regionName].filter(Boolean).join(' · ')}
        </p>
      )}

      <StarRatingDisplay
        avgStars={product.avgStars}
        reviewCount={product.reviewCount}
        className="mt-3"
      />
    </Link>
  );
}
