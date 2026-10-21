import Link from 'next/link';

import { cn } from '@/lib/utils';

import { CATEGORY_STYLES, discoverHref, type DiscoverFilters } from '../lib';
import type { ProductCategory } from '../types';

const CATEGORY_OPTIONS: { label: string; value: ProductCategory | undefined }[] = [
  { label: 'All teas', value: undefined },
  { label: 'Matcha', value: 'matcha' },
  { label: 'Hojicha', value: 'hojicha' },
];

interface FilterLinkProps {
  href: string;
  active: boolean;
  label: string;
  swatch?: string;
}

function FilterLink({ href, active, label, swatch }: FilterLinkProps) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-lg py-1.5 text-sm transition-colors',
          active ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {/* One choice per group, so the marker is a radio dot, not a checkbox. */}
        <span
          aria-hidden="true"
          className={cn(
            'flex-center bg-background h-4.5 w-4.5 shrink-0 rounded-full border',
            active ? 'border-brand border-[5px]' : 'border-neutral-300'
          )}
        />
        {swatch && <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full', swatch)} />}
        {label}
      </Link>
    </li>
  );
}

interface ExploreFiltersProps {
  filters: DiscoverFilters;
  regions: { id: string; name: string }[];
}

// Vivino's filter rail. Every option is a link, so filtering works without JavaScript and
// each state has a shareable URL.
export function ExploreFilters({ filters, regions }: ExploreFiltersProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <nav aria-labelledby="filter-tea">
        <h2 id="filter-tea" className="mb-2 font-bold">
          Tea
        </h2>
        <ul className="flex flex-wrap gap-x-5 lg:block">
          {CATEGORY_OPTIONS.map((option) => (
            <FilterLink
              key={option.label}
              href={discoverHref(filters, { category: option.value })}
              active={option.value === filters.category}
              label={option.label}
              swatch={option.value && CATEGORY_STYLES[option.value].fill}
            />
          ))}
        </ul>
      </nav>
      {regions.length > 0 && (
        <nav aria-labelledby="filter-region">
          <h2 id="filter-region" className="mb-2 font-bold">
            Region
          </h2>
          <ul className="flex flex-wrap gap-x-5 lg:block">
            <FilterLink
              href={discoverHref(filters, { regionId: undefined })}
              active={!filters.regionId}
              label="All regions"
            />
            {regions.map((region) => (
              <FilterLink
                key={region.id}
                href={discoverHref(filters, { regionId: region.id })}
                active={region.id === filters.regionId}
                label={region.name}
              />
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
