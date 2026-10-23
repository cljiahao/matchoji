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

interface ProductRowProps {
  product: Product;
  action?: ReactNode;
  // A per-viewer note under the tea's details, such as the taste feature's match score.
  badge?: ReactNode;
}

// An explore result: the tea left, who made it and where in the middle, the score right.
export function ProductRow({ product, action, badge }: ProductRowProps) {
  const meta = [product.grade, product.regionName].filter(Boolean).join(' · ');
  const countLabel = `${product.reviewCount} ${product.reviewCount === 1 ? 'rating' : 'ratings'}`;

  return (
    <div className="border-border relative flex gap-3 rounded-2xl border p-3 transition-colors hover:border-neutral-300 sm:gap-6 sm:p-4">
      <ProductImageWell
        imageUrl={product.imageUrl}
        category={product.category}
        name={product.name}
        seed={product.id}
        mark={product.brand ?? product.name}
        decorative
        className="aspect-square w-20 shrink-0 sm:w-36"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {product.brand && <p className="text-muted-foreground truncate">{product.brand}</p>}
        <h3 className="leading-snug font-bold sm:text-lg">
          <Link
            href={`/products/${product.id}`}
            className="after:absolute after:inset-0 after:rounded-2xl hover:underline"
          >
            {product.name}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <CategoryBadge category={product.category} />
          {meta && <span className="text-muted-foreground text-sm">{meta}</span>}
        </div>
        {badge}
        {product.topNotes.length > 0 && (
          <ul className="mt-1 hidden flex-wrap gap-1.5 sm:flex">
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
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pb-8 text-right sm:justify-center sm:pb-0">
        <ScoreNumeral value={product.avgStars} size="md" />
        {product.avgStars !== null ? (
          <>
            <Stars value={product.avgStars} category={product.category} size="sm" />
            <p className="text-muted-foreground text-xs tabular-nums">{countLabel}</p>
            <span className="sr-only">
              {product.avgStars.toFixed(1)} out of 5, {countLabel}
            </span>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">Not yet rated</p>
        )}
      </div>
      {/* Sits above the stretched link so it stays its own control; on phones it moves to
          the corner so the score keeps its column. */}
      {action && (
        <div className="absolute right-3 bottom-3 z-10 sm:relative sm:right-auto sm:bottom-auto sm:self-start">
          {action}
        </div>
      )}
    </div>
  );
}
