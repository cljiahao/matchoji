import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { loadDrinkSummaries } from './drink-summaries';

const drink = {
  id: 'd1',
  cafe_id: 'c1',
  slug: 'hojicha-latte',
  name: 'Hojicha Latte',
  base: 'hojicha',
};

describe('loadDrinkSummaries', () => {
  it('pairs each drink with its café, naming columns instead of selecting *', async () => {
    const { client, calls } = createFakeSupabase({
      drinks: { data: [drink], error: null },
      cafes: { data: [{ id: 'c1', slug: 'kurasu', name: 'Kurasu' }], error: null },
    });
    const map = await loadDrinkSummaries(client, ['d1', 'd1']);
    expect(map.get('d1')).toEqual({
      id: 'd1',
      slug: 'hojicha-latte',
      name: 'Hojicha Latte',
      base: 'hojicha',
      cafe: { id: 'c1', slug: 'kurasu', name: 'Kurasu' },
    });
    expect(calls.filter((c) => c.method === 'select').every((c) => c.args[0] !== '*')).toBe(true);
  });

  it('reads nothing for no ids', async () => {
    const { client, calls } = createFakeSupabase({});
    expect((await loadDrinkSummaries(client, [])).size).toBe(0);
    expect(calls).toEqual([]);
  });

  it('omits a drink that row-level security hides, or whose café is hidden', async () => {
    const { client } = createFakeSupabase({
      drinks: { data: [drink], error: null },
      cafes: { data: [], error: null },
    });
    expect((await loadDrinkSummaries(client, ['d1', 'd2'])).size).toBe(0);
  });

  it('is empty when the tables do not exist yet', async () => {
    const missing = { data: null, error: { code: '42P01', message: 'missing' } };
    const a = createFakeSupabase({ drinks: missing });
    expect((await loadDrinkSummaries(a.client, ['d1'])).size).toBe(0);
    const b = createFakeSupabase({
      drinks: { data: [drink], error: null },
      cafes: { data: null, error: { code: 'PGRST205', message: 'missing' } },
    });
    expect((await loadDrinkSummaries(b.client, ['d1'])).size).toBe(0);
  });

  it('throws other errors', async () => {
    const error = new Error('down');
    const a = createFakeSupabase({ drinks: { data: null, error } });
    await expect(loadDrinkSummaries(a.client, ['d1'])).rejects.toBe(error);
    const b = createFakeSupabase({
      drinks: { data: [drink], error: null },
      cafes: { data: null, error },
    });
    await expect(loadDrinkSummaries(b.client, ['d1'])).rejects.toBe(error);
  });
});
