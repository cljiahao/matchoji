'use client';

import Link from 'next/link';

import { LinkList, type LinkItem } from '@/components/widgets';
import { AuthStatus } from '@/features/auth';
import { PAGE_ROUTES } from '@/lib/constants/routes';

const defaultNavLinks: LinkItem[] = [];

export function Navbar() {
  return (
    <nav className="bg-card border-border sticky top-0 z-50 w-full border-b">
      <div className="flex-between max-w-site mx-auto min-h-16 px-6 py-3">
        <Link href={PAGE_ROUTES.HOME} className="text-xl font-bold tracking-tight">
          Matchoji
        </Link>

        <div className="flex items-center gap-4">
          {defaultNavLinks.length > 0 && (
            <LinkList links={defaultNavLinks} className="hover:text-primary transition-colors" />
          )}
          <AuthStatus />
        </div>
      </div>
    </nav>
  );
}
