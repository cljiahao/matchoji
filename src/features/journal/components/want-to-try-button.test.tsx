// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({ usePathname: () => '/products/p1' }));

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SignInPromptProvider } from '@/features/auth';

import { WantToTryButton } from './want-to-try-button';

function setup(options: Parameters<typeof createFakeBrowserClient>[0], compact = false) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  renderWithQuery(<WantToTryButton productId="p1" compact={compact} />);
  return fake;
}

const saved = (ids: string[]) => ({ data: ids.map((product_id) => ({ product_id })), error: null });
const ok = { data: null, error: null };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WantToTryButton', () => {
  it('toggles saved state with one shared list query', async () => {
    const { calls } = setup({ session: makeSession(), results: { wishlist: [saved([]), ok, ok] } });

    const button = await screen.findByRole('button', { name: 'Want to try' });
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
    expect(calls.some((c) => c.method === 'upsert')).toBe(true);

    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(calls.some((c) => c.method === 'delete')).toBe(true);
    expect(calls.filter((c) => c.method === 'select')).toHaveLength(1);
  });

  it('shows an already-saved product as pressed', async () => {
    setup({ session: makeSession(), results: { wishlist: saved(['p1']) } });
    const button = await screen.findByRole('button', { name: 'Want to try' });
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  });

  it('flips immediately, then rolls back and explains when saving fails', async () => {
    let fail: (r: { data: null; error: Error }) => void = () => {};
    const write = new Promise<{ data: null; error: Error }>((resolve) => (fail = resolve));
    setup({ session: makeSession(), results: { wishlist: [saved([]), write] } });

    const button = await screen.findByRole('button', { name: 'Want to try' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));

    fail({ data: null, error: new Error('rls') });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not update your list. Try again.')
    );
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('signed out opens the sign-in prompt, then starts sign-in back to the product', async () => {
    const fake = createFakeBrowserClient({});
    supabase.current = fake.client;
    renderWithQuery(
      <SignInPromptProvider>
        <WantToTryButton productId="p1" />
      </SignInPromptProvider>
    );

    const button = await screen.findByRole('button', { name: 'Want to try' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);

    expect(await screen.findByText('Sign in to save teas you want to try.')).toBeInTheDocument();
    expect(fake.auth.signInWithOAuth).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => expect(fake.auth.signInWithOAuth).toHaveBeenCalled());
    const next = new URL(fake.auth.signInWithOAuth.mock.calls[0][0].options.redirectTo)
      .searchParams;
    expect(next.get('next')).toBe('/products/p1');
    expect(fake.calls.some((c) => c.table === 'wishlist')).toBe(false);
  });

  // A tap before the session resolves must not send a signed-in user to Google.
  it('is disabled while the session is still loading', async () => {
    const fake = createFakeBrowserClient({ session: makeSession() });
    fake.auth.getSession.mockImplementationOnce(() => new Promise(() => {}));
    supabase.current = fake.client;
    renderWithQuery(<WantToTryButton productId="p1" />);

    expect(screen.getByRole('button', { name: 'Want to try' })).toBeDisabled();
    expect(fake.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('has an icon-only compact form with the same name', async () => {
    setup({ session: makeSession(), results: { wishlist: saved([]) } }, true);
    const button = await screen.findByRole('button', { name: 'Want to try' });
    expect(button).not.toHaveTextContent('Want to try');
  });
});
