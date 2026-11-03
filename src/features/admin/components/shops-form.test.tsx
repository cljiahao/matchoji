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

import { ShopsForm } from './shops-form';

const listed = {
  id: 's1',
  brand: 'Ippodo',
  name: 'Kyoto Main Store',
  kind: 'maker_store' as const,
  address: '52 Tokiwagi-cho',
  city: 'Kyoto',
  country: 'Japan',
  lat: 35.01,
  lng: 135.76,
  sourceUrl: 'https://example.com/kyoto',
  checkedAt: '2026-11-03',
};

function setup() {
  const fake = createFakeBrowserClient({
    results: { shop_locations: { data: null, error: null } },
  });
  supabase.current = fake.client;
  renderWithQuery(<ShopsForm shops={[listed]} />);
  return fake;
}

async function fill(label: string, value: string) {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
}

async function fillAll(over: Record<string, string> = {}) {
  const v = {
    Maker: 'Aiya',
    'Shop name': 'Aiya Nishio',
    Address: '15 Yokomachiyashiki',
    City: 'Nishio',
    Country: 'Japan',
    Latitude: '34.86',
    Longitude: '137.06',
    'Source link': 'https://example.com/aiya',
    ...over,
  };
  for (const [label, value] of Object.entries(v)) await fill(label, value);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ShopsForm', () => {
  it('adds a shop with snake_case columns', async () => {
    const fake = setup();
    await fillAll();
    await userEvent.click(screen.getByRole('button', { name: 'Add shop' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Shop added.'));
    const insert = fake.calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toMatchObject({
      brand: 'Aiya',
      lat: 34.86,
      lng: 137.06,
      source_url: 'https://example.com/aiya',
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it('refuses out-of-range coordinates and non-https sources before any request', async () => {
    const fake = setup();
    await fillAll({ Latitude: '95' });
    await userEvent.click(screen.getByRole('button', { name: 'Add shop' }));
    expect(toast.error).toHaveBeenCalledWith('Latitude is -90 to 90');

    await fill('Latitude', '34.86');
    await fill('Source link', 'http://example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add shop' }));
    expect(toast.error).toHaveBeenLastCalledWith('Source must be an https:// link');
    expect(fake.calls.some((c) => c.method === 'insert')).toBe(false);
  });

  it('edits a listed shop', async () => {
    const fake = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Edit Kyoto Main Store' }));
    expect(screen.getByLabelText('Shop name')).toHaveValue('Kyoto Main Store');
    await fill('Address', '1 New Street');
    await userEvent.click(screen.getByRole('button', { name: 'Save shop' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Shop updated.'));
    expect(fake.calls.find((c) => c.method === 'update')?.args[0]).toMatchObject({
      address: '1 New Street',
    });
    expect(fake.calls).toContainEqual({
      table: 'shop_locations',
      method: 'eq',
      args: ['id', 's1'],
    });
  });

  it('removes a listed shop', async () => {
    const fake = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Kyoto Main Store' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Shop removed.'));
    expect(fake.calls.some((c) => c.method === 'delete')).toBe(true);
  });
});
