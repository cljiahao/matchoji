import Link from 'next/link';

import { CategoryBadge } from '@/features/products';

import { formatPrice } from '../lib/format';
import { drinkHref } from '../lib/hrefs';
import { SERVING_LABELS, STYLE_LABELS } from '../lib/labels';
import type { DrinkListing } from '../types';
import { ScorePair } from './score-pair';

interface DrinkRowProps {
  drink: DrinkListing;
  // Set on lists that span cafés, such as similar drinks.
  showCafe?: boolean;
}

export function DrinkRow({ drink, showCafe = false }: DrinkRowProps) {
  const facts = [
    STYLE_LABELS[drink.style],
    SERVING_LABELS[drink.serving],
    drink.price === null ? null : formatPrice(drink.price, drink.currency),
  ].filter((fact): fact is string => fact !== null);

  return (
    <Link
      href={drinkHref(drink.cafe.slug, drink.slug)}
      className="border-border hover:bg-muted/60 focus-visible:ring-ring block rounded-2xl border p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold tracking-tight">{drink.name}</h3>
        <CategoryBadge category={drink.base} />
      </div>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {showCafe && `${drink.cafe.name} · `}
        {facts.join(' · ')}
      </p>
      <ScorePair scores={drink.scores} compact className="mt-3" />
    </Link>
  );
}
