import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { getSupplyOverview } from './supply-service';

describe('getSupplyOverview', () => {
  it('reads the stats and regions and summarizes them', async () => {
    const { client, calls } = createFakeSupabase({
      tea_production_stats: {
        data: [
          { prefecture: 'Kyoto', year: 2025, metric: 'aracha_t', value: 2280, source: 'maff' },
        ],
        error: null,
      },
      regions: { data: [{ id: 'uji', name: 'Uji, Kyoto', prefecture: 'Kyoto' }], error: null },
    });

    const overview = await getSupplyOverview(client);

    expect(overview.prefectures).toEqual([
      {
        prefecture: 'Kyoto',
        regions: [{ id: 'uji', name: 'Uji, Kyoto' }],
        fields: [],
        rawTea: [{ year: 2025, value: 2280 }],
        tencha: null,
      },
    ]);
    expect(calls).toContainEqual({
      table: 'tea_production_stats',
      method: 'select',
      args: ['prefecture, year, metric, value, source'],
    });
  });

  it('is empty before the stats are seeded', async () => {
    const { client } = createFakeSupabase({
      tea_production_stats: { data: [], error: null },
      regions: { data: [], error: null },
    });
    expect(await getSupplyOverview(client)).toEqual({ national: null, prefectures: [] });
  });

  it('throws when either read fails', async () => {
    const error = new Error('boom');
    const statsFail = createFakeSupabase({
      tea_production_stats: { data: null, error },
      regions: { data: [], error: null },
    });
    await expect(getSupplyOverview(statsFail.client)).rejects.toBe(error);

    const regionsFail = createFakeSupabase({
      tea_production_stats: { data: [], error: null },
      regions: { data: null, error },
    });
    await expect(getSupplyOverview(regionsFail.client)).rejects.toBe(error);
  });
});
