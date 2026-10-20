// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../support/fake-browser-client';
import { createFakeSupabase, type QueryResult } from '../support/fake-supabase';
import { renderWithQuery } from '../support/render';

const server = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => server.current }));

const browser = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => browser.current }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/',
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import DiscoverLoading from '@/app/(public)/loading';
import Home from '@/app/(public)/page';
import ProductLoading from '@/app/(public)/products/[id]/loading';
import ProductPage from '@/app/(public)/products/[id]/page';
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

function useServer(results: Record<string, QueryResult | QueryResult[]>) {
  const fake = createFakeSupabase(results);
  server.current = fake.client;
  return fake;
}

beforeEach(() => {
  browser.current = createFakeBrowserClient().client;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Discover page', () => {
  it('lists products from Supabase for the selected category', async () => {
    const { calls } = useServer({
      products: { data: [productRow], error: null },
      product_ratings: { data: [], error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(await Home({ searchParams: Promise.resolve({ category: 'hojicha' }) }));

    expect(screen.getByRole('heading', { name: 'Discover' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kyoto Bancha/ })).toHaveAttribute(
      'href',
      '/products/p1'
    );
    expect(calls).toContainEqual({
      table: 'products',
      method: 'eq',
      args: ['category', 'hojicha'],
    });
  });

  it('ignores unknown categories and shows the empty state', async () => {
    const { calls } = useServer({
      products: { data: [], error: null },
      regions: { data: [], error: null },
    });

    renderWithQuery(await Home({ searchParams: Promise.resolve({ category: 'sencha' }) }));

    expect(screen.getByText(/No tastings logged yet/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'eq')).toBe(false);
  });

  it('shows a no-results state with a clear-filters link when a search matches nothing', async () => {
    useServer({ products: { data: [], error: null }, regions: { data: [], error: null } });

    renderWithQuery(await Home({ searchParams: Promise.resolve({ q: 'gyokuro' }) }));

    expect(screen.getByText('No teas match “gyokuro”.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute('href', '/');
  });

  it('uses mock data in development without Supabase', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NODE_ENV', 'development');

    renderWithQuery(await Home({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('link', { name: /Uji Ceremonial/ })).toBeInTheDocument();
  });
});

describe('Product page', () => {
  it('shows the product, its reviews and the inline rate form', async () => {
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
            photo_url: null,
            created_at: '2026-09-02T00:00:00Z',
          },
        ],
        error: null,
      },
      public_profiles: { data: [{ id: 'u1', display_name: 'Aiko' }], error: null },
    });

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: 'p1' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Kyoto Bancha' })).toBeInTheDocument();
    expect(screen.getByText('4.0 (1 review)')).toBeInTheDocument();
    expect(screen.getByText('Toasty')).toBeInTheDocument();
    expect(screen.getByText('Aiko')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rate it' }).closest('section')).toHaveAttribute(
      'id',
      'rate'
    );
  });

  it('404s for an unknown product', async () => {
    useServer({ products: { data: null, error: null }, reviews: { data: [], error: null } });
    await expect(ProductPage({ params: Promise.resolve({ id: 'nope' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });

  it('uses mock data in development without Supabase', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NODE_ENV', 'development');

    renderWithQuery(await ProductPage({ params: Promise.resolve({ id: 'mock-1' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Uji Ceremonial' })).toBeInTheDocument();
  });
});

describe('static routes', () => {
  it('render loading skeletons as busy regions', () => {
    render(
      <>
        <DiscoverLoading />
        <ProductLoading />
      </>
    );
    expect(screen.getAllByLabelText('Loading')).toHaveLength(2);
  });

  it('auth error page links back home', () => {
    render(<AuthErrorPage />);
    expect(screen.getByRole('heading', { name: 'Sign-in failed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Matchoji' })).toHaveAttribute('href', '/');
  });

  it('footer shows the wordmark and only real links', () => {
    const { rerender } = render(<SiteFooter />);
    expect(screen.getByText('Matchoji')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    rerender(<SiteFooter links={[{ label: 'About', href: '/about' }]} />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });
});
