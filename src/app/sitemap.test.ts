import { describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({ connection: async () => undefined }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/products', () => ({ listCatalogue: async () => [] }));

const state = vi.hoisted(() => ({
  cafesByCity: { singapore: [{ id: 'c1' }], 'johor-bahru': [] as unknown[] },
  tasters: [{ id: 't1' }] as unknown[],
  drinkLists: [{ slug: 'singapore-hojicha-latte' }] as unknown[],
}));

vi.mock('@/features/social', () => ({ listTasters: async () => state.tasters }));
vi.mock('@/features/cafes', () => ({
  CITIES: [{ slug: 'singapore' }, { slug: 'johor-bahru' }],
  cityHref: (path: string, city: string) => `${path}?city=${city}`,
  listCafes: async (_: unknown, { city }: { city: 'singapore' | 'johor-bahru' }) =>
    state.cafesByCity[city],
  topTeasHref: (slug?: string) => (slug ? `/top/teas/${slug}` : '/top/teas'),
  listTopDrinkLists: async () => state.drinkLists,
  listCafeSitemapEntries: async () => [
    { path: '/cafes/kurasu-bugis', lastModified: '2026-11-01T00:00:00Z' },
    { path: '/cafes/kurasu-bugis/hojicha-latte', lastModified: undefined },
  ],
}));

import sitemap from './sitemap';

describe('sitemap', () => {
  const full = async () =>
    (await sitemap()).map((entry) => entry.url.replace(/^https?:\/\/[^/]+/, ''));

  it('lists each city’s home as its own canonical URL', async () => {
    const urls = await full();
    expect(urls).toContain('/?city=singapore');
    expect(urls).toContain('/?city=johor-bahru');
    expect(urls).not.toContain('/');
  });

  it('lists only cities that have cafés, by their canonical URL', async () => {
    const urls = await full();
    expect(urls).toContain('/cafes?city=singapore');
    expect(urls).not.toContain('/cafes?city=johor-bahru');
    expect(urls).not.toContain('/cafes');
  });

  it('leaves out the empty /top and /tasters indexes, matching their noindex', async () => {
    state.tasters = [];
    state.drinkLists = [];
    const urls = await full();
    expect(urls).not.toContain('/tasters');
    expect(urls).not.toContain('/top');
    state.tasters = [{ id: 't1' }];
    state.drinkLists = [{ slug: 'singapore-hojicha-latte' }];
  });

  it('lists approved cafés and drinks', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/cafes/kurasu-bugis');
    expect(urls).toContain('/cafes/kurasu-bugis/hojicha-latte');
    expect(entries.find((e) => e.url.endsWith('/cafes/kurasu-bugis'))?.lastModified).toBe(
      '2026-11-01T00:00:00Z'
    );
  });

  it('lists the tasters index and how we rate', async () => {
    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/tasters');
    expect(urls).toContain('/about/how-we-rate');
  });

  it('lists the drink top lists and the tea lists index', async () => {
    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/top/singapore-hojicha-latte');
    expect(urls).toContain('/top/teas');
  });

  it('omits /sell', async () => {
    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/explore');
    expect(urls).not.toContain('/sell');
  });
});
