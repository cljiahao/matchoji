// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), message: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { CafeEditForm, changedFields } from './cafe-edit-form';
import { DrinkEditForm, changedDrinkFields } from './drink-edit-form';

const ID = '11111111-1111-4111-8111-111111111111';
const TEA = '33333333-3333-4333-8333-333333333333';
const cafe = {
  id: ID,
  name: 'Kopi Hou',
  citySlug: 'singapore',
  area: 'Tiong Bahru',
  address: null,
  lat: 1.28,
  lng: 103.8,
  instagramHandle: null,
  websiteUrl: null,
  status: 'approved' as const,
  createdAt: 'x',
  addedByName: null,
};
const drink = {
  id: ID,
  cafeId: 'c1',
  cafeName: 'Kopi Hou',
  name: 'Hojicha latte',
  base: 'hojicha' as const,
  style: 'latte' as const,
  serving: 'hot' as const,
  price: 7,
  photoUrl: null,
  photoCredit: null,
  teaProductId: null,
  status: 'approved' as const,
  createdAt: 'x',
  addedByName: null,
};

beforeEach(() => vi.clearAllMocks());

describe('CafeEditForm', () => {
  it('sends only what changed to update_cafe', async () => {
    const fake = createFakeSupabase({ 'rpc:update_cafe': { data: null, error: null } });
    supabase.current = fake.client;
    renderWithQuery(<CafeEditForm cafes={[cafe]} />);

    await userEvent.selectOptions(screen.getByLabelText('Café'), ID);
    await userEvent.type(screen.getByLabelText('Instagram handle (no @)'), 'kopihou');
    await userEvent.click(screen.getByRole('button', { name: 'Save café' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls[0].args).toEqual([{ cafe: ID, fields: { instagram_handle: 'kopihou' } }]);
  });

  it('does not call the database when nothing changed or the input is invalid', async () => {
    const fake = createFakeSupabase({});
    supabase.current = fake.client;
    renderWithQuery(<CafeEditForm cafes={[cafe]} />);
    await userEvent.selectOptions(screen.getByLabelText('Café'), ID);

    await userEvent.click(screen.getByRole('button', { name: 'Save café' }));
    expect(toast.message).toHaveBeenCalledWith('Nothing changed.');

    await userEvent.type(screen.getByLabelText('Website (https)'), 'http://insecure.test');
    await userEvent.click(screen.getByRole('button', { name: 'Save café' }));
    expect(toast.error).toHaveBeenCalled();
    expect(fake.calls).toHaveLength(0);
  });

  it('leaves a blanked coordinate alone', () => {
    const before = {
      name: 'a',
      area: '',
      address: '',
      instagram_handle: '',
      website_url: '',
      lat: '1',
      lng: '2',
    };
    expect(changedFields(before, { ...before, lat: '', lng: '3' })).toEqual({ lng: 3 });
  });
});

describe('DrinkEditForm', () => {
  it('sends the photo, credit and tea link', async () => {
    const fake = createFakeSupabase({ 'rpc:update_drink': { data: null, error: null } });
    supabase.current = fake.client;
    renderWithQuery(
      <DrinkEditForm
        drinks={[drink]}
        teas={[
          {
            id: TEA,
            name: 'Hoji',
            brand: 'Farm',
            category: 'hojicha',
            imageUrl: null,
            imageCredit: null,
            shopUrl: null,
          },
        ]}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText('Drink'), ID);
    await userEvent.type(screen.getByLabelText('Photo link (https)'), 'https://cdn.test/p.webp');
    await userEvent.type(screen.getByLabelText('Photo credit'), 'Kopi Hou');
    await userEvent.selectOptions(screen.getByLabelText('Tea it is made with'), TEA);
    await userEvent.click(screen.getByRole('button', { name: 'Save drink' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls[0].args).toEqual([
      {
        drink: ID,
        fields: {
          photo_url: 'https://cdn.test/p.webp',
          photo_credit: 'Kopi Hou',
          tea_product_id: TEA,
        },
      },
    ]);
  });

  it('shows the database error and keeps the form', async () => {
    const fake = createFakeSupabase({
      'rpc:update_drink': { data: null, error: { message: 'No such drink.' } },
    });
    supabase.current = fake.client;
    renderWithQuery(<DrinkEditForm drinks={[drink]} teas={[]} />);
    await userEvent.selectOptions(screen.getByLabelText('Drink'), ID);
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), 'Iced hojicha');
    await userEvent.click(screen.getByRole('button', { name: 'Save drink' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No such drink.'));
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('leaves a blanked price alone', () => {
    const before = {
      name: 'a',
      base: 'matcha' as const,
      style: 'latte' as const,
      serving: 'hot' as const,
      price: '5',
      photo_url: '',
      photo_credit: '',
      tea_product_id: '',
    };
    expect(changedDrinkFields(before, { ...before, price: '' })).toEqual({});
  });
});
