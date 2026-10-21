import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { Product } from '../types';
import { ProductCard } from './product-card';

interface ProductShelfProps {
  title: string;
  seeAllHref: string;
  products: Product[];
  renderAction?: (product: Product) => ReactNode;
}

// A shop shelf: one row that scrolls sideways, so the home page can show several lists
// without turning into one long grid.
export function ProductShelf({ title, seeAllHref, products, renderAction }: ProductShelfProps) {
  if (products.length === 0) return null;
  const id = `shelf-${title.toLowerCase().replaceAll(' ', '-')}`;

  return (
    <section aria-labelledby={id}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={id} className="text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <Link
          href={seeAllHref}
          className="text-brand flex shrink-0 items-center gap-0.5 text-sm font-semibold hover:underline"
        >
          See all
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <ul className="no-scrollbar -mx-6 mt-5 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 sm:gap-6">
        {products.map((product) => (
          <li key={product.id} className="w-40 shrink-0 snap-start sm:w-52">
            <ProductCard product={product} action={renderAction?.(product)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
