// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeEntry } from '../../../../../../test/support/journal';

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  entries: [] as unknown[],
  isPublic: true,
  listMyReviews: vi.fn(),
}));

vi.mock('next/server', () => ({ connection: async () => {} }));
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock('@/features/auth', () => ({ SignInButton: () => <button>Sign in</button> }));
vi.mock('@/features/journal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/journal')>()),
  listMyReviews: (...a: unknown[]) => state.listMyReviews(...a),
  isProfilePublic: async () => state.isPublic,
}));

import YearPage, { generateMetadata } from './page';

const params = (year: string) => ({ params: Promise.resolve({ year }) });
const entries = (n: number, year = 2026) =>
  Array.from({ length: n }, (_, i) =>
    makeEntry({
      id: `r${i}`,
      tastedOn: `${year}-0${i + 1}-01`,
      product: { id: `p${i}`, name: `Tea ${i}` },
    })
  );

beforeEach(() => {
  state.user = { id: 'u1' };
  state.isPublic = true;
  state.listMyReviews.mockReset();
  state.listMyReviews.mockResolvedValue(entries(3));
});

describe('journal year page', () => {
  it('asks a signed-out visitor to sign in and reads no tastings', async () => {
    state.user = null;
    render(await YearPage(params('2026')));
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(state.listMyReviews).not.toHaveBeenCalled();
  });

  it('reads only the signed-in user’s own tastings', async () => {
    render(await YearPage(params('2026')));
    expect(state.listMyReviews).toHaveBeenCalledWith(expect.anything(), 'u1');
    expect(screen.getByRole('heading', { name: 'Your 2026 in tea' })).toBeInTheDocument();
  });

  it('is not found below three tastings that year', async () => {
    state.listMyReviews.mockResolvedValue(entries(2));
    await expect(YearPage(params('2026'))).rejects.toThrow();
  });

  it('is not found for a year with tastings in other years only', async () => {
    state.listMyReviews.mockResolvedValue(entries(5, 2025));
    await expect(YearPage(params('2026'))).rejects.toThrow();
  });

  it('is not found for a malformed year', async () => {
    await expect(YearPage(params('twenty'))).rejects.toThrow();
    await expect(YearPage(params('26'))).rejects.toThrow();
  });

  it('offers sharing to a public profile', async () => {
    render(await YearPage(params('2026')));
    expect(screen.getByRole('button', { name: 'Share your year' })).toBeInTheDocument();
  });

  it('offers no share card to a private profile', async () => {
    state.isPublic = false;
    render(await YearPage(params('2026')));
    expect(screen.queryByRole('button', { name: 'Share your year' })).not.toBeInTheDocument();
    expect(screen.getByText(/profile is private/)).toBeInTheDocument();
  });

  describe('tab title', () => {
    it('is the year title for a year with a recap', async () => {
      expect(await generateMetadata(params('2026'))).toMatchObject({
        title: 'Your year in tea',
        robots: { index: false },
      });
    });

    it('is the not-found title for a malformed year, without reading tastings', async () => {
      expect(await generateMetadata(params('twenty'))).toEqual({ title: 'Page not found' });
      expect(state.listMyReviews).not.toHaveBeenCalled();
    });

    it('is the not-found title for a year with no recap', async () => {
      state.listMyReviews.mockResolvedValue(entries(2));
      expect(await generateMetadata(params('2026'))).toEqual({ title: 'Page not found' });
    });

    it('keeps the year title for a signed-out visitor', async () => {
      state.user = null;
      expect(await generateMetadata(params('2026'))).toMatchObject({ title: 'Your year in tea' });
    });
  });
});
