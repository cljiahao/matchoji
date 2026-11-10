// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  lists: vi.fn(),
  top: vi.fn(),
  teaLists: new Set(['best-value-matcha', 'from-uji-kyoto']),
}));

vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  permanentRedirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
}));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/products', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/products')>()),
  listCatalogue: async () => [],
}));
vi.mock('@/features/discovery', () => ({
  findTopList: (_catalogue: unknown, slug: string) =>
    state.teaLists.has(slug) ? { slug } : undefined,
}));
vi.mock('@/features/cafes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/cafes')>()),
  listTopDrinkLists: (...args: unknown[]) => state.lists(...args),
  listTopDrinks: (...args: unknown[]) => state.top(...args),
}));

import TopDrinksPage, { generateMetadata } from './[slug]/page';
import TopIndexPage, { generateMetadata as indexMetadata } from './page';

const scores = {
  tasterAvg: 4.5,
  tasterCount: 1,
  tasterDisclosedCount: 0,
  communityAvg: null,
  communityCount: 0,
};

const drink = (id: string, name: string) => ({
  id,
  cafeId: 'c1',
  slug: id,
  name,
  base: 'hojicha',
  style: 'latte',
  serving: 'both',
  price: null,
  currency: 'SGD',
  photoUrl: null,
  photoCredit: null,
  teaProductId: null,
  status: 'approved',
  scores,
  cafe: { slug: 'kurasu-bugis', name: 'Kurasu', area: 'Bugis', citySlug: 'singapore' },
});

const list = (city: string, cityName: string, count = 1) => ({
  slug: `${city}-hojicha-latte`,
  title: `Top hojicha lattes in ${cityName}`,
  city,
  base: 'hojicha',
  style: 'latte',
  count,
  drinks: [drink('d1', 'Hojicha Latte')],
});

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  state.lists.mockReset().mockResolvedValue([]);
  state.top.mockReset().mockResolvedValue([]);
});

describe('/top index', () => {
  it('lists drink tops per city', async () => {
    state.lists.mockResolvedValue([
      list('singapore', 'Singapore', 4),
      list('johor-bahru', 'Johor Bahru'),
    ]);
    render(await TopIndexPage());

    const sg = screen.getByRole('region', { name: 'Singapore' });
    expect(
      within(sg).getByRole('link', { name: 'Top hojicha lattes in Singapore' })
    ).toHaveAttribute('href', '/top/singapore-hojicha-latte');
    expect(within(sg).getByRole('link', { name: 'See all 4' })).toBeInTheDocument();
    const jb = screen.getByRole('region', { name: 'Johor Bahru' });
    expect(within(jb).queryByRole('link', { name: /See all/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/No top drinks yet/)).not.toBeInTheDocument();
  });

  it('says so with no lists yet, and still offers tea lists under At home', async () => {
    render(await TopIndexPage());
    expect(screen.getByText(/No top drinks yet/)).toBeInTheDocument();
    const home = screen.getByRole('region', { name: 'At home' });
    expect(within(home).getByRole('link')).toHaveAttribute('href', '/top/teas');
  });
});

describe('/top/[slug]', () => {
  it('shows a drink list, numbered, from listTopDrinks for that city, base and style', async () => {
    state.top.mockResolvedValue([drink('d1', 'Hojicha Latte'), drink('d2', 'Roasted Latte')]);
    render(await TopDrinksPage(params('johor-bahru-hojicha-latte')));

    expect(state.top.mock.calls[0][1]).toEqual({
      city: 'johor-bahru',
      base: 'hojicha',
      style: 'latte',
    });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Top hojicha lattes in Johor Bahru' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('old tea list slug redirects to /top/teas/<slug>', async () => {
    await expect(TopDrinksPage(params('best-value-matcha'))).rejects.toThrow(
      'NEXT_REDIRECT /top/teas/best-value-matcha'
    );
    await expect(TopDrinksPage(params('from-uji-kyoto'))).rejects.toThrow(
      'NEXT_REDIRECT /top/teas/from-uji-kyoto'
    );
    expect(state.top).not.toHaveBeenCalled();
  });

  it('does not redirect a slug that could point anywhere else', async () => {
    await expect(TopDrinksPage(params('//evil.example'))).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(TopDrinksPage(params('..%2Fadmin'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('is not found, never redirected, for a well-formed slug that is no tea list', async () => {
    await expect(TopDrinksPage(params('totally-made-up'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('keeps an empty /top out of search and indexes it once it has lists', async () => {
    state.lists.mockResolvedValue([]);
    expect(await indexMetadata()).toMatchObject({ robots: { index: false } });
    state.lists.mockResolvedValue([list('singapore', 'Singapore')]);
    expect(await indexMetadata()).not.toHaveProperty('robots');
  });

  it('is not found for a known list with no qualifying drink', async () => {
    await expect(TopDrinksPage(params('singapore-matcha-float'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await generateMetadata(params('singapore-matcha-float'))).toEqual({
      title: 'List not found',
    });
  });

  it('titles the page', async () => {
    state.top.mockResolvedValue([drink('d1', 'Hojicha Latte')]);
    expect(await generateMetadata(params('singapore-hojicha-latte'))).toMatchObject({
      title: 'Top hojicha lattes in Singapore',
    });
  });
});
