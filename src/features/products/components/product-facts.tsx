import { Award, Leaf, MapPin, Store, Tag, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  CATEGORY_STYLES,
  CUP_DOSES,
  PRICE_BAND_LABELS,
  formatGrams,
  formatSgd,
  type TeaPrice,
} from '../lib';
import type { Product, ProductCategory } from '../types';

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

// "S$32.00 for 40 g · S$0.80/g", then what a cup costs at the Learn recipes' doses and the
// band among teas of its kind.
function PriceFact({ price, category }: { price: TeaPrice; category: ProductCategory }) {
  const cups = CUP_DOSES[category]
    .map((dose) => `${formatSgd(price.perGram * dose.grams)} per ${dose.label} (${dose.grams} g)`)
    .join(' · ');
  return (
    <>
      <span className="block tabular-nums">
        {formatSgd(price.sgd)} for {formatGrams(price.packGrams)} · {formatSgd(price.perGram)}/g
      </span>
      <span className="text-muted-foreground block tabular-nums">≈ {cups}</span>
      {price.band && (
        <span className="mt-0.5 block font-semibold">
          {PRICE_BAND_LABELS[price.band]} for {CATEGORY_STYLES[category].label.toLowerCase()}
        </span>
      )}
    </>
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
        {product.price && (
          <Fact icon={Tag} label="Price">
            <PriceFact price={product.price} category={product.category} />
          </Fact>
        )}
      </dl>
    </section>
  );
}
