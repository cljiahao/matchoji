import Link from 'next/link';

import { PAGE_ROUTES } from '@/lib/constants/routes';

// For any URL outside the site's routes; the shell's navbar belongs to the (public) group.
export default function NotFound() {
  return (
    <main className="flex-center min-h-screen flex-col gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <Link href={PAGE_ROUTES.HOME} className="text-brand font-semibold hover:underline">
        Go to Matchoji
      </Link>
    </main>
  );
}
