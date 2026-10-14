import Link from 'next/link';

import { cn } from '@/lib/utils';

import { CATEGORY_STYLES } from '../lib';
import type { ProductCategory } from '../types';

const TABS: { label: string; value: ProductCategory | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Matcha', value: 'matcha' },
  { label: 'Hojicha', value: 'hojicha' },
];

interface CategoryTabsProps {
  active: ProductCategory | undefined;
}

export function CategoryTabs({ active }: CategoryTabsProps) {
  return (
    <nav className="border-border inline-flex gap-1 rounded-lg border p-1" aria-label="Category">
      {TABS.map((tab) => {
        const isActive = tab.value === active;
        const activeClass = tab.value
          ? CATEGORY_STYLES[tab.value].activeTab
          : 'bg-primary text-primary-foreground';
        return (
          <Link
            key={tab.label}
            href={tab.value ? `/?category=${tab.value}` : '/'}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive ? activeClass : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
