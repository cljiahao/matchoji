'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface YearShareButtonProps {
  // The public path of the recap, e.g. /u/<id>/year/2026; made absolute when shared.
  path: string;
  title: string;
}

// The Web Share sheet where the browser has one; otherwise the link is copied. The shared page
// is the public recap, whose preview image is the share card.
export function YearShareButton({ path, title }: YearShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
      } catch {
        // Dismissing the sheet rejects with AbortError; there is nothing to recover.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="lg" className="min-h-11" onClick={share}>
        {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        Share your year
      </Button>
      <span role="status" className="text-muted-foreground text-sm">
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  );
}
