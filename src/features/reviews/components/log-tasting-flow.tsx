'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CustomFormField } from '@/components/widgets';
import { ScanLabelButton, type ScanResponse } from '@/features/label-scan';
import {
  productSchema,
  type ProductInput,
  type ProductOutput,
  type ProductSummary,
} from '@/features/products';

import { useCreateProduct } from '../hooks/use-create-product.mutation';
import { useRegions } from '../hooks/use-regions.query';
import type { PrepPreset } from '../types';
import { CategorySelect, RegionSelect } from './form-selects';
import { ProductSearchCombobox } from './product-search-combobox';
import { RateProductForm } from './rate-product-form';

type Step = 'search' | 'add-product' | 'rate';

const EMPTY_PRODUCT: ProductInput = { name: '', category: 'matcha' };

interface LogTastingFlowProps {
  prep?: PrepPreset;
  onClose: () => void;
}

// The dialog's body, loaded the first time the dialog opens: it holds the form, label-scan and
// rating code, which no page needs until someone logs a tasting. Closing unmounts it, so each
// opening starts at the search step with empty state.
export default function LogTastingFlow({ prep, onClose }: LogTastingFlowProps) {
  const [step, setStep] = useState<Step>('search');
  const [product, setProduct] = useState<ProductSummary | undefined>();
  const [query, setQuery] = useState('');

  const { data: regions } = useRegions();
  const createProductMutation = useCreateProduct();

  const productForm = useForm<ProductInput, unknown, ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT,
  });

  async function handleAddProductSubmit(values: ProductOutput) {
    try {
      const created = await createProductMutation.mutateAsync(values);
      setProduct(created);
      setStep('rate');
    } catch (error) {
      // products_name_brand_key: the catalogue (or the review queue) already has this tea.
      const duplicate =
        typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
      toast.error(
        duplicate
          ? 'That tea is already on Matchoji. Search for it by name instead.'
          : 'Could not add that product. Check the details and try again.'
      );
    }
  }

  // The scan only fills things in: a catalogue match goes to the rating step and anything else
  // opens the add-a-tea form pre-filled, and either way the person confirms.
  function handleScanned({ reading, match }: ScanResponse) {
    if (match) {
      setProduct(match);
      setStep('rate');
      toast.info(`Found ${match.name}. Check it's the right tea before you rate.`);
      return;
    }
    productForm.reset({
      name: (reading.name ?? '').slice(0, 120),
      brand: reading.maker?.slice(0, 120) || undefined,
      category: reading.category ?? 'matcha',
      grade: reading.grade?.slice(0, 60) || undefined,
    });
    setStep('add-product');
    toast.info("That tea isn't on Matchoji yet. Check the details, then add it.");
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {step === 'rate' && product ? `Rate ${product.name}` : 'Log a tasting'}
        </DialogTitle>
        <DialogDescription>
          {step === 'search' && 'Find the hojicha or matcha you tried.'}
          {step === 'add-product' &&
            "Add the tea you tried. You can rate it now; it joins Explore once we've checked it."}
          {step === 'rate' && 'How was it?'}
        </DialogDescription>
      </DialogHeader>

      {step === 'search' && <ScanLabelButton onScanned={handleScanned} />}

      {step === 'search' && (
        <ProductSearchCombobox
          query={query}
          onQueryChange={setQuery}
          onSelect={(selected) => {
            setProduct(selected);
            setStep('rate');
          }}
          onAddNew={() => {
            productForm.reset({ ...EMPTY_PRODUCT, name: query.trim() });
            setStep('add-product');
          }}
        />
      )}

      {step === 'add-product' && (
        <Form {...productForm}>
          <form onSubmit={productForm.handleSubmit(handleAddProductSubmit)} className="space-y-4">
            <CustomFormField name="name" label="Name">
              <Input className="h-10" />
            </CustomFormField>
            <CustomFormField name="brand" label="Brand (optional)">
              <Input className="h-10" />
            </CustomFormField>
            <CustomFormField name="category" label="Category">
              <CategorySelect />
            </CustomFormField>
            <CustomFormField name="grade" label="Grade (optional)">
              <Input className="h-10" placeholder="Ceremonial, culinary, first flush…" />
            </CustomFormField>
            {regions && regions.length > 0 && (
              <CustomFormField name="regionId" label="Region (optional)">
                <RegionSelect regions={regions} />
              </CustomFormField>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={createProductMutation.isPending}
              className="w-full"
            >
              {createProductMutation.isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setStep('search')}
            >
              Back to search
            </Button>
          </form>
        </Form>
      )}

      {step === 'rate' && product && (
        <RateProductForm product={product} initialPrep={prep} onLogged={onClose} />
      )}
    </>
  );
}
