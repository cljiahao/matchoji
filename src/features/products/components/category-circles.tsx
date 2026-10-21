import Link from 'next/link';

import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';
import { TeaTin } from './tea-tin';

const CATEGORIES: { category: ProductCategory; blurb: string }[] = [
  { category: 'matcha', blurb: 'Stone-ground green tea' },
  { category: 'hojicha', blurb: 'Roasted green tea' },
];

// Vivino's "pick a type" circles, one per tea. Each opens Explore filtered to it.
export function CategoryCircles({ className }: { className?: string }) {
  return (
    <ul className={cn('flex justify-center gap-6 sm:gap-12', className)}>
      {CATEGORIES.map(({ category, blurb }) => (
        <li key={category}>
          <Link
            href={`/explore?category=${category}`}
            className="group flex flex-col items-center gap-3 text-center"
          >
            <span
              className={cn(
                'flex-center h-28 w-28 rounded-full transition-transform duration-300 ease-out group-hover:-translate-y-1 sm:h-36 sm:w-36',
                CATEGORY_STYLES[category].tint
              )}
            >
              <TeaTin category={category} className="w-12 sm:w-16" />
            </span>
            <span>
              <span className="block font-bold group-hover:underline">
                {CATEGORY_STYLES[category].label}
              </span>
              <span className="text-muted-foreground block text-sm">{blurb}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
