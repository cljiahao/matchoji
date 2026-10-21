import { Award, Leaf, MapPin, Store, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { CATEGORY_STYLES } from '../lib';
import type { Product } from '../types';

interface ProductFactsProps {
  product: Product;
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-border grid grid-cols-[1.25rem_7rem_1fr] items-center gap-3 border-b py-3 text-sm last:border-b-0">
      <Icon aria-hidden="true" className="text-muted-foreground h-4 w-4" />
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Vivino's "Facts about the wine" table, for tea.
export function ProductFacts({ product }: ProductFactsProps) {
  return (
    <section aria-labelledby="facts-heading">
      <h2 id="facts-heading" className="text-2xl font-bold tracking-tight">
        Facts about the tea
      </h2>
      <dl className="mt-4">
        {product.brand && (
          <Fact icon={Store} label="Brand">
            {product.brand}
          </Fact>
        )}
        <Fact icon={Leaf} label="Tea">
          <Link href={`/explore?category=${product.category}`} className="underline">
            {CATEGORY_STYLES[product.category].label}
          </Link>
        </Fact>
        {product.grade && (
          <Fact icon={Award} label="Grade">
            {product.grade}
          </Fact>
        )}
        {product.regionName && (
          <Fact icon={MapPin} label="Region">
            {product.regionName}
          </Fact>
        )}
      </dl>
    </section>
  );
}
