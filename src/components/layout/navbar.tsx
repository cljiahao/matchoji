'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { AuthStatus } from '@/features/auth';
import { SearchPill } from '@/features/products';
import { LogTastingDialog } from '@/features/reviews';
import { NotificationBell } from '@/features/social';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Explore', href: PAGE_ROUTES.EXPLORE },
  { label: 'Regions', href: PAGE_ROUTES.REGIONS },
  { label: 'Learn', href: PAGE_ROUTES.LEARN },
  { label: 'Journal', href: PAGE_ROUTES.JOURNAL },
] as const;

// Product pages are reached from Explore, so they keep it marked as the section.
function isActive(href: string, pathname: string): boolean {
  if (href === PAGE_ROUTES.EXPLORE)
    return pathname.startsWith(PAGE_ROUTES.EXPLORE) || pathname.startsWith('/products/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="max-w-site mx-auto flex h-16 items-center gap-6 px-6">
        <Link
          href={PAGE_ROUTES.HOME}
          className="text-brand flex items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image_assets/logo.svg" alt="" className="h-8 w-8" />
          Matchoji
        </Link>

        {/* Home and Explore have their own search, so the bar's only shows elsewhere. */}
        {pathname !== PAGE_ROUTES.HOME && !pathname.startsWith(PAGE_ROUTES.EXPLORE) && (
          <SearchPill className="hidden w-64 md:block lg:w-72" />
        )}

        {/* Phones reach these through the bottom tab bar instead. */}
        <ul className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href={PAGE_ROUTES.EXPLORE}
            aria-label="Search teas"
            className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full md:hidden"
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </Link>
          <div className="hidden sm:block">
            <LogTastingDialog
              trigger={
                <Button>
                  <Plus aria-hidden="true" />
                  Log a tasting
                </Button>
              }
            />
          </div>
          <NotificationBell />
          <AuthStatus />
        </div>
      </div>
    </nav>
  );
}
