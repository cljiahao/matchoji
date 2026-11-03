// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPublicYear = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/features/journal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/journal')>()),
  getPublicYear: (...a: unknown[]) => getPublicYear(...a),
}));

import SharedYearPage, { generateMetadata } from './page';

const ID = '22222222-2222-4222-8222-222222222222';
const params = (id: string, year: string) => ({ params: Promise.resolve({ id, year }) });
const found = {
  taster: 'Mei',
  recap: {
    year: 2026,
    tastings: 4,
    teas: 3,
    split: { matcha: 3, hojicha: 1 },
    topRated: { tea: 'Samidori', stars: 5, maker: null, date: '2026-01-01' },
    busiestMonth: { label: 'March', count: 2 },
  },
};

beforeEach(() => getPublicYear.mockReset());

describe('shared year page', () => {
  it('shows a public taster’s counts and top tea', async () => {
    getPublicYear.mockResolvedValue(found);
    render(await SharedYearPage(params(ID, '2026')));
    expect(screen.getByRole('heading', { name: /Mei's 2026 in tea/ })).toBeInTheDocument();
    expect(screen.getByText('Samidori')).toBeInTheDocument();
  });

  it('is not found for a private taster or a thin year, saying nothing about either', async () => {
    getPublicYear.mockResolvedValue(null);
    await expect(SharedYearPage(params(ID, '2026'))).rejects.toThrow();
    expect((await generateMetadata(params(ID, '2026'))).title).toBe('Year in tea not found');
  });

  it('is not found for a malformed id or year without reading anything', async () => {
    await expect(SharedYearPage(params('nope', '2026'))).rejects.toThrow();
    await expect(SharedYearPage(params(ID, 'x'))).rejects.toThrow();
    expect(getPublicYear).not.toHaveBeenCalled();
  });

  it('titles a public year for sharing', async () => {
    getPublicYear.mockResolvedValue(found);
    const meta = await generateMetadata(params(ID, '2026'));
    expect(meta.title).toBe("Mei's 2026 in tea");
    expect(meta.description).toBe('Mei logged 4 tastings in 2026 on Matchoji.');
  });
});
