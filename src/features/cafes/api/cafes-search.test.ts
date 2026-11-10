import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { loadIsTrustedTaster, searchCafes, searchDrinks } from './cafes-search';

const CAFE_ROW = {
  id: 'c1',
  slug: 'matcha-bar',
  name: 'Matcha Bar',
  city_slug: 'singapore',
  area: null,
  address: null,
  lat: null,
  lng: null,
  instagram_handle: null,
  website_url: null,
  status: 'approved',
  merged_into: null,
};

describe('searchCafes', () => {
  it('searches approved and own pending cafés by name, skipping merged ones', async () => {
    const fake = createFakeSupabase({ cafes: { data: [CAFE_ROW], error: null } });
    const found = await searchCafes(fake.client, '50%_off, bar');

    expect(found.map((c) => c.id)).toEqual(['c1']);
    expect(fake.calls).toContainEqual({
      table: 'cafes',
      method: 'ilike',
      args: ['name', '%50  off  bar%'],
    });
    expect(fake.calls).toContainEqual({
      table: 'cafes',
      method: 'in',
      args: ['status', ['approved', 'pending']],
    });
    expect(fake.calls).toContainEqual({
      table: 'cafes',
      method: 'is',
      args: ['merged_into', null],
    });
  });

  it('returns nothing while the table does not exist yet', async () => {
    const fake = createFakeSupabase({ cafes: { data: null, error: { code: '42P01' } } });
    await expect(searchCafes(fake.client, 'bar')).resolves.toEqual([]);
  });

  it('throws any other error', async () => {
    const error = { code: '500' };
    const fake = createFakeSupabase({ cafes: { data: null, error } });
    await expect(searchCafes(fake.client, 'bar')).rejects.toBe(error);
  });
});

describe('searchDrinks', () => {
  it('lists a café’s drinks, filtered only when something was typed', async () => {
    const fake = createFakeSupabase({ drinks: { data: [], error: null } });
    await searchDrinks(fake.client, 'c1', '  ');
    expect(fake.calls.some((c) => c.method === 'ilike')).toBe(false);
    expect(fake.calls).toContainEqual({ table: 'drinks', method: 'eq', args: ['cafe_id', 'c1'] });

    await searchDrinks(fake.client, 'c1', 'latte');
    expect(fake.calls).toContainEqual({
      table: 'drinks',
      method: 'ilike',
      args: ['name', '%latte%'],
    });
  });

  it('returns nothing while the table does not exist yet and throws other errors', async () => {
    const missing = createFakeSupabase({ drinks: { data: null, error: { code: 'PGRST205' } } });
    await expect(searchDrinks(missing.client, 'c1', '')).resolves.toEqual([]);
    const error = { code: '500' };
    const broken = createFakeSupabase({ drinks: { data: null, error } });
    await expect(searchDrinks(broken.client, 'c1', '')).rejects.toBe(error);
  });
});

describe('loadIsTrustedTaster', () => {
  it('reads the badge from the public profile', async () => {
    const yes = createFakeSupabase({
      public_profiles: { data: { is_trusted_taster: true }, error: null },
    });
    await expect(loadIsTrustedTaster(yes.client, 'u1')).resolves.toBe(true);
    const none = createFakeSupabase({ public_profiles: { data: null, error: null } });
    await expect(loadIsTrustedTaster(none.client, 'u1')).resolves.toBe(false);
  });

  it('is false when the read fails', async () => {
    const fake = createFakeSupabase({ public_profiles: { data: null, error: { code: 'x' } } });
    await expect(loadIsTrustedTaster(fake.client, 'u1')).resolves.toBe(false);
  });
});
