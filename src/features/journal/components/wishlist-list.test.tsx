// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({ usePathname: () => '/journal' }));

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { WishlistList } from './wishlist-list';

const products = [
  { id: 'p1', name: 'Uji Gold', brand: null, category: 'matcha' as const },
  { id: 'p2', name: 'Kyoto Bancha', brand: null, category: 'hojicha' as const },
];
const saved = { data: [{ product_id: 'p1' }, { product_id: 'p2' }], error: null };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WishlistList', () => {
  it('removes a product through the shared wishlist state', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: { wishlist: [saved, { data: null, error: null }] },
    });
    supabase.current = fake.client;
    renderWithQuery(<WishlistList products={products} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove Uji Gold' })).toBeEnabled()
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Uji Gold' }));

    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Uji Gold' })).not.toBeInTheDocument()
    );
    expect(fake.calls).toContainEqual({
      table: 'wishlist',
      method: 'eq',
      args: ['product_id', 'p1'],
    });
  });

  it('puts the product back in its place and explains when removing fails', async () => {
    supabase.current = createFakeBrowserClient({
      session: makeSession(),
      results: { wishlist: [saved, { data: null, error: new Error('rls') }] },
    }).client;
    renderWithQuery(<WishlistList products={products} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove Uji Gold' })).toBeEnabled()
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Uji Gold' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Uji Gold', 'Kyoto Bancha']);
  });

  it('explains how to add teas when empty', () => {
    supabase.current = createFakeBrowserClient({ session: makeSession() }).client;
    renderWithQuery(<WishlistList products={[]} />);
    expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument();
  });
});

describe('WishlistList while the session loads', () => {
  it('keeps showing the server list instead of flashing empty', () => {
    const fake = createFakeBrowserClient({ session: makeSession() });
    fake.auth.getSession.mockImplementationOnce(() => new Promise(() => {}));
    supabase.current = fake.client;
    renderWithQuery(<WishlistList products={products} />);
    expect(screen.getByRole('link', { name: 'Uji Gold' })).toBeInTheDocument();
  });
});
