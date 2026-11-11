import type { SupabaseClient } from '@supabase/supabase-js';

import { RowNotChangedError, localToday } from '@/features/reviews';
import type { Database } from '@/integrations/supabase/database.types';

import type { CafeOutput } from '../schemas/cafe.schema';
import type { DrinkReviewOutput } from '../schemas/drink-review.schema';
import type { DrinkOutput } from '../schemas/drink.schema';
import type { Cafe, Drink } from '../types';
import { CAFE_COLUMNS, DRINK_COLUMNS, toCafe, toDrink } from './cafes-service';

type Client = SupabaseClient<Database>;

// An error whose message is written for the person, not the logs.
export class FriendlyError extends Error {
  override name = 'FriendlyError';
}

interface DbError {
  code?: string;
  message?: string;
  details?: string;
}

// Postgres names the violated index in the message ('duplicate key value violates unique
// constraint "…"'); PostgREST may also carry it in details.
function isUniqueViolation(error: DbError, constraint: string): boolean {
  return (
    error.code === '23505' && `${error.message ?? ''} ${error.details ?? ''}`.includes(constraint)
  );
}

// limit_pending_rows raises P0001 "You have too many … waiting for review."
function isPendingCap(error: DbError): boolean {
  return error.code === 'P0001' && /waiting for review/.test(error.message ?? '');
}

// limit_daily_submissions raises P0001 "That is a lot for one day…".
function isDailyCap(error: DbError): boolean {
  return error.code === 'P0001' && /lot for one day/.test(error.message ?? '');
}

export const DAILY_LIMIT_MESSAGE = "You've hit today's limit for adding. Try again tomorrow.";
export const CAFE_EXISTS_MESSAGE = 'This café is already listed. Search for it instead.';
export const PENDING_CAFES_MESSAGE =
  "You have too many cafés waiting for review. Try again once they're approved.";
export const PENDING_DRINKS_MESSAGE =
  "You have too many drinks waiting for review. Try again once they're approved.";

// The new row comes straight back: the adder may read their own pending café, so the flow can
// go on to the drinks step without waiting for approval. The slug is the database's.
export async function createCafe(supabase: Client, input: CafeOutput): Promise<Cafe> {
  const { data, error } = await supabase
    .from('cafes')
    .insert({
      name: input.name,
      city_slug: input.citySlug,
      area: input.area ?? null,
      address: input.address ?? null,
      instagram_handle: input.instagramHandle ?? null,
      website_url: input.websiteUrl ?? null,
    })
    .select(CAFE_COLUMNS)
    .single();
  if (error) {
    if (isPendingCap(error)) throw new FriendlyError(PENDING_CAFES_MESSAGE);
    if (isDailyCap(error)) throw new FriendlyError(DAILY_LIMIT_MESSAGE);
    // Only the live-café name index means "already listed"; any other unique violation is a
    // real fault and must not read as a duplicate.
    if (isUniqueViolation(error, 'cafes_city_name_area_key')) {
      throw new FriendlyError(CAFE_EXISTS_MESSAGE);
    }
    throw error;
  }
  return toCafe(data);
}

export async function createDrink(supabase: Client, input: DrinkOutput): Promise<Drink> {
  const { data, error } = await supabase
    .from('drinks')
    .insert({
      cafe_id: input.cafeId,
      name: input.name,
      base: input.base,
      style: input.style,
      serving: input.serving,
      price: input.price ?? null,
    })
    .select(DRINK_COLUMNS)
    .single();
  if (error) {
    if (isPendingCap(error)) throw new FriendlyError(PENDING_DRINKS_MESSAGE);
    if (isDailyCap(error)) throw new FriendlyError(DAILY_LIMIT_MESSAGE);
    if (isUniqueViolation(error, 'drinks_cafe_name_key')) {
      throw new FriendlyError('That drink is already listed at this café. Search for it instead.');
    }
    throw error;
  }
  return toDrink(data);
}

export interface DrinkReviewWrite extends DrinkReviewOutput {
  photoUrl?: string;
}

interface CreateDrinkReviewInput extends DrinkReviewWrite {
  userId: string;
}

// instagram_url and disclosure go as sent: the database stamps who is a trusted taster and
// refuses the fields from anyone else, so the client never decides that.
export async function createDrinkReview(
  supabase: Client,
  drinkId: string,
  input: CreateDrinkReviewInput
): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    drink_id: drinkId,
    user_id: input.userId,
    stars: input.stars,
    notes: input.notes ?? null,
    photo_url: input.photoUrl ?? null,
    flavor_notes: input.flavorNotes ?? [],
    sweetness: input.sweetness ?? null,
    body: input.body ?? null,
    bitterness: input.bitterness ?? null,
    tea_strength: input.teaStrength ?? null,
    roast: input.roast ?? null,
    instagram_url: input.instagramUrl ?? null,
    disclosure: input.disclosure ?? 'none',
    // The taster's own date: the column default is the database's (UTC) day.
    tasted_on: input.tastedOn ?? localToday(),
  });
  if (error) throw error;
}

// RLS lets only the author update; which drink it is and who wrote it are not editable.
export async function updateDrinkReview(
  supabase: Client,
  reviewId: string,
  input: DrinkReviewWrite
): Promise<void> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      stars: input.stars,
      notes: input.notes ?? null,
      photo_url: input.photoUrl ?? null,
      flavor_notes: input.flavorNotes ?? [],
      sweetness: input.sweetness ?? null,
      body: input.body ?? null,
      bitterness: input.bitterness ?? null,
      tea_strength: input.teaStrength ?? null,
      roast: input.roast ?? null,
      instagram_url: input.instagramUrl ?? null,
      disclosure: input.disclosure ?? 'none',
      tasted_on: input.tastedOn ?? localToday(),
    })
    .eq('id', reviewId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new RowNotChangedError('Drink review not updated.');
}

export const REVIEW_DENIED_MESSAGE =
  "You can't rate this drink right now. It may not be open for ratings yet, or your session has lapsed.";
export const REVIEW_INVALID_MESSAGE =
  'Some of those answers are not allowed. Check the fields and try again.';
export const REVIEW_GONE_MESSAGE =
  'That rating could not be changed. It may have been removed; refresh and try again.';

// The words shown when saving a drink rating fails. Anything unrecognised gets the generic
// line, so a raw database message never reaches the page.
export function drinkReviewErrorMessage(error: unknown): string {
  if (error instanceof FriendlyError) return error.message;
  if (error instanceof RowNotChangedError) return REVIEW_GONE_MESSAGE;
  const code = (error as DbError | null)?.code;
  // 42501: row-level security refused the write.
  if (code === '42501') return REVIEW_DENIED_MESSAGE;
  // 23514: a check constraint refused a value.
  if (code === '23514') return REVIEW_INVALID_MESSAGE;
  return 'Could not save that rating. Your answers are still here — try again.';
}
