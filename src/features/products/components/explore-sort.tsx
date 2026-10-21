'use client';

import { useRouter } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { discoverHref, type DiscoverFilters, type DiscoverSort } from '../lib';

const SORT_LABELS: Record<DiscoverSort, string> = {
  top: 'Top rated',
  reviewed: 'Most rated',
  newest: 'Newest',
};

// A select has no submit gesture of its own, so it navigates on change.
export function ExploreSort({ filters }: { filters: DiscoverFilters }) {
  const router = useRouter();
  return (
    <Select
      value={filters.sort}
      onValueChange={(v) => router.push(discoverHref(filters, { sort: v as DiscoverSort }))}
    >
      <SelectTrigger aria-label="Sort" className="w-40 rounded-full">
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
  );
}
