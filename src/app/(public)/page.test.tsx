// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  user: null as { id: string } | null,
  latest: vi.fn(),
  top: vi.fn(),
  cafes: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (state.cookie ? { value: state.cookie } : undefined) }),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }));
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock('@/components/widgets/log-dialog', () => ({
  LogDialog: () => <button>Log a drink</button>,
}));
vi.mock('@/features/social', () => ({
  TastingFeed: () => <p>feed</p>,
  loadFeed: async () => [{ id: 't1' }],
}));
vi.mock('@/features/cafes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/cafes')>()),
  listLatestTasterDrinkReviews: (...args: unknown[]) => state.latest(...args),
  listTopDrinks: (...args: unknown[]) => state.top(...args),
  listCafes: (...args: unknown[]) => state.cafes(...args),
}));

import Home from './page';

const scores = {
  tasterAvg: 4.5,
  tasterCount: 1,
  tasterDisclosedCount: 0,
  communityAvg: null,
  communityCount: 0,
};

const drink = {
  id: 'd1',
  cafeId: 'c1',
  slug: 'hojicha-latte',
  name: 'Hojicha Latte',
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
};

const review = {
  id: 'r1',
  productId: null,
  drinkId: 'd1',
  reviewerName: 'Mei',
  authorId: 'u1',
  stars: 4.5,
  notes: 'Roasty',
  photoUrl: null,
  createdAt: '2026-11-05T00:00:00Z',
  flavorNotes: [],
  profile: {},
  prep: {},
  tastedOn: '2026-11-05',
  edition: { harvestYear: null, flush: null },
  byTrustedTaster: true,
  instagramUrl: null,
  disclosure: 'none',
  teaStrength: null,
  roast: null,
};

const cafe = (id: string, area: string | null) => ({
  id,
  slug: `cafe-${id}`,
  name: `Café ${id}`,
  citySlug: 'singapore',
  area,
  address: null,
  lat: null,
  lng: null,
  instagramHandle: null,
  websiteUrl: null,
  status: 'approved',
  drinkCount: 1,
  scores,
});

const search = (sp: Record<string, string> = {}) => ({ searchParams: Promise.resolve(sp) });

beforeEach(() => {
  state.cookie = undefined;
  state.user = null;
  state.latest.mockReset().mockResolvedValue([]);
  state.top.mockReset().mockResolvedValue([]);
  state.cafes.mockReset().mockResolvedValue([]);
});

describe('Home', () => {
  it('renders new H1', async () => {
    render(await Home(search()));
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'The trusted guide to hojicha and matcha drinks in Singapore and JB',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Rated drink by drink, by tasters you can follow.')
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'City' })).toBeInTheDocument();
  });

  it('shows the taster rail, top lattes and areas when there are cafés', async () => {
    state.latest.mockResolvedValue([{ review, drink }]);
    state.top.mockResolvedValue([drink]);
    state.cafes.mockResolvedValue([cafe('1', 'Bugis'), cafe('2', 'Bugis'), cafe('3', 'Orchard')]);

    render(await Home(search()));

    const rail = screen.getByRole('region', { name: 'Latest from our tasters' });
    expect(within(rail).getByRole('link', { name: /Hojicha Latte · Kurasu/ })).toHaveAttribute(
      'href',
      '/cafes/kurasu-bugis/hojicha-latte'
    );
    const top = screen.getByRole('region', { name: 'Top hojicha lattes in Singapore' });
    expect(within(top).getByRole('link', { name: 'See all' })).toHaveAttribute(
      'href',
      '/top/singapore-hojicha-latte'
    );
    const areas = screen.getByRole('region', { name: 'Cafés by area' });
    expect(within(areas).getByRole('link', { name: /Bugis/ })).toHaveAttribute(
      'href',
      '/cafes?city=singapore&area=Bugis'
    );
    expect(screen.queryByText(/No drinks rated/)).not.toBeInTheDocument();
  });

  it('hides taster rail when empty', async () => {
    state.top.mockResolvedValue([drink]);
    render(await Home(search()));
    expect(
      screen.queryByRole('region', { name: 'Latest from our tasters' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Top hojicha lattes/ })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Cafés by area' })).not.toBeInTheDocument();
  });

  it('cafés with no area still show the invitation, since no rail renders', async () => {
    state.cafes.mockResolvedValue([cafe('1', null)]);
    render(await Home(search()));
    expect(screen.queryByRole('region', { name: 'Cafés by area' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No drinks rated in Singapore yet' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log a drink' })).toBeInTheDocument();
  });

  it('with no café data shows one invitation and still the at-home row, with no empty rails', async () => {
    render(await Home(search()));
    expect(
      screen.getByRole('heading', { name: 'No drinks rated in Singapore yet' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log a drink' })).toBeInTheDocument();
    const home = screen.getByRole('region', { name: 'Brew it at home' });
    expect(within(home).getByRole('link', { name: 'Explore teas' })).toHaveAttribute(
      'href',
      '/explore'
    );
    expect(within(home).getByRole('link', { name: 'Top teas' })).toHaveAttribute(
      'href',
      '/top/teas'
    );
    // The old tea rails are gone.
    expect(screen.queryByRole('region', { name: /Top-rated|to try|Newly added/ })).toBeNull();
  });

  it('?city=johor-bahru switches lists', async () => {
    state.cookie = 'singapore';
    state.top.mockResolvedValue([drink]);
    render(await Home(search({ city: 'johor-bahru' })));

    expect(state.latest.mock.calls[0][1]).toMatchObject({ city: 'johor-bahru' });
    expect(state.top.mock.calls[0][1]).toMatchObject({
      city: 'johor-bahru',
      base: 'hojicha',
      style: 'latte',
    });
    expect(state.cafes.mock.calls[0][1]).toEqual({ city: 'johor-bahru' });
    expect(
      screen.getByRole('region', { name: 'Top hojicha lattes in Johor Bahru' })
    ).toBeInTheDocument();
  });

  it('uses the cookie city, ignoring an unknown ?city=', async () => {
    state.cookie = 'johor-bahru';
    render(await Home(search()));
    expect(state.top.mock.calls[0][1]).toMatchObject({ city: 'johor-bahru' });

    render(await Home(search({ city: 'bogus' })));
    expect(state.top.mock.calls[1][1]).toMatchObject({ city: 'johor-bahru' });
  });

  it('falls back to Singapore with neither a cookie nor a valid ?city=', async () => {
    render(await Home(search({ city: 'bogus' })));
    expect(state.top.mock.calls[0][1]).toMatchObject({ city: 'singapore' });
  });

  it('adds "From people you follow" for a signed-in reader', async () => {
    state.user = { id: 'u1' };
    render(await Home(search()));
    expect(screen.getByRole('region', { name: 'From people you follow' })).toBeInTheDocument();
  });
});
