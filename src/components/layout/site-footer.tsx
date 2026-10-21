import Link from 'next/link';

import { LinkList, type LinkItem } from '@/components/widgets';
import { PAGE_ROUTES } from '@/lib/constants/routes';

interface SiteFooterProps {
  links?: LinkItem[];
}

export function SiteFooter({ links = [] }: SiteFooterProps) {
  return (
    <footer className="bg-muted w-full">
      <div className="max-w-site mx-auto flex flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-brand text-lg font-extrabold tracking-tight">Matchoji</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Rate and discover matcha and hojicha, one cup at a time.
          </p>
        </div>
        <ul className="flex gap-6 text-sm font-semibold">
          <li>
            <Link href={PAGE_ROUTES.EXPLORE} className="hover:underline">
              Explore
            </Link>
          </li>
          <li>
            <Link href={PAGE_ROUTES.JOURNAL} className="hover:underline">
              Journal
            </Link>
          </li>
        </ul>
        {links.length > 0 && <LinkList links={links} className="text-muted-foreground text-sm" />}
      </div>
    </footer>
  );
}
