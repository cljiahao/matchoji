import type { ProductCategory } from '@/features/products';

import type { ReviewSummary } from '../lib/summarize-reviews';
import { FlavorFamilies } from './flavor-families';
import { PrepSummary } from './prep-summary';
import { TasteStructure } from './taste-structure';

interface ProductInsightsProps {
  summary: ReviewSummary;
  category: ProductCategory;
  productName: string;
}

// "What does it taste like?" in Vivino's order: the structure sliders, then flavour
// families. Each part renders only when tastings carry its data, so a new product shows
// nothing rather than empty charts.
export function ProductInsights({ summary, category, productName }: ProductInsightsProps) {
  const hasFamilies = summary.noteCounts.length > 0;
  if (!summary.profile && !hasFamilies && !summary.prep) return null;

  return (
    <section aria-labelledby="taste-heading" className="space-y-8">
      <h2 id="taste-heading" className="text-2xl font-bold tracking-tight">
        What does it taste like?
      </h2>

      {summary.profile && (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-12">
          <TasteStructure values={summary.profile.averages} category={category} />
          <p className="text-muted-foreground text-sm">
            The taste profile of {productName} is based on {summary.profile.contributors}{' '}
            {summary.profile.contributors === 1 ? 'tasting' : 'tastings'}.
          </p>
        </div>
      )}

      <FlavorFamilies noteCounts={summary.noteCounts} category={category} />

      {summary.prep && (
        <div className="bg-muted rounded-2xl px-5 py-4">
          <h3 className="font-semibold">How people make it</h3>
          <PrepSummary prep={summary.prep} className="text-foreground mt-1 text-base" />
        </div>
      )}
    </section>
  );
}
