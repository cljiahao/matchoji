import { describe, expect, it } from 'vitest';

import { createFakeSupabase, type QueryResult } from '../../test/support/fake-supabase';

import { cityHasCafes, hasTrustedTasters } from './sitemap-counts';

const client = (table: string, result: QueryResult) => {
  const fake = createFakeSupabase({ [table]: result });
  return { fake, supabase: fake.client };
};

describe('cityHasCafes', () => {
  it('counts approved, un-merged cafés in the city without loading rows', async () => {
    const { fake, supabase } = client('cafes', { data: null, error: null, count: 2 });
    expect(await cityHasCafes(supabase, 'singapore')).toBe(true);
    expect(fake.calls).toContainEqual(
      expect.objectContaining({
        method: 'select',
        args: ['id', { count: 'exact', head: true }],
      })
    );
    expect(fake.calls).toContainEqual(
      expect.objectContaining({ method: 'eq', args: ['city_slug', 'singapore'] })
    );
  });

  it('is false for a zero or missing count', async () => {
    expect(
      await cityHasCafes(client('cafes', { data: null, error: null, count: 0 }).supabase, 'x')
    ).toBe(false);
    expect(await cityHasCafes(client('cafes', { data: null, error: null }).supabase, 'x')).toBe(
      false
    );
  });

  it('throws a failed read rather than listing an empty page as missing', async () => {
    const failure = new Error('down');
    await expect(
      cityHasCafes(client('cafes', { data: null, error: failure }).supabase, 'x')
    ).rejects.toBe(failure);
  });
});

describe('hasTrustedTasters', () => {
  it('counts public trusted tasters', async () => {
    const { fake, supabase } = client('public_profiles', { data: null, error: null, count: 1 });
    expect(await hasTrustedTasters(supabase)).toBe(true);
    expect(fake.calls).toContainEqual(
      expect.objectContaining({ method: 'eq', args: ['is_trusted_taster', true] })
    );
  });

  it('is false with none', async () => {
    expect(
      await hasTrustedTasters(
        client('public_profiles', { data: null, error: null, count: 0 }).supabase
      )
    ).toBe(false);
  });
});
