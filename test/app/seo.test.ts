import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('sitemap', () => {
  it('lists the browse pages and every catalogue tea', async () => {
    useServer({
      catalogue_teas: { data: [{ id: 't1', created_at: '2026-10-01T00:00:00Z' }], error: null },
    });
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual([
      'http://localhost:3000/',
      'http://localhost:3000/explore',
      'http://localhost:3000/regions',
      'http://localhost:3000/regions/supply',
      'http://localhost:3000/products/t1',
    ]);
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
    expect(rules.rules).toMatchObject({ disallow: ['/admin', '/journal', '/sell', '/auth'] });
    expect(rules.sitemap).toBe('http://localhost:3000/sitemap.xml');
  });
});
