// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/' }));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SignInPromptProvider } from '@/features/auth';

import type { PrepPreset } from '../types';
import { RateProductForm } from './rate-product-form';

const PRODUCT = { id: 'p1', name: 'Uji Ceremonial', brand: null, category: 'matcha' as const };

function setup(
  options: Parameters<typeof createFakeBrowserClient>[0] = {},
  initialStars?: number,
  initialPrep?: PrepPreset
) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  const onLogged = vi.fn();
  renderWithQuery(
    <SignInPromptProvider>
      <RateProductForm
        product={PRODUCT}
        initialStars={initialStars}
        initialPrep={initialPrep}
        onLogged={onLogged}
      />
    </SignInPromptProvider>
  );
  return { ...fake, onLogged };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RateProductForm, signed in', () => {
  it('fills in a recipe’s brew settings when logging from it', async () => {
    const { calls, onLogged } = setup(
      { session: makeSession(), results: { reviews: { data: null, error: null } } },
      undefined,
      { method: 'koicha', doseG: 4, waterMl: 30, waterTempC: 80 }
    );

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      prep_method: 'koicha',
      dose_g: 4,
      water_ml: 30,
      water_temp_c: 80,
    });
  });

  it('requires a star rating', async () => {
    const { calls } = setup({ session: makeSession() });

    await userEvent.click(await screen.findByRole('button', { name: 'Save rating' }));
    expect(await screen.findByText('Pick a rating')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'insert')).toBe(false);
  });

  it('logs the review with photo, then resets and refreshes', async () => {
    const { calls, upload, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.type(screen.getByLabelText('Tasting notes (optional)'), 'nutty');
    await userEvent.upload(
      screen.getByLabelText('Photo (optional)'),
      new File(['x'], 'cup.jpg', { type: 'image/jpeg' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^user-1\//), expect.any(File));
    const insert = calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toMatchObject({
      product_id: 'p1',
      user_id: 'user-1',
      stars: 4,
      notes: 'nutty',
      photo_url: expect.stringMatching(/^https:\/\/cdn\.test\/user-1\//),
    });
    expect(toast.success).toHaveBeenCalledWith('Tasting logged.');
    expect(router.refresh).toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'false');
  });

  it('submits notes, profile and prep', async () => {
    const { calls, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '5 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Umami' }));
    await userEvent.click(screen.getByRole('button', { name: 'Creamy' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Sweetness 3 of 5' }));
    await userEvent.click(screen.getByText('How you made it'));
    await userEvent.click(screen.getByRole('radio', { name: 'Usucha' }));
    await userEvent.type(screen.getByLabelText('Matcha (g)'), '2');
    await userEvent.type(screen.getByLabelText('Water (ml)'), '70');
    await userEvent.type(screen.getByLabelText('Water temp (°C)'), '80');
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      stars: 5,
      flavor_notes: ['umami', 'creamy'],
      sweetness: 3,
      umami: null,
      prep_method: 'usucha',
      dose_g: 2,
      water_ml: 70,
      water_temp_c: 80,
    });
  });

  it('submits the edition: a harvest year and a flush picked from the select', async () => {
    const { calls, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.type(screen.getByLabelText('Harvest year (optional)'), '2025');
    await userEvent.click(screen.getByRole('combobox', { name: 'Flush (optional)' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Autumn flush' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      harvest_year: 2025,
      flush: 'autumn',
    });
  });

  it('puts the flush back to "Not sure" without sending one', async () => {
    const { calls, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    const flush = screen.getByRole('combobox', { name: 'Flush (optional)' });
    await userEvent.click(flush);
    await userEvent.click(await screen.findByRole('option', { name: 'Autumn flush' }));
    await userEvent.click(flush);
    await userEvent.click(await screen.findByRole('option', { name: 'Not sure' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({ flush: null });
  });

  it('opens with stars, notes and the date, then the taste group, then collapsed prep', async () => {
    setup({ session: makeSession() });
    const notes = await screen.findByLabelText('Tasting notes (optional)');
    const date = screen.getByLabelText('Tasted on');
    const taste = screen.getByRole('group', { name: 'What did you taste? (optional)' });
    const prep = screen.getByText('How you made it').closest('details')!;

    expect(date.closest('details')).toBeNull();
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(notes, taste)).toBe(true);
    expect(follows(taste, prep)).toBe(true);
    expect(prep).not.toHaveAttribute('open');
  });

  it('suggests notes in the product’s own category', async () => {
    setup({ session: makeSession() });
    expect(await screen.findByLabelText('Tasting notes (optional)')).toHaveAttribute(
      'placeholder',
      'Creamy, grassy, sweet finish…'
    );
  });

  it('prefills the tasting date with today', async () => {
    setup({ session: makeSession() });
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(await screen.findByLabelText('Tasted on')).toHaveValue(today);
  });

  it('stores a cleared number as null', async () => {
    const { calls, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByText('How you made it'));
    const dose = screen.getByLabelText('Matcha (g)');
    await userEvent.type(dose, '2');
    await userEvent.clear(dose);
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({ dose_g: null });
  });

  it('opens the prep section and shows an inline error for an out-of-range value', async () => {
    const { calls } = setup({ session: makeSession() });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByText('How you made it'));
    await userEvent.type(screen.getByLabelText('Matcha (g)'), '60');
    await userEvent.click(screen.getByText('How you made it'));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    expect(await screen.findByText('Between 0 and 50')).toBeInTheDocument();
    expect(screen.getByText('How you made it').closest('details')).toHaveAttribute('open');
    expect(calls.some((c) => c.method === 'insert')).toBe(false);
  });

  it('clears the prep fields after logging so a second log starts fresh', async () => {
    setup({ session: makeSession(), results: { reviews: { data: null, error: null } } });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByText('How you made it'));
    await userEvent.type(screen.getByLabelText('Water (ml)'), '70');
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(screen.getByLabelText('Water (ml)')).toHaveValue(null));
  });

  it('starts with the star the visitor tapped', async () => {
    const { calls, onLogged } = setup(
      { session: makeSession(), results: { reviews: { data: null, error: null } } },
      4
    );

    expect(await screen.findByRole('radio', { name: '4 stars' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));
    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({ stars: 4 });
  });

  it('still submits with stars only', async () => {
    const { calls, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      stars: 3,
      flavor_notes: [],
      prep_method: null,
      dose_g: null,
    });
  });

  it('keeps the rating and explains when saving fails', async () => {
    setup({
      session: makeSession(),
      results: { reviews: { data: null, error: new Error('rls') } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '5 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not log that tasting. Your rating is still here — try again.'
      )
    );
    expect(screen.getByRole('radio', { name: '5 stars' })).toHaveAttribute('aria-checked', 'true');
  });
});

// Entry points ask for sign-in first, so this covers a session that lapsed mid-form.
describe('RateProductForm, signed out', () => {
  it('asks for sign-in back to this product instead of saving', async () => {
    const { auth, calls } = setup();

    await userEvent.click(await screen.findByRole('radio', { name: '3 stars' }));
    const submit = screen.getByRole('button', { name: 'Save rating' });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);

    expect(await screen.findByRole('dialog', { name: 'Join Matchoji' })).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'insert')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalled());
    const redirect = new URL(auth.signInWithOAuth.mock.calls[0][0].options.redirectTo);
    expect(redirect.pathname).toBe('/auth/callback');
    expect(redirect.searchParams.get('next')).toBe('/products/p1#rate');
  });
});
