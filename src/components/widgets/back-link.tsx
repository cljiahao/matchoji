import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface BackLinkProps {
  href: string;
  // Where the link goes ("Learn", "Matcha 101"), not "Back".
  label: string;
  className?: string;
}

export function BackLink({ href, label, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        // The negative margin lines the chevron up with the page's left edge while the
        // padding keeps a 40px hit area.
        'text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/50 focus-visible:border-ring -ml-2 inline-flex min-h-10 items-center gap-1 rounded-full border border-transparent py-2 pr-4 pl-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px]',
        className
      )}
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
      <span className="sr-only">Back to</span> {label}
    </Link>
  );
}
