import { LinkList, type LinkItem } from '@/components/widgets';

interface SiteFooterProps {
  creditText?: string;
  links?: LinkItem[];
}

const defaultLinks: LinkItem[] = [{ label: 'Contact Us', href: '#' }];

export function SiteFooter({
  creditText = 'Built with Matchoji',
  links = defaultLinks,
}: SiteFooterProps) {
  return (
    <footer className="bg-foreground w-full">
      <div className="flex-between px-6 py-6">
        <p className="text-background text-sm">{creditText}</p>
        <LinkList links={links} className="text-background text-sm" />
      </div>
    </footer>
  );
}
