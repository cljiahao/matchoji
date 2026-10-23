import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { getLatestStockReport, reportStock } from './stock-service';

describe('getLatestStockReport', () => {
  it('reads the newest report for the tea', async () => {
    const { client, calls } = createFakeSupabase({
      stock_reports: {
        data: { status: 'sold_out', created_at: '2026-10-24T00:00:00Z' },
        error: null,
      },
    });

    expect(await getLatestStockReport(client, 'p1')).toEqual({
      status: 'sold_out',
      reportedAt: '2026-10-24T00:00:00Z',
    });
    expect(calls).toContainEqual({
      table: 'stock_reports',
      method: 'eq',
      args: ['product_id', 'p1'],
    });
    expect(calls).toContainEqual({
      table: 'stock_reports',
      method: 'order',
      args: ['created_at', { ascending: false }],
    });
  });

  it('is null when nobody has reported the tea', async () => {
    const { client } = createFakeSupabase({ stock_reports: { data: null, error: null } });
    expect(await getLatestStockReport(client, 'p1')).toBeNull();
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ stock_reports: { data: null, error } });
    await expect(getLatestStockReport(client, 'p1')).rejects.toBe(error);
  });
});

describe('reportStock', () => {
  it('inserts the status without a user id, leaving that to the database', async () => {
    const { client, calls } = createFakeSupabase({
      stock_reports: {
        data: { status: 'in_stock', created_at: '2026-10-24T01:00:00Z' },
        error: null,
      },
    });

    expect(await reportStock(client, 'p1', 'in_stock')).toEqual({
      status: 'in_stock',
      reportedAt: '2026-10-24T01:00:00Z',
    });
    expect(calls).toContainEqual({
      table: 'stock_reports',
      method: 'insert',
      args: [{ product_id: 'p1', status: 'in_stock' }],
    });
  });

  it('throws when the database refuses the report', async () => {
    const error = Object.assign(new Error('You reported this tea a moment ago.'), {
      code: 'P0001',
    });
    const { client } = createFakeSupabase({ stock_reports: { data: null, error } });
    await expect(reportStock(client, 'p1', 'sold_out')).rejects.toBe(error);
  });
});
