// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listTasters = vi.fn();

vi.mock('next/server', () => ({ connection: async () => undefined }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/social', () => ({
  InstagramHandleLink: ({ handle }: { handle: string }) => <a href="#ig">@{handle}</a>,
  TrustedTasterBadge: () => <span>Trusted taster</span>,
  listTasters: (...a: unknown[]) => listTasters(...a),
}));

import TastersPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('tasters page', () => {
  it('shows one line, not an empty grid, when there are no tasters', async () => {
    listTasters.mockResolvedValue([]);
    render(await TastersPage());
    expect(screen.getByText('No trusted tasters yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists each taster with bio, handle, count and latest drink', async () => {
    listTasters.mockResolvedValue([
      {
        id: 'u1',
        name: 'Foodcnl',
        bio: 'Hojicha first.',
        instagramHandle: 'foodcnl',
        drinkReviewCount: 1,
        latest: {
          drink: { name: 'Hojicha latte', slug: 'hojicha-latte', cafe: { slug: 'kurasu' } },
        },
      },
      {
        id: 'u2',
        name: 'Newbie',
        bio: null,
        instagramHandle: null,
        drinkReviewCount: 0,
        latest: null,
      },
    ]);
    render(await TastersPage());
    expect(screen.queryByText('No trusted tasters yet.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Foodcnl' })).toHaveAttribute('href', '/u/u1');
    expect(screen.getByText('Hojicha first.')).toBeInTheDocument();
    expect(screen.getByText('@foodcnl')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hojicha latte' })).toHaveAttribute(
      'href',
      '/cafes/kurasu/hojicha-latte'
    );
    expect(screen.getByText(/0 drinks rated/)).toBeInTheDocument();
  });

  // A failed read must reach (public)/error.tsx, which keeps the navbar and offers a retry.
  it('lets a failed read propagate to the route error boundary', async () => {
    listTasters.mockRejectedValue(new Error('down'));
    await expect(TastersPage()).rejects.toThrow('down');
  });
});
