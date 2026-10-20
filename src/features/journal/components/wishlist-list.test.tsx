// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { WishlistList } from './wishlist-list';

const products = [
  { id: 'p1', name: 'Uji Gold', brand: null, category: 'matcha' as const },
  { id: 'p2', name: 'Kyoto Bancha', brand: null, category: 'hojicha' as const },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WishlistList', () => {
  it('removes a product from the list', async () => {
    const fake = createFakeBrowserClient({ results: { wishlist: { data: null, error: null } } });
    supabase.current = fake.client;
    render(<WishlistList userId="u1" products={products} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Uji Gold' }));

    expect(screen.queryByRole('link', { name: 'Uji Gold' })).not.toBeInTheDocument();
    expect(fake.calls).toContainEqual({
      table: 'wishlist',
      method: 'eq',
      args: ['product_id', 'p1'],
    });
  });

  it('puts the product back and explains when removing fails', async () => {
    supabase.current = createFakeBrowserClient({
      results: { wishlist: { data: null, error: new Error('rls') } },
    }).client;
    render(<WishlistList userId="u1" products={products} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Uji Gold' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: 'Uji Gold' })).toBeInTheDocument();
  });

  it('explains how to add teas when empty', () => {
    render(<WishlistList userId="u1" products={[]} />);
    expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument();
  });
});
