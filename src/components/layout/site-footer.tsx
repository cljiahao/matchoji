import Link from 'next/link';

import { LinkList, type LinkItem } from '@/components/widgets';
import { PAGE_ROUTES } from '@/lib/constants/routes';

// Photos are packshots shared with the makers' leave; a GitHub issue is the takedown route.
const PHOTO_REMOVAL_URL =
  'https://github.com/cljiahao/matchoji/issues/new?title=Photo%20removal%20request';

interface SiteFooterProps {
  links?: LinkItem[];
}

const LINK_CLASS = 'inline-block py-3 font-semibold hover:underline';

export function SiteFooter({ links = [] }: SiteFooterProps) {
  return (
    <footer className="border-border w-full border-t">
      <div className="max-w-site mx-auto flex flex-col gap-8 px-6 pt-10 pb-6 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <p className="text-brand text-lg font-extrabold tracking-tight">Matchoji</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Rate and discover matcha and hojicha, one cup at a time.
          </p>
        </div>

        {/* The navbar (sm and up) already has Explore, Regions, Learn and Journal, and the
            phone tab bar has all but Regions, so only that one repeats, on phones only. */}
        <nav aria-label="More from Matchoji" className="text-sm">
          <ul className="flex flex-col sm:items-end">
            <li className="sm:hidden">
              <Link href={PAGE_ROUTES.REGIONS} className={LINK_CLASS}>
                Regions
              </Link>
            </li>
            <li>
              <Link href={PAGE_ROUTES.SUPPLY} className={LINK_CLASS}>
                Tea supply
              </Link>
            </li>
            <li>
              <Link href={PAGE_ROUTES.SELL} className={LINK_CLASS}>
                Sell on Matchoji
              </Link>
            </li>
            {links.length > 0 && (
              <li className="py-1.5">
                <LinkList links={links} className="text-muted-foreground" />
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="max-w-site mx-auto px-6">
        <div className="border-border text-muted-foreground flex flex-col gap-1 border-t py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Matchoji · A hobby project</p>
          <p>
            Is one of these photos yours?{' '}
            <a
              href={PHOTO_REMOVAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Ask us to take it down.
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
