'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CustomFormField } from '@/components/widgets';
import { createClient } from '@/integrations/supabase/client';

import { applyAsVendor, updateVendor } from '../api/vendor-service';
import { vendorSchema, type VendorInput, type VendorOutput } from '../schemas';
import type { Vendor } from '../types';

interface VendorFormProps {
  userId: string;
  // Absent for a new application; present to edit an existing shop.
  vendor?: Vendor;
}

const toInput = (vendor?: Vendor): VendorInput => ({
  name: vendor?.name ?? '',
  profileInfo: vendor?.profileInfo ?? '',
  website: vendor?.website ?? '',
  country: vendor?.country ?? '',
  shipsTo: vendor?.shipsTo.join(', ') ?? '',
});

export function VendorForm({ userId, vendor }: VendorFormProps) {
  const router = useRouter();
  const form = useForm<VendorInput, unknown, VendorOutput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: toInput(vendor),
  });

  async function handleSubmit(values: VendorOutput) {
    try {
      const supabase = createClient();
      if (vendor) {
        await updateVendor(supabase, vendor.id, values);
        toast.success('Shop details saved.');
      } else {
        await applyAsVendor(supabase, userId, values);
        toast.success('Application sent. We will review it soon.');
      }
      router.refresh();
    } catch {
      toast.error('Could not save your shop. Try again.');
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="max-w-xl space-y-4"
        aria-label={vendor ? 'Shop details' : 'Apply to sell'}
      >
        <CustomFormField name="name" label="Shop name">
          <Input autoComplete="organization" />
        </CustomFormField>
        <CustomFormField
          name="profileInfo"
          label="About your shop (optional)"
          description="Your farm or roastery, and what you sell."
        >
          <Textarea rows={3} />
        </CustomFormField>
        <CustomFormField name="website" label="Website (optional)">
          <Input type="url" placeholder="https://" />
        </CustomFormField>
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <CustomFormField name="country" label="Ships from" description="Country code, e.g. JP">
            <Input maxLength={2} className="uppercase" />
          </CustomFormField>
          <CustomFormField
            name="shipsTo"
            label="Ships to"
            description="Country codes, separated by commas, e.g. SG, MY, JP"
          >
            <Input className="uppercase" />
          </CustomFormField>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {vendor ? 'Save shop details' : 'Apply to sell'}
        </Button>
      </form>
    </Form>
  );
}
