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
}));

import PublicError from '@/app/(public)/error';
import ExploreLoading from '@/app/(public)/explore/loading';
import ExplorePage from '@/app/(public)/explore/page';
import JournalLoading from '@/app/(public)/journal/loading';
import JournalPage from '@/app/(public)/journal/page';
import HomeLoading from '@/app/(public)/loading';
import Home from '@/app/(public)/page';
import ProductLoading from '@/app/(public)/products/[id]/loading';
import ProductPage from '@/app/(public)/products/[id]/page';
import RegionsLoading from '@/app/(public)/regions/loading';
import RegionsPage from '@/app/(public)/regions/page';
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
  created_at: '2026-09-01T00:00:00Z',
};

function useServer(
  results: Record<string, QueryResult | QueryResult[]>,
  user: { id: string } | null = null
) {
  const fake = createFakeSupabase(results);
  server.current = {
    from: fake.client.from,
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

const row = (id: string, name: string, category: 'matcha' | 'hojicha', createdAt: string) => ({
  ...productRow,
  id,
  name,
  category,
  created_at: createdAt,
});

describe('Home page', () => {
  // Like /journal: without a request-time API first, Next prerenders / at build time and a
  // build without Supabase env vars fails.
  it('renders per request: waits for the connection before reading products', async () => {
    const fake = useServer({ products: { data: [], error: null } });
    nextServer.connection.mockImplementationOnce(async () => {
      throw new Error('prerender bail-out');
    });

    await expect(Home()).rejects.toThrow('prerender bail-out');
    expect(fake.calls).toHaveLength(0);
  });

  it('leads with search and the two teas, then shelves for each tea and the newest', async () => {
    const { calls } = useServer({
      products: [
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
      product_ratings: { data: [], error: null },
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

    expect(calls.filter((c) => c.table === 'products' && c.method === 'from')).toHaveLength(3);
    expect(calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([
      ['category', 'matcha'],
      ['category', 'hojicha'],
    ]);
  });

  it('hides an empty shelf and keeps the others', async () => {
    useServer({
      products: [
        { data: [row('m1', 'Uji Gold', 'matcha', '2026-09-01T00:00:00Z')], error: null },
        { data: [], error: null },
        { data: [row('m1', 'Uji Gold', 'matcha', '2026-09-01T00:00:00Z')], error: null },
      ],
      product_ratings: { data: [], error: null },
    });

    renderWithQuery(await Home());

    expect(screen.getByRole('region', { name: 'Top-rated matcha' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Top-rated hojicha' })).not.toBeInTheDocument();
    expect(screen.queryByText('No teas rated yet')).not.toBeInTheDocument();
  });

  it('invites the first tasting when the catalogue is empty', async () => {
    useServer({ products: { data: [], error: null } });

    renderWithQuery(await Home());

    expect(screen.getByRole('heading', { name: 'No teas rated yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log a tasting' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});

describe('Explore page', () => {
  it('lists products from Supabase for the selected category', async () => {
    const { calls } = useServer({
      products: { data: [productRow], error: null },
      product_ratings: { data: [], error: null },
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
    expect(screen.getByText('Showing 1 tea')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Want to try' })).toBeInTheDocument();
    expect(calls).toContainEqual({
      table: 'products',
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
  });

  it('titles a search and counts several teas', async () => {
    useServer({
      products: {
        data: [productRow, row('p2', 'Kyoto Gold', 'hojicha', '2026-09-03T00:00:00Z')],
        error: null,
      },
      product_ratings: { data: [], error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ q: 'kyoto' }) }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Results for “kyoto”' })
    ).toBeInTheDocument();
    expect(screen.getByText('Showing 2 teas')).toBeInTheDocument();
  });

  it('still shows the feed when regions fail to load', async () => {
    useServer({
      products: { data: [productRow], error: null },
      product_ratings: { data: [], error: null },
      regions: { data: null, error: new Error('boom') },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Explore teas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kyoto Bancha' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Region' })).not.toBeInTheDocument();
  });

  it('ignores unknown categories and shows the empty state', async () => {
    const { calls } = useServer({
      products: { data: [], error: null },
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
    useServer({ products: { data: [], error: null }, regions: { data: [], error: null } });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ category: 'matcha' }) }));

    expect(screen.getByText('No matcha rated yet. Be the first to rate one.')).toBeInTheDocument();
  });

  it('shows a no-results state with a clear-filters link when a search matches nothing', async () => {
    useServer({ products: { data: [], error: null }, regions: { data: [], error: null } });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ q: 'gyokuro' }) }));

    expect(screen.getByText('No teas match “gyokuro”.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute('href', '/explore');
    expect(screen.queryByRole('button', { name: 'Log a tasting' })).not.toBeInTheDocument();
  });

  it('treats an empty region as no match rather than an empty catalogue', async () => {
    useServer({
      products: { data: [], error: null },
      regions: { data: [{ id: REGION, name: 'Uji, Kyoto' }], error: null },
    });

    renderWithQuery(await ExplorePage({ searchParams: Promise.resolve({ region: REGION }) }));

    expect(screen.getByText('No teas from this region yet.')).toBeInTheDocument();
    expect(screen.getByText('Showing 0 teas')).toBeInTheDocument();
  });

  it('filters by grade and minimum rating, offering the grades of the other matches', async () => {
    useServer({
      products: {
        data: [
          { ...productRow, grade: 'Bancha' },
          { ...row('p2', 'Kyoto Gold', 'hojicha', '2026-09-03T00:00:00Z'), grade: 'Premium' },
          { ...row('p3', 'Kyoto Silver', 'hojicha', '2026-09-04T00:00:00Z'), grade: 'Premium' },
        ],
        error: null,
      },
      product_ratings: {
        data: [
          { product_id: 'p1', avg_stars: 4.8, review_count: 2 },
          { product_id: 'p2', avg_stars: 4.6, review_count: 1 },
          { product_id: 'p3', avg_stars: 3.2, review_count: 1 },
        ],
        error: null,
      },
      reviews: { data: [], error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(
      await ExplorePage({ searchParams: Promise.resolve({ grade: 'premium', rating: '4.5' }) })
    );

    expect(screen.getByRole('link', { name: 'Kyoto Gold' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Kyoto Bancha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Kyoto Silver' })).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 tea')).toBeInTheDocument();
    const grade = screen.getByRole('navigation', { name: 'Grade' });
    expect(within(grade).getByRole('link', { name: 'Bancha' })).toHaveAttribute(
      'href',
      '/explore?grade=Bancha&rating=4.5'
    );
  });

  it('says no teas match when grade or rating narrows to nothing', async () => {
    useServer({
      products: { data: [productRow], error: null },
      product_ratings: { data: [], error: null },
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
          { id: REGION, name: 'Uji, Kyoto', prefecture: 'Kyoto', scarcity_note: null },
          {
            id: '9b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e',
            name: 'Ise, Mie',
            prefecture: 'Mie',
            scarcity_note: 'Mostly sencha',
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

    render(await RegionsPage());

    expect(nextServer.connection).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'Tea regions' })).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', `/explore?region=${REGION}`);
    expect(links[0]).toHaveTextContent('Uji, Kyoto');
    expect(links[0]).toHaveTextContent('2 matcha');
    expect(links[0]).not.toHaveTextContent('hojicha');
    expect(links[1]).toHaveTextContent('No teas yet');
    expect(links[1]).toHaveTextContent('Mostly sencha');
  });

  it('says so when no regions are listed', async () => {
    useServer({ regions: { data: [], error: null }, products: { data: [], error: null } });

    render(await RegionsPage());

    expect(screen.getByText('No regions listed yet.')).toBeInTheDocument();
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
    useServer({
      products: { data: productRow, error: null },
      product_ratings: { data: [{ product_id: 'p1', avg_stars: 4, review_count: 1 }], error: null },
      reviews: {
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

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: 'p1' }) }));

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
  });

  it('shows an unrated product with its grade and region', async () => {
    useServer({
      products: { data: { ...productRow, grade: 'First flush', region_id: REGION }, error: null },
      regions: { data: [{ id: REGION, name: 'Uji, Kyoto' }], error: null },
      product_ratings: { data: [], error: null },
      reviews: { data: [], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: 'p1' }) }));

    expect(screen.getByText('Not yet rated')).toBeInTheDocument();
    expect(screen.getAllByText('First flush')).toHaveLength(2);
    expect(screen.getAllByText('Uji, Kyoto')).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Photos' })).not.toBeInTheDocument();
    expect(screen.getByText('No reviews yet. Be the first to rate it.')).toBeInTheDocument();
  });

  it('404s for an unknown product', async () => {
    useServer({ products: { data: null, error: null }, reviews: { data: [], error: null } });
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
    expect(screen.getAllByRole('link')).toHaveLength(2);

    rerender(<SiteFooter links={[{ label: 'About', href: '/about' }]} />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });
});
