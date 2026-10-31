import { Star } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PAGE_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

import { CATEGORY_STYLES, MIN_RATINGS, discoverHref, type DiscoverFilters } from '../lib';
import type { ProductCategory } from '../types';

const CATEGORY_OPTIONS: { label: string; value: ProductCategory | undefined }[] = [
  { label: 'All teas', value: undefined },
  { label: 'Matcha', value: 'matcha' },
  { label: 'Hojicha', value: 'hojicha' },
];

interface FilterLinkProps {
  href: string;
  active: boolean;
  label: ReactNode;
  swatch?: string;
}

function FilterLink({ href, active, label, swatch }: FilterLinkProps) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-2.5 rounded-lg text-sm transition-colors lg:min-h-0 lg:py-1.5',
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

function FilterGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="mb-2 font-bold">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-x-5 lg:block">{children}</ul>
    </nav>
  );
}

interface ExploreFiltersProps {
  filters: DiscoverFilters;
  regions: { id: string; name: string }[];
  grades: string[];
}

// Vivino's filter rail. Every option is a link, so filtering works without JavaScript and
// each state has a shareable URL.
export function ExploreFilters({ filters, regions, grades }: ExploreFiltersProps) {
  // A grade from a shared link stays selectable even when no listed tea carries it any more.
  const gradeList =
    filters.grade && !grades.some((g) => g.toLowerCase() === filters.grade?.toLowerCase())
      ? [...grades, filters.grade]
      : grades;

  return (
    <div className="space-y-6 lg:space-y-8">
      <FilterGroup id="filter-tea" title="Tea">
        {CATEGORY_OPTIONS.map((option) => (
          <FilterLink
            key={option.label}
            href={discoverHref(filters, { category: option.value })}
            active={option.value === filters.category}
            label={option.label}
            swatch={option.value && CATEGORY_STYLES[option.value].fill}
          />
        ))}
      </FilterGroup>

      <FilterGroup id="filter-rating" title="Rating">
        <FilterLink
          href={discoverHref(filters, { minRating: undefined })}
          active={!filters.minRating}
          label="Any rating"
        />
        {MIN_RATINGS.map((value) => (
          <FilterLink
            key={value}
            href={discoverHref(filters, { minRating: value })}
            active={value === filters.minRating}
            label={
              <span className="flex items-center gap-1">
                <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                {value} and up
              </span>
            }
          />
        ))}
      </FilterGroup>

      {gradeList.length > 0 && (
        <FilterGroup id="filter-grade" title="Grade">
          <FilterLink
            href={discoverHref(filters, { grade: undefined })}
            active={!filters.grade}
            label="All grades"
          />
          {gradeList.map((grade) => (
            <FilterLink
              key={grade}
              href={discoverHref(filters, { grade })}
              active={grade.toLowerCase() === filters.grade?.toLowerCase()}
              label={grade}
            />
          ))}
        </FilterGroup>
      )}

      {regions.length > 0 && (
        <div>
          <FilterGroup id="filter-region" title="Region">
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
          </FilterGroup>
          <Link
            href={PAGE_ROUTES.REGIONS}
            className="text-brand mt-2 inline-block text-sm font-semibold hover:underline"
          >
            Browse regions
          </Link>
        </div>
      )}
    </div>
  );
}
