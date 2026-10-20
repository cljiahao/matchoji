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

import { WantToTryButton } from './want-to-try-button';

function setup(options: Parameters<typeof createFakeBrowserClient>[0]) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  renderWithQuery(<WantToTryButton productId="p1" />);
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WantToTryButton', () => {
  it('toggles saved state', async () => {
    const { calls } = setup({
      session: makeSession(),
      results: {
        wishlist: [
          { data: null, error: null },
          { data: null, error: null },
          { data: null, error: null },
        ],
      },
    });

    const button = await screen.findByRole('button', { name: 'Want to try' });
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    await userEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
    expect(calls.some((c) => c.table === 'wishlist' && c.method === 'upsert')).toBe(true);

    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(calls.some((c) => c.table === 'wishlist' && c.method === 'delete')).toBe(true);
  });

  it('shows an already-saved product as pressed', async () => {
    setup({
      session: makeSession(),
      results: { wishlist: { data: { product_id: 'p1' }, error: null } },
    });
    const button = await screen.findByRole('button', { name: 'Want to try' });
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  });

  it('rolls back and explains when saving fails', async () => {
    setup({
      session: makeSession(),
      results: {
        wishlist: [
          { data: null, error: null },
          { data: null, error: new Error('rls') },
        ],
      },
    });

    const button = await screen.findByRole('button', { name: 'Want to try' });
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    await userEvent.click(button);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not update your list. Try again.')
    );
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('signed out starts sign-in back to the product', async () => {
    const { auth, calls } = setup({});

    await userEvent.click(await screen.findByRole('button', { name: 'Want to try' }));

    await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalled());
    const next = new URL(auth.signInWithOAuth.mock.calls[0][0].options.redirectTo).searchParams;
    expect(next.get('next')).toBe('/products/p1');
    expect(calls.some((c) => c.table === 'wishlist')).toBe(false);
  });
});
