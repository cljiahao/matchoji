'use client';

import { Bookmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useWishlistToggle } from '../hooks/use-wishlist';

interface WantToTryButtonProps {
  productId: string;
  // Icon-only for the feed's card corner; the accessible name stays the same.
  compact?: boolean;
  className?: string;
}

// The label stays "Want to try" in both states so the accessible name matches what is
// visible; aria-pressed and the filled mark carry the saved state.
export function WantToTryButton({ productId, compact = false, className }: WantToTryButtonProps) {
  const { saved, toggle, pending } = useWishlistToggle(productId);

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'default'}
      aria-pressed={saved}
      aria-label={compact ? 'Want to try' : undefined}
      title={compact ? 'Want to try' : undefined}
      disabled={pending}
      onClick={toggle}
      className={cn(
        'bg-card',
        compact && 'relative h-8 w-8 rounded-full after:absolute after:-inset-1.5',
        className
      )}
    >
      <Bookmark aria-hidden="true" className={cn(saved && 'fill-current')} />
      {!compact && 'Want to try'}
    </Button>
  );
}
