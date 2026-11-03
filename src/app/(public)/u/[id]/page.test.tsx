import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProfileView = vi.fn();

vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
vi.mock('@/features/social', () => ({
  BlockButton: () => null,
  FollowButton: () => null,
  TastingFeed: () => null,
  getProfileView: (...a: unknown[]) => getProfileView(...a),
}));
vi.mock('@/features/taste', () => ({ YourTaste: () => null, buildTasteProfile: () => ({}) }));

import { generateMetadata } from './page';

const ID = '22222222-2222-4222-8222-222222222222';
const params = (id: string) => Promise.resolve({ id });

beforeEach(() => vi.clearAllMocks());

describe('profile generateMetadata', () => {
  it('shares a public profile with its tea count', async () => {
    getProfileView.mockResolvedValue({
      profile: { id: ID, name: 'Mei', isPublic: true, joinedAt: '2026-01-01' },
      counts: { teas: 5, followers: 0, following: 0 },
    });
    const meta = await generateMetadata({ params: params(ID) });
    expect(meta.description).toBe('Mei has rated 5 teas on Matchoji.');
  });

  it('shares a private profile without counts', async () => {
    getProfileView.mockResolvedValue({
      profile: { id: ID, name: 'Mei', isPublic: false, joinedAt: '2026-01-01' },
      counts: { teas: 5, followers: 0, following: 0 },
    });
    const meta = await generateMetadata({ params: params(ID) });
    expect(meta.description).toBe('A taster on Matchoji.');
    expect(meta.robots).toEqual({ index: false });
  });

  it('titles an unknown or malformed id as not found', async () => {
    getProfileView.mockResolvedValue(null);
    expect((await generateMetadata({ params: params(ID) })).title).toBe('Taster not found');
    expect((await generateMetadata({ params: params('nope') })).title).toBe('Taster not found');
  });
});
