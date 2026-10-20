'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomFormField } from '@/components/widgets';
import { signInWithGoogle, useSession } from '@/features/auth';
import type { ProductSummary } from '@/features/products';

import { useLogReview } from '../hooks/use-log-review.mutation';
import {
  clearReviewDraft,
  draftForCategory,
  loadReviewDraft,
  localToday,
  saveReviewDraft,
} from '../lib';
import { TASTE_ATTRIBUTES } from '../lib/tasting-vocab';
import { reviewSchemaFor, type ReviewInput, type ReviewOutput } from '../schemas/review.schema';
import { FlavorNotePicker } from './flavor-note-picker';
import { PrepFields } from './prep-fields';
import { StarRatingInput } from './star-rating-input';
import { TasteProfileInput } from './taste-profile-input';

const NOTES_PLACEHOLDER = {
  matcha: 'Creamy, grassy, sweet finish…',
  hojicha: 'Toasty, nutty, smooth…',
} as const;

// Every field the form renders gets a defined value, so inputs stay controlled and a reset
// after logging actually clears them on screen.
function emptyReview(): ReviewInput {
  return {
    stars: 0,
    notes: '',
    flavorNotes: [],
    doseG: '',
    waterMl: '',
    waterTempC: '',
    tastedOn: localToday(),
  };
}

interface RateProductFormProps {
  product: ProductSummary;
  onLogged?: () => void;
}

// Signed-out visitors fill in the same form; submitting validates, parks the draft, and
// sends them through Google sign-in back to this product, where the draft is restored.
export function RateProductForm({ product, onLogged }: RateProductFormProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const { session, isLoading: sessionLoading } = useSession();
  const router = useRouter();
  const logReviewMutation = useLogReview();

  const form = useForm<ReviewInput, unknown, ReviewOutput>({
    resolver: zodResolver(reviewSchemaFor(product.category)),
    defaultValues: emptyReview(),
  });

  useEffect(() => {
    const draft = loadReviewDraft(product.id);
    if (!draft) return;
    form.reset({ ...emptyReview(), ...draftForCategory(draft, product.category) });
    clearReviewDraft(product.id);
    toast.info('Your rating is back. Add your photo again if you had one.');
  }, [form, product.id, product.category]);

  async function handleSubmit(values: ReviewOutput) {
    if (!session) {
      saveReviewDraft(product.id, values);
      setRedirecting(true);
      const { error } = await signInWithGoogle(`/products/${product.id}#rate`);
      if (error) {
        setRedirecting(false);
        toast.error('Could not reach Google sign-in. Check your connection and try again.');
      }
      return;
    }

    try {
      await logReviewMutation.mutateAsync({
        ...values,
        productId: product.id,
        userId: session.user.id,
        photo,
      });
      toast.success('Tasting logged.');
      form.reset(emptyReview());
      setPhoto(null);
      onLogged?.();
      router.refresh();
    } catch {
      toast.error('Could not log that tasting. Your rating is still here — try again.');
    }
  }

  const pending = logReviewMutation.isPending || redirecting;

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <CustomFormField name="stars" label="Rating">
          <StarRatingInput category={product.category} />
        </CustomFormField>
        <CustomFormField name="notes" label="Tasting notes (optional)">
          <Textarea placeholder={NOTES_PLACEHOLDER[product.category]} />
        </CustomFormField>
        <CustomFormField name="tastedOn" label="Tasted on">
          <Input type="date" max={localToday()} className="w-44" />
        </CustomFormField>

        <fieldset className="border-border space-y-4 border-t pt-4">
          <legend className="float-left mb-3 w-full text-sm font-medium">
            What did you taste? (optional)
          </legend>
          <CustomFormField name="flavorNotes" label="Flavour notes">
            <FlavorNotePicker category={product.category} />
          </CustomFormField>
          <div role="group" aria-labelledby="taste-profile-label" className="space-y-1">
            <p id="taste-profile-label" className="mb-2 text-sm font-medium">
              Taste profile
            </p>
            {TASTE_ATTRIBUTES.map((attribute) => (
              <Controller
                key={attribute}
                name={attribute}
                control={form.control}
                render={({ field }) => (
                  <TasteProfileInput
                    attribute={attribute}
                    category={product.category}
                    value={field.value as number | undefined}
                    onChange={field.onChange}
                  />
                )}
              />
            ))}
          </div>
        </fieldset>

        <PrepFields category={product.category} />

        <div className="space-y-2">
          <Label htmlFor="photo">Photo (optional)</Label>
          {/* The native control is visually hidden: its "Choose File / No file chosen" chrome
              can't be themed, so a styled label stands in and shows the chosen name. */}
          <input
            id="photo"
            type="file"
            accept="image/*"
            className="peer sr-only"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="photo"
            className="border-input bg-card peer-focus-visible:ring-ring flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm peer-focus-visible:ring-2"
          >
            <ImagePlus aria-hidden="true" className="text-muted-foreground h-4 w-4" />
            <span className={photo ? 'truncate' : 'text-muted-foreground'}>
              {photo ? photo.name : 'Add a photo of your cup'}
            </span>
          </label>
        </div>

        {!sessionLoading && !session && (
          <p className="text-muted-foreground text-sm">
            You&rsquo;ll sign in with Google first. Your rating is kept while you do.
          </p>
        )}
        <Button type="submit" disabled={pending || sessionLoading} className="w-full">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {session || sessionLoading ? 'Submit rating' : 'Sign in with Google to submit'}
        </Button>
      </form>
    </Form>
  );
}
