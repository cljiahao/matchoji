import Link from 'next/link';

import { LinkList, type LinkItem } from '@/components/widgets';
import { PAGE_ROUTES } from '@/lib/constants/routes';

interface SiteFooterProps {
  links?: LinkItem[];
}

export function SiteFooter({ links = [] }: SiteFooterProps) {
  return (
    // One quiet row under a hairline: the page's content ends the page, not the footer.
    <footer className="border-border w-full border-t">
      <div className="max-w-site mx-auto flex flex-col gap-2 px-6 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          <span className="text-brand font-extrabold tracking-tight">Matchoji</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline">
            Rate and discover matcha and hojicha, one cup at a time.
          </span>
        </p>
        {/* Shown on phones too: the tab bar has no room for Regions, the supply figures or Sell. */}
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
          <li>
            <Link href={PAGE_ROUTES.EXPLORE} className="hover:underline">
              Explore
            </Link>
          </li>
          <li>
            <Link href={PAGE_ROUTES.REGIONS} className="hover:underline">
              Regions
            </Link>
          </li>
          <li>
            <Link href={PAGE_ROUTES.SUPPLY} className="hover:underline">
              Tea supply
            </Link>
          </li>
          <li>
            <Link href={PAGE_ROUTES.JOURNAL} className="hover:underline">
              Journal
            </Link>
          </li>
          <li>
            <Link href={PAGE_ROUTES.SELL} className="hover:underline">
              Sell on Matchoji
            </Link>
          </li>
          {links.length > 0 && (
            <li>
              <LinkList links={links} className="text-muted-foreground" />
            </li>
          )}
        </ul>
      </div>
    </footer>
  );
}
