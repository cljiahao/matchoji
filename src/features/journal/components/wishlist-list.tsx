'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CategoryBadge, type ProductSummary } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { removeFromWishlist } from '../api/wishlist-service';

interface WishlistListProps {
  userId: string;
  products: ProductSummary[];
}

export function WishlistList({ userId, products }: WishlistListProps) {
  const [items, setItems] = useState(products);

  async function remove(product: ProductSummary) {
    setItems((current) => current.filter((p) => p.id !== product.id));
    try {
      await removeFromWishlist(createClient(), userId, product.id);
    } catch {
      setItems((current) =>
        current.some((p) => p.id === product.id) ? current : [product, ...current]
      );
      toast.error('Could not update your list. Try again.');
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing saved yet. Use “Want to try” on any tea to keep it here.
      </p>
    );
  }

  return (
    <ul className="bg-card divide-y rounded-lg border">
      {items.map((product) => (
        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={`/products/${product.id}`}
              className="truncate font-medium hover:underline hover:underline-offset-2"
            >
              {product.name}
            </Link>
            <CategoryBadge category={product.category} className="shrink-0" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${product.name}`}
            onClick={() => remove(product)}
          >
            <X aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
