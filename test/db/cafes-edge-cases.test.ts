import { randomUUID } from 'node:crypto';

import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

// Edge cases the main cafés-and-drinks suite leaves out. Each test pins today's behaviour.

const ADMIN = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '33333333-3333-4333-8333-333333333333';
const TASTER = '44444444-4444-4444-8444-444444444444';
const OTHER = '66666666-6666-4666-8666-666666666666';

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

let counter = 0;
const unique = (label: string) => `${label} ${++counter}`;

const cafe = async (opts: { status?: string; city?: string } = {}) =>
  (
    await rows<{ id: string }>(
      `insert into public.cafes (name, city_slug, status) values ($1, $2, $3) returning id`,
      [unique('Cafe'), opts.city ?? 'singapore', opts.status ?? 'approved']
    )
  )[0].id;

const drink = async (
  cafeId: string,
  opts: { status?: string; name?: string; addedBy?: string | null } = {}
) =>
  (
    await rows<{ id: string }>(
      `insert into public.drinks (cafe_id, name, base, style, serving, status, added_by)
       values ($1, $2, 'hojicha', 'latte', 'both', $3, $4) returning id`,
      [
        cafeId,
        opts.name ?? unique('Hojicha Latte'),
        opts.status ?? 'approved',
        opts.addedBy ?? null,
      ]
    )
  )[0].id;

const review = async (userId: string, drinkId: string, stars: number, daysAgo = 0) =>
  (
    await rows<{ id: string }>(
      `insert into public.reviews (user_id, drink_id, stars, tasted_on)
       values ($1, $2, $3, current_date - $4::integer) returning id`,
      [userId, drinkId, stars, daysAgo]
    )
  )[0].id;

beforeAll(async () => {
  db = await createMigratedDb();
  for (const id of [ADMIN, ALICE, BOB, TASTER, OTHER])
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      id,
      `${id.slice(0, 4)}@example.com`,
    ]);
  await db.query('update public.profiles set is_admin = true where id = $1', [ADMIN]);
  await call(ADMIN, 'select public.set_trusted_taster ($1, true)', [TASTER]);
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('keep_taster_public trigger', () => {
  it('lets a person who is not a taster go private and come back', async () => {
    await call(BOB, 'update public.profiles set is_public = false where id = $1', [BOB]);
    await call(BOB, 'update public.profiles set is_public = true where id = $1', [BOB]);
    expect(await rows('select is_public from public.profiles where id = $1', [BOB])).toEqual([
      { is_public: true },
    ]);
  });

  it('lets a taster edit other fields while staying public', async () => {
    await call(TASTER, `update public.profiles set bio = 'Hojicha first' where id = $1`, [TASTER]);
    expect(await rows('select bio from public.profiles where id = $1', [TASTER])).toEqual([
      { bio: 'Hojicha first' },
    ]);
  });

  it('refuses to make a taster private, even for the table owner', async () => {
    await expect(
      call(TASTER, 'update public.profiles set is_public = false where id = $1', [TASTER])
    ).rejects.toThrow(/stays public/);
    await expect(
      db.query('update public.profiles set is_public = false where id = $1', [TASTER])
    ).rejects.toThrow(/stays public/);
    // An admin has no policy to edit someone else's profile, so the update matches no row.
    const byAdmin = await call(
      ADMIN,
      'update public.profiles set is_public = false where id = $1',
      [TASTER]
    );
    expect(byAdmin.affectedRows).toBe(0);
    expect(await rows('select is_public from public.profiles where id = $1', [TASTER])).toEqual([
      { is_public: true },
    ]);
  });

  it('refuses to promote a private profile without making it public in the same statement', async () => {
    await call(OTHER, 'update public.profiles set is_public = false where id = $1', [OTHER]);
    await expect(
      db.query('update public.profiles set is_trusted_taster = true where id = $1', [OTHER])
    ).rejects.toThrow(/stays public/);
    expect(
      await rows('select is_trusted_taster from public.profiles where id = $1', [OTHER])
    ).toEqual([{ is_trusted_taster: false }]);
  });

  it('allows going private again once the badge is revoked', async () => {
    await call(ADMIN, 'select public.set_trusted_taster ($1, true)', [OTHER]);
    await call(ADMIN, 'select public.set_trusted_taster ($1, false)', [OTHER]);
    await call(OTHER, 'update public.profiles set is_public = false where id = $1', [OTHER]);
    expect(await rows('select is_public from public.profiles where id = $1', [OTHER])).toEqual([
      { is_public: false },
    ]);
  });
});

describe('merge_drink with a shared reviewer', () => {
  it('keeps both reviews and counts the person once, by their latest', async () => {
    const c = await cafe();
    const keep = await drink(c);
    const dup = await drink(c);
    const older = await review(ALICE, dup, 2, 3);
    const newer = await review(ALICE, keep, 5, 0);

    await call(ADMIN, 'select public.merge_drink ($1, $2)', [dup, keep]);

    expect(
      await rows('select id from public.reviews where drink_id = $1 order by tasted_on', [keep])
    ).toEqual([{ id: older }, { id: newer }]);
    expect(await rows('select 1 from public.reviews where drink_id = $1', [dup])).toHaveLength(0);
    expect(
      await rows(
        'select community_count::int as n, community_avg::float as avg from public.drink_ratings where drink_id = $1',
        [keep]
      )
    ).toEqual([{ n: 1, avg: 5 }]);
  });

  it('counts the older review when it is the later one', async () => {
    const c = await cafe();
    const keep = await drink(c);
    const dup = await drink(c);
    await review(BOB, keep, 1, 4);
    await review(BOB, dup, 4, 0);

    await call(ADMIN, 'select public.merge_drink ($1, $2)', [dup, keep]);

    expect(
      await rows<{ n: number; avg: number }>(
        'select community_count::int as n, community_avg::float as avg from public.drink_ratings where drink_id = $1',
        [keep]
      )
    ).toEqual([{ n: 1, avg: 4 }]);
  });
});

describe('merge_cafe when keep is already merged', () => {
  it('refuses a keeper that was itself merged away, leaving the duplicate untouched', async () => {
    const survivor = await cafe();
    const merged = await cafe();
    const dup = await cafe();
    const d = await drink(dup);
    await call(ADMIN, 'select public.merge_cafe ($1, $2)', [merged, survivor]);

    await expect(call(ADMIN, 'select public.merge_cafe ($1, $2)', [dup, merged])).rejects.toThrow(
      /approved café/
    );
    expect(await rows('select status, merged_into from public.cafes where id = $1', [dup])).toEqual(
      [{ status: 'approved', merged_into: null }]
    );
    expect(await rows('select cafe_id from public.drinks where id = $1', [d])).toEqual([
      { cafe_id: dup },
    ]);
  });

  it('refuses to merge a café that was already merged into itself', async () => {
    const a = await cafe();
    const b = await cafe();
    await call(ADMIN, 'select public.merge_cafe ($1, $2)', [a, b]);
    await expect(call(ADMIN, 'select public.merge_cafe ($1, $2)', [a, a])).rejects.toThrow(
      /itself/
    );
  });
});

describe('writes to cities', () => {
  const snapshot = () => rows('select slug, name, currency from public.cities order by sort_order');

  it('refuses insert, update and delete for anon, members and admins', async () => {
    const before = await snapshot();
    for (const who of [null, ALICE, ADMIN]) {
      await expect(
        call(
          who,
          `insert into public.cities (slug, name, country, currency) values ('zz', 'ZZ', 'SG', 'SGD')`
        )
      ).rejects.toThrow(/permission denied/);
      await expect(
        call(who, `update public.cities set name = 'Changed' where slug = 'singapore'`)
      ).rejects.toThrow(/permission denied/);
      await expect(call(who, `delete from public.cities where slug = 'singapore'`)).rejects.toThrow(
        /permission denied/
      );
    }
    expect(await snapshot()).toEqual(before);
  });

  it('is still readable by anon', async () => {
    const seen = await call(null, 'select slug from public.cities order by sort_order');
    expect(seen.rows).toEqual([{ slug: 'singapore' }, { slug: 'johor-bahru' }]);
  });
});

describe('limit_pending_rows on drinks', () => {
  const person = async () => {
    const id = randomUUID();
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      id,
      `${id.slice(0, 8)}@example.com`,
    ]);
    return id;
  };
  const fillPending = async (cafeId: string, who: string) => {
    for (let i = 0; i < 20; i++) await drink(cafeId, { status: 'pending', addedBy: who });
  };

  it('refuses the 21st pending drink for one person', async () => {
    const [c, who] = [await cafe(), await person()];
    await fillPending(c, who);
    await expect(drink(c, { status: 'pending', addedBy: who })).rejects.toThrow(
      /too many drinks waiting for review/
    );
  });

  it('counts only pending drinks, and only the same person', async () => {
    const [c, who, other] = [await cafe(), await person(), await person()];
    await fillPending(c, who);
    await drink(c, { status: 'approved', addedBy: who });
    await drink(c, { status: 'pending', addedBy: other });
    await drink(c, { status: 'pending', addedBy: null });
    expect(
      await rows(`select 1 from public.drinks where added_by = $1 and status = 'pending'`, [who])
    ).toHaveLength(20);
  });

  it('frees a slot once one of the pending drinks is reviewed', async () => {
    const [c, who] = [await cafe(), await person()];
    await fillPending(c, who);
    const [{ id }] = await rows<{ id: string }>(
      `select id from public.drinks where added_by = $1 limit 1`,
      [who]
    );
    await db.query(`update public.drinks set status = 'rejected' where id = $1`, [id]);
    await drink(c, { status: 'pending', addedBy: who });
    await expect(drink(c, { status: 'pending', addedBy: who })).rejects.toThrow(/too many drinks/);
  });

  it('keeps the café cap apart from the drink cap', async () => {
    const [c, who] = [await cafe(), await person()];
    await fillPending(c, who);
    await db.query(
      `insert into public.cafes (name, city_slug, status, added_by) values ($1, 'singapore', 'pending', $2)`,
      [unique('Capped cafe'), who]
    );
    expect(
      await rows(`select 1 from public.cafes where added_by = $1 and status = 'pending'`, [who])
    ).toHaveLength(1);
  });
});
