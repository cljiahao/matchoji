import { LinkList, type LinkItem } from '@/components/widgets';

interface SiteFooterProps {
  links?: LinkItem[];
}

export function SiteFooter({ links = [] }: SiteFooterProps) {
  return (
    <footer className="border-border w-full border-t">
      <div className="flex-between max-w-site mx-auto px-6 py-6">
        <p className="text-muted-foreground text-sm">Matchoji</p>
        {links.length > 0 && <LinkList links={links} className="text-muted-foreground text-sm" />}
      </div>
    </footer>
  );
}
