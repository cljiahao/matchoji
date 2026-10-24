'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomFormField } from '@/components/widgets';
import { useSession, useSignInPrompt } from '@/features/auth';
import type { ProductSummary } from '@/features/products';

import { useLogReview } from '../hooks/use-log-review.mutation';
import { useUpdateReview } from '../hooks/use-update-review.mutation';
import { localToday } from '../lib';
import { FLUSHES, FLUSH_LABELS, TASTE_ATTRIBUTES } from '../lib/tasting-vocab';
import { reviewSchemaFor, type ReviewInput, type ReviewOutput } from '../schemas/review.schema';
import type { Review } from '../types';
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
function emptyReview(stars = 0): ReviewInput {
  return {
    stars,
    notes: '',
    flavorNotes: [],
    doseG: '',
    waterMl: '',
    waterTempC: '',
    harvestYear: '',
    tastedOn: localToday(),
  };
}

// An existing tasting as form values, for editing it.
function fromReview(review: Review): ReviewInput {
  return {
    stars: review.stars,
    notes: review.notes ?? '',
    flavorNotes: review.flavorNotes,
    sweetness: review.profile.sweetness,
    umami: review.profile.umami,
    bitterness: review.profile.bitterness,
    body: review.profile.body,
    prepMethod: review.prep.method ?? undefined,
    doseG: review.prep.doseG ?? '',
    waterMl: review.prep.waterMl ?? '',
    waterTempC: review.prep.waterTempC ?? '',
    harvestYear: review.edition.harvestYear ?? '',
    flush: review.edition.flush ?? undefined,
    tastedOn: review.tastedOn,
  };
}

interface RateProductFormProps {
  product: ProductSummary;
  // Set when the visitor opened the form by tapping a star.
  initialStars?: number;
  // Set to edit this tasting instead of logging a new one.
  review?: Review;
  onLogged?: () => void;
}

// Opened only for signed-in visitors (the entry points ask for sign-in first). A session
// that lapses while the form is open sends the visitor to sign in rather than failing.
export function RateProductForm({ product, initialStars, review, onLogged }: RateProductFormProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const router = useRouter();
  const logReviewMutation = useLogReview();
  const updateReviewMutation = useUpdateReview();

  const form = useForm<ReviewInput, unknown, ReviewOutput>({
    resolver: zodResolver(reviewSchemaFor(product.category)),
    defaultValues: review ? fromReview(review) : emptyReview(initialStars),
  });

  async function handleSubmit(values: ReviewOutput) {
    if (!session) {
      promptSignIn({ nextPath: `/products/${product.id}#rate` });
      return;
    }

    if (review) {
      try {
        await updateReviewMutation.mutateAsync({
          ...values,
          reviewId: review.id,
          userId: session.user.id,
          currentPhotoUrl: review.photoUrl,
          photo,
        });
        toast.success('Tasting updated.');
        onLogged?.();
        router.refresh();
      } catch {
        toast.error('Could not save your changes. Try again.');
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

  const pending = logReviewMutation.isPending || updateReviewMutation.isPending;

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

        <div className="grid grid-cols-2 gap-4">
          <CustomFormField name="harvestYear" label="Harvest year (optional)">
            <Input type="number" inputMode="numeric" placeholder="e.g. 2025" />
          </CustomFormField>
          <CustomFormField name="flush" label="Flush (optional)">
            <select className="border-input bg-card h-9 w-full rounded-md border px-3 text-sm">
              <option value="">Not sure</option>
              {FLUSHES.map((flush) => (
                <option key={flush} value={flush}>
                  {FLUSH_LABELS[flush]}
                </option>
              ))}
            </select>
          </CustomFormField>
        </div>

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
              {photo?.name ?? (review?.photoUrl ? 'Replace your photo' : 'Add a photo of your cup')}
            </span>
          </label>
        </div>

        <Button type="submit" size="lg" disabled={pending || sessionLoading} className="w-full">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {review ? 'Save changes' : 'Save rating'}
        </Button>
      </form>
    </Form>
  );
}
