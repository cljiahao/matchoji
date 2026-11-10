// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ID = '11111111-1111-4111-8111-111111111111';

const flags = vi.hoisted(() => ({ marketplace: false }));
const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  stockReport: null as unknown,
  offers: [] as unknown[],
  avgStars: null as number | null,
}));

vi.mock('next/navigation', () => ({ notFound: vi.fn(), permanentRedirect: vi.fn() }));
vi.mock('@/lib/constants/env', () => ({
  get MARKETPLACE_ENABLED() {
    return flags.marketplace;
  },
}));
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock('@/features/discovery', () => ({
  SimilarTeas: () => null,
  TeaHighlights: () => null,
  buildHighlights: () => [],
  listSimilarTeas: async () => [],
}));
vi.mock('@/features/journal', () => ({
  FreshnessHint: () => null,
  WantToTryButton: () => null,
  getStash: async () => null,
}));
vi.mock('@/features/marketplace', () => ({
  WhereToBuy: () => <section>where to buy</section>,
  listProductOffers: async () => state.offers,
}));
vi.mock('@/features/pairing', () => ({ GoesWellWith: () => null }));
vi.mock('@/features/products', () => ({
  CATEGORY_STYLES: { matcha: { band: '' }, hojicha: { band: '' } },
  CategoryBadge: () => null,
  ProductFacts: () => null,
  ProductImageWell: () => null,
  ScoreNumeral: () => <span>score</span>,
  Stars: () => null,
  ValueBadge: () => null,
  getProduct: async () => ({
    id: ID,
    name: 'Uji Gold',
    brand: null,
    category: 'matcha',
    grade: null,
    regionName: null,
    imageUrl: null,
    imageCredit: null,
    shopUrl: null,
    status: 'approved',
    addedBy: null,
    mergedInto: null,
    avgStars: state.avgStars,
    reviewCount: state.avgStars === null ? 0 : 3,
  }),
  listCatalogue: async () => [],
  listPriceHistory: async () => [],
  valueScoresFor: () => new Map(),
}));
vi.mock('@/features/reviews', () => ({
  CommunityReviews: () => null,
  EditionList: () => null,
  ProductInsights: () => null,
  RateThisTea: () => null,
  listEditions: async () => [],
  listReviews: async () => [],
  localToday: () => '2026-11-10',
  summarizeReviews: () => ({ photos: [] }),
}));
vi.mock('@/features/share', () => ({
  serializeJsonLd: () => '{}',
  teaJsonLd: () => ({}),
  teaMetadata: () => ({}),
}));
vi.mock('@/features/shops', () => ({
  hasShopsForBrand: async () => false,
  shopsHref: () => '/shops',
}));
vi.mock('@/features/social', () => ({
  ReviewReactions: () => null,
  loadReactions: async () => ({}),
}));
vi.mock('@/features/stock', () => ({
  StockPanel: () => <section>stock panel</section>,
  getLatestStockReport: async () => state.stockReport,
}));
vi.mock('@/features/taste', () => ({ MatchSummary: () => null, loadMatches: async () => null }));

import ProductPage from './page';

const params = Promise.resolve({ id: ID });

beforeEach(() => {
  flags.marketplace = false;
  state.user = null;
  state.stockReport = null;
  state.offers = [];
  state.avgStars = null;
});

describe('product page', () => {
  it('hides Where to buy when marketplace disabled', async () => {
    state.offers = [{ id: 'offer' }];
    render(await ProductPage({ params }));
    expect(screen.queryByText('where to buy')).not.toBeInTheDocument();
  });

  it('shows Where to buy only with the marketplace on and an offer', async () => {
    flags.marketplace = true;
    render(await ProductPage({ params }));
    expect(screen.queryByText('where to buy')).not.toBeInTheDocument();

    state.offers = [{ id: 'offer' }];
    render(await ProductPage({ params }));
    expect(screen.getByText('where to buy')).toBeInTheDocument();
  });

  it('hides stock panel for anon with no report', async () => {
    render(await ProductPage({ params }));
    expect(screen.queryByText('stock panel')).not.toBeInTheDocument();
  });

  it('shows the stock panel to a signed-in viewer or when a report exists', async () => {
    state.user = { id: 'u1' };
    const signedIn = render(await ProductPage({ params }));
    expect(screen.getByText('stock panel')).toBeInTheDocument();
    signedIn.unmount();

    state.user = null;
    state.stockReport = { status: 'in_stock' };
    render(await ProductPage({ params }));
    expect(screen.getByText('stock panel')).toBeInTheDocument();
  });

  it('says "Not yet rated" once, with no empty score numeral', async () => {
    render(await ProductPage({ params }));
    expect(screen.getAllByText('Not yet rated')).toHaveLength(1);
    expect(screen.queryByText('score')).not.toBeInTheDocument();
  });

  it('shows the score numeral once the tea is rated', async () => {
    state.avgStars = 4.2;
    render(await ProductPage({ params }));
    expect(screen.getByText('score')).toBeInTheDocument();
    expect(screen.queryByText('Not yet rated')).not.toBeInTheDocument();
  });
});
