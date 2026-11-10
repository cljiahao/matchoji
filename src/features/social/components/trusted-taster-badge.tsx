import { BadgeCheck, ExternalLink } from 'lucide-react';

import { isInstagramHandle } from '@/features/account';

// Marks the invited tasters whose drink reviews lead a café or drink page, apart from community
// ratings. Text carries the meaning; the icon is decoration.
export function TrustedTasterBadge() {
  return (
    <span className="border-border bg-brand/10 text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
      <BadgeCheck aria-hidden="true" className="text-brand size-3.5" />
      Trusted taster
    </span>
  );
}

// The handle is stored data, so only one that passes the handle pattern becomes a link.
export function InstagramHandleLink({ handle }: { handle: string }) {
  if (!isInstagramHandle(handle)) return null;
  return (
    <a
      href={`https://www.instagram.com/${handle}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand inline-flex items-center gap-1 text-sm font-semibold hover:underline"
    >
      @{handle}
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </a>
  );
}
