'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CustomFormField } from '@/components/widgets';
import { useSession, useSignInPrompt } from '@/features/auth';
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

interface LogTastingDialogProps {
  trigger?: ReactNode;
  // A recipe's brew settings, filled into the rating step.
  prep?: PrepPreset;
}

// The app-wide entry point: find or add a product, then rate it. Like Vivino, logging needs
// an account, so a signed-out visitor gets the sign-in dialog instead of the form.
export function LogTastingDialog({ trigger, prep }: LogTastingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('search');
  const [product, setProduct] = useState<ProductSummary | undefined>();
  const [query, setQuery] = useState('');

  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const { data: regions } = useRegions();
  const createProductMutation = useCreateProduct();

  const productForm = useForm<ProductInput, unknown, ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT,
  });

  function handleOpenChange(next: boolean) {
    if (next && !session) {
      if (!sessionLoading) promptSignIn({ reason: 'Sign in to log and rate the teas you try.' });
      return;
    }
    setOpen(next);
    if (!next) {
      setStep('search');
      setProduct(undefined);
      setQuery('');
      productForm.reset(EMPTY_PRODUCT);
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button>Log a tasting</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
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
                <Input />
              </CustomFormField>
              <CustomFormField name="brand" label="Brand (optional)">
                <Input />
              </CustomFormField>
              <CustomFormField name="category" label="Category">
                <CategorySelect />
              </CustomFormField>
              <CustomFormField name="grade" label="Grade (optional)">
                <Input placeholder="Ceremonial, culinary, first flush…" />
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
            </form>
          </Form>
        )}

        {step === 'rate' && product && (
          <RateProductForm
            product={product}
            initialPrep={prep}
            onLogged={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
