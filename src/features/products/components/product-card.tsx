import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { Product } from '../types';
import { CategoryBadge } from './category-badge';
import { ProductImageWell } from './product-image-well';
import { ScoreNumeral } from './score-numeral';
import { Stars } from './star-rating-display';

// Display copy of the reviews vocabulary's slug format; products can't import reviews.
const noteLabel = (slug: string) => {
  const words = slug.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

interface ProductCardProps {
  product: Product;
  action?: ReactNode;
}

export function ProductCard({ product, action }: ProductCardProps) {
  const meta = [product.grade, product.regionName].filter(Boolean).join(' · ');

  return (
    <div className="relative h-full">
      <Link
        href={`/products/${product.id}`}
        className="group bg-card border-border flex h-full flex-col overflow-hidden rounded-lg border transition-colors hover:border-neutral-400"
      >
        <div className="relative">
          <ProductImageWell
            imageUrl={product.imageUrl}
            category={product.category}
            name={product.name}
            decorative
            className="aspect-square w-full sm:aspect-[4/3]"
          />
          <CategoryBadge category={product.category} className="absolute top-2.5 left-2.5" />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
          <div className="min-w-0">
            <h2 className="leading-tight font-semibold group-hover:underline group-hover:underline-offset-2">
              {product.name}
            </h2>
            {product.brand && (
              <p className="text-muted-foreground truncate text-sm">{product.brand}</p>
            )}
          </div>

          {meta && <p className="text-muted-foreground text-xs">{meta}</p>}

          {product.topNotes.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {product.topNotes.map((note) => (
                <li
                  key={note}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs',
                    CATEGORY_STYLES[product.category].tint
                  )}
                >
                  {noteLabel(note)}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-center gap-2">
            {product.avgStars === null ? (
              <span className="text-muted-foreground text-sm">Not yet rated</span>
            ) : (
              <>
                <span className="sr-only">
                  {product.avgStars.toFixed(1)} out of 5, {product.reviewCount}{' '}
                  {product.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
                <span aria-hidden="true" className="flex items-center gap-2">
                  <ScoreNumeral value={product.avgStars} size="sm" />
                  <span className="hidden sm:block">
                    <Stars value={product.avgStars} category={product.category} size="sm" />
                  </span>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    ({product.reviewCount})
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      {action && <div className="absolute top-2 right-2">{action}</div>}
    </div>
  );
}
