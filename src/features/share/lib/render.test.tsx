import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProduct = vi.fn();
const getProfileView = vi.fn();
const fetchPhoto = vi.fn();

vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/products', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/products')>()),
  getProduct: (...args: unknown[]) => getProduct(...args),
}));
vi.mock('@/features/social', () => ({
  getProfileView: (...args: unknown[]) => getProfileView(...args),
}));
vi.mock('./fetch-photo', () => ({ fetchPhoto: (...args: unknown[]) => fetchPhoto(...args) }));

import { renderProfileImage, renderSiteImage, renderTeaImage } from './render';

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
    counts: { teas: 4, followers: 0, following: 0 },
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
