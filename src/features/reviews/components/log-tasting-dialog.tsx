'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
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
import { signInWithGoogle, useSession } from '@/features/auth';
import {
  productSchema,
  type ProductInput,
  type ProductOutput,
  type ProductSummary,
} from '@/features/products';

import { useCreateProduct } from '../hooks/use-create-product.mutation';
import { useRegions } from '../hooks/use-regions.query';
import { clearProductDraft, loadProductDraft, saveProductDraft } from '../lib';
import { CategorySelect, RegionSelect } from './form-selects';
import { ProductSearchCombobox } from './product-search-combobox';
import { RateProductForm } from './rate-product-form';

type Step = 'search' | 'add-product' | 'rate';

const EMPTY_PRODUCT: ProductInput = { name: '', category: 'matcha' };

interface LogTastingDialogProps {
  trigger?: ReactNode;
  // A page with several dialogs lets exactly one reopen a product parked across sign-in.
  restoresDraft?: boolean;
}

// The feed's entry point: find or add a product, then rate it. Product pages render
// RateProductForm inline instead, since the product is already chosen there.
export function LogTastingDialog({ trigger, restoresDraft = true }: LogTastingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('search');
  const [product, setProduct] = useState<ProductSummary | undefined>();
  const [query, setQuery] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const { session, isLoading: sessionLoading } = useSession();
  const { data: regions } = useRegions();
  const createProductMutation = useCreateProduct();

  const productForm = useForm<ProductInput, unknown, ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT,
  });

  useEffect(() => {
    if (!restoresDraft) return;
    const draft = loadProductDraft();
    if (!draft) return;
    productForm.reset({ ...EMPTY_PRODUCT, ...draft });
    // sessionStorage exists only after hydration; reading it during render would make the
    // client's first render disagree with the server HTML, so the one-time restore runs here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep('add-product');
    setOpen(true);
    clearProductDraft();
    toast.info('Your new product is back. Press Continue to add it.');
  }, [restoresDraft, productForm]);

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
    // Products are insertable only by signed-in users, so park the product and sign in
    // first; the dialog reopens on this step with it filled in.
    if (!session) {
      saveProductDraft(values);
      setRedirecting(true);
      const { error } = await signInWithGoogle('/');
      if (error) {
        setRedirecting(false);
        toast.error('Could not reach Google sign-in. Check your connection and try again.');
      }
      return;
    }

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
              {!sessionLoading && !session && (
                <p className="text-muted-foreground text-sm">
                  You&rsquo;ll sign in with Google first. The product is kept while you do.
                </p>
              )}
              <Button
                type="submit"
                disabled={createProductMutation.isPending || redirecting || sessionLoading}
                className="w-full"
              >
                {(createProductMutation.isPending || redirecting) && (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                )}
                {session || sessionLoading ? 'Continue' : 'Sign in with Google to continue'}
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
