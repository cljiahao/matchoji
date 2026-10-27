// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../support/fake-browser-client';
import { createFakeSupabase, type QueryResult } from '../support/fake-supabase';
import { renderWithQuery } from '../support/render';

const server = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => server.current }));

const browser = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => browser.current }));

const nextServer = vi.hoisted(() => ({ connection: vi.fn(async () => {}) }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: nextServer.connection,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  permanentRedirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
}));

import AccountPage from '@/app/(public)/account/page';
import AdminPage, { generateMetadata as adminMetadata } from '@/app/(public)/admin/page';
import PublicError from '@/app/(public)/error';
import ExploreLoading from '@/app/(public)/explore/loading';
import ExplorePage from '@/app/(public)/explore/page';
import JournalLoading from '@/app/(public)/journal/loading';
import JournalPage from '@/app/(public)/journal/page';
import HomeLoading from '@/app/(public)/loading';
import Home from '@/app/(public)/page';
import ProductLoading from '@/app/(public)/products/[id]/loading';
import ProductPage, { generateMetadata } from '@/app/(public)/products/[id]/page';
import RegionsLoading from '@/app/(public)/regions/loading';
import RegionsPage from '@/app/(public)/regions/page';
import SupplyPage from '@/app/(public)/regions/supply/page';
import SellPage from '@/app/(public)/sell/page';
import ProfilePage from '@/app/(public)/u/[id]/page';
import AuthErrorPage from '@/app/auth/error/page';
import { SiteFooter } from '@/components/layout/site-footer';

const productRow = {
  id: 'p1',
  name: 'Kyoto Bancha',
  brand: 'Ippodo',
  category: 'hojicha',
  grade: null,
  region_id: null,
  image_url: null,
  status: 'approved',
  created_at: '2026-09-01T00:00:00Z',
  price_sgd: null,
  pack_grams: null,
};

function useServer(
  results: Record<string, QueryResult | QueryResult[]>,
  user: { id: string } | null = null
) {
  // Tea pages also read per-harvest ratings; most tests have none to show.
  const fake = createFakeSupabase({ edition_ratings: { data: [], error: null }, ...results });
  server.current = {
    from: fake.client.from,
    rpc: fake.client.rpc,
    auth: { getUser: async () => ({ data: { user }, error: null }) },
  };
  return fake;
}

beforeEach(() => {
  browser.current = createFakeBrowserClient().client;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const REGION = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';
// Tea pages 404 a malformed id before querying, so routes use a real uuid.
const PRODUCT_ID = '5d1e2f3a-4b5c-4d6e-8f70-8192a3b4c5d6';

// A catalogue_teas row: an approved tea with its region, rating and scores already joined.
const row = (
  id: string,
  name: string,
  category: 'matcha' | 'hojicha',
  createdAt: string,
  extra: Record<string, unknown> = {}
) => ({
  id,
  name,
  brand: 'Ippodo',
  category,
  grade: null,
  region_name: null,
  supply: null,
  image_url: null,
  shop_url: null,
  created_at: createdAt,
  review_count: 0,
  avg_stars: null,
  ...extra,
});

const bancha = row('p1', 'Kyoto Bancha', 'hojicha', '2026-09-01T00:00:00Z');

describe('Home page', () => {
  // Like /journal: without a request-time API first, Next prerenders / at build time and a
  // build without Supabase env vars fails.
  it('renders per request: waits for the connection before reading products', async () => {
    const fake = useServer({ catalogue_teas: { data: [], error: null } });
    nextServer.connection.mockImplementationOnce(async () => {
      throw new Error('prerender bail-out');
    });

    await expect(Home()).rejects.toThrow('prerender bail-out');
    expect(fake.calls).toHaveLength(0);
  });

  it('leads with search and the two teas, then shelves for each tea and the newest', async () => {
    const { calls } = useServer({
      catalogue_teas: [
        { data: [row('m1', 'Uji Gold', 'matcha', '2026-09-01T00:00:00Z')], error: null },
        { data: [row('h1', 'Kyoto Bancha', 'hojicha', '2026-09-02T00:00:00Z')], error: null },
        {
          data: [
            row('n1', 'Hoshino Fresh', 'matcha', '2026-09-03T00:00:00Z'),
            row('h1', 'Kyoto Bancha', 'hojicha', '2026-09-02T00:00:00Z'),
            row('m1', 'Uji Gold', 'matcha', '2026-09-01T00:00:00Z'),
          ],
          error: null,
        },
      ],
    });

    renderWithQuery(await Home());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Find your next matcha or hojicha' })
    ).toBeInTheDocument();
    expect(screen.getByRole('search')).toHaveAttribute('action', '/explore');
    expect(screen.getByRole('link', { name: /Stone-ground green tea/ })).toHaveAttribute(
      'href',
      '/explore?category=matcha'
    );

    const matcha = screen.getByRole('region', { name: 'Top-rated matcha' });
    expect(within(matcha).getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/explore?category=matcha'
    );
    expect(within(matcha).getByRole('link', { name: /Uji Gold/ })).toHaveAttribute(
      'href',
      '/products/m1'
    );
    const hojicha = screen.getByRole('region', { name: 'Top-rated hojicha' });
    expect(within(hojicha).getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/explore?category=hojicha'
    );
    const newest = screen.getByRole('region', { name: 'Newly added' });
    expect(within(newest).getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/explore?sort=newest'
    );
    expect(
      within(newest)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent)
    ).toEqual(['Hoshino Fresh', 'Kyoto Bancha', 'Uji Gold']);
    expect(within(newest).getAllByRole('button', { name: 'Want to try' })).toHaveLength(3);

    // Three queries, each fetching only its shelf.
    expect(calls.filter((c) => c.table === 'catalogue_teas' && c.method === 'from')).toHaveLength(
      3
    );
    expect(calls.filter((c) => c.method === 'range').map((c) => c.args)).toEqual([
      [0, 11],
      [0, 11],
      [0, 11],
    ]);
    expect(calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([
      ['category', 'matcha'],
      ['category', 'hojicha'],
    ]);
  });

  it('leads a signed-in reader with tastings from people they follow', async () => {
    useServer(
      {
        catalogue_teas: {
          data: [row('m1', 'Uji Gold', 'matcha', '2026-09-01T00:00:00Z')],
          error: null,
        },
        'rpc:following_feed': {
          data: [{ ...reviewRow('r1', 'm1', '2026-10-05', 5), user_id: 'u2' }],
          error: null,
        },
        public_profiles: { data: [{ id: 'u2', display_name: 'Ben' }], error: null },
        products: {
          data: [{ id: 'm1', name: 'Uji Gold', brand: null, category: 'matcha' }],
          error: null,
        },
      },
      { id: 'u1' }
    );

    renderWithQuery(await Home());

    const feed = screen.getByRole('region', { name: 'From people you follow' });
    expect(within(feed).getByRole('link', { name: 'Ben' })).toHaveAttribute('href', '/u/u2');
    expect(within(feed).getByRole('link', { name: 'Uji Gold' })).toHaveAttribute(
      'href',
      '/products/m1'
    );
  });

  it('hides an empty shelf and keeps the others', async () => {
    useServer({
      catalogue_teas: [
        { data: [row('m1', 'Uji Gold', 'matcha', '2026-09-01T00:00:00Z')], error: null },
        { data: [], error: null },
        { data: [row('m1', 'Uji Gold', 'matcha', '2026-09-01T00:00:00Z')], error: null },
      ],
    });

    renderWithQuery(await Home());

    expect(screen.getByRole('region', { name: 'Top-rated matcha' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Top-rated hojicha' })).not.toBeInTheDocument();
    expect(screen.queryByText('No teas rated yet')).not.toBeInTheDocument();
  });

  it('invites the first tasting when the catalogue is empty', async () => {
    useServer({ catalogue_teas: { data: [], error: null } });

    renderWithQuery(await Home());

    expect(screen.getByRole('heading', { name: 'No teas rated yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log a tasting' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});

describe('Explore page', () => {
  it('lists teas from the catalogue for the selected category', async () => {
    const { calls } = useServer({
      catalogue_teas: { data: [bancha], count: 1, error: null },
      regions: { data: [{ id: REGION, name: 'Uji, Kyoto' }], error: null },
    });

    renderWithQuery(
      await ExplorePage({ searchParams: Promise.resolve({ category: 'hojicha', sort: 'newest' }) })
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Explore Hojicha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kyoto Bancha' })).toHaveAttribute(
      'href',
      '/products/p1'
    );
    expect(screen.getByText('Showing 1–1 of 1 tea')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Want to try' })).toBeInTheDocument();
    expect(calls).toContainEqual({
      table: 'catalogue_teas',
      method: 'eq',
      args: ['category', 'hojicha'],
    });

    const filters = screen.getByRole('complementary', { name: 'Filters' });
    expect(within(filters).getByRole('link', { name: 'Hojicha' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(within(filters).getByRole('link', { name: 'Uji, Kyoto' })).toHaveAttribute(
      'href',
      `/explore?category=hojicha&region=${REGION}&sort=newest`
    );
    expect(screen.getByRole('combobox', { name: 'Sort' })).toHaveTextContent('Newest');
    const search = screen.getByRole('search');
    expect(search.querySelector('input[name="category"]')).toHaveValue('hojicha');
    expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument();
  });

  it('titles a search, counts the matches and pages through them', async () => {
    useServer({
      catalogue_teas: {
        data: [bancha, row('p2', 'Kyoto Gold', 'hojicha', '2026-09-03T00:00:00Z')],
        count: 50,
        error: null,
      },
      regions: { data: [], error: null },
    });

    renderWithQuery(
      await ExplorePage({ searchParams: Promise.resolve({ q: 'kyoto', page: '2' }) })
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Results for “kyoto”' })
    ).toBeInTheDocument();
    expect(screen.getByText('Showing 25–26 of 50 teas')).toBeInTheDocument();
    const pages = screen.getByRole('navigation', { name: 'Pages' });
    expect(within(pages).getByText('Page 2 of 3')).toBeInTheDocument();
    expect(within(pages).getByRole('link', { name: '← Previous' })).toHaveAttribute(
      'href',
      '/explore?q=kyoto'
    );
    expect(within(pages).getByRole('link', { name: 'Next →' })).toHaveAttribute(
      'href',
      '/explore?q=kyoto&page=3'
    );
  });

  it('still shows the feed when regions fail to load', async () => {
    useServer({
      catalogue_teas: { data: [bancha], count: 1, error: null },
      regions: { data: null, error: new Error('boom') },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Explore teas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kyoto Bancha' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Region' })).not.toBeInTheDocument();
  });

  it('ignores unknown categories and shows the empty state', async () => {
    const { calls } = useServer({
      catalogue_teas: { data: [], count: 0, error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ category: 'sencha' }) }));

    expect(
      screen.getByText('No teas rated yet. Be the first to rate a matcha or hojicha.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log a tasting' })).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'eq')).toBe(false);
  });

  it('names the category in an empty filtered catalogue', async () => {
    useServer({
      catalogue_teas: { data: [], count: 0, error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ category: 'matcha' }) }));

    expect(screen.getByText('No matcha rated yet. Be the first to rate one.')).toBeInTheDocument();
  });

  it('shows a no-results state with a clear-filters link when a search matches nothing', async () => {
    useServer({
      catalogue_teas: { data: [], count: 0, error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ q: 'gyokuro' }) }));

    expect(screen.getByText('No teas match “gyokuro”.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute('href', '/explore');
    expect(screen.queryByRole('button', { name: 'Log a tasting' })).not.toBeInTheDocument();
  });

  it('treats an empty region as no match rather than an empty catalogue', async () => {
    useServer({
      catalogue_teas: { data: [], count: 0, error: null },
      regions: { data: [{ id: REGION, name: 'Uji, Kyoto' }], error: null },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ region: REGION }) }));

    expect(screen.getByText('No teas from this region yet.')).toBeInTheDocument();
    expect(screen.getByText('No teas')).toBeInTheDocument();
  });

  it('filters by grade and minimum rating in SQL, offering the grades of the other matches', async () => {
    const { calls } = useServer({
      catalogue_teas: [
        {
          data: [
            row('p2', 'Kyoto Gold', 'hojicha', '2026-09-03T00:00:00Z', {
              grade: 'Premium',
              review_count: 1,
              avg_stars: 4.6,
            }),
          ],
          count: 1,
          error: null,
        },
        { data: [{ grade: 'Bancha' }, { grade: 'Premium' }], error: null },
      ],
      tea_taste_profiles: { data: [], error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(
      await ExplorePage({ searchParams: Promise.resolve({ grade: 'premium', rating: '4.5' }) })
    );

    expect(screen.getByRole('link', { name: 'Kyoto Gold' })).toBeInTheDocument();
    expect(screen.getByText('Showing 1–1 of 1 tea')).toBeInTheDocument();
    expect(calls).toContainEqual({
      table: 'catalogue_teas',
      method: 'eq',
      args: ['grade_key', 'premium'],
    });
    expect(calls).toContainEqual({
      table: 'catalogue_teas',
      method: 'gte',
      args: ['avg_stars', 4.5],
    });
    const grade = screen.getByRole('navigation', { name: 'Grade' });
    expect(within(grade).getByRole('link', { name: 'Bancha' })).toHaveAttribute(
      'href',
      '/explore?grade=Bancha&rating=4.5'
    );
  });

  it('ranks by the signed-in taster’s match and badges each row', async () => {
    const { calls } = useServer(
      {
        catalogue_teas: [
          {
            data: [
              row('far', 'Roasty One', 'hojicha', '2026-09-01T00:00:00Z'),
              row('near', 'Creamy One', 'matcha', '2026-09-02T00:00:00Z'),
            ],
            count: 2,
            error: null,
          },
          { data: [], error: null },
        ],
        regions: { data: [], error: null },
        latest_reviews: { data: [{ product_id: 'loved', stars: 5 }], error: null },
        products: {
          data: [
            { id: 'loved', name: 'Sayaka', category: 'matcha', grade: null, region_id: null },
            { id: 'far', name: 'Roasty One', category: 'hojicha', grade: null, region_id: null },
            { id: 'near', name: 'Creamy One', category: 'matcha', grade: null, region_id: null },
          ],
          error: null,
        },
        tea_taste_profiles: { data: [], error: null },
      },
      { id: 'u1' }
    );

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ sort: 'match' }) }));

    const names = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(['Creamy One', 'Roasty One']);
    expect(screen.getAllByText(/% match/)).toHaveLength(1);
    // The pool is read by score order, not paged in SQL.
    expect(calls.find((c) => c.method === 'range')?.args).toEqual([0, 499]);
  });

  it('says no teas match when grade or rating narrows to nothing', async () => {
    useServer({
      catalogue_teas: { data: [], count: 0, error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ rating: '4' }) }));

    expect(screen.getByText('No teas match these filters.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute('href', '/explore');
  });
});

describe('Regions page', () => {
  it('renders per request and links each region to its Explore list, busiest first', async () => {
    nextServer.connection.mockClear();
    useServer({
      regions: {
        data: [
          {
            id: REGION,
            name: 'Uji, Kyoto',
            prefecture: 'Kyoto',
            scarcity_note: null,
            matcha_supply: 'tight',
            hojicha_supply: null,
          },
          {
            id: '9b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e',
            name: 'Ise, Mie',
            prefecture: 'Mie',
            scarcity_note: 'Mostly sencha',
            matcha_supply: 'scarce',
            hojicha_supply: 'plentiful',
          },
        ],
        error: null,
      },
      products: {
        data: [
          { region_id: REGION, category: 'matcha' },
          { region_id: REGION, category: 'matcha' },
        ],
        error: null,
      },
    });

    render(await RegionsPage({ searchParams: Promise.resolve({}) }));

    expect(nextServer.connection).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'Tea regions' })).toBeInTheDocument();
    const links = within(screen.getByRole('list')).getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', `/explore?region=${REGION}`);
    expect(links[0]).toHaveTextContent('Uji, Kyoto');
    expect(links[0]).toHaveTextContent('2 matcha');
    expect(links[0]).not.toHaveTextContent('hojicha');
    expect(links[0]).toHaveTextContent('Matcha tight');
    expect(links[1]).toHaveTextContent('No teas yet');
    expect(links[1]).toHaveTextContent('Matcha scarce · Hojicha plentiful');
    expect(links[1]).toHaveTextContent('Mostly sencha');
    expect(screen.getByRole('link', { name: 'Most teas' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'See the harvest numbers' })).toHaveAttribute(
      'href',
      '/regions/supply'
    );
  });

  it('puts the scarcest region first when sorted by scarcity', async () => {
    useServer({
      regions: {
        data: [
          {
            id: REGION,
            name: 'Uji, Kyoto',
            prefecture: 'Kyoto',
            scarcity_note: null,
            matcha_supply: 'tight',
            hojicha_supply: null,
          },
          {
            id: '9b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e',
            name: 'Ise, Mie',
            prefecture: 'Mie',
            scarcity_note: null,
            matcha_supply: 'scarce',
            hojicha_supply: null,
          },
        ],
        error: null,
      },
      products: { data: [{ region_id: REGION, category: 'matcha' }], error: null },
    });

    render(await RegionsPage({ searchParams: Promise.resolve({ sort: 'scarce' }) }));

    const sort = screen.getByRole('navigation', { name: 'Sort regions' });
    expect(within(sort).getByRole('link', { name: 'Scarcest first' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    const cards = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(cards[0]).toContain('Ise, Mie');
    expect(cards[1]).toContain('Uji, Kyoto');
  });

  it('says so when no regions are listed', async () => {
    useServer({ regions: { data: [], error: null }, products: { data: [], error: null } });

    render(await RegionsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText('No regions listed yet.')).toBeInTheDocument();
  });
});

describe('Supply page', () => {
  const stat = (
    prefecture: string,
    year: number,
    metric: string,
    value: number,
    source = 'maff'
  ) => ({ prefecture, year, metric, value, source });

  it('shows national tiles, prefecture cards led by tencha, and the sources', async () => {
    nextServer.connection.mockClear();
    useServer({
      tea_production_stats: {
        data: [
          stat('Japan', 2025, 'cultivated_ha', 33400),
          stat('Japan', 2026, 'cultivated_ha', 31900),
          stat('Japan', 2018, 'aracha_t', 86300),
          stat('Japan', 2025, 'aracha_t', 75100),
          stat('Japan', 2025, 'aracha_t', 73372, 'zencharen'),
          stat('Japan', 2025, 'tencha_t', 6278, 'zencharen'),
          stat('Shizuoka', 2025, 'aracha_t', 24100),
          stat('Kyoto', 2016, 'cultivated_ha', 1580),
          stat('Kyoto', 2026, 'cultivated_ha', 1510),
          stat('Kyoto', 2025, 'aracha_t', 2280),
          stat('Kyoto', 2025, 'aracha_t', 2121, 'zencharen'),
          stat('Kyoto', 2025, 'tencha_t', 989, 'zencharen'),
        ],
        error: null,
      },
      regions: { data: [{ id: REGION, name: 'Uji, Kyoto', prefecture: 'Kyoto' }], error: null },
    });

    render(await SupplyPage());

    expect(nextServer.connection).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tea supply in numbers' })
    ).toBeInTheDocument();
    expect(screen.getByText('31,900 ha')).toBeInTheDocument();
    expect(screen.getByText('−4% since 2025')).toBeInTheDocument();
    expect(screen.getByText('−13% since 2018')).toBeInTheDocument();
    expect(screen.getByText('8.6% of all tea')).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards.map((c) => within(c).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Kyoto',
      'Shizuoka',
    ]);
    expect(within(cards[0]).getByRole('link', { name: 'Uji, Kyoto' })).toHaveAttribute(
      'href',
      `/explore?region=${REGION}`
    );
    expect(cards[0]).toHaveTextContent('989 t');
    expect(cards[0]).toHaveTextContent('47% of its tea');
    expect(cards[0]).toHaveTextContent('−4% since 2016');
    expect(cards[1]).toHaveTextContent('Not reported');
    expect(screen.getByText(/農林水産省「作物統計調査」/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aichi Prefecture' })).toBeInTheDocument();
  });

  it('says so before the figures are seeded', async () => {
    useServer({
      tea_production_stats: { data: [], error: null },
      regions: { data: [], error: null },
    });

    render(await SupplyPage());

    expect(screen.getByText('No harvest figures loaded yet.')).toBeInTheDocument();
    expect(screen.queryByText('All figures')).not.toBeInTheDocument();
  });
});

describe('Sell page', () => {
  const vendor = (status: string) => ({
    id: 'v1',
    name: 'Kyoto Leaf',
    profile_info: null,
    website: null,
    country: 'JP',
    ships_to: ['SG', 'JP'],
    status,
  });

  it('asks a signed-out visitor to sign in', async () => {
    useServer({});
    renderWithQuery(await SellPage());
    expect(screen.getByRole('button', { name: 'Sign in to apply' })).toBeInTheDocument();
  });

  it('shows the application form before a user has applied', async () => {
    useServer({ vendors: { data: null, error: null } }, { id: 'u1' });
    renderWithQuery(await SellPage());
    expect(screen.getByRole('form', { name: 'Apply to sell' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply to sell' })).toBeInTheDocument();
  });

  it('shows a rejected shop the reason and lets it apply again', async () => {
    useServer(
      { vendors: { data: { ...vendor('rejected'), review_note: 'Add a website.' }, error: null } },
      { id: 'u1' }
    );
    renderWithQuery(await SellPage());
    expect(screen.getByText(/Our note: Add a website\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply again' })).toBeInTheDocument();
  });

  it('says a pending shop is under review and offers no listing form', async () => {
    useServer({ vendors: { data: vendor('pending'), error: null } }, { id: 'u1' });
    renderWithQuery(await SellPage());
    expect(screen.getByText('Kyoto Leaf is under review.')).toBeInTheDocument();
    expect(screen.getByLabelText('Shop name')).toHaveValue('Kyoto Leaf');
    expect(screen.getByLabelText('Ships to')).toHaveValue('SG, JP');
    expect(screen.queryByRole('form', { name: 'Add a listing' })).not.toBeInTheDocument();
  });

  it('lets an approved vendor manage listings, offering only teas not yet listed', async () => {
    useServer(
      {
        vendors: { data: vendor('approved'), error: null },
        listings: {
          data: [
            {
              id: 'l1',
              vendor_id: 'v1',
              product_id: 'p1',
              price: '32.50',
              currency: 'SGD',
              stock: 4,
              url: 'https://leaf.example/sayaka',
              updated_at: '2026-10-24T00:00:00Z',
            },
          ],
          error: null,
        },
        // The catalogue read starts first; the listings' tea lookup waits for the listings.
        products: [
          {
            data: [
              { id: 'p1', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' },
              { id: 'p2', name: 'Wako', brand: 'Marukyu Koyamaen', category: 'matcha' },
            ],
            error: null,
          },
          {
            data: [{ id: 'p1', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' }],
            error: null,
          },
        ],
      },
      { id: 'u1' }
    );
    renderWithQuery(await SellPage());

    expect(screen.getByText('Sayaka')).toBeInTheDocument();
    expect(screen.getByText(/SGD.32\.50 · 4 in stock/)).toBeInTheDocument();
    const picker = screen.getByLabelText('Tea');
    expect(
      within(picker)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['Pick a tea from the catalogue', 'Wako · Marukyu Koyamaen']);
    expect(screen.getByLabelText('Currency')).toHaveValue('SGD');
  });
});

describe('Account page', () => {
  it('asks a visitor to sign in', async () => {
    useServer({});
    renderWithQuery(await AccountPage());
    expect(screen.getByText('Sign in to manage your name and your data.')).toBeInTheDocument();
  });

  it('shows a signed-in person their name, export and deletion', async () => {
    useServer(
      {
        profiles: {
          data: { email: 'aiko@example.com', display_name: 'Aiko', is_public: true },
          error: null,
        },
        blocks: { data: [{ blocked_id: 'u9' }], error: null },
        public_profiles: { data: [{ id: 'u9', display_name: 'Spammy' }], error: null },
      },
      { id: 'u1' }
    );
    renderWithQuery(await AccountPage());
    expect(screen.getByRole('button', { name: 'Make my profile private' })).toBeInTheDocument();
    expect(screen.getByText('Spammy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See your profile' })).toHaveAttribute('href', '/u/u1');

    expect(screen.getByText('Signed in as aiko@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Name shown on your reviews')).toHaveValue('Aiko');
    expect(screen.getByRole('button', { name: 'Download my data' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete my account' })).toBeDisabled();
  });
});

describe('Profile page', () => {
  const PROFILE = '0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d';
  const tasting = {
    ...reviewRow('r1', 'p1', '2026-10-05', 5),
    user_id: PROFILE,
    notes: 'Deep umami',
  };

  it('shows a public taster’s counts, taste and recent tastings, with Follow', async () => {
    useServer(
      {
        public_profiles: {
          data: {
            id: PROFILE,
            display_name: 'Ben',
            is_public: true,
            created_at: '2026-09-01T00:00:00Z',
          },
          error: null,
        },
        latest_reviews: [
          { data: null, count: 1, error: null },
          { data: [tasting], error: null },
        ],
        // The fake resolves .maybeSingle() when it is built, before the awaited counts.
        follows: [
          { data: null, error: null },
          { data: null, count: 4, error: null },
          { data: null, count: 2, error: null },
        ],
        blocks: { data: null, error: null },
        products: {
          data: [{ id: 'p1', name: 'Kyoto Bancha', brand: 'Ippodo', category: 'hojicha' }],
          error: null,
        },
      },
      { id: 'viewer' }
    );

    renderWithQuery(await ProfilePage({ params: Promise.resolve({ id: PROFILE }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Ben' })).toBeInTheDocument();
    expect(screen.getByText(/1 tea rated · 4 followers · 2 following/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Follow' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: "Ben's taste" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kyoto Bancha' })).toHaveAttribute(
      'href',
      '/products/p1'
    );
    expect(screen.getByText('Deep umami')).toBeInTheDocument();
  });

  it('shows only the name of a private taster', async () => {
    useServer({
      public_profiles: {
        data: {
          id: PROFILE,
          display_name: 'Ben',
          is_public: false,
          created_at: '2026-09-01T00:00:00Z',
        },
        error: null,
      },
      latest_reviews: { data: null, count: 1, error: null },
      follows: { data: null, count: 0, error: null },
    });

    renderWithQuery(await ProfilePage({ params: Promise.resolve({ id: PROFILE }) }));

    expect(screen.getByText(/Ben keeps their profile private/)).toBeInTheDocument();
    expect(screen.queryByText(/followers/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recent tastings' })).not.toBeInTheDocument();
  });

  it('404s for an unknown or malformed id', async () => {
    useServer({ public_profiles: { data: null, error: null } });
    await expect(ProfilePage({ params: Promise.resolve({ id: PROFILE }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    await expect(ProfilePage({ params: Promise.resolve({ id: 'nope' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });
});

describe('Admin page', () => {
  it('404s for visitors and for signed-in people who are not admins', async () => {
    useServer({});
    await expect(AdminPage()).rejects.toThrow('NEXT_NOT_FOUND');

    useServer({ 'rpc:is_admin': { data: false, error: null } }, { id: 'u1' });
    await expect(AdminPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect((await adminMetadata()).title).toBe('Not found');
  });

  it('shows an admin the pending teas and shops', async () => {
    useServer(
      {
        'rpc:is_admin': { data: true, error: null },
        products: [
          {
            data: [
              {
                id: 't1',
                name: 'Hoshi',
                brand: 'Farm',
                category: 'matcha',
                grade: null,
                added_by: null,
                created_at: '2026-10-24T00:00:00Z',
              },
            ],
            error: null,
          },
          {
            data: [{ id: 'p1', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' }],
            error: null,
          },
        ],
        vendors: { data: [], error: null },
        content_reports: { data: [], error: null },
      },
      { id: 'admin' }
    );

    renderWithQuery(await AdminPage());

    expect(screen.getByRole('heading', { name: 'Teas awaiting review (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve Hoshi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shop applications (0)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Review queue, 1 waiting' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: 'Tea that Hoshi duplicates' }));
    expect(await screen.findAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('tab', { name: 'Reports' }));
    expect(screen.getByRole('heading', { name: 'Reports (0)' })).toBeInTheDocument();
  });
});

describe('Public error boundary', () => {
  it('offers a retry and a way back to Explore, with the reference', async () => {
    const retry = vi.fn();
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    render(<PublicError error={error} retry={retry} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'We couldn’t load this page' })
    ).toBeInTheDocument();
    expect(screen.getByText('Reference: abc123')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore teas' })).toHaveAttribute('href', '/explore');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('handles a thrown value that is not an Error', () => {
    render(<PublicError error="nope" retry={() => {}} />);
    expect(screen.queryByText(/Reference/)).not.toBeInTheDocument();
  });
});

describe('Product page', () => {
  it('shows the product, its taste, facts, photos and community reviews', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    useServer({
      products: {
        data: { ...productRow, shop_url: 'https://global.ippodo-tea.co.jp/products/bancha601102' },
        error: null,
      },
      stock_reports: { data: { status: 'sold_out', created_at: twoDaysAgo }, error: null },
      review_likes: { data: [{ review_id: 'r1', user_id: 'someone' }], error: null },
      review_comments: { data: [], error: null },
      listings: {
        data: [
          {
            id: 'l1',
            vendor_id: 'v1',
            product_id: 'p1',
            price: '18.00',
            currency: 'SGD',
            stock: 3,
            url: 'https://leaf.example/bancha',
            updated_at: '2026-10-24T00:00:00Z',
          },
        ],
        error: null,
      },
      vendors: {
        data: [
          {
            id: 'v1',
            name: 'Kyoto Leaf',
            profile_info: null,
            website: null,
            country: 'JP',
            ships_to: ['SG'],
            status: 'approved',
          },
        ],
        error: null,
      },
      product_ratings: { data: { product_id: 'p1', avg_stars: 4, review_count: 1 }, error: null },
      'rpc:product_reviews': {
        data: [
          {
            id: 'r1',
            product_id: 'p1',
            user_id: 'u1',
            stars: 4,
            notes: 'Toasty',
            photo_url: 'https://cdn.test/cup.jpg',
            created_at: '2026-09-02T00:00:00Z',
            flavor_notes: ['roasty'],
            sweetness: null,
            umami: null,
            bitterness: null,
            body: null,
            prep_method: null,
            dose_g: null,
            water_ml: null,
            water_temp_c: null,
            tasted_on: '2026-09-02',
          },
        ],
        error: null,
      },
      public_profiles: { data: [{ id: 'u1', display_name: 'Aiko' }], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Kyoto Bancha' })).toBeInTheDocument();
    expect(screen.getAllByText('Ippodo')).toHaveLength(2);
    expect(screen.getAllByText('4.0')[0]).toHaveClass('text-6xl');
    expect(screen.getAllByText('1 rating')).toHaveLength(2);
    expect(screen.getByText('Rate it')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: 'Rate Kyoto Bancha' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Want to try' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What does it taste like?' })).toBeInTheDocument();
    expect(screen.getByText('1 mention of roasted notes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Facts about the tea' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tasting photo 1' })).toHaveAttribute(
      'src',
      'https://cdn.test/cup.jpg'
    );
    expect(screen.getByText('Toasty')).toBeInTheDocument();
    expect(screen.getByText('Aiko')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Community reviews' }).closest('section')
    ).toHaveAttribute('id', 'rate');
    const stock = screen.getByRole('heading', { name: 'Stock at the official shop' })
      .parentElement as HTMLElement;
    expect(stock).toHaveTextContent('Sold out');
    expect(stock).toHaveTextContent('reported 2 days ago');
    expect(within(stock).getByRole('link', { name: /Check Ippodo’s shop/ })).toHaveAttribute(
      'href',
      'https://global.ippodo-tea.co.jp/products/bancha601102'
    );
    expect(screen.queryByText('Awaiting review.')).not.toBeInTheDocument();
    expect(screen.queryByText('Not added to the catalogue.')).not.toBeInTheDocument();
    // Reactions sit under each review.
    expect(screen.getByRole('button', { name: 'Like (1)' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: '0 comments' })).toBeInTheDocument();
    const buy = screen
      .getByRole('heading', { name: 'Where to buy' })
      .closest('section') as HTMLElement;
    expect(buy).toHaveTextContent('Kyoto Leaf');
    expect(buy).toHaveTextContent('Ships from Japan to Singapore');
    expect(buy).toHaveTextContent('3 left');
    expect(within(buy).getByRole('link', { name: /Buy from Kyoto Leaf/ })).toHaveAttribute(
      'href',
      'https://leaf.example/bancha'
    );
  });

  it('shows an unrated product with its grade and region', async () => {
    useServer({
      products: {
        data: { ...productRow, grade: 'First flush', region_id: REGION, status: 'pending' },
        error: null,
      },
      regions: { data: { id: REGION, name: 'Uji, Kyoto' }, error: null },
      product_ratings: { data: null, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.getByText('Not yet rated')).toBeInTheDocument();
    expect(screen.getByText('Awaiting review.')).toBeInTheDocument();
    expect(screen.getAllByText('First flush')).toHaveLength(2);
    expect(screen.getAllByText('Uji, Kyoto')).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Photos' })).not.toBeInTheDocument();
    expect(screen.getByText('No reviews yet. Be the first to rate it.')).toBeInTheDocument();
    // Someone else's tea awaiting review: no rating, buying or stock tools.
    expect(screen.queryByText('Rate it')).not.toBeInTheDocument();
    expect(screen.queryByText('Add your rating')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Where to buy' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Stock at the official shop' })
    ).not.toBeInTheDocument();
  });

  it('lets whoever added a tea awaiting review rate it', async () => {
    useServer(
      {
        products: { data: { ...productRow, status: 'pending', added_by: 'u1' }, error: null },
        product_ratings: { data: null, error: null },
        'rpc:product_reviews': { data: [], error: null },
        latest_reviews: { data: [], error: null },
        stock_reports: { data: null, error: null },
        listings: { data: [], error: null },
      },
      { id: 'u1' }
    );

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.getByText('Rate it')).toBeInTheDocument();
    expect(screen.getByText('Add your rating')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Where to buy' })).not.toBeInTheDocument();
  });

  it('credits the photo under the image when the tea has both', async () => {
    useServer({
      products: {
        data: {
          ...productRow,
          image_url: 'https://cdn.test/tin.webp',
          image_credit: 'Marukyu Koyamaen',
        },
        error: null,
      },
      product_ratings: { data: null, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.getByText('Photo: Marukyu Koyamaen')).toBeInTheDocument();
  });

  it('shows no credit without a photo, even if one is stored', async () => {
    useServer({
      products: { data: { ...productRow, image_credit: 'Marukyu Koyamaen' }, error: null },
      product_ratings: { data: null, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.queryByText(/^Photo:/)).not.toBeInTheDocument();
  });

  it('invites sellers and stock reports on an approved tea nobody sells yet', async () => {
    useServer({
      products: { data: productRow, error: null },
      product_ratings: { data: null, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.getByText('No recent reports')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sell it on Matchoji' })).toHaveAttribute(
      'href',
      '/sell'
    );
    expect(screen.queryByRole('link', { name: /shop/ })).not.toBeInTheDocument();
  });

  it('shows a priced tea’s pack price, price per gram, cost per cup and band', async () => {
    const { calls } = useServer({
      products: { data: { ...productRow, price_sgd: '24.00', pack_grams: '80.0' }, error: null },
      product_ratings: { data: null, error: null },
      tea_prices: { data: { price_band: 'budget' }, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    const price = screen.getByText('Price').nextElementSibling;
    expect(price).toHaveTextContent('S$24.00 for 80 g · S$0.30/g');
    expect(price).toHaveTextContent('≈ S$0.90 per cup (3 g)');
    expect(price).toHaveTextContent('Budget for hojicha');
    expect(calls).toContainEqual({ table: 'tea_prices', method: 'eq', args: ['product_id', 'p1'] });
  });

  it('forwards a merged duplicate to the tea it repeated', async () => {
    useServer({
      products: {
        data: { ...productRow, status: 'rejected', merged_into: 'keep-id' },
        error: null,
      },
      product_ratings: { data: null, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });
    await expect(ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) })).rejects.toThrow(
      'NEXT_REDIRECT /products/keep-id'
    );
  });

  it('shows a signed-in taster how well an unrated tea suits them, and why', async () => {
    useServer(
      {
        products: [
          { data: productRow, error: null },
          {
            data: [
              { id: 'p1', name: 'Kyoto Bancha', category: 'hojicha', grade: null, region_id: null },
              { id: 'p9', name: 'Gokujo', category: 'hojicha', grade: null, region_id: null },
            ],
            error: null,
          },
        ],
        product_ratings: { data: null, error: null },
        'rpc:product_reviews': { data: [], error: null },
        latest_reviews: { data: [{ product_id: 'p9', stars: 5 }], error: null },
        tea_taste_profiles: { data: [], error: null },
        stock_reports: { data: null, error: null },
        listings: { data: [], error: null },
      },
      { id: 'u1' }
    );

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.getByText('match for you')).toBeInTheDocument();
    expect(screen.getByText('Because you rated Gokujo 5★.')).toBeInTheDocument();
  });

  it('titles the page with the tea and brand, and keeps unlisted teas out of search', async () => {
    useServer({
      products: { data: { ...productRow, status: 'pending' }, error: null },
      product_ratings: { data: { product_id: 'p1', avg_stars: 4, review_count: 2 }, error: null },
    });
    const meta = await generateMetadata({ params: Promise.resolve({ id: PRODUCT_ID }) });
    expect(meta.title).toBe('Kyoto Bancha · Ippodo');
    expect(meta.description).toBe(
      'Kyoto Bancha · Ippodo: hojicha. 4.0 out of 5 from 2 ratings on Matchoji.'
    );
    expect(meta.robots).toEqual({ index: false });
  });

  it('404s a malformed tea id without querying', async () => {
    const fake = useServer({});
    await expect(ProductPage({ params: Promise.resolve({ id: 'p1' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(fake.calls).toEqual([]);
  });

  it('tells the taster who added a rejected tea why it is not in the catalogue', async () => {
    useServer({
      products: { data: { ...productRow, status: 'rejected' }, error: null },
      product_ratings: { data: null, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: PRODUCT_ID }) }));

    expect(screen.getByText('Not added to the catalogue.')).toBeInTheDocument();
  });

  it('404s for an unknown product', async () => {
    useServer({
      products: { data: null, error: null },
      'rpc:product_reviews': { data: [], error: null },
      stock_reports: { data: null, error: null },
      listings: { data: [], error: null },
    });
    await expect(ProductPage({ params: Promise.resolve({ id: 'nope' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });
});

const reviewRow = (id: string, productId: string, tastedOn: string, stars: number) => ({
  id,
  product_id: productId,
  user_id: 'u1',
  stars,
  notes: null,
  photo_url: null,
  created_at: `${tastedOn}T00:00:00Z`,
  flavor_notes: ['roasty'],
  sweetness: null,
  umami: null,
  bitterness: null,
  body: null,
  prep_method: 'steeped',
  dose_g: 5,
  water_ml: 300,
  water_temp_c: 95,
  tasted_on: tastedOn,
});

describe('Journal page', () => {
  // Without a request-time API before the Supabase check, Next prerenders /journal at build
  // time and a build without Supabase env vars fails (it broke the Vercel preview).
  it('renders per request: waits for the connection before reading the user', async () => {
    const order: string[] = [];
    nextServer.connection.mockImplementationOnce(async () => {
      order.push('connection');
    });
    server.current = {
      from: vi.fn(),
      auth: {
        getUser: async () => {
          order.push('getUser');
          return { data: { user: null }, error: null };
        },
      },
    };

    await JournalPage();

    expect(order).toEqual(['connection', 'getUser']);
  });

  it('journal signed out shows sign-in', async () => {
    useServer({});
    renderWithQuery(await JournalPage());

    expect(screen.getByRole('heading', { name: 'Your journal' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign in to start your journal' })
    ).toBeInTheDocument();
  });

  it('invites a first tasting when the journal is empty', async () => {
    useServer(
      { reviews: { data: [], error: null }, wishlist: { data: [], error: null } },
      { id: 'u1' }
    );
    renderWithQuery(await JournalPage());

    expect(screen.getByText(/No tastings yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log a tasting' })).toBeInTheDocument();
  });

  it('journal lists tastings by month and the want-to-try list', async () => {
    browser.current = createFakeBrowserClient({
      session: makeSession({ id: 'u1' }),
      results: { wishlist: { data: [{ product_id: 'p9' }], error: null } },
    }).client;
    useServer(
      {
        reviews: {
          data: [reviewRow('r2', 'p1', '2026-10-05', 5), reviewRow('r1', 'p1', '2026-09-12', 3)],
          error: null,
        },
        products: [
          {
            data: [{ id: 'p1', name: 'Kyoto Bancha', brand: 'Ippodo', category: 'hojicha' }],
            error: null,
          },
          { data: [{ id: 'p9', name: 'Uji Gold', brand: null, category: 'matcha' }], error: null },
        ],
        wishlist: { data: [{ product_id: 'p9' }], error: null },
      },
      { id: 'u1' }
    );
    renderWithQuery(await JournalPage());

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'September 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Kyoto Bancha/ })[0]).toHaveAttribute(
      'href',
      '/products/p1'
    );
    expect(screen.getAllByText('Steeped · 5g · 300ml · 95°C')).toHaveLength(2);
    expect(await screen.findByRole('link', { name: 'Uji Gold' })).toHaveAttribute(
      'href',
      '/products/p9'
    );
    expect(screen.getByRole('button', { name: 'Remove Uji Gold' })).toBeInTheDocument();
    // Your taste reads one tea (its latest tasting), so it is an early read.
    expect(screen.getByRole('heading', { name: 'Your taste' })).toBeInTheDocument();
    expect(screen.getByText(/Early read from 1 tea/)).toBeInTheDocument();
  });
});

describe('static routes', () => {
  it('render loading skeletons as busy regions', () => {
    render(
      <>
        <HomeLoading />
        <ExploreLoading />
        <ProductLoading />
        <JournalLoading />
        <RegionsLoading />
      </>
    );
    expect(screen.getAllByLabelText('Loading')).toHaveLength(5);
  });

  it('auth error page links back home', () => {
    render(<AuthErrorPage />);
    expect(screen.getByRole('heading', { name: 'Sign-in failed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Matchoji' })).toHaveAttribute('href', '/');
  });

  it('footer shows the wordmark, tagline, section links and only real extra links', () => {
    const { rerender } = render(<SiteFooter />);
    expect(screen.getByText('Matchoji')).toBeInTheDocument();
    expect(
      screen.getByText('Rate and discover matcha and hojicha, one cup at a time.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('href', '/journal');
    expect(screen.getByRole('link', { name: 'Sell on Matchoji' })).toHaveAttribute('href', '/sell');
    expect(screen.getByRole('link', { name: 'Regions' })).toHaveAttribute('href', '/regions');
    expect(screen.getByRole('link', { name: 'Tea supply' })).toHaveAttribute(
      'href',
      '/regions/supply'
    );
    expect(screen.getByRole('link', { name: 'Learn' })).toHaveAttribute('href', '/learn');
    expect(screen.getAllByRole('link')).toHaveLength(7);
    const takedown = screen.getByRole('link', { name: 'Ask us to take it down.' });
    expect(takedown).toHaveAttribute(
      'href',
      'https://github.com/cljiahao/matchoji/issues/new?title=Photo%20removal%20request'
    );
    expect(takedown).toHaveAttribute('target', '_blank');
    expect(takedown).toHaveAttribute('rel', 'noopener noreferrer');

    rerender(<SiteFooter links={[{ label: 'About', href: '/about' }]} />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });
});
