// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ page: { kind: 'missing' } as unknown }));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  permanentRedirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/share', () => ({
  drinkJsonLd: () => ({}),
  drinkMetadata: () => ({ title: 'Hojicha Latte' }),
  serializeJsonLd: () => '{}',
}));
vi.mock('@/features/cafes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/cafes')>()),
  getDrinkPage: async () => state.page,
  listSimilarDrinks: async () => [],
}));

import DrinkPage, { generateMetadata } from './page';

const scores = {
  tasterAvg: 4.5,
  tasterCount: 1,
  tasterDisclosedCount: 1,
  communityAvg: 3.5,
  communityCount: 1,
};
const drink = {
  id: 'd1',
  cafeId: 'c1',
  slug: 'hojicha-latte',
  name: 'Hojicha Latte',
  base: 'hojicha',
  style: 'latte',
  serving: 'both',
  price: 7.5,
  currency: 'SGD',
  photoUrl: null,
  photoCredit: null,
  teaProductId: 'p1',
  status: 'approved',
  scores,
  cafe: { slug: 'kurasu-bugis', name: 'Kurasu', area: 'Bugis', citySlug: 'singapore' },
};
const review = (id: string, name: string, taster: boolean) => ({
  id,
  productId: null,
  drinkId: 'd1',
  reviewerName: name,
  authorId: null,
  stars: 4,
  notes: `notes by ${name}`,
  photoUrl: null,
  createdAt: '2026-11-05T00:00:00Z',
  flavorNotes: [],
  profile: {},
  prep: { method: null, doseG: null, waterMl: null, waterTempC: null },
  tastedOn: '2026-11-05',
  edition: { harvestYear: null, flush: null },
  byTrustedTaster: taster,
  instagramUrl: taster ? 'https://www.instagram.com/p/abc/' : null,
  disclosure: taster ? 'gifted' : 'none',
  teaStrength: null,
  roast: null,
});

const params = (slug: string, d: string) => ({ params: Promise.resolve({ slug, drink: d }) });

beforeEach(() => {
  state.page = { kind: 'missing' };
});

describe('drink page', () => {
  it('notFound for an unknown drink', async () => {
    await expect(DrinkPage(params('a', 'b'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('notFound for malformed slugs', async () => {
    await expect(DrinkPage(params('a', 'B B'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('redirects permanently, e.g. a rejected drink to its café', async () => {
    state.page = { kind: 'redirect', to: '/cafes/kurasu-bugis' };
    await expect(DrinkPage(params('kurasu-bugis', 'x'))).rejects.toThrow(
      'REDIRECT:/cafes/kurasu-bugis'
    );
  });

  it('renders taster block before community', async () => {
    state.page = {
      kind: 'found',
      drink,
      tasterReviews: [review('r1', 'Mei', true)],
      communityReviews: [review('r2', 'Ken', false)],
      teaProduct: { id: 'p1', name: 'Hojicha Powder' },
    };
    render(await DrinkPage(params('kurasu-bugis', 'hojicha-latte')));
    const text = document.body.textContent ?? '';
    expect(text.indexOf('notes by Mei')).toBeGreaterThan(-1);
    expect(text.indexOf('notes by Mei')).toBeLessThan(text.indexOf('notes by Ken'));
    expect(screen.getByRole('heading', { level: 1, name: 'Hojicha Latte' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Hojicha Powder' }).getAttribute('href')).toBe(
      '/products/p1'
    );
    expect(screen.getByRole('link', { name: 'See the post on Instagram' })).toBeTruthy();
  });

  it('shows the drink photo with alt text and its credit', async () => {
    state.page = {
      kind: 'found',
      drink: { ...drink, photoUrl: 'https://x.test/d.jpg', photoCredit: '@mei' },
      tasterReviews: [],
      communityReviews: [],
      teaProduct: null,
    };
    render(await DrinkPage(params('kurasu-bugis', 'hojicha-latte')));
    expect(screen.getByRole('img', { name: 'Hojicha Latte at Kurasu' }).getAttribute('src')).toBe(
      'https://x.test/d.jpg'
    );
    expect(screen.getByText('Photo: @mei')).toBeTruthy();
  });

  it('says so when there are no reviews yet', async () => {
    state.page = {
      kind: 'found',
      drink: { ...drink, teaProductId: null },
      tasterReviews: [],
      communityReviews: [],
      teaProduct: null,
    };
    render(await DrinkPage(params('kurasu-bugis', 'hojicha-latte')));
    expect(screen.getByText(/No reviews yet/)).toBeTruthy();
  });

  it('metadata', async () => {
    expect(await generateMetadata(params('a', 'b'))).toEqual({ title: 'Drink not found' });
    state.page = {
      kind: 'found',
      drink,
      tasterReviews: [],
      communityReviews: [],
      teaProduct: null,
    };
    expect(await generateMetadata(params('a', 'b'))).toEqual({ title: 'Hojicha Latte' });
  });
});
