import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SUPABASE_DIR, createMigratedDb } from '../support/supabase-db';

const ADMIN = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '33333333-3333-4333-8333-333333333333';
const TASTER = '44444444-4444-4444-8444-444444444444';
const TASTER2 = '55555555-5555-4555-8555-555555555555';
const PRIVATE = '66666666-6666-4666-8666-666666666666';
const CAP_CAFES = '77777777-7777-4777-8777-777777777777';
const CAP_DRINKS = '88888888-8888-4888-8888-888888888888';

const POST = 'https://www.instagram.com/p/Cx1_abc-9/';
const OTHER_POST = 'https://www.instagram.com/p/Zz9_other/';
const MIGRATION = path.join(SUPABASE_DIR, 'migrations/20261111000000_sweep_hardening.sql');

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
const call = (who: string | null, sql: string, params: unknown[] = []) =>
  as(who, () => db.query(sql, params));
const asRows = <T>(who: string | null, sql: string, params: unknown[] = []) =>
  as(who, () => rows<T>(sql, params));

let counter = 0;
const unique = (label: string) => `${label} ${++counter}`;

interface CafeOpts {
  status?: string;
  city?: string;
  area?: string | null;
  addedBy?: string | null;
  name?: string;
}

const cafe = async (opts: CafeOpts = {}) =>
  (
    await rows<{ id: string }>(
      `insert into public.cafes (name, city_slug, area, status, added_by)
       values ($1, $2, $3, $4, $5) returning id`,
      [
        opts.name ?? unique('Sweep Cafe'),
        opts.city ?? 'singapore',
        opts.area ?? null,
        opts.status ?? 'approved',
        opts.addedBy ?? null,
      ]
    )
  )[0].id;

interface DrinkOpts {
  status?: string;
  name?: string;
  addedBy?: string | null;
}

const drink = async (cafeId: string, opts: DrinkOpts = {}) =>
  (
    await rows<{ id: string }>(
      `insert into public.drinks (cafe_id, name, base, style, serving, status, added_by)
       values ($1, $2, 'hojicha', 'latte', 'both', $3, $4) returning id`,
      [cafeId, opts.name ?? unique('Sweep Latte'), opts.status ?? 'approved', opts.addedBy ?? null]
    )
  )[0].id;

const review = async (
  userId: string,
  drinkId: string,
  extra: { url?: string | null; disclosure?: string } = {}
) =>
  (
    await rows<{ id: string }>(
      `insert into public.reviews (user_id, drink_id, stars, instagram_url, disclosure)
       values ($1, $2, 4, $3, $4) returning id`,
      [userId, drinkId, extra.url ?? null, extra.disclosure ?? 'none']
    )
  )[0].id;

const merge = (what: 'cafe' | 'drink', dup: string, keep: string) =>
  call(ADMIN, `select public.merge_${what} ($1, $2)`, [dup, keep]);

beforeAll(async () => {
  db = await createMigratedDb();
  for (const id of [ADMIN, ALICE, BOB, TASTER, TASTER2, PRIVATE, CAP_CAFES, CAP_DRINKS])
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      id,
      `${id.slice(0, 4)}@example.com`,
    ]);
  await db.query('update public.profiles set is_admin = true where id = $1', [ADMIN]);
  await db.query('update public.profiles set is_public = false where id = $1', [PRIVATE]);
  for (const id of [TASTER, TASTER2, ADMIN])
    await call(ADMIN, 'select public.set_trusted_taster ($1, true)', [id]);
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('1. cafe_ratings.taster_disclosed_count', () => {
  it('counts disclosed reviews beside taster_count', async () => {
    const c = await cafe();
    const d1 = await drink(c);
    const d2 = await drink(c);
    await review(TASTER, d1, { url: POST, disclosure: 'gifted' });
    await review(TASTER, d2, { url: POST, disclosure: 'paid' });
    await review(TASTER2, d1, { url: POST, disclosure: 'none' });
    await review(BOB, d1);
    const [row] = await asRows<{
      taster_count: number;
      taster_disclosed_count: number;
      community_count: number;
    }>(
      null,
      `select taster_count, taster_disclosed_count, community_count
       from public.cafe_ratings where cafe_id = $1`,
      [c]
    );
    // Three taster reviews (TASTER on two drinks, TASTER2 on one): the unit the average uses.
    expect(row).toEqual({ taster_count: 3, taster_disclosed_count: 2, community_count: 1 });
  });

  it('counts the reviews the average is taken over, not the people', async () => {
    const c = await cafe();
    const d1 = await drink(c);
    const d2 = await drink(c);
    await review(TASTER, d1, { url: POST });
    await review(TASTER, d2, { url: POST });
    const [row] = await asRows<{ taster_count: number; taster_avg: string }>(
      null,
      'select taster_count, taster_avg from public.cafe_ratings where cafe_id = $1',
      [c]
    );
    // One person, two reviews of four stars: a count of 1 would sit beside an average of two.
    expect(row.taster_count).toBe(2);
    expect(Number(row.taster_avg)).toBe(4);
  });

  it('is zero for a café with no reviews', async () => {
    const c = await cafe();
    expect(
      await asRows(
        null,
        'select taster_disclosed_count from public.cafe_ratings where cafe_id = $1',
        [c]
      )
    ).toEqual([{ taster_disclosed_count: 0 }]);
  });
});

describe('2. drink names are unique among live drinks', () => {
  it('lets a name be reused once its holder is rejected or merged', async () => {
    const c = await cafe();
    const rejected = await drink(c, { name: 'Roasted Latte', status: 'rejected' });
    await drink(c, { name: ' roasted latte ' });
    expect(rejected).toBeTruthy();

    const keep = await drink(c, { name: 'Kept One' });
    const dup = await drink(c, { name: 'Dup One' });
    await merge('drink', dup, keep);
    await drink(c, { name: 'dup one' });
  });

  it('still refuses a second live drink with the same name', async () => {
    const c = await cafe();
    await drink(c, { name: 'Live Latte', status: 'pending', addedBy: ALICE });
    await expect(drink(c, { name: 'LIVE latte', addedBy: BOB })).rejects.toThrow(
      /drinks_cafe_name_key/
    );
  });

  it('refuses re-approving a rejected drink whose name is now taken', async () => {
    const c = await cafe();
    const old = await drink(c, { name: 'Taken Latte', status: 'rejected' });
    await drink(c, { name: 'Taken Latte' });
    await expect(call(ADMIN, `select public.review_drink ($1, 'approved')`, [old])).rejects.toThrow(
      /already has this name/
    );
  });
});

describe('3. merge_cafe with a rejected drink on the keeper', () => {
  it('moves the duplicate’s drink and numbers its slug', async () => {
    const keep = await cafe();
    const dup = await cafe();
    await drink(keep, { name: 'Hojicha Latte', status: 'rejected' });
    const moved = await drink(dup, { name: 'Hojicha Latte' });
    await merge('cafe', dup, keep);
    expect(
      await rows('select cafe_id, slug, status from public.drinks where id = $1', [moved])
    ).toEqual([{ cafe_id: keep, slug: 'hojicha-latte-2', status: 'approved' }]);
    expect(await rows('select status from public.cafes where id = $1', [dup])).toEqual([
      { status: 'rejected' },
    ]);
  });

  it('does not treat the duplicate’s own rejected drink as a clash', async () => {
    const keep = await cafe();
    const dup = await cafe();
    await drink(keep, { name: 'Same Name' });
    const rejected = await drink(dup, { name: 'Same Name', status: 'rejected' });
    await merge('cafe', dup, keep);
    expect(await rows('select cafe_id from public.drinks where id = $1', [rejected])).toEqual([
      { cafe_id: keep },
    ]);
  });
});

describe('4. reactions follow the review’s visibility', () => {
  const like = (who: string, reviewId: string) =>
    call(who, 'insert into public.review_likes (review_id, user_id) values ($1, $2)', [
      reviewId,
      who,
    ]);
  const comment = (who: string, reviewId: string) =>
    call(
      who,
      `insert into public.review_comments (review_id, user_id, body) values ($1, $2, 'hi')`,
      [reviewId, who]
    );

  it('lets anyone react on a published review of an approved drink', async () => {
    const r = await review(ALICE, await drink(await cafe()));
    await like(BOB, r);
    await comment(BOB, r);
    expect(
      await asRows(null, 'select 1 from public.review_likes where review_id = $1', [r])
    ).toHaveLength(1);
    expect(
      await asRows(null, 'select 1 from public.review_comments where review_id = $1', [r])
    ).toHaveLength(1);
  });

  it('keeps reactions on a pending drink’s review to its owner and admins', async () => {
    const d = await drink(await cafe(), { status: 'pending', addedBy: ALICE });
    const r = await review(ALICE, d);
    await expect(like(BOB, r)).rejects.toThrow(/row-level security/);
    await expect(comment(BOB, r)).rejects.toThrow(/row-level security/);
    await like(ALICE, r);
    await comment(ALICE, r);
    const count = (who: string | null) =>
      asRows<{ n: string }>(
        who,
        'select (select count(*) from public.review_likes where review_id = $1) + (select count(*) from public.review_comments where review_id = $1) as n',
        [r]
      );
    expect(await count(ALICE)).toEqual([{ n: 2 }]);
    expect(await count(ADMIN)).toEqual([{ n: 2 }]);
    expect(await count(BOB)).toEqual([{ n: 0 }]);
    expect(await count(null)).toEqual([{ n: 0 }]);
  });

  it('hides existing reactions once the drink is rejected', async () => {
    const d = await drink(await cafe());
    const r = await review(ALICE, d);
    await like(BOB, r);
    await call(ADMIN, `select public.review_drink ($1, 'rejected')`, [d]);
    expect(
      await asRows(null, 'select 1 from public.review_likes where review_id = $1', [r])
    ).toHaveLength(0);
    expect(
      await asRows(BOB, 'select 1 from public.review_likes where review_id = $1', [r])
    ).toHaveLength(0);
    await expect(comment(BOB, r)).rejects.toThrow(/row-level security/);
    expect(
      await asRows(ADMIN, 'select 1 from public.review_likes where review_id = $1', [r])
    ).toHaveLength(1);
  });

  it('still allows reactions on a private author’s drink review, which shows anonymously', async () => {
    const r = await review(PRIVATE, await drink(await cafe()));
    await like(BOB, r);
    expect(
      await asRows(BOB, 'select 1 from public.review_likes where review_id = $1', [r])
    ).toHaveLength(1);
  });
});

describe('5. disclosure and Instagram link after publishing', () => {
  const update = (who: string, id: string, set: string) =>
    call(who, `update public.reviews set ${set} where id = $1`, [id]);

  it('lets disclosure be raised but never lowered', async () => {
    const r = await review(TASTER, await drink(await cafe()), { url: POST, disclosure: 'gifted' });
    await expect(update(TASTER, r, `disclosure = 'none'`)).rejects.toThrow(
      /raised but not lowered/
    );
    await expect(update(TASTER, r, `disclosure = 'invited'`)).rejects.toThrow(
      /raised but not lowered/
    );
    await update(TASTER, r, `disclosure = 'gifted'`);
    await update(TASTER, r, `disclosure = 'paid'`);
    await expect(update(TASTER, r, `disclosure = 'gifted'`)).rejects.toThrow(
      /raised but not lowered/
    );
  });

  it('fixes the Instagram link once set, except for admins', async () => {
    const d = await drink(await cafe());
    const r = await review(TASTER, d, { url: POST });
    await expect(update(TASTER, r, `instagram_url = '${OTHER_POST}'`)).rejects.toThrow(
      /cannot be changed/
    );
    await update(TASTER, r, `instagram_url = '${POST}'`);
    const adminReview = await review(ADMIN, d, { url: POST });
    await update(ADMIN, adminReview, `instagram_url = '${OTHER_POST}'`);
  });

  it('allows adding a link where there was none (a taster’s tea review)', async () => {
    const [{ id: tea }] = await rows<{ id: string }>(
      `insert into public.products (name, brand, category, status)
       values ($1, 'Farm', 'hojicha', 'approved') returning id`,
      [unique('Tea')]
    );
    const [{ id }] = await rows<{ id: string }>(
      `insert into public.reviews (user_id, product_id, stars) values ($1, $2, 4) returning id`,
      [TASTER, tea]
    );
    await update(TASTER, id, `instagram_url = '${POST}'`);
    expect(await rows('select instagram_url from public.reviews where id = $1', [id])).toEqual([
      { instagram_url: POST },
    ]);
  });

  it('still lets deleting an account clear both fields', async () => {
    const r = await review(TASTER2, await drink(await cafe()), { url: POST, disclosure: 'paid' });
    await call(TASTER2, 'select public.delete_my_account ()');
    expect(
      await rows('select instagram_url, disclosure from public.reviews where id = $1', [r])
    ).toEqual([{ instagram_url: null, disclosure: 'none' }]);
  });
});

describe('6. duplicate cafés and daily caps', () => {
  it('refuses a second live café with the same city, name and area', async () => {
    await cafe({ name: 'Dup Cafe', area: 'Orchard' });
    await expect(cafe({ name: '  dup CAFE ', area: 'Orchard', status: 'pending' })).rejects.toThrow(
      /cafes_city_name_area_key/
    );
    await cafe({ name: 'Dup Cafe', area: 'Tampines' });
    await cafe({ name: 'Dup Cafe', area: 'Orchard', city: 'johor-bahru' });
  });

  it('ignores case and surrounding spaces in the area', async () => {
    await cafe({ name: 'Area Case Cafe', area: 'Orchard' });
    await expect(
      cafe({ name: 'Area Case Cafe', area: ' orchard ', status: 'pending' })
    ).rejects.toThrow(/cafes_city_name_area_key/);
    await expect(
      cafe({ name: 'Area Case Cafe', area: '  ', status: 'pending' })
    ).resolves.toBeTruthy();
  });

  it('exempts admins from the daily caps', async () => {
    for (let i = 0; i < 16; i++) await cafe({ addedBy: ADMIN });
    const c = await cafe({ addedBy: ADMIN });
    for (let i = 0; i < 31; i++) await drink(c, { addedBy: ADMIN });
    expect(await drink(c, { addedBy: ADMIN })).toBeTruthy();
  });

  it('treats a missing area as one area', async () => {
    await cafe({ name: 'No Area Cafe' });
    await expect(cafe({ name: 'No Area Cafe', status: 'pending' })).rejects.toThrow(
      /cafes_city_name_area_key/
    );
  });

  it('lets a rejected or merged café give up its name', async () => {
    await cafe({ name: 'Gone Cafe', area: 'Bugis', status: 'rejected' });
    const id = await cafe({ name: 'Gone Cafe', area: 'Bugis' });
    expect(id).toBeTruthy();
  });

  it('caps café submissions per user per day whatever their status', async () => {
    for (let i = 0; i < 15; i++)
      await cafe({ addedBy: CAP_CAFES, status: i % 2 ? 'rejected' : 'approved' });
    await expect(cafe({ addedBy: CAP_CAFES, status: 'rejected' })).rejects.toThrow(
      /lot for one day/
    );
    await cafe({ addedBy: ALICE });
  });

  it('caps drink submissions per user per day whatever their status', async () => {
    const c = await cafe();
    for (let i = 0; i < 30; i++)
      await drink(c, { addedBy: CAP_DRINKS, status: i % 2 ? 'rejected' : 'approved' });
    await expect(drink(c, { addedBy: CAP_DRINKS, status: 'rejected' })).rejects.toThrow(
      /lot for one day/
    );
  });

  it('can be rerun, and fails clearly when live duplicates already exist', async () => {
    const fresh = await createMigratedDb();
    try {
      const sql = readFileSync(MIGRATION, 'utf8');
      await fresh.exec(sql);
      await fresh.exec('drop index public.cafes_city_name_area_key');
      for (let i = 0; i < 2; i++)
        await fresh.query(
          `insert into public.cafes (name, city_slug, area, status) values ('Twin', 'singapore', 'CBD', 'approved')`
        );
      await expect(fresh.exec(sql)).rejects.toThrow(/duplicate live cafés exist: .*twin/);
      await fresh.exec(
        `update public.cafes set status = 'rejected' where id in (select id from public.cafes limit 1)`
      );
      await fresh.exec(sql);
    } finally {
      await fresh.close();
    }
  }, 60_000);
});

describe('7. reviewing a merged row is refused', () => {
  it('refuses review_cafe and review_drink on merged rows, not on others', async () => {
    const keep = await cafe();
    const dup = await cafe();
    await merge('cafe', dup, keep);
    await expect(call(ADMIN, `select public.review_cafe ($1, 'approved')`, [dup])).rejects.toThrow(
      /merged/
    );

    const k = await drink(keep, { name: 'Keeper' });
    const dd = await drink(keep, { name: 'Duplicate' });
    await merge('drink', dd, k);
    await expect(call(ADMIN, `select public.review_drink ($1, 'approved')`, [dd])).rejects.toThrow(
      /merged/
    );

    await call(ADMIN, `select public.review_drink ($1, 'rejected', 'no')`, [k]);
    await expect(
      call(ADMIN, `select public.review_cafe ($1, 'approved')`, [crypto.randomUUID()])
    ).rejects.toThrow(/No such café/);
  });
});

describe('8. update_cafe and update_drink validate input', () => {
  const updateCafe = (id: string, fields: object) =>
    call(ADMIN, 'select public.update_cafe ($1, $2::jsonb)', [id, JSON.stringify(fields)]);
  const updateDrink = (id: string, fields: object) =>
    call(ADMIN, 'select public.update_drink ($1, $2::jsonb)', [id, JSON.stringify(fields)]);

  it('rejects an unparseable or out-of-range lat/lng with a clean error', async () => {
    const c = await cafe();
    await expect(updateCafe(c, { lat: 'north' })).rejects.toThrow(/lat must be a number/);
    await expect(updateCafe(c, { lat: 91 })).rejects.toThrow(/lat must be between/);
    await expect(updateCafe(c, { lng: 'NaN' })).rejects.toThrow(/lng must be a number/);
    await expect(updateCafe(c, { lng: -181 })).rejects.toThrow(/lng must be between/);
    await updateCafe(c, { lat: 1.3521, lng: 103.8198 });
    await updateCafe(c, { lat: null });
    expect(await rows('select lat, lng from public.cafes where id = $1', [c])).toEqual([
      { lat: null, lng: 103.8198 },
    ]);
  });

  it('trims the name and refuses a blank or over-long one', async () => {
    const c = await cafe();
    await updateCafe(c, { name: '  New Name  ' });
    expect(await rows('select name from public.cafes where id = $1', [c])).toEqual([
      { name: 'New Name' },
    ]);
    await expect(updateCafe(c, { name: '   ' })).rejects.toThrow(/Name must be/);
    await expect(updateCafe(c, { name: 'x'.repeat(121) })).rejects.toThrow(/Name must be/);
    await expect(updateCafe(c, { name: null })).rejects.toThrow(/Name must be/);

    const d = await drink(c);
    await updateDrink(d, { name: ' Spaced ' });
    expect(await rows('select name from public.drinks where id = $1', [d])).toEqual([
      { name: 'Spaced' },
    ]);
    await expect(updateDrink(d, { name: '' })).rejects.toThrow(/Name must be/);
  });

  it('rejects a bad price, tea id or clashing name with a clean error', async () => {
    const c = await cafe();
    const d = await drink(c, { name: 'Price Test' });
    await drink(c, { name: 'Other Drink' });
    await expect(updateDrink(d, { price: 'cheap' })).rejects.toThrow(/price must be a number/);
    await expect(updateDrink(d, { price: -1 })).rejects.toThrow(/price must be between/);
    await expect(updateDrink(d, { price: 100000 })).rejects.toThrow(/price must be between/);
    await expect(updateDrink(d, { tea_product_id: 'nope' })).rejects.toThrow(/must be an id/);
    await expect(updateDrink(d, { name: 'other drink' })).rejects.toThrow(/already has this name/);
    await updateDrink(d, { price: '7.50' });
    expect(await rows('select price from public.drinks where id = $1', [d])).toEqual([
      { price: '7.50' },
    ]);
  });

  it('rejects a non-object payload', async () => {
    const c = await cafe();
    await expect(call(ADMIN, `select public.update_cafe ($1, '[]'::jsonb)`, [c])).rejects.toThrow(
      /must be an object/
    );
  });
});

describe('9. Instagram handles cannot be only dots', () => {
  it('rejects "." and ".." on profiles and cafés, and keeps real handles', async () => {
    for (const bad of ['.', '..', '...'])
      await expect(
        call(ALICE, 'update public.profiles set instagram_handle = $2 where id = $1', [ALICE, bad])
      ).rejects.toThrow(/profiles_instagram_handle_not_dots/);
    await call(ALICE, 'update public.profiles set instagram_handle = $2 where id = $1', [
      ALICE,
      'a.b_c',
    ]);
    await call(ALICE, 'update public.profiles set instagram_handle = null where id = $1', [ALICE]);

    await expect(
      db.query(
        `insert into public.cafes (name, city_slug, instagram_handle) values ($1, 'singapore', '..')`,
        [unique('Dots')]
      )
    ).rejects.toThrow(/cafes_instagram_handle_not_dots/);
    await db.query(
      `insert into public.cafes (name, city_slug, instagram_handle) values ($1, 'singapore', 'ok.cafe')`,
      [unique('Handle')]
    );
  });
});
