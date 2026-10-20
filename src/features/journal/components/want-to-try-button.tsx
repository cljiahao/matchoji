'use client';

import { Bookmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useWishlistToggle } from '../hooks/use-wishlist-toggle';

interface WantToTryButtonProps {
  productId: string;
  className?: string;
}

// The label stays "Want to try" in both states so the accessible name matches what is
// visible; aria-pressed and the filled mark carry the saved state.
export function WantToTryButton({ productId, className }: WantToTryButtonProps) {
  const { saved, toggle, pending } = useWishlistToggle(productId);

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={saved}
      disabled={pending}
      onClick={toggle}
      className={cn('bg-card', className)}
    >
      <Bookmark aria-hidden="true" className={cn(saved && 'fill-current')} />
      Want to try
    </Button>
  );
}
