'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createClient } from '@/integrations/supabase/client';

import { deleteListing } from '../api/listing-service';
import { formatPrice } from '../lib';
import type { VendorListing } from '../types';
import { ListingForm } from './listing-form';

export function VendorListings({
  vendorId,
  listings,
}: {
  vendorId: string;
  listings: VendorListing[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(listing: VendorListing) {
    setRemoving(listing.id);
    try {
      await deleteListing(createClient(), listing.id);
      toast.success('Listing removed.');
      router.refresh();
    } catch {
      toast.error('Could not remove the listing. Try again.');
    } finally {
      setRemoving(null);
    }
  }

  if (listings.length === 0) {
    return <p className="text-muted-foreground text-sm">No listings yet. Add your first below.</p>;
  }

  return (
    <ul className="divide-y rounded-2xl border">
      {listings.map((listing) => {
        const name = listing.product?.name ?? 'Removed tea';
        return (
          <li key={listing.id} className="px-5 py-4">
            {editing === listing.id ? (
              <ListingForm
                vendorId={vendorId}
                products={[]}
                listing={listing}
                onDone={() => setEditing(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatPrice(listing.price, listing.currency)} · {listing.stock} in stock
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(listing.id)}
                    aria-label={`Edit ${name}`}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={removing === listing.id}
                    onClick={() => remove(listing)}
                    aria-label={`Remove ${name}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
