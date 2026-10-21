import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { DiscoverFilters } from '../lib';

interface SearchPillProps {
  // On Explore the search keeps the other filters; elsewhere it starts a fresh search.
  filters?: DiscoverFilters;
  size?: 'md' | 'lg';
  className?: string;
}

// A plain GET form so search works before hydration.
export function SearchPill({ filters, size = 'md', className }: SearchPillProps) {
  return (
    <form action="/explore" role="search" className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className={cn(
          'text-muted-foreground pointer-events-none absolute top-1/2 -translate-y-1/2',
          size === 'lg' ? 'left-5 h-5 w-5' : 'left-3.5 h-4 w-4'
        )}
      />
      <input
        // Remount on a new URL query: soft navigation keeps client state, and an
        // uncontrolled input would otherwise keep showing the previous search.
        key={filters?.q ?? ''}
        type="search"
        name="q"
        defaultValue={filters?.q}
        placeholder="Search any matcha or hojicha"
        aria-label="Search teas"
        className={cn(
          'border-border placeholder:text-muted-foreground w-full rounded-full border bg-white transition-colors hover:border-neutral-300 focus-visible:border-neutral-400',
          size === 'lg'
            ? 'h-14 pr-5 pl-13 text-base focus-visible:shadow-sm'
            : 'h-10 pr-4 pl-10 text-sm'
        )}
      />
      {filters?.category && <input type="hidden" name="category" value={filters.category} />}
      {filters?.regionId && <input type="hidden" name="region" value={filters.regionId} />}
      {filters && filters.sort !== 'top' && (
        <input type="hidden" name="sort" value={filters.sort} />
      )}
    </form>
  );
}
