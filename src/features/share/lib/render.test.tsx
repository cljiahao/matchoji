import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProduct = vi.fn();
const getProfileView = vi.fn();
const fetchPhoto = vi.fn();
const getPublicYear = vi.fn();

vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/products', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/products')>()),
  getProduct: (...args: unknown[]) => getProduct(...args),
}));
vi.mock('@/features/social', () => ({
  getProfileView: (...args: unknown[]) => getProfileView(...args),
}));
vi.mock('@/features/journal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/journal')>()),
  getPublicYear: (...args: unknown[]) => getPublicYear(...args),
}));
vi.mock('./fetch-photo', () => ({ fetchPhoto: (...args: unknown[]) => fetchPhoto(...args) }));

const getCafePage = vi.fn();
const getDrinkPage = vi.fn();
vi.mock('@/features/cafes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/cafes')>()),
  getCafePage: (...args: unknown[]) => getCafePage(...args),
  getDrinkPage: (...args: unknown[]) => getDrinkPage(...args),
}));

import {
  renderCafeImage,
  renderDrinkImage,
  renderProfileImage,
  renderSiteImage,
  renderTeaImage,
  renderYearImage,
} from './render';

const scores = {
  tasterAvg: 4.5,
  tasterCount: 2,
  tasterDisclosedCount: 1,
  communityAvg: null,
  communityCount: 0,
};
const cafe = {
  id: 'c1',
  slug: 'kurasu-bugis',
  name: 'Kurasu',
  citySlug: 'singapore',
  area: 'Bugis',
  address: null,
  lat: null,
  lng: null,
  instagramHandle: null,
  websiteUrl: null,
  status: 'approved',
};
const drink = {
  id: 'd1',
  cafeId: 'c1',
  slug: 'hojicha-latte',
  name: 'Hojicha Latte',
  base: 'hojicha',
  style: 'latte',
  serving: 'both',
  price: 7.5,
  currency: 'SGD',
  photoUrl: 'https://x.test/d.png',
  photoCredit: null,
  teaProductId: null,
  status: 'approved',
  scores,
  cafe: { slug: 'kurasu-bugis', name: 'Kurasu', area: 'Bugis', citySlug: 'singapore' },
};

const tea = {
  id: 'a',
  name: 'Samidori',
  brand: 'Ippodo',
  category: 'matcha',
  imageUrl: 'https://x.test/a.png',
  avgStars: 4.2,
  reviewCount: 3,
};

async function isPng(res: Response) {
  expect(res.headers.get('content-type')).toBe('image/png');
  const bytes = new Uint8Array(await res.arrayBuffer());
  expect([...bytes.slice(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
  return bytes.length;
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchPhoto.mockResolvedValue(null);
});

describe('renderSiteImage', () => {
  it('returns a PNG', async () => {
    await isPng(await renderSiteImage());
  });
});

describe('renderTeaImage', () => {
  it('draws the tea and fetches its photo', async () => {
    getProduct.mockResolvedValue(tea);
    await isPng(await renderTeaImage('a'));
    expect(fetchPhoto).toHaveBeenCalledWith('https://x.test/a.png');
  });

  it('falls back to the site card for an unknown tea', async () => {
    getProduct.mockResolvedValue(null);
    const unknown = await isPng(await renderTeaImage('missing'));
    expect(fetchPhoto).not.toHaveBeenCalled();
    expect(unknown).toBe(await isPng(await renderSiteImage()));
  });
});

describe('renderProfileImage', () => {
  const view = (isPublic: boolean) => ({
    profile: { id: 'p', name: 'Mei', isPublic, joinedAt: '2026-01-01' },
    counts: { drinks: 0, teas: 4, followers: 0, following: 0 },
  });

  it('reads the profile as an anonymous viewer', async () => {
    getProfileView.mockResolvedValue(view(true));
    await isPng(await renderProfileImage('p'));
    expect(getProfileView).toHaveBeenCalledWith(expect.anything(), 'p', null);
  });

  it('shares the site card for a private profile, never its name', async () => {
    getProfileView.mockResolvedValue(view(false));
    const priv = await isPng(await renderProfileImage('p'));
    expect(priv).toBe(await isPng(await renderSiteImage()));
  });

  it('shares the site card for an unknown profile', async () => {
    getProfileView.mockResolvedValue(null);
    await isPng(await renderProfileImage('missing'));
  });
});

describe('renderYearImage', () => {
  it('draws a public taster’s year', async () => {
    getPublicYear.mockResolvedValue({
      taster: 'Mei',
      recap: {
        year: 2026,
        tastings: 3,
        teas: 3,
        split: { matcha: 3, hojicha: 0 },
        topRated: { tea: 'Samidori', stars: 5 },
        busiestMonth: { label: 'March', count: 2 },
      },
    });
    expect(await isPng(await renderYearImage('u1', 2026))).toBeGreaterThan(1000);
    expect(getPublicYear).toHaveBeenCalledWith(expect.anything(), 'u1', 2026);
  });

  it('falls back to the site image for a private taster or a thin year', async () => {
    getPublicYear.mockResolvedValue(null);
    const site = await isPng(await renderSiteImage());
    expect(await isPng(await renderYearImage('u1', 2026))).toBe(site);
  });
});

describe('renderCafeImage', () => {
  it('draws an approved café', async () => {
    getCafePage.mockResolvedValue({ kind: 'found', cafe, scores, drinks: [drink] });
    expect(await isPng(await renderCafeImage('kurasu-bugis'))).toBeGreaterThan(1000);
  });

  it('shares the site card for a missing, redirected or unapproved café', async () => {
    const site = await isPng(await renderSiteImage());
    getCafePage.mockResolvedValue({ kind: 'missing' });
    expect(await isPng(await renderCafeImage('x'))).toBe(site);
    getCafePage.mockResolvedValue({ kind: 'redirect', to: '/cafes/y' });
    expect(await isPng(await renderCafeImage('x'))).toBe(site);
    getCafePage.mockResolvedValue({
      kind: 'found',
      cafe: { ...cafe, status: 'pending' },
      scores,
      drinks: [],
    });
    expect(await isPng(await renderCafeImage('x'))).toBe(site);
  });

  it('shares the site card for a malformed slug without reading the café', async () => {
    const site = await isPng(await renderSiteImage());
    expect(await isPng(await renderCafeImage('Not A Slug'))).toBe(site);
    expect(getCafePage).not.toHaveBeenCalled();
  });
});

describe('renderDrinkImage', () => {
  it('draws the drink with its photo', async () => {
    getDrinkPage.mockResolvedValue({
      kind: 'found',
      drink,
      tasterReviews: [],
      communityReviews: [],
      teaProduct: null,
    });
    expect(await isPng(await renderDrinkImage('kurasu-bugis', 'hojicha-latte'))).toBeGreaterThan(
      1000
    );
    expect(fetchPhoto).toHaveBeenCalledWith('https://x.test/d.png');
  });

  it('shares the site card when the drink is missing or unapproved', async () => {
    const site = await isPng(await renderSiteImage());
    getDrinkPage.mockResolvedValue({ kind: 'missing' });
    expect(await isPng(await renderDrinkImage('a', 'b'))).toBe(site);
    getDrinkPage.mockResolvedValue({
      kind: 'found',
      drink: { ...drink, status: 'pending' },
      tasterReviews: [],
      communityReviews: [],
      teaProduct: null,
    });
    expect(await isPng(await renderDrinkImage('a', 'b'))).toBe(site);
  });

  it('shares the site card for a malformed slug without reading the drink', async () => {
    const site = await isPng(await renderSiteImage());
    expect(await isPng(await renderDrinkImage('Bad Slug', 'hojicha-latte'))).toBe(site);
    expect(await isPng(await renderDrinkImage('kurasu-bugis', '../x'))).toBe(site);
    expect(getDrinkPage).not.toHaveBeenCalled();
  });
});
