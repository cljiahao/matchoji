import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  isAdmin,
  listApprovedTeas,
  listCafeQueue,
  listDrinkQueue,
  listOpenReports,
  listReviewQueue,
  listTrustedTasters,
  mergeCafe,
  mergeDrink,
  mergeTea,
  resolveReport,
  reviewCafe,
  reviewDrink,
  reviewShop,
  reviewTea,
  searchProfiles,
  setTeaLinks,
  setTeaPrice,
  setTrustedTaster,
  updateCafe,
  updateDrink,
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
            image_url: 'https://cdn.test/s.webp',
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
        imageUrl: 'https://cdn.test/s.webp',
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

  it('reports queue shows drink review target', async () => {
    const { client } = createFakeSupabase({
      content_reports: {
        data: [
          {
            id: 'rep1',
            reporter_id: 'u1',
            target_type: 'review',
            target_id: 'r1',
            reason: 'Rude',
            created_at: 'x',
          },
        ],
        error: null,
      },
      reviews: {
        data: [
          { id: 'r1', user_id: 'u2', product_id: null, drink_id: 'd1', notes: 'Meh', stars: 2 },
        ],
        error: null,
      },
      review_comments: { data: [], error: null },
      admin_drinks: { data: [{ id: 'd1', name: 'Hojicha latte', cafe_id: 'c1' }], error: null },
      admin_cafes: { data: [{ id: 'c1', name: 'Kopi Hou' }], error: null },
      public_profiles: { data: [{ id: 'u1', display_name: 'Aiko' }], error: null },
    });
    const [report] = await listOpenReports(client);
    expect(report.content).toEqual({
      text: '2★ Meh',
      authorName: 'Former taster',
      productId: null,
      drinkLabel: 'Kopi Hou · Hojicha latte',
    });
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

const ID = '11111111-1111-4111-8111-111111111111';
const KEEP = '22222222-2222-4222-8222-222222222222';

describe('café and drink moderation', () => {
  it('reviewCafe calls review_cafe rpc', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:review_cafe': { data: null, error: null },
    });
    await reviewCafe(client, ID, 'rejected', 'Duplicate');
    expect(calls[0]).toMatchObject({
      table: 'rpc:review_cafe',
      args: [{ cafe: ID, decision: 'rejected', note: 'Duplicate' }],
    });
  });

  it('reviewCafe surfaces 42501', async () => {
    const error = { code: '42501', message: 'Admins only.' };
    const { client } = createFakeSupabase({ 'rpc:review_cafe': { data: null, error } });
    await expect(reviewCafe(client, ID, 'approved')).rejects.toBe(error);
  });

  it('reviewDrink passes the database refusal for a drink at an unapproved café', async () => {
    const error = { code: 'P0001', message: 'Approve the café first.' };
    const { client } = createFakeSupabase({ 'rpc:review_drink': { data: null, error } });
    await expect(reviewDrink(client, ID, 'approved')).rejects.toBe(error);
  });

  it('rejects an id that is not a uuid before calling the database', async () => {
    const { client, calls } = createFakeSupabase({});
    await expect(reviewCafe(client, 'nope', 'approved')).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('merges through the checked functions and surfaces a refusal', async () => {
    const error = { message: 'Cannot merge across cities.' };
    const { client, calls } = createFakeSupabase({
      'rpc:merge_cafe': { data: null, error },
      'rpc:merge_drink': { data: null, error: null },
    });
    await expect(mergeCafe(client, ID, KEEP)).rejects.toBe(error);
    await mergeDrink(client, ID, KEEP);
    expect(calls.at(-1)?.args).toEqual([{ duplicate: ID, keep: KEEP }]);
  });

  it('setTrustedTaster calls rpc', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:set_trusted_taster': { data: null, error: null },
    });
    await setTrustedTaster(client, ID, true);
    expect(calls[0].args).toEqual([{ person: ID, value: true }]);
  });
});

describe('listCafeQueue and listDrinkQueue', () => {
  it('maps pending cafés with the adder from admin_cafes', async () => {
    const { client, calls } = createFakeSupabase({
      admin_cafes: {
        data: [
          {
            id: 'c1',
            name: 'Kopi Hou',
            city_slug: 'singapore',
            area: 'Tiong Bahru',
            address: null,
            lat: null,
            lng: null,
            instagram_handle: 'kopihou',
            website_url: null,
            status: 'pending',
            created_at: '2026-11-10T00:00:00Z',
            adder_name: 'Aiko',
          },
        ],
        error: null,
      },
    });
    const [cafe] = await listCafeQueue(client);
    expect(cafe).toMatchObject({ name: 'Kopi Hou', citySlug: 'singapore', addedByName: 'Aiko' });
    expect(calls.some((c) => c.table === 'cafes')).toBe(false);
    expect(calls).toContainEqual(
      expect.objectContaining({ method: 'eq', args: ['status', 'pending'] })
    );
  });

  it('listCafeQueue returns [] on missing table', async () => {
    const { client } = createFakeSupabase({
      admin_cafes: { data: null, error: { code: 'PGRST205', message: 'no table' } },
    });
    expect(await listCafeQueue(client)).toEqual([]);
  });

  it('throws any other error', async () => {
    const error = { code: '500', message: 'down' };
    const { client } = createFakeSupabase({ admin_cafes: { data: null, error } });
    await expect(listCafeQueue(client)).rejects.toBe(error);
  });

  it('names each pending drink’s café', async () => {
    const { client } = createFakeSupabase({
      admin_drinks: {
        data: [
          {
            id: 'd1',
            cafe_id: 'c1',
            name: 'Hojicha latte',
            base: 'hojicha',
            style: 'latte',
            serving: 'hot',
            price: 7.5,
            photo_url: null,
            photo_credit: null,
            tea_product_id: null,
            status: 'pending',
            created_at: 'x',
            adder_name: null,
          },
        ],
        error: null,
      },
      admin_cafes: { data: [{ id: 'c1', name: 'Kopi Hou' }], error: null },
    });
    expect(await listDrinkQueue(client)).toMatchObject([
      { name: 'Hojicha latte', cafeName: 'Kopi Hou', price: 7.5, addedByName: null },
    ]);
  });

  it('listDrinkQueue returns [] on missing table', async () => {
    const { client } = createFakeSupabase({
      admin_drinks: { data: null, error: { code: '42P01', message: 'x' } },
    });
    expect(await listDrinkQueue(client)).toEqual([]);
  });
});

describe('updateCafe and updateDrink', () => {
  it('updateCafe sends only the changed fields to update_cafe', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:update_cafe': { data: null, error: null },
    });
    await updateCafe(client, ID, { name: 'Kopi Hou', instagram_handle: '' });
    expect(calls[0]).toMatchObject({
      table: 'rpc:update_cafe',
      args: [{ cafe: ID, fields: { name: 'Kopi Hou', instagram_handle: '' } }],
    });
  });

  it('updateCafe surfaces the database error', async () => {
    const error = { code: 'P0002', message: 'No such café.' };
    const { client } = createFakeSupabase({ 'rpc:update_cafe': { data: null, error } });
    await expect(updateCafe(client, ID, { name: 'x' })).rejects.toBe(error);
  });

  it('updateCafe refuses a key the database does not allow, without calling it', async () => {
    const { client, calls } = createFakeSupabase({});
    await expect(
      updateCafe(client, ID, { slug: 'hack' } as unknown as Parameters<typeof updateCafe>[2])
    ).rejects.toThrow();
    await expect(updateCafe(client, ID, { website_url: 'http://x.test' })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('updateDrink sends photo, credit and tea link', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:update_drink': { data: null, error: null },
    });
    const fields = {
      photo_url: 'https://cdn.test/p.webp',
      photo_credit: 'Kopi Hou',
      tea_product_id: KEEP,
      price: 8,
    };
    await updateDrink(client, ID, fields);
    expect(calls[0].args).toEqual([{ drink: ID, fields }]);
  });

  it('updateDrink refuses a negative price', async () => {
    const { client, calls } = createFakeSupabase({});
    await expect(updateDrink(client, ID, { price: -1 })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe('searchProfiles and listTrustedTasters', () => {
  it('finds private profiles through public_profiles and escapes wildcards', async () => {
    const { client, calls } = createFakeSupabase({
      public_profiles: {
        data: [{ id: 'u1', display_name: 'Aiko', is_public: false, is_trusted_taster: false }],
        error: null,
      },
    });
    expect(await searchProfiles(client, ' 50%_ ')).toEqual([
      { id: 'u1', displayName: 'Aiko', isPublic: false, isTrustedTaster: false },
    ]);
    expect(calls).toContainEqual(
      expect.objectContaining({ method: 'ilike', args: ['display_name', '%50\\%\\_%'] })
    );
  });

  it('does not query for a blank search', async () => {
    const { client, calls } = createFakeSupabase({});
    expect(await searchProfiles(client, '  ')).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('lists current tasters, and is empty on a missing table', async () => {
    const { client } = createFakeSupabase({
      public_profiles: {
        data: [{ id: 'u1', display_name: 'Aiko', is_public: true, is_trusted_taster: true }],
        error: null,
      },
    });
    expect(await listTrustedTasters(client)).toHaveLength(1);
    const missing = createFakeSupabase({
      public_profiles: { data: null, error: { code: '42P01', message: 'x' } },
    });
    expect(await listTrustedTasters(missing.client)).toEqual([]);
  });
});
