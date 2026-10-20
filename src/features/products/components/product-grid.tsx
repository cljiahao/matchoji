import type { ReactNode } from 'react';

import type { Product } from '../types';
import { ProductCard } from './product-card';

interface ProductGridProps {
  products: Product[];
  // A slot rather than an import keeps products independent of the features that act on
  // them (the journal's want-to-try toggle).
  renderAction?: (product: Product) => ReactNode;
}

export function ProductGrid({ products, renderAction }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} action={renderAction?.(product)} />
      ))}
    </div>
  );
}
