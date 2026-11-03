import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COURSES, GUIDES, RECIPES } from '@/features/learn';

import { createFakeSupabase, type QueryResult } from '../support/fake-supabase';

const server = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => server.current }));
vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }));

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

function useServer(results: Record<string, QueryResult>) {
  const fake = createFakeSupabase(results);
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
    });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual([
      'http://localhost:3000/',
      'http://localhost:3000/explore',
      'http://localhost:3000/top',
      'http://localhost:3000/regions',
      'http://localhost:3000/regions/supply',
      'http://localhost:3000/shops',
      'http://localhost:3000/learn',
      ...RECIPES.map((r) => `http://localhost:3000/learn/recipes/${r.slug}`),
      ...GUIDES.map((g) => `http://localhost:3000/learn/guides/${g.slug}`),
      ...COURSES.flatMap((c) => [
        `http://localhost:3000/learn/courses/${c.slug}`,
        ...c.lessons.map((l) => `http://localhost:3000/learn/courses/${c.slug}/${l.slug}`),
      ]),
      'http://localhost:3000/products/t1',
    ]);
  });

  it('adds a top list only once enough teas are rated', async () => {
    const rated = Array.from({ length: 5 }, (_, i) =>
      catalogueRow(`r${i}`, { review_count: 3, avg_stars: 4 })
    );
    useServer({ catalogue_teas: { data: rated, error: null } });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain('http://localhost:3000/top/matcha');
    expect(urls).not.toContain('http://localhost:3000/top/hojicha');
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
