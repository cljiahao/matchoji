'use client';

import { ChevronDown, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogDialog } from '@/components/widgets/log-dialog';
import { AuthStatus } from '@/features/auth';
import { SearchPill } from '@/features/products';
import { NotificationBell } from '@/features/social';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Cafés', href: PAGE_ROUTES.CAFES },
  { label: 'Top', href: PAGE_ROUTES.TOP },
  { label: 'Tasters', href: PAGE_ROUTES.TASTERS },
] as const;

// The tea side of the site, kept one click away without competing with the café links.
const AT_HOME_LINKS = [
  { label: 'Teas', href: PAGE_ROUTES.EXPLORE },
  { label: 'Learn', href: PAGE_ROUTES.LEARN },
  { label: 'Regions', href: PAGE_ROUTES.REGIONS },
] as const;

// Product pages are reached from Teas, so they keep it marked as the section.
function isActive(href: string, pathname: string): boolean {
  if (href === PAGE_ROUTES.EXPLORE)
    return pathname.startsWith(PAGE_ROUTES.EXPLORE) || pathname.startsWith('/products/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const atHomeActive = AT_HOME_LINKS.some((link) => isActive(link.href, pathname));

  return (
    <nav className="border-border bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="max-w-site mx-auto flex h-16 items-center gap-4 px-6 lg:gap-6">
        <Link
          href={PAGE_ROUTES.HOME}
          className="text-brand flex min-h-11 shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image_assets/logo.svg" alt="" className="h-8 w-8" />
          Matchoji
        </Link>

        {/* Explore has its own search, so the bar's only shows elsewhere. */}
        {!pathname.startsWith(PAGE_ROUTES.EXPLORE) && (
          <SearchPill className="hidden lg:block lg:w-48 xl:w-72" />
        )}

        {/* Phones reach these through the bottom tab bar instead. */}
        <ul className="hidden items-center gap-4 md:flex lg:gap-6">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-block py-3 text-sm font-semibold transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex items-center gap-1 py-3 text-sm font-semibold transition-colors',
                  atHomeActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                At home
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {AT_HOME_LINKS.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          <Link
            href={PAGE_ROUTES.EXPLORE}
            aria-label="Search teas"
            className="hover:bg-muted flex h-11 w-11 items-center justify-center rounded-full md:hidden"
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </Link>
          <div className="hidden md:block">
            <LogDialog
              trigger={
                <Button className="min-h-11">
                  <Plus aria-hidden="true" />
                  Log a drink
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
