import Link from 'next/link';

import { CATEGORY_STYLES } from '@/features/products';
import { cn } from '@/lib/utils';

import { recipeHref } from '../lib/hrefs';
import type { Recipe } from '../types';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const style = CATEGORY_STYLES[recipe.category];
  return (
    <Link
      href={recipeHref(recipe.slug)}
      className="bg-muted hover:bg-muted/70 flex h-full flex-col rounded-2xl px-5 py-4 transition-colors"
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full', style.fill)} />
        {style.label}
      </span>
      <span className="mt-1 text-lg font-bold tracking-tight">{recipe.title}</span>
      <span className="text-muted-foreground mt-1 text-sm">{recipe.summary}</span>
      <span className="mt-3 text-sm font-semibold">
        {recipe.doseG} g · {recipe.waterMl} ml · {recipe.waterTempC}°C
        {recipe.milkMl ? ` · ${recipe.milkMl} ml milk` : ''}
      </span>
    </Link>
  );
}
