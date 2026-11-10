'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomFormField } from '@/components/widgets';
import { useSession, useSignInPrompt } from '@/features/auth';
import { FlavorNotePicker, StarRatingInput, localToday, type Review } from '@/features/reviews';
import type { DrinkBase } from '@/integrations/supabase/database.types';

import { FriendlyError } from '../api/cafes-mutations';
import { useLogDrinkReview } from '../hooks/use-log-drink-review.mutation';
import { useUpdateDrinkReview } from '../hooks/use-update-drink-review.mutation';
import {
  drinkReviewSchemaFor,
  type DrinkReviewInput,
  type DrinkReviewOutput,
} from '../schemas/drink-review.schema';
import { DisclosureRadios } from './disclosure-radios';
import { ScaleInput } from './scale-input';

type ScaleName = 'sweetness' | 'body' | 'bitterness' | 'teaStrength' | 'roast';

interface DrinkReviewFormProps {
  drink: { id: string; name: string; base: DrinkBase };
  // Trusted tasters post an Instagram link and a disclosure with every drink review.
  isTaster: boolean;
  // Set to edit this review instead of logging a new one.
  review?: Review;
  onLogged?: () => void;
}

// Every field gets a defined value so inputs stay controlled. Disclosure is left unset: the
// taster has to choose it.
function emptyReview(isTaster: boolean): DrinkReviewInput {
  return {
    stars: 0,
    notes: '',
    flavorNotes: [],
    tastedOn: localToday(),
    ...(isTaster ? { instagramUrl: '' } : {}),
  };
}

function fromReview(review: Review): DrinkReviewInput {
  return {
    stars: review.stars,
    notes: review.notes ?? '',
    flavorNotes: review.flavorNotes,
    sweetness: review.profile.sweetness,
    body: review.profile.body,
    bitterness: review.profile.bitterness,
    teaStrength: review.teaStrength ?? undefined,
    roast: review.roast ?? undefined,
    tastedOn: review.tastedOn,
    instagramUrl: review.instagramUrl ?? '',
    disclosure: review.instagramUrl ? review.disclosure : undefined,
  };
}

// Opened only for signed-in visitors; a session that lapses mid-form sends them to sign in.
export function DrinkReviewForm({ drink, isTaster, review, onLogged }: DrinkReviewFormProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const { session, isLoading: sessionLoading } = useSession();
  const promptSignIn = useSignInPrompt();
  const router = useRouter();
  const logReview = useLogDrinkReview();
  const updateReview = useUpdateDrinkReview();

  const resolver = useMemo(
    () => zodResolver(drinkReviewSchemaFor({ isTaster, base: drink.base })),
    [isTaster, drink.base]
  );
  const form = useForm<DrinkReviewInput, unknown, DrinkReviewOutput>({
    resolver,
    defaultValues: review ? fromReview(review) : emptyReview(isTaster),
  });

  async function handleSubmit(values: DrinkReviewOutput) {
    if (!session) {
      promptSignIn({ reason: 'Sign in to rate café drinks.' });
      return;
    }
    try {
      if (review) {
        await updateReview.mutateAsync({
          ...values,
          reviewId: review.id,
          userId: session.user.id,
          currentPhotoUrl: review.photoUrl,
          photo,
        });
        toast.success('Rating updated.');
      } else {
        await logReview.mutateAsync({
          ...values,
          drinkId: drink.id,
          userId: session.user.id,
          photo,
        });
        toast.success('Rating saved.');
        form.reset(emptyReview(isTaster));
        setPhoto(null);
      }
      onLogged?.();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof FriendlyError
          ? error.message
          : 'Could not save that rating. Your answers are still here — try again.'
      );
    }
  }

  const pending = logReview.isPending || updateReview.isPending;

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <CustomFormField name="stars" label="Rating">
          <StarRatingInput category={drink.base} />
        </CustomFormField>
        <CustomFormField name="notes" label="Tasting notes (optional)">
          <Textarea placeholder="Creamy, not too sweet…" />
        </CustomFormField>
        <CustomFormField name="tastedOn" label="Tasted on">
          <Input type="date" max={localToday()} className="h-10 w-44" />
        </CustomFormField>

        <fieldset className="border-border space-y-4 border-t pt-4">
          <legend className="float-left mb-1 w-full text-sm font-medium">
            What did you taste? (optional)
          </legend>
          <CustomFormField name="flavorNotes" label="Flavour notes">
            <FlavorNotePicker category={drink.base} />
          </CustomFormField>
          <div role="group" aria-labelledby="drink-scales-label" className="space-y-1">
            <p id="drink-scales-label" className="mb-2 text-sm font-medium">
              How it tasted
            </p>
            <ScaleField name="sweetness" label="Sweetness" />
            <ScaleField name="body" label="Body" />
            <ScaleField name="bitterness" label="Bitterness" />
            <ScaleField name="teaStrength" label="Tea strength" />
            {drink.base === 'hojicha' && <ScaleField name="roast" label="Roast" />}
          </div>
        </fieldset>

        {isTaster && (
          <fieldset className="border-border space-y-4 border-t pt-4">
            <legend className="float-left mb-1 w-full text-sm font-medium">
              Your Instagram post
            </legend>
            <CustomFormField name="instagramUrl" label="Post or reel link">
              <Input
                className="h-10"
                inputMode="url"
                autoCapitalize="none"
                placeholder="https://www.instagram.com/p/…"
              />
            </CustomFormField>
            <Controller
              name="disclosure"
              control={form.control}
              render={({ field: { ref, value, onChange, onBlur }, fieldState }) => (
                <div className="space-y-2">
                  <DisclosureRadios
                    ref={ref}
                    legend="Was this drink gifted, paid or invited?"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </div>
              )}
            />
          </fieldset>
        )}

        <div className="space-y-2">
          <Label htmlFor="drink-photo">Photo (optional)</Label>
          <input
            id="drink-photo"
            type="file"
            accept="image/*"
            className="peer sr-only"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="drink-photo"
            className="border-input bg-card peer-focus-visible:ring-ring flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm peer-focus-visible:ring-2"
          >
            <ImagePlus aria-hidden="true" className="text-muted-foreground h-4 w-4" />
            <span className={photo ? 'truncate' : 'text-muted-foreground'} title={photo?.name}>
              {photo?.name ??
                (review?.photoUrl ? 'Replace your photo' : 'Add a photo of your drink')}
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

function ScaleField({ name, label }: { name: ScaleName; label: string }) {
  const { control } = useFormContext<DrinkReviewInput>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <ScaleInput
          label={label}
          value={typeof field.value === 'number' ? field.value : undefined}
          onChange={field.onChange}
        />
      )}
    />
  );
}
