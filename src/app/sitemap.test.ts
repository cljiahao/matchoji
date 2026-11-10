import { describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({ connection: async () => undefined }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/products', () => ({ listCatalogue: async () => [] }));

vi.mock('@/features/cafes', () => ({
  listCafeSitemapEntries: async () => [
    { path: '/cafes/kurasu-bugis', lastModified: '2026-11-01T00:00:00Z' },
    { path: '/cafes/kurasu-bugis/hojicha-latte', lastModified: undefined },
  ],
}));

import sitemap from './sitemap';

describe('sitemap', () => {
  it('lists approved cafés and drinks, and the /cafes index', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/cafes');
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

  it('omits /sell', async () => {
    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/explore');
    expect(urls).not.toContain('/sell');
  });
});
