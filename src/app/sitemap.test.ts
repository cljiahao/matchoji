import { describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({ connection: async () => undefined }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/products', () => ({ listCatalogue: async () => [] }));

import sitemap from './sitemap';

describe('sitemap', () => {
  it('omits /sell', async () => {
    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname);
    expect(urls).toContain('/explore');
    expect(urls).not.toContain('/sell');
  });
});
