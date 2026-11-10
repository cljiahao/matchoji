import Link from 'next/link';

import { PAGE_ROUTES } from '@/lib/constants/routes';

const LINK_CLASS =
  'text-brand inline-flex min-h-11 items-center px-2 font-semibold hover:underline';

// For a café, drink, tea or profile that doesn't exist (or a hidden one) inside the site, with the navbar kept.
export default function PublicNotFound() {
  return (
    <div className="max-w-site flex-center mx-auto w-full flex-col gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">We couldn&apos;t find that</h1>
      <p className="text-muted-foreground max-w-md">
        The café, drink or page may have moved, or the link may be mistyped.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href={PAGE_ROUTES.CAFES} className={LINK_CLASS}>
          Browse cafés
        </Link>
        <Link href={PAGE_ROUTES.TOP} className={LINK_CLASS}>
          Top drinks
        </Link>
        <Link href={PAGE_ROUTES.EXPLORE} className={LINK_CLASS}>
          Explore teas
        </Link>
      </div>
    </div>
  );
}
