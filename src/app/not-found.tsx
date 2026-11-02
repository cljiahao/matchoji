import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteShell } from '@/components/layout';
import { PAGE_ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Page not found' };

const LINK_CLASS =
  'text-brand inline-flex min-h-11 items-center px-2 font-semibold hover:underline md:min-h-0';

// For any URL outside the site's routes. The (public) layout doesn't wrap it, so it brings the shell itself.
export default function NotFound() {
  return (
    <SiteShell>
      <div className="max-w-site flex-center mx-auto w-full flex-col gap-4 px-6 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground max-w-md">
          The page may have moved, or the link may be mistyped.
        </p>
        <div className="flex items-center gap-4">
          <Link href={PAGE_ROUTES.EXPLORE} className={LINK_CLASS}>
            Explore teas
          </Link>
          <Link href={PAGE_ROUTES.HOME} className={LINK_CLASS}>
            Home
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
