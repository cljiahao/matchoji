import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const ADMIN = '11111111-1111-4111-8111-111111111111';
const TASTER = '22222222-2222-4222-8222-222222222222';
const SELLER = '33333333-3333-4333-8333-333333333333';

let db: PGlite;

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

const tea = async (name: string, status: string, addedBy: string | null = null) =>
  (
    await rows<{ id: string }>(
      `insert into public.products (name, brand, category, status, added_by)
       values ($1, 'Farm', 'matcha', $2, $3) returning id`,
      [name, status, addedBy]
    )
  )[0].id;

const call = (who: string | null, sql: string, params: unknown[] = []) =>
  as(who, () => db.query(sql, params));

beforeAll(async () => {
  db = await createMigratedDb();
  for (const id of [ADMIN, TASTER, SELLER])
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      id,
      `${id.slice(0, 4)}@example.com`,
    ]);
  await db.query('update public.profiles set is_admin = true where id = $1', [ADMIN]);
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('admin flag', () => {
  it('cannot be set by a user on themselves', async () => {
    await expect(
      as(TASTER, () => db.exec('update public.profiles set is_admin = true'))
    ).rejects.toThrow(/permission denied/);
    expect(await as(TASTER, () => rows('select public.is_admin () as a'))).toEqual([{ a: false }]);
    expect(await as(ADMIN, () => rows('select public.is_admin () as a'))).toEqual([{ a: true }]);
  });
});

describe('reviewing teas', () => {
  it('lets only an admin approve or reject, with a reason the taster can read', async () => {
    const pending = await tea('Hoshi Midori', 'pending', TASTER);
    await expect(
      call(TASTER, `select public.review_tea ($1, 'approved')`, [pending])
    ).rejects.toThrow(/Only admins/);
    await expect(
      call(null, `select public.review_tea ($1, 'approved')`, [pending])
    ).rejects.toThrow(/permission denied/);

    await call(ADMIN, `select public.review_tea ($1, 'rejected', ' Not a matcha. ')`, [pending]);
    expect(
      await as(TASTER, () =>
        rows('select status, review_note from public.products where id = $1', [pending])
      )
    ).toEqual([{ status: 'rejected', review_note: 'Not a matcha.' }]);
  });

  it('shows admins every tea, including rejected ones', async () => {
    const hidden = await tea('Hidden Reject', 'rejected');
    expect(
      await as(ADMIN, () => rows('select id from public.products where id = $1', [hidden]))
    ).toHaveLength(1);
    expect(
      await as(TASTER, () => rows('select id from public.products where id = $1', [hidden]))
    ).toEqual([]);
  });

  it('lets an admin set a tea’s photo and shop link, https only', async () => {
    const t = await tea('Linked', 'approved');
    await call(
      ADMIN,
      `select public.set_tea_links ($1, 'https://img.example/a.webp', 'https://shop.example/a', '')`,
      [t]
    );
    expect(
      await rows('select image_url, shop_url from public.products where id = $1', [t])
    ).toEqual([{ image_url: 'https://img.example/a.webp', shop_url: 'https://shop.example/a' }]);
    await expect(
      call(ADMIN, `select public.set_tea_links ($1, 'http://img.example/a.webp', '', '')`, [t])
    ).rejects.toThrow(/products_image_url_https/);
    await expect(call(TASTER, `select public.set_tea_links ($1, '', '', '')`, [t])).rejects.toThrow(
      /Only admins/
    );
  });

  it('credits the photo, keeps it on a null image, and clears both on an empty one', async () => {
    const t = await tea('Credited', 'approved');
    const state = () =>
      rows('select image_url, image_credit from public.products where id = $1', [t]);
    await call(
      ADMIN,
      `select public.set_tea_links ($1, 'https://img.example/c.webp', '', ' Marukyu Koyamaen ')`,
      [t]
    );
    expect(await state()).toEqual([
      { image_url: 'https://img.example/c.webp', image_credit: 'Marukyu Koyamaen' },
    ]);

    await call(ADMIN, `select public.set_tea_links ($1, null, '', 'Ippodo')`, [t]);
    expect(await state()).toEqual([
      { image_url: 'https://img.example/c.webp', image_credit: 'Ippodo' },
    ]);

    await call(ADMIN, `select public.set_tea_links ($1, null, '', '  ')`, [t]);
    expect(await state()).toEqual([
      { image_url: 'https://img.example/c.webp', image_credit: null },
    ]);

    await call(ADMIN, `select public.set_tea_links ($1, 'https://img.example/c.webp', '', 'X')`, [
      t,
    ]);
    await call(ADMIN, `select public.set_tea_links ($1, '', '', 'Ignored')`, [t]);
    expect(await state()).toEqual([{ image_url: null, image_credit: null }]);
  });

  it('refuses a credit over 120 characters', async () => {
    const t = await tea('Long credit', 'approved');
    await expect(
      call(ADMIN, `select public.set_tea_links ($1, null, '', $2)`, [t, 'x'.repeat(121)])
    ).rejects.toThrow(/products_image_credit_check/);
  });

  it('refuses a suggested tea that arrives with a credit, and a non-admin writing one', async () => {
    await expect(
      call(
        TASTER,
        `insert into public.products (name, category, status, added_by, image_credit)
         values ('Fake credit', 'matcha', 'pending', auth.uid (), 'Ippodo')`
      )
    ).rejects.toThrow(/row-level security/);
    const t = await tea('Taster credit', 'approved');
    await expect(
      call(TASTER, `select public.set_tea_links ($1, null, '', 'Mine')`, [t])
    ).rejects.toThrow(/Only admins/);
  });
});

describe('merging a duplicate tea', () => {
  it('moves tastings, saves, reports and listings onto the kept tea and forwards to it', async () => {
    const keep = await tea('Sayaka', 'approved');
    const dup = await tea('Sayaka no Mukashi', 'pending', TASTER);
    await call(
      TASTER,
      `insert into public.reviews (user_id, product_id, stars) values (auth.uid (), $1, 4)`,
      [dup]
    );
    await call(
      TASTER,
      `insert into public.wishlist (user_id, product_id) values (auth.uid (), $1)`,
      [dup]
    );
    await call(
      TASTER,
      `insert into public.wishlist (user_id, product_id) values (auth.uid (), $1)`,
      [keep]
    );

    await expect(call(ADMIN, 'select public.merge_tea ($1, $1)', [keep])).rejects.toThrow(/itself/);
    await expect(call(ADMIN, 'select public.merge_tea ($1, $2)', [keep, dup])).rejects.toThrow(
      /approved tea/
    );
    await call(ADMIN, 'select public.merge_tea ($1, $2)', [dup, keep]);

    expect(
      await rows('select product_id from public.reviews where user_id = $1', [TASTER])
    ).toEqual([{ product_id: keep }]);
    expect(
      await rows('select product_id from public.wishlist where user_id = $1', [TASTER])
    ).toEqual([{ product_id: keep }]);
    expect(
      await rows('select status, merged_into, review_note from public.products where id = $1', [
        dup,
      ])
    ).toEqual([{ status: 'rejected', merged_into: keep, review_note: 'Duplicate of Sayaka' }]);
  });
});

describe('reviewing shops', () => {
  it('lets an admin reject with a reason, and the shop reapply', async () => {
    await call(
      SELLER,
      `insert into public.vendors (user_id, name, country, ships_to) values (auth.uid (), 'Leaf', 'JP', '{SG}')`
    );
    const [{ id }] = await rows<{ id: string }>('select id from public.vendors');
    await expect(
      call(SELLER, `select public.review_vendor ($1, 'approved')`, [id])
    ).rejects.toThrow(/Only admins/);
    await call(ADMIN, `select public.review_vendor ($1, 'rejected', 'Add a website.')`, [id]);
    expect(await as(SELLER, () => rows('select status, review_note from public.vendors'))).toEqual([
      { status: 'rejected', review_note: 'Add a website.' },
    ]);

    await call(SELLER, 'select public.reapply_as_vendor ()');
    expect(await as(SELLER, () => rows('select status, review_note from public.vendors'))).toEqual([
      { status: 'pending', review_note: null },
    ]);
    await expect(call(SELLER, 'select public.reapply_as_vendor ()')).rejects.toThrow(
      /no rejected application/
    );
    expect(await as(ADMIN, () => rows('select name from public.vendors'))).toEqual([
      { name: 'Leaf' },
    ]);
  });
});
