'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface FilterDisclosureProps {
  activeCount: number;
  children: ReactNode;
}

// With four filter groups the rail fills a phone screen before any tea shows, so below lg it
// folds behind one button. From lg it is the sidebar and always open.
export function FilterDisclosure({ activeCount, children }: FilterDisclosureProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="border-border hover:bg-muted flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground flex-center h-5 min-w-5 rounded-full px-1.5 text-xs">
            {activeCount}
          </span>
        )}
      </button>
      <div id={id} className={cn('mt-5 lg:mt-0 lg:block', !open && 'hidden')}>
        {children}
      </div>
    </>
  );
}
