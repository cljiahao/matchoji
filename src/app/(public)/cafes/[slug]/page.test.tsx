// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ page: { kind: 'missing' } as unknown }));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  permanentRedirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/components/widgets/tea-map', () => ({ TeaMap: () => <div>map</div> }));
vi.mock('@/features/share', () => ({
  cafeJsonLd: () => ({}),
  cafeMetadata: () => ({ title: 'Kurasu' }),
  serializeJsonLd: () => '{}',
}));
vi.mock('@/features/cafes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/cafes')>()),
  getCafePage: async () => state.page,
  latestTasterReviews: async () => [],
}));

import CafePage, { generateMetadata } from './page';

const cafe = {
  id: 'c1',
  slug: 'kurasu-bugis',
  name: 'Kurasu',
  citySlug: 'singapore',
  area: 'Bugis',
  address: '1 Bugis St',
  lat: 1.3,
  lng: 103.85,
  instagramHandle: 'kurasu',
  websiteUrl: 'https://kurasu.test',
  status: 'approved',
};
const scores = {
  tasterAvg: null,
  tasterCount: 0,
  tasterDisclosedCount: 0,
  communityAvg: null,
  communityCount: 0,
};

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  state.page = { kind: 'missing' };
});

describe('café page', () => {
  it('notFound for unknown slug', async () => {
    await expect(CafePage(params('nope'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('notFound for a malformed slug without reading', async () => {
    await expect(CafePage(params('../x'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('permanently redirects a merged café', async () => {
    state.page = { kind: 'redirect', to: '/cafes/new' };
    await expect(CafePage(params('old'))).rejects.toThrow('REDIRECT:/cafes/new');
  });

  it('renders the café, its handle link and an empty drinks state', async () => {
    state.page = { kind: 'found', cafe, scores, drinks: [] };
    render(await CafePage(params('kurasu-bugis')));
    expect(screen.getByRole('heading', { level: 1, name: 'Kurasu' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /@kurasu/ }).getAttribute('href')).toBe(
      'https://www.instagram.com/kurasu/'
    );
    expect(screen.getByText(/No drinks listed/)).toBeTruthy();
  });

  it('lists drinks with a link to each drink page', async () => {
    state.page = {
      kind: 'found',
      cafe,
      scores,
      drinks: [
        {
          id: 'd1',
          cafeId: 'c1',
          slug: 'hojicha-latte',
          name: 'Hojicha Latte',
          base: 'hojicha',
          style: 'latte',
          serving: 'both',
          price: 7.5,
          currency: 'SGD',
          photoUrl: null,
          photoCredit: null,
          teaProductId: null,
          status: 'approved',
          scores,
          cafe: { slug: 'kurasu-bugis', name: 'Kurasu', area: 'Bugis', citySlug: 'singapore' },
        },
      ],
    };
    render(await CafePage(params('kurasu-bugis')));
    expect(screen.getByRole('link', { name: /Hojicha Latte/ }).getAttribute('href')).toBe(
      '/cafes/kurasu-bugis/hojicha-latte'
    );
  });

  it('shows an Awaiting review banner and no score for a pending café', async () => {
    state.page = { kind: 'found', cafe: { ...cafe, status: 'pending' }, scores, drinks: [] };
    render(await CafePage(params('kurasu-bugis')));
    expect(screen.getByRole('status').textContent).toMatch(/Awaiting review/);
    expect(screen.queryByText(/Tasters/)).toBeNull();
  });

  it('shows no banner for a listed café', async () => {
    state.page = { kind: 'found', cafe, scores, drinks: [] };
    render(await CafePage(params('kurasu-bugis')));
    expect(screen.queryByText(/Awaiting review/)).toBeNull();
  });

  it('metadata gives the not-found title for a missing café', async () => {
    expect(await generateMetadata(params('nope'))).toEqual({ title: 'Café not found' });
  });

  it('metadata describes a found café', async () => {
    state.page = { kind: 'found', cafe, scores, drinks: [] };
    expect(await generateMetadata(params('kurasu-bugis'))).toEqual({ title: 'Kurasu' });
  });
});
