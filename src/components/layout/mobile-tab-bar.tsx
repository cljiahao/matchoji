'use client';

import { BookOpen, Compass, Home, Plus, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LogTastingDialog } from '@/features/reviews';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

function Tab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold',
          active ? 'text-brand' : 'text-muted-foreground'
        )}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
        {label}
      </Link>
    </li>
  );
}

// Phones get an app-style tab bar, so the header stays one clean row and logging a tasting
// is always one thumb away.
export function MobileTabBar() {
  const pathname = usePathname();
  const exploring = pathname.startsWith(PAGE_ROUTES.EXPLORE) || pathname.startsWith('/products/');

  return (
    <nav
      aria-label="Sections"
      className="border-border fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden"
    >
      <ul className="flex items-center">
        <Tab href={PAGE_ROUTES.HOME} label="Home" icon={Home} active={pathname === '/'} />
        <Tab href={PAGE_ROUTES.EXPLORE} label="Explore" icon={Compass} active={exploring} />
        <li className="flex-1">
          <LogTastingDialog
            trigger={
              <button
                type="button"
                className="text-brand flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-semibold"
              >
                <span className="bg-brand flex-center h-6 w-6 rounded-full text-white">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                </span>
                Log
              </button>
            }
          />
        </li>
        <Tab
          href={PAGE_ROUTES.JOURNAL}
          label="Journal"
          icon={BookOpen}
          active={pathname.startsWith(PAGE_ROUTES.JOURNAL)}
        />
      </ul>
    </nav>
  );
}
