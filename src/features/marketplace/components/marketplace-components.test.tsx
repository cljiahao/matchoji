// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { ListingForm } from './listing-form';
import { ReapplyButton } from './reapply-button';
import { VendorForm } from './vendor-form';
import { VendorListings } from './vendor-listings';

const PRODUCT = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';
const vendorRow = {
  id: 'v1',
  name: 'Kyoto Leaf',
  profile_info: null,
  website: null,
  country: 'JP',
  ships_to: ['SG'],
  status: 'pending',
};
const listingRow = {
  id: 'l1',
  vendor_id: 'v1',
  product_id: PRODUCT,
  price: '32.50',
  currency: 'SGD',
  stock: 4,
  url: 'https://leaf.example/sayaka',
  updated_at: '2026-10-24T00:00:00Z',
};

function useFake(results: NonNullable<Parameters<typeof createFakeBrowserClient>[0]>['results']) {
  const fake = createFakeBrowserClient({ results });
  supabase.current = fake.client;
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VendorForm', () => {
  it('explains what is missing instead of sending a bad application', async () => {
    const fake = useFake({});
    renderWithQuery(<VendorForm userId="u1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Apply to sell' }));

    expect(await screen.findByText('Shop name is required')).toBeInTheDocument();
    expect(screen.getByText('Use a two-letter country code, e.g. JP')).toBeInTheDocument();
    expect(screen.getByText('List at least one country you ship to')).toBeInTheDocument();
    expect(fake.calls.some((c) => c.table === 'vendors')).toBe(false);
  });

  it('sends an application and refreshes the page', async () => {
    const fake = useFake({ vendors: { data: vendorRow, error: null } });
    renderWithQuery(<VendorForm userId="u1" />);

    await userEvent.type(screen.getByLabelText('Shop name'), 'Kyoto Leaf');
    await userEvent.type(screen.getByLabelText('Ships from'), 'jp');
    await userEvent.type(screen.getByLabelText('Ships to'), 'sg');
    await userEvent.click(screen.getByRole('button', { name: 'Apply to sell' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls).toContainEqual({
      table: 'vendors',
      method: 'insert',
      args: [
        {
          user_id: 'u1',
          name: 'Kyoto Leaf',
          profile_info: null,
          website: null,
          country: 'JP',
          ships_to: ['SG'],
        },
      ],
    });
    expect(toast.success).toHaveBeenCalledWith('Application sent. We will review it soon.');
  });
});

describe('ListingForm', () => {
  const products = [{ id: PRODUCT, name: 'Sayaka', brand: 'Ippodo', category: 'matcha' as const }];

  async function fill() {
    await userEvent.selectOptions(screen.getByLabelText('Tea'), PRODUCT);
    await userEvent.type(screen.getByLabelText('Price'), '32.50');
    await userEvent.clear(screen.getByLabelText('Currency'));
    await userEvent.type(screen.getByLabelText('Currency'), 'sgd');
    await userEvent.type(screen.getByLabelText('In stock'), '4');
    await userEvent.type(screen.getByLabelText('Buy link'), 'https://leaf.example/sayaka');
    await userEvent.click(screen.getByRole('button', { name: 'Add listing' }));
  }

  it('adds a listing with typed numbers parsed', async () => {
    const fake = useFake({ listings: { data: listingRow, error: null } });
    renderWithQuery(<ListingForm vendorId="v1" products={products} />);
    await fill();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Listing added.'));
    expect(fake.calls).toContainEqual({
      table: 'listings',
      method: 'insert',
      args: [
        {
          vendor_id: 'v1',
          product_id: PRODUCT,
          price: 32.5,
          currency: 'SGD',
          stock: 4,
          url: 'https://leaf.example/sayaka',
        },
      ],
    });
  });

  it('says so when the tea is already listed', async () => {
    useFake({
      listings: { data: null, error: Object.assign(new Error('dup'), { code: '23505' }) },
    });
    renderWithQuery(<ListingForm vendorId="v1" products={products} />);
    await fill();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You already list this tea.'));
    expect(router.refresh).not.toHaveBeenCalled();
  });
});

describe('VendorListings', () => {
  const listing = {
    id: 'l1',
    productId: PRODUCT,
    price: 32.5,
    currency: 'SGD',
    stock: 4,
    url: 'https://leaf.example/sayaka',
    updatedAt: '2026-10-24T00:00:00Z',
    product: { id: PRODUCT, name: 'Sayaka', brand: 'Ippodo', category: 'matcha' as const },
  };

  it('removes a listing', async () => {
    const fake = useFake({ listings: { data: null, error: null } });
    renderWithQuery(<VendorListings vendorId="v1" listings={[listing]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Sayaka' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls).toContainEqual({ table: 'listings', method: 'eq', args: ['id', 'l1'] });
  });

  it('edits a listing in place', async () => {
    useFake({ listings: { data: { ...listingRow, stock: 0 }, error: null } });
    renderWithQuery(<VendorListings vendorId="v1" listings={[listing]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit Sayaka' }));
    const stock = screen.getByLabelText('In stock');
    expect(stock).toHaveValue('4');
    await userEvent.clear(stock);
    await userEvent.type(stock, '0');
    await userEvent.click(screen.getByRole('button', { name: 'Save listing' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Listing updated.'));
    expect(screen.queryByRole('button', { name: 'Save listing' })).not.toBeInTheDocument();
  });

  it('says when there is nothing listed yet', () => {
    useFake({});
    renderWithQuery(<VendorListings vendorId="v1" listings={[]} />);
    expect(screen.getByText('No listings yet. Add your first below.')).toBeInTheDocument();
  });
});

describe('ReapplyButton', () => {
  it('sends the application again and refreshes the page', async () => {
    const fake = useFake({ 'rpc:reapply_as_vendor': { data: null, error: null } });
    renderWithQuery(<ReapplyButton />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply again' }));
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls).toContainEqual({ table: 'rpc:reapply_as_vendor', method: 'rpc', args: [] });
  });

  it('explains a failure', async () => {
    useFake({ 'rpc:reapply_as_vendor': { data: null, error: new Error('nope') } });
    renderWithQuery(<ReapplyButton />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply again' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not resend your application. Try again.')
    );
  });
});
