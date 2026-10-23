import Link from 'next/link';

import { PAGE_ROUTES } from '@/lib/constants/routes';

// For a tea id that doesn't exist (or a hidden one) inside the site, with the navbar kept.
export default function PublicNotFound() {
  return (
    <div className="max-w-site flex-center mx-auto w-full flex-col gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">We couldn&apos;t find that</h1>
      <p className="text-muted-foreground max-w-md">
        The tea or page may have moved, or the link may be mistyped.
      </p>
      <Link href={PAGE_ROUTES.EXPLORE} className="text-brand font-semibold hover:underline">
        Explore teas
      </Link>
    </div>
  );
}
