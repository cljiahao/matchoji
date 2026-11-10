import { beforeEach, describe, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);
vi.mock('next/navigation', () => ({ notFound }));
vi.mock('next/server', () => ({ connection: async () => undefined }));
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
vi.mock('@/features/auth', () => ({ SignInButton: () => null }));
vi.mock('@/features/marketplace', () => ({
  ListingForm: () => null,
  ReapplyButton: () => null,
  VendorForm: () => null,
  VendorListings: () => null,
  getMyVendor: vi.fn(),
  listCatalogue: vi.fn(),
  listVendorListings: vi.fn(),
}));

import SellPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('sell page', () => {
  it('returns notFound when marketplace disabled', async () => {
    await expect(SellPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledOnce();
  });
});
