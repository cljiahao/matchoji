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

import { RateProductForm } from './rate-product-form';

const PRODUCT = { id: 'p1', name: 'Uji Ceremonial', brand: null, category: 'matcha' as const };

function setup(options: Parameters<typeof createFakeBrowserClient>[0] = {}) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  const onLogged = vi.fn();
  renderWithQuery(<RateProductForm product={PRODUCT} onLogged={onLogged} />);
  return { ...fake, onLogged };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('RateProductForm, signed in', () => {
  it('requires a star rating', async () => {
    const { calls } = setup({ session: makeSession() });

    await userEvent.click(await screen.findByRole('button', { name: 'Submit rating' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));

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
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));

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
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({ dose_g: null });
  });

  it('opens the prep section and shows an inline error for an out-of-range value', async () => {
    const { calls } = setup({ session: makeSession() });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByText('How you made it'));
    await userEvent.type(screen.getByLabelText('Matcha (g)'), '60');
    await userEvent.click(screen.getByText('How you made it'));
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));

    expect(await screen.findByText('Between 0 and 50')).toBeInTheDocument();
    expect(screen.getByText('How you made it').closest('details')).toHaveAttribute('open');
    expect(calls.some((c) => c.method === 'insert')).toBe(false);
  });

  it('clears the prep fields after logging so a second log starts fresh', async () => {
    setup({ session: makeSession(), results: { reviews: { data: null, error: null } } });

    await userEvent.click(await screen.findByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByText('How you made it'));
    await userEvent.type(screen.getByLabelText('Water (ml)'), '70');
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));

    await waitFor(() => expect(screen.getByLabelText('Water (ml)')).toHaveValue(null));
  });

  it('restores a stale draft without a note from the other category', async () => {
    sessionStorage.setItem(
      'matchoji:review-draft:p1',
      JSON.stringify({ stars: 3, flavorNotes: ['roasty', 'umami'] })
    );
    const { calls, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Umami' })).toHaveAttribute('aria-pressed', 'true')
    );
    expect(screen.getByText('1 of 6')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));
    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      flavor_notes: ['umami'],
    });
  });

  it('still submits with stars only', async () => {
    const { calls, onLogged } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await userEvent.click(await screen.findByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));

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
    await userEvent.click(screen.getByRole('button', { name: 'Submit rating' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not log that tasting. Your rating is still here — try again.'
      )
    );
    expect(screen.getByRole('radio', { name: '5 stars' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('RateProductForm, signed out', () => {
  it('parks the draft and sends the user through Google sign-in back to this product', async () => {
    const { auth } = setup();

    expect(await screen.findByText(/sign in with Google first/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google to submit' }));

    await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalled());
    expect(JSON.parse(sessionStorage.getItem('matchoji:review-draft:p1')!)).toMatchObject({
      stars: 3,
    });
    const { options } = auth.signInWithOAuth.mock.calls[0][0];
    const redirect = new URL(options.redirectTo);
    expect(redirect.pathname).toBe('/auth/callback');
    expect(redirect.searchParams.get('next')).toBe('/products/p1#rate');
  });

  it('re-enables the form and toasts when Google sign-in cannot start', async () => {
    const { auth } = setup();
    auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: new Error('offline') });

    await userEvent.click(await screen.findByRole('radio', { name: '3 stars' }));
    const submit = screen.getByRole('button', { name: 'Sign in with Google to submit' });
    await userEvent.click(submit);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not reach Google sign-in. Check your connection and try again.'
      )
    );
    expect(submit).toBeEnabled();
  });

  it('restores a parked draft on return and clears it', async () => {
    sessionStorage.setItem(
      'matchoji:review-draft:p1',
      JSON.stringify({ stars: 2, notes: 'grassy' })
    );
    setup({ session: makeSession() });

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true')
    );
    expect(screen.getByLabelText('Tasting notes (optional)')).toHaveValue('grassy');
    expect(toast.info).toHaveBeenCalled();
    expect(sessionStorage.getItem('matchoji:review-draft:p1')).toBeNull();
  });
});
