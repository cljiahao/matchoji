import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { listPriceHistory } from './price-history-service';

describe('listPriceHistory', () => {
  it('maps rows to price points, oldest first, for the one tea', async () => {
    const { client, calls } = createFakeSupabase({
      tea_price_history: {
        data: [
          { recorded_at: '2026-03-01T00:00:00Z', price: '32.00', pack_grams: '40.0' },
          { recorded_at: '2026-09-01T00:00:00Z', price: '36.00', pack_grams: '40.0' },
        ],
        error: null,
      },
    });

    expect(await listPriceHistory(client, 't1')).toEqual([
      { recordedAt: '2026-03-01T00:00:00Z', sgd: 32, packGrams: 40, perGram: 0.8 },
      { recordedAt: '2026-09-01T00:00:00Z', sgd: 36, packGrams: 40, perGram: 0.9 },
    ]);
    expect(calls).toContainEqual({
      table: 'tea_price_history',
      method: 'eq',
      args: ['product_id', 't1'],
    });
    expect(calls).toContainEqual({
      table: 'tea_price_history',
      method: 'order',
      args: ['recorded_at', { ascending: true }],
    });
  });

  it('is empty until the migration is applied', async () => {
    for (const code of ['42P01', 'PGRST205']) {
      const { client } = createFakeSupabase({
        tea_price_history: { data: null, error: { code, message: 'missing' } },
      });
      expect(await listPriceHistory(client, 't1')).toEqual([]);
    }
  });

  it('throws any other error', async () => {
    const error = { code: '42501', message: 'denied' };
    const { client } = createFakeSupabase({ tea_price_history: { data: null, error } });
    await expect(listPriceHistory(client, 't1')).rejects.toBe(error);
  });
});
