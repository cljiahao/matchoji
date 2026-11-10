// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  cafes: [] as unknown[],
  listCafes: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (state.cookie ? { value: state.cookie } : undefined) }),
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/cafes' }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/components/widgets/log-dialog', () => ({
  AddCafeCta: () => <button>Add a café</button>,
}));
vi.mock('@/components/widgets/tea-map', () => ({ TeaMap: () => <div>map</div> }));
vi.mock('@/features/cafes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/cafes')>()),
  listCafes: (...args: unknown[]) => state.listCafes(...args),
}));

import CafesPage, { generateMetadata } from './page';

const cafe = (id: string, area: string | null) => ({
  id,
  slug: `cafe-${id}`,
  name: `Café ${id}`,
  citySlug: 'singapore',
  area,
  address: null,
  lat: 1.3,
  lng: 103.8,
  instagramHandle: null,
  websiteUrl: null,
  status: 'approved',
  drinkCount: 2,
  scores: {
    tasterAvg: null,
    tasterCount: 0,
    tasterDisclosedCount: 0,
    communityAvg: null,
    communityCount: 0,
  },
});

const search = (sp: Record<string, string> = {}) => ({ searchParams: Promise.resolve(sp) });

beforeEach(() => {
  state.cookie = undefined;
  state.listCafes.mockReset();
  state.listCafes.mockResolvedValue([cafe('1', 'Bugis'), cafe('2', 'Tiong Bahru')]);
});

describe('cafés page', () => {
  it('lists the café cards and area options for the default city', async () => {
    render(await CafesPage(search()));
    expect(state.listCafes).toHaveBeenLastCalledWith(expect.anything(), {
      city: 'singapore',
      area: undefined,
      tasterOnly: false,
    });
    expect(screen.getByRole('link', { name: /Café 1/ }).getAttribute('href')).toBe('/cafes/cafe-1');
    expect(screen.getByRole('option', { name: 'Bugis' })).toBeTruthy();
  });

  it('?city= beats the cookie', async () => {
    state.cookie = 'singapore';
    render(await CafesPage(search({ city: 'johor-bahru' })));
    expect(state.listCafes.mock.calls[0][1]).toMatchObject({ city: 'johor-bahru' });
  });

  it('falls back to the default city for an unknown ?city=', async () => {
    render(await CafesPage(search({ city: 'bogus' })));
    expect(state.listCafes.mock.calls[0][1]).toMatchObject({ city: 'singapore' });
  });

  it('uses the cookie without a query, and passes area and taster filters', async () => {
    state.cookie = 'johor-bahru';
    render(await CafesPage(search({ area: 'Bugis', taster: '1' })));
    expect(state.listCafes.mock.calls[0][1]).toEqual({
      city: 'johor-bahru',
      area: 'Bugis',
      tasterOnly: true,
    });
  });

  it('reads well with zero cafés', async () => {
    state.listCafes.mockResolvedValue([]);
    render(await CafesPage(search()));
    expect(screen.getByText(/No cafés listed in Singapore yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a café' })).toBeTruthy();
  });

  it('offers no add-café call to action when filters, not an empty city, hid the cafés', async () => {
    state.listCafes.mockResolvedValue([]);
    render(await CafesPage(search({ area: 'Bugis' })));
    expect(screen.getByText(/No cafés match those filters/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add a café' })).toBeNull();
  });
});

describe('cafés page metadata', () => {
  it('names a self-referencing canonical per city', async () => {
    const sg = await generateMetadata(search({ city: 'singapore' }));
    const jb = await generateMetadata(search({ city: 'johor-bahru' }));
    expect(sg.alternates?.canonical).toBe('/cafes?city=singapore');
    expect(jb.alternates?.canonical).toBe('/cafes?city=johor-bahru');
  });

  it('follows the cookie, then the default, when there is no ?city=', async () => {
    state.cookie = 'johor-bahru';
    expect((await generateMetadata(search())).alternates?.canonical).toBe(
      '/cafes?city=johor-bahru'
    );
    state.cookie = undefined;
    expect((await generateMetadata(search({ city: 'bogus' }))).alternates?.canonical).toBe(
      '/cafes?city=singapore'
    );
  });

  it('is indexable when the city has cafés', async () => {
    expect((await generateMetadata(search())).robots).toBeUndefined();
  });

  it('is noindex while the city has no cafés', async () => {
    state.listCafes.mockResolvedValue([]);
    expect((await generateMetadata(search())).robots).toEqual({ index: false });
  });
});
