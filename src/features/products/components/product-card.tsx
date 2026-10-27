import Link from 'next/link';
import type { ReactNode } from 'react';

import type { Product } from '../types';
import { CategoryBadge } from './category-badge';
import { PriceInline } from './price-inline';
import { ProductImageWell } from './product-image-well';
import { RatingInline } from './rating-inline';

interface ProductCardProps {
  product: Product;
  action?: ReactNode;
}

// A shelf card: the tea on its tile, brand above the name, one rating line.
export function ProductCard({ product, action }: ProductCardProps) {
  return (
    <div className="relative h-full">
      <Link href={`/products/${product.id}`} className="group flex h-full flex-col gap-3">
        <div className="relative">
          <ProductImageWell
            imageUrl={product.imageUrl}
            category={product.category}
            name={product.name}
            seed={product.id}
            mark={product.brand ?? product.name}
            decorative
            className="aspect-square w-full transition-[filter] group-hover:brightness-[0.97]"
          />
          {/* A drawn tin already shows the tea by colour; a photo needs the label. */}
          {product.imageUrl && (
            <CategoryBadge category={product.category} className="absolute top-3 left-3" />
          )}
        </div>
        <div className="min-w-0 px-0.5">
          {product.brand && (
            <p className="text-muted-foreground truncate text-sm">{product.brand}</p>
          )}
          <h3 className="line-clamp-2 leading-snug font-bold group-hover:underline">
            {product.name}
          </h3>
          <RatingInline
            avgStars={product.avgStars}
            reviewCount={product.reviewCount}
            category={product.category}
            className="mt-1"
          />
          <PriceInline price={product.price} className="mt-0.5" />
        </div>
      </Link>
      {action && <div className="absolute top-2.5 right-2.5">{action}</div>}
    </div>
  );
}
