'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CustomFormField } from '@/components/widgets';

import { FriendlyError } from '../api/cafes-mutations';
import { useCreateCafe } from '../hooks/use-create-cafe.mutation';
import { CITIES, DEFAULT_CITY } from '../lib/city';
import { cafeSchema, type CafeInput, type CafeOutput } from '../schemas/cafe.schema';
import type { Cafe } from '../types';
import { OptionSelect } from './option-select';

const CITY_OPTIONS = CITIES.map((c) => ({ value: c.slug, label: c.name }));

interface AddCafeFormProps {
  initialName?: string;
  onAdded: (cafe: Cafe) => void;
  onCancel: () => void;
}

// A new café waits for review, but its adder can already rate it, so the flow carries on.
export function AddCafeForm({ initialName = '', onAdded, onCancel }: AddCafeFormProps) {
  const createCafe = useCreateCafe();
  const form = useForm<CafeInput, unknown, CafeOutput>({
    resolver: zodResolver(cafeSchema),
    defaultValues: {
      name: initialName,
      citySlug: DEFAULT_CITY,
      area: '',
      address: '',
      instagramHandle: '',
      websiteUrl: '',
    },
  });

  async function handleSubmit(values: CafeOutput) {
    try {
      onAdded(await createCafe.mutateAsync(values));
    } catch (error) {
      toast.error(
        error instanceof FriendlyError ? error.message : 'Could not add that café. Try again.'
      );
    }
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <CustomFormField name="name" label="Café name">
          <Input className="h-10" autoComplete="off" />
        </CustomFormField>
        <CustomFormField name="citySlug" label="City">
          <OptionSelect options={CITY_OPTIONS} placeholder="Pick a city" />
        </CustomFormField>
        <CustomFormField name="area" label="Area (optional)">
          <Input className="h-10" placeholder="e.g. Tiong Bahru" />
        </CustomFormField>
        <CustomFormField name="address" label="Address (optional)">
          <Input className="h-10" />
        </CustomFormField>
        <CustomFormField name="instagramHandle" label="Instagram (optional)">
          <Input className="h-10" placeholder="@handle" autoCapitalize="none" />
        </CustomFormField>
        <CustomFormField name="websiteUrl" label="Website (optional)">
          <Input className="h-10" inputMode="url" placeholder="https://…" />
        </CustomFormField>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Back
          </Button>
          <Button type="submit" disabled={createCafe.isPending} className="flex-1">
            {createCafe.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Add café
          </Button>
        </div>
      </form>
    </Form>
  );
}
