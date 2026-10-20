'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { discoverHref, type DiscoverFilters, type DiscoverSort } from '../lib';
import { CategoryTabs } from './category-tabs';

const SORT_LABELS: Record<DiscoverSort, string> = {
  top: 'Top rated',
  reviewed: 'Most reviewed',
  newest: 'Newest',
};

const ALL_REGIONS = 'all';

interface DiscoverToolbarProps {
  filters: DiscoverFilters;
  regions: { id: string; name: string }[];
}

// Search submits as a plain GET form so it works before hydration; the selects navigate
// on change because a select has no submit gesture of its own.
export function DiscoverToolbar({ filters, regions }: DiscoverToolbarProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <form action="/" role="search" className="relative">
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        />
        <Input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search by name or brand"
          aria-label="Search teas"
          className="bg-card h-11 pl-9"
        />
        {filters.category && <input type="hidden" name="category" value={filters.category} />}
        {filters.regionId && <input type="hidden" name="region" value={filters.regionId} />}
        {filters.sort !== 'top' && <input type="hidden" name="sort" value={filters.sort} />}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryTabs filters={filters} />
        <div className="ml-auto flex flex-wrap gap-2">
          {regions.length > 0 && (
            <Select
              value={filters.regionId ?? ALL_REGIONS}
              onValueChange={(v) =>
                router.push(discoverHref(filters, { regionId: v === ALL_REGIONS ? undefined : v }))
              }
            >
              <SelectTrigger aria-label="Region" className="bg-card w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_REGIONS}>All regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.sort}
            onValueChange={(v) => router.push(discoverHref(filters, { sort: v as DiscoverSort }))}
          >
            <SelectTrigger aria-label="Sort" className="bg-card w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as DiscoverSort[]).map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
