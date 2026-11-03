import type { ProductCategory } from '@/features/products';

import { pairingsFor } from '../match';

// "Goes well with" for a tea's page: sweets a tea house itself pairs with this kind of tea,
// each with its source. Nothing renders when no sourced rule fits.
export function GoesWellWith({
  category,
  grade,
}: {
  category: ProductCategory;
  grade: string | null;
}) {
  const rules = pairingsFor({ category, grade });
  if (rules.length === 0) return null;
  return (
    <section aria-labelledby="pairing-heading">
      <h2 id="pairing-heading" className="text-2xl font-bold tracking-tight">
        Goes well with
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule.id} className="bg-muted/40 rounded-2xl px-4 py-3">
            <p className="font-semibold">{rule.sweet}</p>
            <p className="text-muted-foreground mt-1 text-sm">{rule.note}</p>
            <a
              href={rule.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2"
            >
              Source: {rule.source.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
