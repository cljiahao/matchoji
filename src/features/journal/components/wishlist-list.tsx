'use client';

import { X } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CategoryBadge, type ProductSummary } from '@/features/products';

import { useWishlist } from '../hooks/use-wishlist';

interface WishlistListProps {
  products: ProductSummary[];
}

// The server sends the saved products in order; the shared id cache decides which are still
// saved, so a failed removal returns the item to its original place.
export function WishlistList({ products }: WishlistListProps) {
  const { ids, loaded, toggle, pending } = useWishlist();
  const items = loaded ? products.filter((p) => ids.includes(p.id)) : products;

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
            disabled={pending}
            onClick={() => toggle(product.id)}
          >
            <X aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
