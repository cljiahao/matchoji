'use client';

import { X } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CatalogueStatusNote, TeaTin, type ProductSummary } from '@/features/products';

import type { Stash } from '../api/wishlist-service';

import { useWishlist } from '../hooks/use-wishlist';
import { StashEditor } from './stash-editor';

interface WishlistListProps {
  // The stash is present on the journal's own list (the server read it with the products).
  products: (ProductSummary & { stash?: Stash })[];
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
    <ul className="space-y-2">
      {items.map((product) => (
        <li
          key={product.id}
          className="border-border flex items-center justify-between gap-3 rounded-2xl border p-2 pr-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-tile flex-center h-12 w-12 shrink-0 rounded-xl">
              <TeaTin
                category={product.category}
                seed={product.id}
                mark={product.brand ?? product.name}
                className="w-5"
              />
            </span>
            <span className="min-w-0">
              {product.brand && (
                <span className="text-muted-foreground block truncate text-xs">
                  {product.brand}
                </span>
              )}
              <Link
                href={`/products/${product.id}`}
                className="block truncate font-semibold hover:underline"
              >
                {product.name}
              </Link>
              <CatalogueStatusNote status={product.status} />
              {product.stash && (
                <StashEditor productId={product.id} name={product.name} stash={product.stash} />
              )}
            </span>
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
