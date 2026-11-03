// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProfileView = vi.fn();
const listUserTastings = vi.fn();

vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
vi.mock('@/features/social', () => ({
  BlockButton: () => null,
  FollowButton: () => null,
  TastingFeed: () => null,
  getProfileView: (...a: unknown[]) => getProfileView(...a),
}));
vi.mock('@/features/journal', () => ({
  PublicStatsStrip: ({ stats }: { stats: { teas: number } }) => <p>stats strip {stats.teas}</p>,
  computePublicStats: (entries: unknown[]) => ({ teas: entries.length }),
  listUserTastings: (...a: unknown[]) => listUserTastings(...a),
}));
vi.mock('@/features/taste', () => ({ YourTaste: () => null, buildTasteProfile: () => ({}) }));

import ProfilePage, { generateMetadata } from './page';

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

describe('profile stats strip', () => {
  const view = (isPublic: boolean, isSelf: boolean) => ({
    profile: { id: ID, name: 'Mei', isPublic, joinedAt: '2026-01-01' },
    counts: { teas: 2, followers: 0, following: 0 },
    viewer: { isSelf, follows: false, blocked: false },
    recent: [],
  });

  it('shows a public profile’s stats to a visitor', async () => {
    getProfileView.mockResolvedValue(view(true, false));
    listUserTastings.mockResolvedValue([{}, {}]);
    render(await ProfilePage({ params: params(ID) }));
    expect(screen.getByText('stats strip 2')).toBeInTheDocument();
  });

  it('hides a private profile’s stats from a visitor and never reads its tastings', async () => {
    getProfileView.mockResolvedValue(view(false, false));
    render(await ProfilePage({ params: params(ID) }));
    expect(screen.queryByText(/stats strip/)).not.toBeInTheDocument();
    expect(listUserTastings).not.toHaveBeenCalled();
  });

  it('shows a private profile’s stats to its owner', async () => {
    getProfileView.mockResolvedValue(view(false, true));
    listUserTastings.mockResolvedValue([{}]);
    render(await ProfilePage({ params: params(ID) }));
    expect(screen.getByText('stats strip 1')).toBeInTheDocument();
  });
});
