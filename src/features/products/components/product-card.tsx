import Link from 'next/link';

import type { Product } from '../types';
import { CategoryBadge } from './category-badge';
import { ProductImageWell } from './product-image-well';
import { ScoreNumeral } from './score-numeral';
import { Stars } from './star-rating-display';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const meta = [product.grade, product.regionName].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-card border-border focus-visible:ring-ring flex flex-col overflow-hidden rounded-lg border transition-colors outline-none hover:border-neutral-400 focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <ProductImageWell
        imageUrl={product.imageUrl}
        category={product.category}
        name={product.name}
        className="aspect-[4/3] w-full"
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="leading-tight font-semibold group-hover:underline group-hover:underline-offset-2">
              {product.name}
            </h2>
            {product.brand && (
              <p className="text-muted-foreground truncate text-sm">{product.brand}</p>
            )}
          </div>
          <CategoryBadge category={product.category} className="shrink-0" />
        </div>

        {meta && <p className="text-muted-foreground text-xs">{meta}</p>}

        <div className="mt-auto flex items-center gap-2">
          {product.avgStars === null ? (
            <span className="text-muted-foreground text-sm">Not yet rated</span>
          ) : (
            <>
              <ScoreNumeral value={product.avgStars} size="sm" />
              <Stars value={product.avgStars} category={product.category} size="sm" />
              <span className="text-muted-foreground text-sm tabular-nums">
                ({product.reviewCount})
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
