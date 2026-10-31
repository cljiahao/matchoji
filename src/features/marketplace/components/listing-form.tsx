'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CustomFormField } from '@/components/widgets';
import type { ProductSummary } from '@/features/products';
import { createClient } from '@/integrations/supabase/client';

import { saveListing } from '../api/listing-service';
import { listingSchema, type ListingInput, type ListingOutput } from '../schemas';
import type { VendorListing } from '../types';

interface ListingFormProps {
  vendorId: string;
  // Teas the vendor can still list; ignored when editing, since the tea is fixed.
  products: ProductSummary[];
  listing?: VendorListing;
  defaultCurrency?: string;
  onDone?: () => void;
}

const UNIQUE_VIOLATION = '23505';

const productLabel = (p: ProductSummary) => (p.brand ? `${p.name} · ${p.brand}` : p.name);

export function ListingForm({
  vendorId,
  products,
  listing,
  defaultCurrency = 'USD',
  onDone,
}: ListingFormProps) {
  const router = useRouter();
  const form = useForm<ListingInput, unknown, ListingOutput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      productId: listing?.productId ?? '',
      price: listing ? String(listing.price) : '',
      currency: listing?.currency ?? defaultCurrency,
      stock: listing ? String(listing.stock) : '',
      url: listing?.url ?? '',
    },
  });

  async function handleSubmit(values: ListingOutput) {
    try {
      await saveListing(createClient(), vendorId, values, listing?.id);
      toast.success(listing ? 'Listing updated.' : 'Listing added.');
      if (!listing) form.reset({ ...form.getValues(), productId: '', stock: '', url: '' });
      onDone?.();
      router.refresh();
    } catch (error) {
      const duplicate =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code === UNIQUE_VIOLATION
          : false;
      toast.error(
        duplicate ? 'You already list this tea.' : 'Could not save the listing. Try again.'
      );
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        aria-label={listing ? `Edit ${listing.product?.name ?? 'listing'}` : 'Add a listing'}
      >
        {!listing && (
          <CustomFormField name="productId" label="Tea">
            <select className="border-input h-11 w-full rounded-md border bg-transparent px-3 text-sm sm:h-9">
              <option value="">Pick a tea from the catalogue</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {productLabel(p)}
                </option>
              ))}
            </select>
          </CustomFormField>
        )}
        <div className="grid grid-cols-3 gap-4">
          <CustomFormField name="price" label="Price">
            <Input inputMode="decimal" />
          </CustomFormField>
          <CustomFormField name="currency" label="Currency">
            <Input maxLength={3} className="uppercase" />
          </CustomFormField>
          <CustomFormField name="stock" label="In stock">
            <Input inputMode="numeric" />
          </CustomFormField>
        </div>
        <CustomFormField
          name="url"
          label="Buy link"
          description="The page on your shop where people buy this tea."
        >
          <Input type="url" placeholder="https://" />
        </CustomFormField>
        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {listing ? 'Save listing' : 'Add listing'}
          </Button>
          {listing && onDone && (
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
