'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { LinkList, type LinkItem } from '@/components/widgets';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

const defaultNavLinks: LinkItem[] = [];

export function Navbar() {
  const pathname = usePathname();
  const rootPath = `/${pathname.split('/')[1]}`;
  const isDashboard = rootPath === PAGE_ROUTES.DASHBOARD;

  return (
    <nav
      className={cn(
        isDashboard
          ? 'sticky top-0 z-50 w-full'
          : 'max-w-site fixed inset-x-0 top-0 z-50 mx-auto pt-10'
      )}
    >
      <div
        className={cn(
          'flex-between bg-card min-h-20 px-6 py-3 shadow-lg',
          isDashboard ? 'border-b' : 'rounded-2xl border'
        )}
      >
        <Link href={PAGE_ROUTES.HOME} className="text-xl font-bold tracking-tight">
          <span className="text-brand-gradient">Match</span>
          <span>oji</span>
        </Link>

        <div className="flex items-center gap-4">
          {defaultNavLinks.length > 0 && (
            <LinkList links={defaultNavLinks} className="hover:text-primary transition-colors" />
          )}
          <Button
            asChild
            className="bg-primary hover:bg-primary-hover text-primary-foreground h-12 rounded-lg px-6 py-3 font-bold"
          >
            <Link href={PAGE_ROUTES.DASHBOARD}>Dashboard</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
