'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { AuthStatus } from '@/features/auth';
import { LogTastingDialog } from '@/features/reviews';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

const NAV_LINKS = [{ label: 'Discover', href: PAGE_ROUTES.HOME }] as const;

// Product pages are reached from the feed, so they keep Discover marked as the section.
function isActive(href: string, pathname: string): boolean {
  if (href === PAGE_ROUTES.HOME) return pathname === '/' || pathname.startsWith('/products/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-border sticky top-0 z-50 w-full border-b">
      <div className="flex-between max-w-site mx-auto min-h-16 gap-4 px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href={PAGE_ROUTES.HOME} className="text-xl font-bold tracking-tight">
            Matchoji
          </Link>
          <ul className="hidden items-center gap-6 sm:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href, pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <LogTastingDialog
            trigger={
              <Button aria-label="Log a tasting">
                <Plus aria-hidden="true" />
                <span className="hidden sm:inline">Log a tasting</span>
              </Button>
            }
          />
          <AuthStatus />
        </div>
      </div>
    </nav>
  );
}
