'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CustomFormField } from '@/components/widgets';
import { SignInButton, useSession } from '@/features/auth';
import { productSchema, type ProductOutput, type ProductSummary } from '@/features/products';

import { useCreateProduct } from '../hooks/use-create-product.mutation';
import { useLogReview } from '../hooks/use-log-review.mutation';
import { useRegions } from '../hooks/use-regions.query';
import { reviewSchema, type ReviewOutput } from '../schemas/review.schema';
import { ProductSearchCombobox } from './product-search-combobox';
import { StarRatingInput } from './star-rating-input';

type Step = 'search' | 'add-product' | 'rate';

interface LogTastingDialogProps {
  initialProduct?: ProductSummary;
  trigger?: ReactNode;
}

export function LogTastingDialog({ initialProduct, trigger }: LogTastingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(initialProduct ? 'rate' : 'search');
  const [product, setProduct] = useState<ProductSummary | undefined>(initialProduct);
  const [query, setQuery] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const { session } = useSession();
  const router = useRouter();
  const { data: regions } = useRegions();
  const createProductMutation = useCreateProduct();
  const logReviewMutation = useLogReview();

  const productForm = useForm<ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: query, category: 'matcha' },
  });

  const reviewForm = useForm<ReviewOutput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { stars: 0, notes: '' },
  });

  function reset() {
    setStep(initialProduct ? 'rate' : 'search');
    setProduct(initialProduct);
    setQuery('');
    setPhoto(null);
    productForm.reset();
    reviewForm.reset({ stars: 0, notes: '' });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleAddProductSubmit(values: ProductOutput) {
    try {
      const created = await createProductMutation.mutateAsync(values);
      setProduct(created);
      setStep('rate');
    } catch {
      toast.error('Could not add that product. Please try again.');
    }
  }

  async function handleReviewSubmit(values: ReviewOutput) {
    if (!session || !product) return;

    try {
      await logReviewMutation.mutateAsync({
        ...values,
        productId: product.id,
        userId: session.user.id,
        photo,
      });
      toast.success('Tasting logged.');
      handleOpenChange(false);
      router.refresh();
    } catch {
      toast.error('Could not log that tasting. Please try again.');
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
              productForm.setValue('name', query);
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
              <CustomFormField name="brand" label="Brand" description="Optional">
                <Input />
              </CustomFormField>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select
                  onValueChange={(v) => productForm.setValue('category', v as 'matcha' | 'hojicha')}
                  defaultValue={productForm.getValues('category')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matcha">Matcha</SelectItem>
                    <SelectItem value="hojicha">Hojicha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CustomFormField name="grade" label="Grade" description="Optional">
                <Input />
              </CustomFormField>
              {regions && regions.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Region (optional)</label>
                  <Select onValueChange={(v) => productForm.setValue('regionId', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={createProductMutation.isPending} className="w-full">
                Continue
              </Button>
            </form>
          </Form>
        )}

        {step === 'rate' && product && (
          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(handleReviewSubmit)} className="space-y-4">
              <CustomFormField name="stars" label="Rating">
                <StarRatingInput />
              </CustomFormField>
              <CustomFormField name="notes" label="Tasting notes" description="Optional">
                <Textarea placeholder="Toasty, nutty, smooth…" />
              </CustomFormField>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Photo (optional)</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </div>

              {session ? (
                <Button type="submit" disabled={logReviewMutation.isPending} className="w-full">
                  Submit rating
                </Button>
              ) : (
                <div className="space-y-2 text-center">
                  <p className="text-muted-foreground text-sm">Sign in to submit your rating.</p>
                  <SignInButton />
                </div>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
