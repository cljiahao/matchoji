import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const SELLER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

let db: PGlite;
let product: string;

async function as<T>(id: string | null, run: () => Promise<T>): Promise<T> {
  await db.exec(
    id ? `set request.jwt.claim.sub = '${id}'; set role authenticated;` : 'set role anon;'
  );
  try {
    return await run();
  } finally {
    await db.exec('reset role; reset request.jwt.claim.sub;');
  }
}

const rows = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows;

const apply = (user: string, status = 'pending') =>
  db.query(
    `insert into public.vendors (user_id, name, country, ships_to, status)
     values ($1, 'Kyoto Leaf', 'JP', '{SG,JP}', $2)`,
    [user, status]
  );

const vendorId = async (user: string) =>
  (await rows<{ id: string }>('select id from public.vendors where user_id = $1', [user]))[0].id;

const list = (vendor: string) =>
  db.query(
    `insert into public.listings (vendor_id, product_id, price, currency, stock, url)
     values ($1, $2, 32.5, 'SGD', 4, 'https://kyoto-leaf.example/sayaka')`,
    [vendor, product]
  );

beforeAll(async () => {
  db = await createMigratedDb();
  for (const id of [SELLER, OTHER])
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      id,
      `${id.slice(0, 4)}@example.com`,
    ]);
  product = (
    await rows<{ id: string }>(
      `insert into public.products (name, brand, category, status)
       values ('Sayaka', 'Ippodo', 'matcha', 'approved')
       returning id`
    )
  )[0].id;
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('vendor applications', () => {
  it('lets a user apply for themselves, pending only', async () => {
    await expect(as(SELLER, () => apply(SELLER, 'approved'))).rejects.toThrow(/row-level security/);
    await expect(as(SELLER, () => apply(OTHER))).rejects.toThrow(/row-level security/);
    await as(SELLER, () => apply(SELLER));

    expect(
      await as(SELLER, () => rows<{ status: string }>('select status from public.vendors'))
    ).toEqual([{ status: 'pending' }]);
  });

  it('keeps pending shops private and blocks self-approval', async () => {
    expect(await as(null, () => rows('select id from public.vendors'))).toEqual([]);
    expect(await as(OTHER, () => rows('select id from public.vendors'))).toEqual([]);

    await expect(
      as(SELLER, () => db.exec(`update public.vendors set status = 'approved'`))
    ).rejects.toThrow(/permission denied/);
    await as(SELLER, () => db.exec(`update public.vendors set name = 'Kyoto Leaf Tea'`));
    expect(await rows('select name, status from public.vendors')).toEqual([
      { name: 'Kyoto Leaf Tea', status: 'pending' },
    ]);
  });

  it('rejects bad country codes and non-https websites', async () => {
    await expect(
      as(SELLER, () => db.exec(`update public.vendors set country = 'Japan'`))
    ).rejects.toThrow(/check constraint/);
    await expect(
      as(SELLER, () => db.exec(`update public.vendors set website = 'http://leaf.example'`))
    ).rejects.toThrow(/check constraint/);
  });

  it('cannot list before approval', async () => {
    const vendor = await vendorId(SELLER);
    await expect(as(SELLER, () => list(vendor))).rejects.toThrow(/row-level security/);
  });
});

describe('approval and listings', () => {
  it('approval makes the shop public and the owner a vendor', async () => {
    await db.exec(`update public.vendors set status = 'approved', reviewed_at = now()`);

    expect(await as(null, () => rows('select name from public.vendors'))).toEqual([
      { name: 'Kyoto Leaf Tea' },
    ]);
    expect(await rows('select role from public.profiles where id = $1', [SELLER])).toEqual([
      { role: 'vendor' },
    ]);
  });

  it('lets the approved vendor list a tea that everyone can see, once per tea', async () => {
    const vendor = await vendorId(SELLER);
    await as(SELLER, () => list(vendor));
    await expect(as(SELLER, () => list(vendor))).rejects.toThrow(/unique/);

    expect(
      await as(null, () =>
        rows<{ price: string; currency: string }>(
          'select price::text, currency from public.listings'
        )
      )
    ).toEqual([{ price: '32.50', currency: 'SGD' }]);
  });

  it('refuses a listing of a tea that is not in the catalogue yet', async () => {
    const vendor = await vendorId(SELLER);
    const pending = (
      await rows<{ id: string }>(
        `insert into public.products (name, category) values ('Unreviewed', 'matcha') returning id`
      )
    )[0].id;
    await expect(
      as(SELLER, () =>
        db.query(
          `insert into public.listings (vendor_id, product_id, price, currency, stock, url)
           values ($1, $2, 10, 'SGD', 1, 'https://kyoto-leaf.example/x')`,
          [vendor, pending]
        )
      )
    ).rejects.toThrow(/row-level security/);
  });

  it('stops other users editing or deleting the listing', async () => {
    await as(OTHER, () => db.exec(`update public.listings set price = 1`));
    await as(OTHER, () => db.exec(`delete from public.listings`));
    expect(await rows('select price::text from public.listings')).toEqual([{ price: '32.50' }]);

    const vendor = await vendorId(SELLER);
    await expect(as(OTHER, () => list(vendor))).rejects.toThrow(/row-level security/);
  });

  it('rejects a zero price, negative stock and a non-https link', async () => {
    for (const change of ['price = 0', 'stock = -1', `url = 'http://kyoto-leaf.example'`])
      await expect(
        as(SELLER, () => db.exec(`update public.listings set ${change}`))
      ).rejects.toThrow(/check constraint/);
  });

  it('updates stock and stamps the change', async () => {
    const before = (
      await rows<{ updated_at: string }>('select updated_at from public.listings')
    )[0];
    await as(SELLER, () => db.exec(`update public.listings set stock = 0`));
    const after = (
      await rows<{ stock: number; updated_at: string }>(
        'select stock, updated_at from public.listings'
      )
    )[0];
    expect(after.stock).toBe(0);
    expect(new Date(after.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before.updated_at).getTime()
    );
  });

  it('hides listings and drops the role when the vendor is rejected', async () => {
    await db.exec(`update public.vendors set status = 'rejected'`);

    expect(await as(null, () => rows('select id from public.listings'))).toEqual([]);
    expect(await as(SELLER, () => rows('select id from public.listings'))).toHaveLength(1);
    expect(await rows('select role from public.profiles where id = $1', [SELLER])).toEqual([
      { role: 'consumer' },
    ]);
    await expect(
      as(SELLER, () => db.exec(`update public.listings set stock = 9`)).then(() =>
        rows<{ stock: number }>('select stock from public.listings')
      )
    ).resolves.toEqual([{ stock: 0 }]);
  });

  it('audits vendor and listing changes', async () => {
    const audited = await rows<{ table_name: string }>(
      `select distinct table_name from public.audit_log
       where table_name in ('vendors', 'listings') order by table_name`
    );
    expect(audited).toEqual([{ table_name: 'listings' }, { table_name: 'vendors' }]);
  });
});
