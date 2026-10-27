import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  isAdmin,
  listApprovedTeas,
  listOpenReports,
  listReviewQueue,
  mergeTea,
  resolveReport,
  reviewShop,
  reviewTea,
  setTeaLinks,
  setTeaPrice,
} from './admin-service';

describe('isAdmin', () => {
  it('asks the database and treats anything but true as no', async () => {
    expect(
      await isAdmin(createFakeSupabase({ 'rpc:is_admin': { data: true, error: null } }).client)
    ).toBe(true);
    expect(
      await isAdmin(createFakeSupabase({ 'rpc:is_admin': { data: null, error: null } }).client)
    ).toBe(false);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({ 'rpc:is_admin': { data: null, error } });
    await expect(isAdmin(client)).rejects.toBe(error);
  });
});

describe('listApprovedTeas', () => {
  it('returns approved teas with their saved credit and shop link', async () => {
    const { client } = createFakeSupabase({
      products: {
        data: [
          {
            id: 't1',
            name: 'Sayaka',
            brand: 'Ippodo',
            category: 'matcha',
            image_credit: 'Ippodo',
            shop_url: 'https://shop.example/s',
          },
        ],
        error: null,
      },
    });
    expect(await listApprovedTeas(client)).toEqual([
      {
        id: 't1',
        name: 'Sayaka',
        brand: 'Ippodo',
        category: 'matcha',
        imageCredit: 'Ippodo',
        shopUrl: 'https://shop.example/s',
      },
    ]);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ products: { data: null, error } });
    await expect(listApprovedTeas(client)).rejects.toBe(error);
  });
});

describe('listReviewQueue', () => {
  it('lists pending teas with who added them, and pending shops', async () => {
    const { client, calls } = createFakeSupabase({
      products: {
        data: [
          {
            id: 't1',
            name: 'Hoshi',
            brand: 'Farm',
            category: 'matcha',
            grade: null,
            added_by: 'u1',
            created_at: '2026-10-24T00:00:00Z',
          },
        ],
        error: null,
      },
      vendors: {
        data: [
          {
            id: 'v1',
            name: 'Leaf',
            country: 'JP',
            ships_to: ['SG'],
            website: null,
            profile_info: null,
            created_at: '2026-10-24T01:00:00Z',
          },
        ],
        error: null,
      },
      public_profiles: { data: [{ id: 'u1', display_name: 'Aiko' }], error: null },
    });

    const queue = await listReviewQueue(client);

    expect(queue.teas).toEqual([
      expect.objectContaining({ id: 't1', name: 'Hoshi', addedByName: 'Aiko' }),
    ]);
    expect(queue.shops).toEqual([expect.objectContaining({ id: 'v1', shipsTo: ['SG'] })]);
    expect(calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([
      ['status', 'pending'],
      ['status', 'pending'],
    ]);
  });

  it('throws when either list fails', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({
      products: { data: null, error },
      vendors: { data: [], error: null },
    });
    await expect(listReviewQueue(client)).rejects.toBe(error);
  });
});

describe('admin actions', () => {
  it('call the checked database functions with their arguments', async () => {
    const ok = { data: null, error: null };
    const { client, calls } = createFakeSupabase({
      'rpc:review_tea': ok,
      'rpc:merge_tea': ok,
      'rpc:review_vendor': ok,
      'rpc:set_tea_links': ok,
    });

    await reviewTea(client, 't1', 'rejected', 'Duplicate');
    await mergeTea(client, 't1', 't2');
    await reviewShop(client, 'v1', 'approved');
    await setTeaLinks(client, 't2', {
      image: null,
      shop: 'https://shop.example',
      credit: 'Ippodo',
    });

    expect(calls.map((c) => [c.table, c.args[0]])).toEqual([
      ['rpc:review_tea', { tea: 't1', decision: 'rejected', note: 'Duplicate' }],
      ['rpc:merge_tea', { duplicate: 't1', keep: 't2' }],
      ['rpc:review_vendor', { vendor: 'v1', decision: 'approved', note: undefined }],
      [
        'rpc:set_tea_links',
        { tea: 't2', image: null, shop: 'https://shop.example', credit: 'Ippodo' },
      ],
    ]);
  });

  it('surface the database’s refusal', async () => {
    const error = Object.assign(new Error('Only admins can do that.'), { code: '42501' });
    const { client } = createFakeSupabase({ 'rpc:review_tea': { data: null, error } });
    await expect(reviewTea(client, 't1', 'approved')).rejects.toBe(error);
  });
});

describe('listOpenReports and resolveReport', () => {
  it('pairs each open report with what was reported and who said it', async () => {
    const { client } = createFakeSupabase({
      content_reports: {
        data: [
          {
            id: 'rep1',
            reporter_id: 'u1',
            target_type: 'comment',
            target_id: 'c1',
            reason: 'Spam',
            created_at: 'x',
          },
          {
            id: 'rep2',
            reporter_id: 'u1',
            target_type: 'review',
            target_id: 'gone',
            reason: 'Off topic',
            created_at: 'y',
          },
        ],
        error: null,
      },
      reviews: { data: [], error: null },
      review_comments: {
        data: [{ id: 'c1', user_id: 'u2', review_id: 'r1', body: 'Buy pills' }],
        error: null,
      },
      public_profiles: {
        data: [
          { id: 'u1', display_name: 'Aiko' },
          { id: 'u2', display_name: 'Spammy' },
        ],
        error: null,
      },
    });
    const reports = await listOpenReports(client);
    expect(reports[0]).toMatchObject({
      reporterName: 'Aiko',
      content: { text: 'Buy pills', authorName: 'Spammy', productId: null },
    });
    expect(reports[1].content).toBeNull();
  });

  it('is empty without further reads when nothing is reported', async () => {
    const { client, calls } = createFakeSupabase({ content_reports: { data: [], error: null } });
    expect(await listOpenReports(client)).toEqual([]);
    expect(calls.filter((c) => c.method === 'from')).toHaveLength(1);
  });

  it('resolves through the checked database function', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:resolve_report': { data: null, error: null },
    });
    await resolveReport(client, 'rep1', 'removed', 'Spam');
    expect(calls[0].args).toEqual([{ report: 'rep1', decision: 'removed', note: 'Spam' }]);
  });
});

describe('setTeaPrice', () => {
  it('sends the price and pack size, or nulls to clear, and throws a refusal', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:set_tea_price': [
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: new Error('denied') },
      ],
    });
    await setTeaPrice(client, 't1', { price: 32, grams: 40 });
    await setTeaPrice(client, 't1', null);
    expect(calls.filter((c) => c.table === 'rpc:set_tea_price').map((c) => c.args[0])).toEqual([
      { tea: 't1', price: 32, grams: 40 },
      { tea: 't1', price: null, grams: null },
    ]);
    await expect(setTeaPrice(client, 't1', null)).rejects.toThrow('denied');
  });
});
