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
import {
  productSchema,
  type ProductInput,
  type ProductOutput,
  type ProductSummary,
} from '@/features/products';

import { useCreateProduct } from '../hooks/use-create-product.mutation';
import { useRegions } from '../hooks/use-regions.query';
import { CategorySelect, RegionSelect } from './form-selects';
import { ProductSearchCombobox } from './product-search-combobox';
import { RateProductForm } from './rate-product-form';

type Step = 'search' | 'add-product' | 'rate';

const EMPTY_PRODUCT: ProductInput = { name: '', category: 'matcha' };

interface LogTastingDialogProps {
  trigger?: ReactNode;
}

// The feed's entry point: find or add a product, then rate it. Product pages render
// RateProductForm inline instead, since the product is already chosen there.
export function LogTastingDialog({ trigger }: LogTastingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('search');
  const [product, setProduct] = useState<ProductSummary | undefined>();
  const [query, setQuery] = useState('');

  const { data: regions } = useRegions();
  const createProductMutation = useCreateProduct();

  const productForm = useForm<ProductInput, unknown, ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT,
  });

  function handleOpenChange(next: boolean) {
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
    } catch {
      toast.error('Could not add that product. Check the details and try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button>Log a tasting</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'rate' && product ? `Rate ${product.name}` : 'Log a tasting'}
          </DialogTitle>
          <DialogDescription>
            {step === 'search' && 'Find the hojicha or matcha you tried.'}
            {step === 'add-product' && "Add the product you tried — it'll join the catalog."}
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
              <Button type="submit" disabled={createProductMutation.isPending} className="w-full">
                {createProductMutation.isPending && (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                )}
                Continue
              </Button>
            </form>
          </Form>
        )}

        {step === 'rate' && product && (
          <RateProductForm product={product} onLogged={() => handleOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
