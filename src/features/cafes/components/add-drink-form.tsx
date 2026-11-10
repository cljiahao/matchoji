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
import { useCreateDrink } from '../hooks/use-create-drink.mutation';
import { drinkSchema, type DrinkInput, type DrinkOutput } from '../schemas/drink.schema';
import type { Drink } from '../types';
import { OptionSelect } from './option-select';

const BASE_OPTIONS = [
  { value: 'matcha', label: 'Matcha' },
  { value: 'hojicha', label: 'Hojicha' },
];
const STYLE_OPTIONS = [
  { value: 'latte', label: 'Latte' },
  { value: 'iced_latte', label: 'Iced latte' },
  { value: 'straight', label: 'Straight' },
  { value: 'float', label: 'Float' },
  { value: 'other', label: 'Other' },
];
const SERVING_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'iced', label: 'Iced' },
  { value: 'both', label: 'Hot or iced' },
];

interface AddDrinkFormProps {
  cafeId: string;
  initialName?: string;
  onAdded: (drink: Drink) => void;
  onCancel: () => void;
}

export function AddDrinkForm({ cafeId, initialName = '', onAdded, onCancel }: AddDrinkFormProps) {
  const createDrink = useCreateDrink();
  const form = useForm<DrinkInput, unknown, DrinkOutput>({
    resolver: zodResolver(drinkSchema),
    defaultValues: { cafeId, name: initialName, price: '' },
  });

  async function handleSubmit(values: DrinkOutput) {
    try {
      onAdded(await createDrink.mutateAsync(values));
    } catch (error) {
      toast.error(
        error instanceof FriendlyError ? error.message : 'Could not add that drink. Try again.'
      );
    }
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <CustomFormField name="name" label="Drink name">
          <Input className="h-10" autoComplete="off" placeholder="e.g. Hojicha latte" />
        </CustomFormField>
        <CustomFormField name="base" label="Tea">
          <OptionSelect options={BASE_OPTIONS} placeholder="Matcha or hojicha" />
        </CustomFormField>
        <CustomFormField name="style" label="Style">
          <OptionSelect options={STYLE_OPTIONS} placeholder="Pick a style" />
        </CustomFormField>
        <CustomFormField name="serving" label="Served">
          <OptionSelect options={SERVING_OPTIONS} placeholder="Hot, iced or both" />
        </CustomFormField>
        <CustomFormField name="price" label="Price (optional)">
          <Input className="h-10 w-32 tabular-nums" inputMode="decimal" placeholder="e.g. 7.50" />
        </CustomFormField>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Back
          </Button>
          <Button type="submit" disabled={createDrink.isPending} className="flex-1">
            {createDrink.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Add drink
          </Button>
        </div>
      </form>
    </Form>
  );
}
