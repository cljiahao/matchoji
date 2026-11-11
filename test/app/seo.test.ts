import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ALL_DRINK_LISTS } from '@/features/cafes/lib';
import { COURSES, GUIDES, RECIPES } from '@/features/learn';

import { createFakeSupabase, type QueryResult } from '../support/fake-supabase';

const server = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => server.current }));
vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }));

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

const NO_ROWS: QueryResult = { data: [], error: null };

function useServer(results: Record<string, QueryResult | QueryResult[]>) {
  // Cafés and drinks are read for the sitemap too; most cases have none.
  const fake = createFakeSupabase({
    cafes: NO_ROWS,
    drinks: NO_ROWS,
    drink_ratings: NO_ROWS,
    drink_ranks: NO_ROWS,
    public_profiles: NO_ROWS,
    cafe_ratings: NO_ROWS,
    ...results,
  });
  server.current = fake.client;
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

const catalogueRow = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: `Tea ${id}`,
  brand: null,
  category: 'matcha',
  grade: null,
  region_id: null,
  region_name: null,
  supply: null,
  image_url: null,
  shop_url: null,
  created_at: '2026-10-01T00:00:00Z',
  review_count: 0,
  avg_stars: null,
  ...extra,
});

describe('sitemap', () => {
  it('lists the browse and Learn pages and every catalogue tea', async () => {
    useServer({
      catalogue_teas: { data: [catalogueRow('t1')], error: null },
      cafes: {
        data: [{ id: 'c1', slug: 'kurasu-bugis', updated_at: '2026-11-01T00:00:00Z' }],
        error: null,
        count: 1,
      },
      drinks: {
        data: [{ cafe_id: 'c1', slug: 'hojicha-latte', updated_at: '2026-11-02T00:00:00Z' }],
        error: null,
      },
    });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual([
      'http://localhost:3000/?city=singapore',
      'http://localhost:3000/cafes?city=singapore',
      'http://localhost:3000/?city=johor-bahru',
      'http://localhost:3000/cafes?city=johor-bahru',
      'http://localhost:3000/explore',
      'http://localhost:3000/top/teas',
      'http://localhost:3000/regions',
      'http://localhost:3000/regions/supply',
      'http://localhost:3000/shops',
      'http://localhost:3000/about/how-we-rate',
      'http://localhost:3000/learn',
      ...RECIPES.map((r) => `http://localhost:3000/learn/recipes/${r.slug}`),
      ...GUIDES.map((g) => `http://localhost:3000/learn/guides/${g.slug}`),
      ...COURSES.flatMap((c) => [
        `http://localhost:3000/learn/courses/${c.slug}`,
        ...c.lessons.map((l) => `http://localhost:3000/learn/courses/${c.slug}/${l.slug}`),
      ]),
      'http://localhost:3000/products/t1',
      'http://localhost:3000/cafes/kurasu-bugis',
      'http://localhost:3000/cafes/kurasu-bugis/hojicha-latte',
    ]);
  });

  it('leaves the empty café, taster and top indexes out, matching their noindex', async () => {
    useServer({ catalogue_teas: NO_ROWS });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain('http://localhost:3000/?city=singapore');
    expect(urls).not.toContain('http://localhost:3000/cafes?city=singapore');
    expect(urls).not.toContain('http://localhost:3000/tasters');
    expect(urls).not.toContain('http://localhost:3000/top');
  });

  it('adds a top list only once enough teas are rated', async () => {
    const rated = Array.from({ length: 5 }, (_, i) =>
      catalogueRow(`r${i}`, { review_count: 3, avg_stars: 4 })
    );
    useServer({ catalogue_teas: { data: rated, error: null } });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain('http://localhost:3000/top/teas');
    expect(urls).toContain('http://localhost:3000/top/teas/matcha');
    expect(urls).not.toContain('http://localhost:3000/top/teas/hojicha');
    expect(urls).not.toContain('http://localhost:3000/top/matcha');
  });

  it('adds a drink top list only once a drink qualifies', async () => {
    useServer({
      catalogue_teas: NO_ROWS,
      cafes: {
        data: [
          {
            id: 'c1',
            slug: 'kurasu-bugis',
            name: 'Kurasu',
            city_slug: 'singapore',
            area: 'Bugis',
            updated_at: '2026-11-01T00:00:00Z',
          },
        ],
        error: null,
      },
      drinks: {
        data: [
          {
            id: 'd1',
            cafe_id: 'c1',
            slug: 'hojicha-latte',
            name: 'Hojicha Latte',
            base: 'hojicha',
            style: 'latte',
            serving: 'both',
            price: null,
            currency: 'SGD',
            status: 'approved',
            updated_at: '2026-11-02T00:00:00Z',
          },
        ],
        error: null,
      },
      drink_ranks: ALL_DRINK_LISTS.map((list): QueryResult =>
        list.city === 'singapore' && list.base === 'hojicha' && list.style === 'latte'
          ? { data: [{ drink_id: 'd1' }], error: null, count: 1 }
          : NO_ROWS
      ),
      drink_ratings: {
        data: [
          {
            drink_id: 'd1',
            taster_count: 1,
            taster_avg: 4,
            taster_disclosed_count: 0,
            community_count: 0,
            community_avg: null,
          },
        ],
        error: null,
      },
    });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain('http://localhost:3000/top/singapore-hojicha-latte');
    expect(urls).not.toContain('http://localhost:3000/top/singapore-matcha-latte');
  });

  it('throws the Supabase error', async () => {
    const error = new Error('down');
    useServer({ catalogue_teas: { data: null, error } });
    await expect(sitemap()).rejects.toBe(error);
  });
});

describe('robots', () => {
  it('keeps personal and admin pages out and points at the sitemap', () => {
    const rules = robots();
    expect(rules.rules).toMatchObject({
      disallow: ['/admin', '/account', '/journal', '/sell', '/auth', '/api/'],
    });
    expect(rules.sitemap).toBe('http://localhost:3000/sitemap.xml');
  });
});
