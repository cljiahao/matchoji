import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const ADMIN = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '33333333-3333-4333-8333-333333333333';
const TASTER = '44444444-4444-4444-8444-444444444444';
const TASTER2 = '55555555-5555-4555-8555-555555555555';
const CAROL = '66666666-6666-4666-8666-666666666666';
const DAVE = '77777777-7777-4777-8777-777777777777';
const CAPPED = '88888888-8888-4888-8888-888888888888';

const POST = 'https://www.instagram.com/p/Cx1_abc-9/';

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
        opts.name ?? unique('Cafe'),
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
  teaProductId?: string | null;
}

const drink = async (cafeId: string, opts: DrinkOpts = {}) =>
  (
    await rows<{ id: string }>(
      `insert into public.drinks (cafe_id, name, base, style, serving, status, added_by, tea_product_id)
       values ($1, $2, 'hojicha', 'latte', 'both', $3, $4, $5) returning id`,
      [
        cafeId,
        opts.name ?? unique('Hojicha Latte'),
        opts.status ?? 'approved',
        opts.addedBy ?? null,
        opts.teaProductId ?? null,
      ]
    )
  )[0].id;

interface ReviewOpts {
  daysAgo?: number;
  instagramUrl?: string | null;
  disclosure?: string;
}

const drinkReview = async (userId: string, drinkId: string, stars: number, opts: ReviewOpts = {}) =>
  (
    await rows<{ id: string }>(
      `insert into public.reviews (user_id, drink_id, stars, tasted_on, instagram_url, disclosure)
       values ($1, $2, $3, current_date - $4::integer, $5, $6) returning id`,
      [
        userId,
        drinkId,
        stars,
        opts.daysAgo ?? 0,
        opts.instagramUrl ?? null,
        opts.disclosure ?? 'none',
      ]
    )
  )[0].id;

const tasterReview = (id: string, drinkId: string, stars: number, disclosure = 'none') =>
  drinkReview(id, drinkId, stars, { instagramUrl: POST, disclosure });

const tea = async (name: string) =>
  (
    await rows<{ id: string }>(
      `insert into public.products (name, brand, category, status)
       values ($1, 'Farm', 'hojicha', 'approved') returning id`,
      [name]
    )
  )[0].id;

interface Ratings {
  taster_count: number;
  taster_avg: string | null;
  taster_disclosed_count: number;
  community_count: number;
  community_avg: string | null;
}

const ratings = async (drinkId: string) =>
  (
    await rows<Ratings>(
      `select taster_count, taster_avg, taster_disclosed_count, community_count, community_avg
       from public.drink_ratings where drink_id = $1`,
      [drinkId]
    )
  )[0];

beforeAll(async () => {
  db = await createMigratedDb();
  for (const id of [ADMIN, ALICE, BOB, TASTER, TASTER2, CAROL, DAVE, CAPPED])
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

describe('cities', () => {
  it('seeds singapore and johor-bahru', async () => {
    expect(
      await asRows(
        null,
        'select slug, name, country, currency from public.cities order by sort_order'
      )
    ).toEqual([
      { slug: 'singapore', name: 'Singapore', country: 'SG', currency: 'SGD' },
      { slug: 'johor-bahru', name: 'Johor Bahru', country: 'MY', currency: 'MYR' },
    ]);
    await expect(
      call(
        ALICE,
        `insert into public.cities (slug, name, country, currency) values ('x', 'X', 'SG', 'SGD')`
      )
    ).rejects.toThrow(/permission denied/);
  });
});

describe('suggesting cafés', () => {
  const insertCafe = (who: string | null, name: string, extra = '') =>
    call(
      who,
      `insert into public.cafes (name, city_slug${extra ? ', ' + extra.split('=')[0] : ''})
       values ($1, 'singapore'${extra ? ', ' + extra.split('=')[1] : ''}) returning status`,
      [name]
    );

  it('anyone signed in can add a pending café; anon cannot', async () => {
    const added = await insertCafe(ALICE, unique('Alice Cafe'));
    expect(added.rows).toEqual([{ status: 'pending' }]);
    expect(
      await asRows(ALICE, 'select added_by from public.my_cafes where name like $1', [
        'Alice Cafe%',
      ])
    ).toEqual([{ added_by: ALICE }]);

    await expect(insertCafe(null, unique('Anon Cafe'))).rejects.toThrow(/permission denied/);
    await expect(insertCafe(ALICE, unique('Sneaky'), `status='approved'`)).rejects.toThrow(
      /row-level security/
    );
    await expect(
      insertCafe(ALICE, unique('Sneaky'), `review_note='Approved by me'`)
    ).rejects.toThrow(/row-level security/);
    await expect(
      call(
        ALICE,
        `insert into public.cafes (name, city_slug, added_by) values ($1, 'singapore', $2)`,
        [unique('Framed'), BOB]
      )
    ).rejects.toThrow(/row-level security/);
  });

  it('keeps a pending café to its adder and admins', async () => {
    const name = unique('Hidden Cafe');
    await insertCafe(ALICE, name);
    const find = (who: string | null) =>
      asRows(who, 'select name from public.cafes where name = $1', [name]);
    expect(await find(ALICE)).toHaveLength(1);
    expect(await find(ADMIN)).toHaveLength(1);
    expect(await find(BOB)).toHaveLength(0);
    expect(await find(null)).toHaveLength(0);
  });

  it('café slug is generated, unique, and ignores client slug; update cannot change slug', async () => {
    const name = 'Café Kitsuné';
    const first = await call(
      ALICE,
      `insert into public.cafes (name, area, city_slug, slug)
       values ($1, 'Tanjong Pagar', 'singapore', 'hacked') returning id, slug`,
      [name]
    );
    expect(first.rows[0]).toMatchObject({ slug: 'cafe-kitsune-tanjong-pagar' });

    const second = await call(
      BOB,
      `insert into public.cafes (name, area, city_slug) values ($1, 'Tanjong Pagar', 'singapore')
       returning slug`,
      [name]
    );
    expect(second.rows).toEqual([{ slug: 'cafe-kitsune-tanjong-pagar-2' }]);

    const id = (first.rows[0] as { id: string }).id;
    await expect(
      call(ALICE, `update public.cafes set slug = 'new' where id = $1`, [id])
    ).rejects.toThrow(/permission denied/);
    await expect(
      call(ADMIN, `update public.cafes set slug = 'new' where id = $1`, [id])
    ).rejects.toThrow(/permission denied/);
  });

  it('11th pending café for one user is refused', async () => {
    for (let i = 0; i < 10; i++) await insertCafe(CAPPED, unique('Capped Cafe'));
    await expect(insertCafe(CAPPED, unique('Capped Cafe'))).rejects.toThrow(
      /too many cafés waiting for review/
    );
    await insertCafe(ALICE, unique('Other Cafe'));
  });
});

describe('suggesting drinks', () => {
  it('drink currency follows the café city (JB → MYR)', async () => {
    const sg = await cafe();
    const jb = await cafe({ city: 'johor-bahru' });
    const add = (cafeId: string) =>
      call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving, currency)
         values ($1, $2, 'matcha', 'latte', 'iced', 'SGD') returning currency`,
        [cafeId, unique('Matcha Latte')]
      );
    expect((await add(sg)).rows).toEqual([{ currency: 'SGD' }]);
    expect((await add(jb)).rows).toEqual([{ currency: 'MYR' }]);
  });

  it('refuses drinks at a café the caller cannot engage, and photos on suggestions', async () => {
    const pendingElsewhere = await cafe({ status: 'pending', addedBy: BOB });
    await expect(
      call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving) values ($1, 'X', 'matcha', 'latte', 'hot')`,
        [pendingElsewhere]
      )
    ).rejects.toThrow(/row-level security/);

    const approved = await cafe();
    await expect(
      call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving, photo_url)
         values ($1, 'Pixel', 'matcha', 'latte', 'hot', 'https://tracker.example/p.gif')`,
        [approved]
      )
    ).rejects.toThrow(/row-level security/);
  });

  it('keeps one drink per name at a café, and numbers a repeated slug', async () => {
    const c = await cafe();
    await drink(c, { name: 'Hojicha Latte' });
    await expect(drink(c, { name: ' hojicha latte ' })).rejects.toThrow(/drinks_cafe_name_key/);
    const slug = await rows<{ slug: string }>(
      `insert into public.drinks (cafe_id, name, base, style, serving, currency)
       values ($1, 'Hojicha-Latte!', 'hojicha', 'latte', 'hot', 'SGD') returning slug`,
      [c]
    );
    expect(slug[0].slug).toBe('hojicha-latte-2');
  });

  it('user can rate own pending drink; others cannot rate it', async () => {
    const c = await cafe();
    const pending = (
      await call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving)
         values ($1, $2, 'hojicha', 'latte', 'hot') returning id`,
        [c, unique('Pending Latte')]
      )
    ).rows[0] as { id: string };

    await call(ALICE, `insert into public.reviews (user_id, drink_id, stars) values ($1, $2, 4)`, [
      ALICE,
      pending.id,
    ]);
    await expect(
      call(BOB, `insert into public.reviews (user_id, drink_id, stars) values ($1, $2, 4)`, [
        BOB,
        pending.id,
      ])
    ).rejects.toThrow(/row-level security/);
  });
});

describe('reviews of drinks', () => {
  it('review must have exactly one of product_id / drink_id', async () => {
    const d = await drink(await cafe());
    const p = await tea(unique('Tea'));
    const insert = (product: string | null, drinkId: string | null) =>
      call(
        ALICE,
        `insert into public.reviews (user_id, product_id, drink_id, stars) values ($1, $2, $3, 4)`,
        [ALICE, product, drinkId]
      );
    await expect(insert(p, d)).rejects.toThrow(/reviews_one_target/);
    await expect(insert(null, null)).rejects.toThrow(/row-level security/);
    await db.query(`alter table public.reviews disable trigger user`);
    try {
      await expect(
        db.query(`insert into public.reviews (user_id, stars) values ($1, 4)`, [ALICE])
      ).rejects.toThrow(/reviews_one_target/);
    } finally {
      await db.query(`alter table public.reviews enable trigger user`);
    }
    await insert(p, null);
    await insert(null, d);
  });

  it('non-taster cannot set instagram_url or disclosure', async () => {
    const d = await drink(await cafe());
    const insert = (extra: string) =>
      call(
        BOB,
        `insert into public.reviews (user_id, drink_id, stars, ${extra.split('=')[0]})
         values ($1, $2, 4, ${extra.split('=')[1]})`,
        [BOB, d]
      );
    await expect(insert(`instagram_url='${POST}'`)).rejects.toThrow(/Only trusted tasters/);
    await expect(insert(`disclosure='gifted'`)).rejects.toThrow(/Only trusted tasters/);

    const own = (
      await call(
        BOB,
        `insert into public.reviews (user_id, drink_id, stars) values ($1, $2, 4) returning id`,
        [BOB, d]
      )
    ).rows[0] as { id: string };
    await expect(
      call(BOB, `update public.reviews set disclosure = 'paid' where id = $1`, [own.id])
    ).rejects.toThrow(/Only trusted tasters/);
    await expect(
      call(BOB, `update public.reviews set instagram_url = '${POST}' where id = $1`, [own.id])
    ).rejects.toThrow(/Only trusted tasters/);
  });

  it('taster drink review without instagram_url is refused; with valid url succeeds and by_trusted_taster = true', async () => {
    const d = await drink(await cafe());
    const insert = (url: string | null) =>
      call(
        TASTER,
        `insert into public.reviews (user_id, drink_id, stars, instagram_url, disclosure)
         values ($1, $2, 5, $3, 'gifted') returning by_trusted_taster, instagram_url`,
        [TASTER, d, url]
      );
    await expect(insert(null)).rejects.toThrow(/needs the Instagram post link/);
    for (const bad of [
      'http://www.instagram.com/p/abc/',
      'https://www.instagram.com/stories/abc/',
      'https://evil.example/https://www.instagram.com/p/abc/',
      'https://www.instagram.com/p/abc/?utm=x',
    ])
      await expect(insert(bad)).rejects.toThrow(/instagram_url/);
    expect((await insert(POST)).rows).toEqual([{ by_trusted_taster: true, instagram_url: POST }]);
    expect((await insert('https://www.instagram.com/reel/Zz9/')).rows).toHaveLength(1);
  });

  it('lets a taster review a tea without an Instagram link', async () => {
    const p = await tea(unique('Tea'));
    const res = await call(
      TASTER,
      `insert into public.reviews (user_id, product_id, stars) values ($1, $2, 4) returning by_trusted_taster`,
      [TASTER, p]
    );
    expect(res.rows).toEqual([{ by_trusted_taster: true }]);
  });

  it('client cannot spoof by_trusted_taster', async () => {
    const d = await drink(await cafe());
    const res = await call(
      BOB,
      `insert into public.reviews (user_id, drink_id, stars, by_trusted_taster)
       values ($1, $2, 4, true) returning by_trusted_taster`,
      [BOB, d]
    );
    expect(res.rows).toEqual([{ by_trusted_taster: false }]);
    const review = (
      await rows<{ id: string }>('select id from public.reviews where drink_id = $1', [d])
    )[0];
    await expect(
      call(BOB, `update public.reviews set by_trusted_taster = true where id = $1`, [review.id])
    ).rejects.toThrow(/permission denied/);
  });
});

describe('trusted tasters', () => {
  it('user cannot set own is_trusted_taster', async () => {
    await expect(
      call(CAROL, `update public.profiles set is_trusted_taster = true where id = $1`, [CAROL])
    ).rejects.toThrow(/permission denied/);
    await call(
      CAROL,
      `update public.profiles set instagram_handle = 'carol.sips', bio = 'Hojicha fan' where id = $1`,
      [CAROL]
    );
    await expect(
      call(CAROL, `update public.profiles set instagram_handle = '@carol' where id = $1`, [CAROL])
    ).rejects.toThrow(/instagram_handle/);
    await expect(
      call(CAROL, `update public.profiles set bio = $2 where id = $1`, [CAROL, 'x'.repeat(281)])
    ).rejects.toThrow(/bio/);
  });

  it('set_trusted_taster requires admin and forces is_public', async () => {
    await call(TASTER2, `update public.profiles set is_public = false where id = $1`, [TASTER2]);
    await expect(
      call(TASTER2, 'select public.set_trusted_taster ($1, true)', [TASTER2])
    ).rejects.toThrow(/Only admins/);
    await expect(
      call(null, 'select public.set_trusted_taster ($1, true)', [TASTER2])
    ).rejects.toThrow(/permission denied/);
    await call(ADMIN, 'select public.set_trusted_taster ($1, true)', [TASTER2]);
    expect(
      await rows('select is_trusted_taster, is_public from public.profiles where id = $1', [
        TASTER2,
      ])
    ).toEqual([{ is_trusted_taster: true, is_public: true }]);
    const view = await asRows<{ is_trusted_taster: boolean }>(
      null,
      'select is_trusted_taster from public.public_profiles where id = $1',
      [TASTER2]
    );
    expect(view).toEqual([{ is_trusted_taster: true }]);
  });

  it('taster cannot set is_public = false', async () => {
    await expect(
      call(TASTER2, `update public.profiles set is_public = false where id = $1`, [TASTER2])
    ).rejects.toThrow(/stays public/);
  });

  it("revoking taster keeps existing reviews' by_trusted_taster", async () => {
    await call(ADMIN, 'select public.set_trusted_taster ($1, true)', [DAVE]);
    const d = await drink(await cafe());
    await tasterReview(DAVE, d, 5);
    await call(ADMIN, 'select public.set_trusted_taster ($1, false)', [DAVE]);

    const stored = await rows('select by_trusted_taster from public.reviews where user_id = $1', [
      DAVE,
    ]);
    expect(stored).toEqual([{ by_trusted_taster: true }]);
    expect((await ratings(d)).taster_count).toBe(1);

    const later = await call(
      DAVE,
      `insert into public.reviews (user_id, drink_id, stars) values ($1, $2, 3) returning by_trusted_taster`,
      [DAVE, await drink(await cafe())]
    );
    expect(later.rows).toEqual([{ by_trusted_taster: false }]);
    await call(DAVE, `update public.profiles set is_public = false where id = $1`, [DAVE]);
  });

  it('refuses an unknown person', async () => {
    await expect(
      call(ADMIN, 'select public.set_trusted_taster ($1, true)', [
        '99999999-9999-4999-8999-999999999999',
      ])
    ).rejects.toThrow(/No such person/);
  });
});

describe('drink_ratings', () => {
  it('counts latest review per person (re-log moves count by 0)', async () => {
    const d = await drink(await cafe());
    await drinkReview(BOB, d, 5, { daysAgo: 3 });
    await drinkReview(ALICE, d, 3, { daysAgo: 3 });
    const before = await ratings(d);
    expect(before).toMatchObject({ community_count: 2, community_avg: '4.00' });

    await drinkReview(BOB, d, 1, { daysAgo: 0 });
    const after = await ratings(d);
    expect(after.community_count).toBe(before.community_count);
    expect(after.community_avg).toBe('2.00');

    await drinkReview(BOB, d, 4, { daysAgo: 5 });
    expect(await ratings(d)).toMatchObject({ community_count: 2, community_avg: '2.00' });

    await drinkReview(CAROL, d, 5);
    expect((await ratings(d)).community_count).toBe(3);
  });

  it('drink_ratings splits taster vs community and counts disclosed', async () => {
    const d = await drink(await cafe());
    await tasterReview(TASTER, d, 5, 'gifted');
    await tasterReview(TASTER2, d, 4, 'none');
    await drinkReview(BOB, d, 3);
    await drinkReview(ALICE, d, 2);
    expect(await ratings(d)).toEqual({
      taster_count: 2,
      taster_avg: '4.50',
      taster_disclosed_count: 1,
      community_count: 2,
      community_avg: '2.50',
    });
  });

  it('reads zero for a drink nobody has rated', async () => {
    const d = await drink(await cafe());
    expect(await ratings(d)).toEqual({
      taster_count: 0,
      taster_avg: null,
      taster_disclosed_count: 0,
      community_count: 0,
      community_avg: null,
    });
  });

  it('drink_ratings excludes pending drinks and drinks at pending cafés', async () => {
    const approvedCafe = await cafe();
    const pendingCafe = await cafe({ status: 'pending' });
    const pendingDrink = await drink(approvedCafe, { status: 'pending' });
    const atPendingCafe = await drink(pendingCafe);
    const listed = await drink(approvedCafe);
    for (const d of [pendingDrink, atPendingCafe, listed]) await drinkReview(BOB, d, 4);

    const found = await rows<{ drink_id: string }>(
      'select drink_id from public.drink_ratings where drink_id = any ($1::uuid[])',
      [[pendingDrink, atPendingCafe, listed]]
    );
    expect(found).toEqual([{ drink_id: listed }]);

    expect(
      await rows('select cafe_id from public.cafe_ratings where cafe_id = $1', [pendingCafe])
    ).toEqual([]);
    expect(
      await rows<{ drink_count: number; community_count: number }>(
        'select drink_count, community_count from public.cafe_ratings where cafe_id = $1',
        [approvedCafe]
      )
    ).toEqual([{ drink_count: 1, community_count: 1 }]);
  });

  it('rolls a café up over its drinks, counting people once, taster and community apart', async () => {
    const c = await cafe();
    const a = await drink(c);
    const b = await drink(c);
    await tasterReview(TASTER, a, 5);
    await drinkReview(BOB, a, 2);
    await drinkReview(BOB, b, 4);
    expect(
      await rows(
        `select drink_count, taster_count, taster_avg, community_count, community_avg
         from public.cafe_ratings where cafe_id = $1`,
        [c]
      )
    ).toEqual([
      {
        drink_count: 2,
        taster_count: 1,
        taster_avg: '5.00',
        community_count: 1,
        community_avg: '3.00',
      },
    ]);
  });

  it('private-profile community review counted in community_count, hidden from drink_reviews author', async () => {
    const d = await drink(await cafe());
    await call(CAROL, `update public.profiles set is_public = false where id = $1`, [CAROL]);
    await drinkReview(CAROL, d, 4);
    await drinkReview(BOB, d, 2);
    await tasterReview(TASTER, d, 5);

    expect(await ratings(d)).toMatchObject({ community_count: 2, taster_count: 1 });

    type Shown = { user_id: string | null; author_private: boolean; by_trusted_taster: boolean };
    const q =
      'select user_id, author_private, by_trusted_taster from public.drink_reviews ($1) order by stars';
    const anon = await asRows<Shown>(null, q, [d]);
    expect(anon).toHaveLength(3);
    expect(anon.filter((r) => r.author_private)).toEqual([
      { user_id: null, author_private: true, by_trusted_taster: false },
    ]);
    expect(anon.find((r) => r.by_trusted_taster)?.user_id).toBe(TASTER);

    const own = await asRows<Shown>(CAROL, q, [d]);
    expect(own.filter((r) => r.user_id === CAROL)).toHaveLength(1);
    const other = await asRows<Shown>(BOB, q, [d]);
    expect(other.filter((r) => r.user_id === CAROL)).toHaveLength(0);

    expect(
      await asRows(null, 'select id from public.drink_reviews ($1)', [
        await drink(await cafe(), { status: 'pending' }),
      ])
    ).toEqual([]);
  });
});

describe('merging', () => {
  it('merge_drink repoints reviews and sets merged_into', async () => {
    const c = await cafe();
    const keep = await drink(c, { name: 'Hojicha Latte' });
    const dup = await drink(c, { name: 'Houjicha Latte' });
    const other = await drink(await cafe());
    await drinkReview(BOB, dup, 4);
    const liked = await drinkReview(ALICE, dup, 5);
    await call(BOB, 'insert into public.review_likes (review_id, user_id) values ($1, $2)', [
      liked,
      BOB,
    ]);

    await expect(call(BOB, 'select public.merge_drink ($1, $2)', [dup, keep])).rejects.toThrow(
      /Only admins/
    );
    await expect(call(ADMIN, 'select public.merge_drink ($1, $1)', [dup])).rejects.toThrow(
      /itself/
    );
    await expect(call(ADMIN, 'select public.merge_drink ($1, $2)', [dup, other])).rejects.toThrow(
      /same café/
    );
    await call(ADMIN, 'select public.merge_drink ($1, $2)', [dup, keep]);

    expect(
      await rows('select drink_id from public.reviews where drink_id in ($1, $2)', [dup, keep])
    ).toEqual([{ drink_id: keep }, { drink_id: keep }]);
    expect(
      await rows('select status, merged_into, review_note from public.drinks where id = $1', [dup])
    ).toEqual([
      { status: 'rejected', merged_into: keep, review_note: 'Duplicate of Hojicha Latte' },
    ]);
    expect(
      await rows('select drink_id from public.notifications where review_id = $1', [liked])
    ).toEqual([{ drink_id: keep }]);
    expect((await ratings(keep)).community_count).toBe(2);
    expect(
      await asRows(null, 'select merged_into from public.drinks where id = $1', [dup])
    ).toEqual([{ merged_into: keep }]);
  });

  it('merge_cafe moves drinks and merges slug clashes', async () => {
    const keep = await cafe({ name: 'Keep Cafe' });
    const dup = await cafe({ name: 'Dup Cafe' });
    const keeperLatte = await drink(keep, { name: 'Hojicha Latte' });
    const clashing = await drink(dup, { name: 'Hojicha Latte' });
    const unique1 = await drink(dup, { name: 'Matcha Float' });
    await drinkReview(BOB, clashing, 4);

    await expect(call(BOB, 'select public.merge_cafe ($1, $2)', [dup, keep])).rejects.toThrow(
      /Only admins/
    );
    await expect(
      call(ADMIN, 'select public.merge_cafe ($1, $2)', [keep, await cafe({ status: 'pending' })])
    ).rejects.toThrow(/approved café/);
    await call(ADMIN, 'select public.merge_cafe ($1, $2)', [dup, keep]);

    expect(await rows('select cafe_id from public.drinks where id = $1', [unique1])).toEqual([
      { cafe_id: keep },
    ]);
    expect(
      await rows('select cafe_id, status, merged_into from public.drinks where id = $1', [clashing])
    ).toEqual([{ cafe_id: dup, status: 'rejected', merged_into: keeperLatte }]);
    expect(
      await rows('select drink_id from public.reviews where user_id = $1 and drink_id = $2', [
        BOB,
        keeperLatte,
      ])
    ).toHaveLength(1);
    expect(await rows('select status, merged_into from public.cafes where id = $1', [dup])).toEqual(
      [{ status: 'rejected', merged_into: keep }]
    );
    expect(await asRows(null, 'select merged_into from public.cafes where id = $1', [dup])).toEqual(
      [{ merged_into: keep }]
    );
    expect(
      await rows(
        'select count(*)::int as n from public.drinks where cafe_id = $1 and status = $2',
        [keep, 'approved']
      )
    ).toEqual([{ n: 2 }]);
  });

  it('forwards an older merge to the final survivor', async () => {
    const a = await cafe();
    const b = await cafe();
    const c = await cafe();
    await call(ADMIN, 'select public.merge_cafe ($1, $2)', [a, b]);
    await call(ADMIN, 'select public.merge_cafe ($1, $2)', [b, c]);
    expect(await rows('select merged_into from public.cafes where id = $1', [a])).toEqual([
      { merged_into: c },
    ]);
  });
});

describe('moderation notifications', () => {
  it('review_cafe approve notifies adder with kind cafe_reviewed', async () => {
    const pending = (
      await call(
        ALICE,
        `insert into public.cafes (name, city_slug) values ($1, 'singapore') returning id`,
        [unique('Notify Cafe')]
      )
    ).rows[0] as { id: string };
    await expect(
      call(ALICE, `select public.review_cafe ($1, 'approved')`, [pending.id])
    ).rejects.toThrow(/Only admins/);
    await call(ADMIN, `select public.review_cafe ($1, 'approved')`, [pending.id]);
    const note = await asRows(
      ALICE,
      'select kind, cafe_id, drink_id, product_id, body from public.notifications where cafe_id = $1',
      [pending.id]
    );
    expect(note).toMatchObject([
      { kind: 'cafe_reviewed', cafe_id: pending.id, drink_id: null, product_id: null },
    ]);
    expect(
      await asRows(BOB, 'select id from public.notifications where cafe_id = $1', [pending.id])
    ).toEqual([]);
  });

  it('review_drink reject notifies the adder with the reason', async () => {
    const c = await cafe();
    const pending = (
      await call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving) values ($1, 'Hojicha Cake', 'hojicha', 'other', 'hot') returning id`,
        [c]
      )
    ).rows[0] as { id: string };
    await expect(
      call(ADMIN, `select public.review_drink ($1, 'maybe')`, [pending.id])
    ).rejects.toThrow(/approved or rejected/);
    await call(ADMIN, `select public.review_drink ($1, 'rejected', 'Drinks only')`, [pending.id]);
    const note = await asRows<{ kind: string; drink_id: string; body: string }>(
      ALICE,
      'select kind, drink_id, body from public.notifications where drink_id = $1',
      [pending.id]
    );
    expect(note).toEqual([
      {
        kind: 'drink_reviewed',
        drink_id: pending.id,
        body: 'Hojicha Cake was not added: Drinks only',
      },
    ]);
  });

  it('like on a drink review notifies author with drink_id', async () => {
    const d = await drink(await cafe());
    const review = await drinkReview(CAROL, d, 4);
    await call(BOB, 'insert into public.review_likes (review_id, user_id) values ($1, $2)', [
      review,
      BOB,
    ]);
    await call(
      BOB,
      `insert into public.review_comments (review_id, user_id, body) values ($1, $2, 'Nice')`,
      [review, BOB]
    );
    expect(
      await asRows(
        CAROL,
        'select kind, drink_id, product_id from public.notifications where review_id = $1 order by id',
        [review]
      )
    ).toEqual([
      { kind: 'like', drink_id: d, product_id: null },
      { kind: 'comment', drink_id: d, product_id: null },
    ]);
  });
});

describe('tea views', () => {
  it('product_ratings unaffected by drink reviews', async () => {
    const p = await tea(unique('Tea'));
    await db.query(`insert into public.reviews (user_id, product_id, stars) values ($1, $2, 4)`, [
      BOB,
      p,
    ]);
    const d = await drink(await cafe(), { teaProductId: p });
    await drinkReview(BOB, d, 1);
    await drinkReview(ALICE, d, 1);

    expect(
      await rows(
        'select review_count::int as n, avg_stars from public.product_ratings where product_id = $1',
        [p]
      )
    ).toEqual([{ n: 1, avg_stars: '4.00' }]);
    expect(await rows('select 1 from public.product_ratings where product_id is null')).toEqual([]);
    expect(await rows('select 1 from public.tea_taste_profiles where product_id is null')).toEqual(
      []
    );
    expect(await rows('select 1 from public.edition_ratings where product_id is null')).toEqual([]);
  });

  it('keeps a tea and a drink review by the same person apart in latest_reviews', async () => {
    const p = await tea(unique('Tea'));
    const d = await drink(await cafe());
    await db.query(`insert into public.reviews (user_id, product_id, stars) values ($1, $2, 4)`, [
      DAVE,
      p,
    ]);
    await drinkReview(DAVE, d, 2);
    expect(
      await rows(
        'select count(*)::int as n from public.latest_reviews where user_id = $1 and (product_id = $2 or drink_id = $3)',
        [DAVE, p, d]
      )
    ).toEqual([{ n: 2 }]);
  });

  it('never links a product to a café or drink', async () => {
    const cols = await rows<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'products'
         and (column_name like '%cafe%' or column_name like '%drink%')`
    );
    expect(cols).toEqual([]);
  });
});

describe('audit', () => {
  it('audit_log records café insert', async () => {
    const name = unique('Audited Cafe');
    await call(ALICE, `insert into public.cafes (name, city_slug) values ($1, 'singapore')`, [
      name,
    ]);
    const logged = await rows<{ actor_id: string; action: string }>(
      `select actor_id, action from public.audit_log
       where table_name = 'cafes' and new_row ->> 'name' = $1`,
      [name]
    );
    expect(logged).toEqual([{ actor_id: ALICE, action: 'INSERT' }]);
  });

  it('audits drinks and cities too', async () => {
    const d = await drink(await cafe());
    const audited = await rows<{ table_name: string }>(
      `select distinct table_name from public.audit_log where table_name in ('drinks', 'cities')`
    );
    expect(audited.map((r) => r.table_name)).toContain('drinks');
    await db.query(`update public.cities set sort_order = sort_order where slug = 'singapore'`);
    expect(
      await rows(`select 1 from public.audit_log where table_name = 'cities' and action = 'UPDATE'`)
    ).toHaveLength(1);
    expect(d).toBeTruthy();
  });
});

describe('security review fixes', () => {
  type Shown = { id: string };
  const visibleDrinks = (who: string | null, cafeId: string) =>
    asRows<Shown>(who, 'select id from public.drinks where cafe_id = $1', [cafeId]);

  it('delete_my_account leaves a taster review unlinkable to the person', async () => {
    const taster = '99999999-9999-4999-8999-999999999999';
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
      taster,
      'gone@example.com',
    ]);
    await call(ADMIN, 'select public.set_trusted_taster ($1, true)', [taster]);
    await call(
      taster,
      `update public.profiles set instagram_handle = 'gone_tea', bio = 'hi' where id = $1`,
      [taster]
    );
    const d = await drink(await cafe());
    const review = await tasterReview(taster, d, 5, 'gifted');

    await call(taster, 'select public.delete_my_account ()');

    expect(
      await rows(
        'select user_id, by_trusted_taster, instagram_url, disclosure from public.reviews where id = $1',
        [review]
      )
    ).toEqual([
      { user_id: null, by_trusted_taster: false, instagram_url: null, disclosure: 'none' },
    ]);
    const logged = await rows<{ blob: string }>(
      `select (coalesce(old_row::text, '') || coalesce(new_row::text, '')) as blob
       from public.audit_log
       where (table_name = 'reviews' and (old_row ->> 'id' = $1 or new_row ->> 'id' = $1))
          or table_name = 'profiles'`,
      [review]
    );
    for (const { blob } of logged) {
      expect(blob).not.toContain(taster);
      expect(blob).not.toContain('gone_tea');
      expect(blob).not.toContain(POST);
      expect(blob).not.toContain('gone@example.com');
    }
    expect(await ratings(d)).toMatchObject({ taster_count: 0, community_count: 1 });
  });

  it('a rejected café hides its drinks and their reviews from visitors', async () => {
    const c = await cafe();
    const d = await drink(c);
    await drinkReview(BOB, d, 4);
    expect(await visibleDrinks(null, c)).toHaveLength(1);

    await call(ADMIN, `select public.review_cafe ($1, 'rejected', 'closed')`, [c]);

    expect(await visibleDrinks(null, c)).toEqual([]);
    expect(await visibleDrinks(DAVE, c)).toEqual([]);
    expect(await asRows(null, 'select id from public.drink_reviews ($1)', [d])).toEqual([]);
    expect(await asRows(null, 'select id from public.reviews where drink_id = $1', [d])).toEqual(
      []
    );
    expect(await visibleDrinks(ADMIN, c)).toHaveLength(1);
  });

  it('review_drink refuses to approve a drink at a café that is not approved', async () => {
    const c = await cafe({ status: 'pending' });
    const d = await drink(c, { status: 'pending' });
    await expect(call(ADMIN, `select public.review_drink ($1, 'approved')`, [d])).rejects.toThrow(
      /Approve the café first/
    );
    await call(ADMIN, `select public.review_cafe ($1, 'approved')`, [c]);
    await call(ADMIN, `select public.review_drink ($1, 'approved')`, [d]);
  });

  it('merge_cafe refuses cafés in different cities', async () => {
    const sg = await cafe();
    const jb = await cafe({ city: 'johor-bahru' });
    await expect(call(ADMIN, 'select public.merge_cafe ($1, $2)', [jb, sg])).rejects.toThrow(
      /different cities/
    );
  });

  it('merge_cafe merges a clashing drink only into an approved keeper drink', async () => {
    const keep = await cafe();
    const dup = await cafe();
    await drink(keep, { name: 'Hojicha Latte', status: 'pending' });
    await drink(dup, { name: 'Hojicha Latte' });
    await expect(call(ADMIN, 'select public.merge_cafe ($1, $2)', [dup, keep])).rejects.toThrow(
      /matching drink/
    );
    expect(await rows('select status from public.cafes where id = $1', [dup])).toEqual([
      { status: 'approved' },
    ]);
  });

  it('hides added_by and the reviewer note from every table read', async () => {
    const c = await cafe({ addedBy: ALICE });
    for (const who of [null, BOB, ALICE, ADMIN]) {
      await expect(
        asRows(who, 'select added_by from public.cafes where id = $1', [c])
      ).rejects.toThrow(/permission denied/);
      await expect(asRows(who, 'select review_note from public.drinks')).rejects.toThrow(
        /permission denied/
      );
      await expect(asRows(who, 'select * from public.cafes')).rejects.toThrow(/permission denied/);
      expect(
        await asRows(who, 'select name, status from public.cafes where id = $1', [c])
      ).toHaveLength(1);
    }
  });

  it('gives adders their own rows and admins the queue, with the adder, through views', async () => {
    const c = await cafe({ addedBy: ALICE, status: 'pending' });
    const d = await drink(c, { addedBy: ALICE, status: 'pending' });
    await call(ADMIN, `select public.review_cafe ($1, 'approved')`, [c]);
    await call(ADMIN, `select public.review_drink ($1, 'rejected', 'not a hojicha')`, [d]);

    expect(
      await asRows(
        ALICE,
        'select added_by, status, review_note from public.my_drinks where id = $1',
        [d]
      )
    ).toEqual([{ added_by: ALICE, status: 'rejected', review_note: 'not a hojicha' }]);
    expect(await asRows(BOB, 'select id from public.my_cafes where id = $1', [c])).toEqual([]);

    expect(
      await asRows(ADMIN, 'select adder_name, added_by from public.admin_cafes where id = $1', [c])
    ).toEqual([{ adder_name: expect.any(String), added_by: ALICE }]);
    expect(
      await asRows(ADMIN, 'select id from public.admin_drinks where id = $1', [d])
    ).toHaveLength(1);

    expect(await asRows(BOB, 'select id from public.admin_cafes')).toEqual([]);
    expect(await asRows(ALICE, 'select id from public.admin_drinks')).toEqual([]);
    for (const view of ['my_cafes', 'my_drinks', 'admin_cafes', 'admin_drinks'])
      await expect(asRows(null, `select id from public.${view}`)).rejects.toThrow(
        /permission denied/
      );
  });

  it('refuses a review of an approved drink at a rejected or pending café', async () => {
    const insert = (d: string) =>
      call(BOB, 'insert into public.reviews (user_id, drink_id, stars) values ($1, $2, 4)', [
        BOB,
        d,
      ]);
    const rejected = await cafe({ status: 'rejected' });
    const pending = await cafe({ status: 'pending' });
    await expect(insert(await drink(rejected))).rejects.toThrow(/row-level security/);
    await expect(insert(await drink(pending))).rejects.toThrow(/row-level security/);
    await insert(await drink(await cafe()));
  });

  it('still lets an adder review their own pending drink at an approved café', async () => {
    const c = await cafe();
    const own = await drink(c, { addedBy: ALICE, status: 'pending' });
    const added = await call(
      ALICE,
      'insert into public.reviews (user_id, drink_id, stars) values ($1, $2, 5)',
      [ALICE, own]
    );
    expect(added.affectedRows).toBe(1);
  });

  it('keeps the internal merge and the admin RPCs out of reach', async () => {
    const c = await cafe();
    const a = await drink(c);
    const b = await drink(c);
    for (const who of [null, ALICE])
      await expect(call(who, 'select internal.merge_drink_into ($1, $2)', [a, b])).rejects.toThrow(
        /permission denied/
      );
    for (const sql of [
      'select public.update_cafe ($1, \'{"name":"X"}\')',
      'select public.update_drink ($1, \'{"name":"X"}\')',
      'select public.merge_cafe ($1, $1)',
      "select public.review_cafe ($1, 'approved')",
    ])
      await expect(call(null, sql, [c])).rejects.toThrow(/permission denied/);
    await expect(
      call(ALICE, 'select public.update_cafe ($1, \'{"name":"X"}\')', [c])
    ).rejects.toThrow(/Only admins/);
  });

  it('an adder cannot change status on their own café or drink', async () => {
    const mine = (
      await call(
        ALICE,
        `insert into public.cafes (name, city_slug) values ($1, 'singapore') returning id`,
        [unique('Self-approve')]
      )
    ).rows[0] as { id: string };
    await expect(
      call(ALICE, `update public.cafes set status = 'approved' where id = $1`, [mine.id])
    ).rejects.toThrow(/permission denied/);
    const d = (
      await call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving) values ($1, 'Mine', 'matcha', 'latte', 'hot') returning id`,
        [mine.id]
      )
    ).rows[0] as { id: string };
    await expect(
      call(ALICE, `update public.drinks set status = 'approved' where id = $1`, [d.id])
    ).rejects.toThrow(/permission denied/);
  });

  it("shows no other person's pending drink or its reviews", async () => {
    const c = await cafe();
    const pending = (
      await call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving) values ($1, $2, 'matcha', 'latte', 'hot') returning id`,
        [c, unique('Pending')]
      )
    ).rows[0] as { id: string };
    await call(ALICE, 'insert into public.reviews (user_id, drink_id, stars) values ($1, $2, 4)', [
      ALICE,
      pending.id,
    ]);
    const q = 'select id from public.drink_reviews ($1)';
    expect(await asRows(BOB, q, [pending.id])).toEqual([]);
    expect(await asRows(null, q, [pending.id])).toEqual([]);
    expect(await asRows(ALICE, q, [pending.id])).toHaveLength(1);
    expect(
      await asRows(BOB, 'select id from public.reviews where drink_id = $1', [pending.id])
    ).toEqual([]);
  });

  it('only lets a suggestion name an approved tea', async () => {
    const c = await cafe();
    const pendingTea = (
      await rows<{ id: string }>(
        `insert into public.products (name, brand, category, status)
         values ($1, 'Farm', 'hojicha', 'pending') returning id`,
        [unique('Pending tea')]
      )
    )[0].id;
    const add = (teaId: string) =>
      call(
        ALICE,
        `insert into public.drinks (cafe_id, name, base, style, serving, tea_product_id)
         values ($1, $2, 'hojicha', 'latte', 'hot', $3)`,
        [c, unique('Tea Latte'), teaId]
      );
    await expect(add(pendingTea)).rejects.toThrow(/row-level security/);
    await add(await tea(unique('Approved tea')));
  });

  it('update_cafe and update_drink edit allowed fields, refuse the rest, and are audited', async () => {
    const c = await cafe({ name: 'Old Name' });
    const d = await drink(c, { name: 'Old Drink' });

    await call(ADMIN, `select public.update_cafe ($1, $2::jsonb)`, [
      c,
      JSON.stringify({ name: 'New Name', area: 'Tiong Bahru', lat: 1.28, instagram_handle: '' }),
    ]);
    expect(
      await rows('select name, area, lat, slug from public.cafes where id = $1', [c])
    ).toMatchObject([{ name: 'New Name', area: 'Tiong Bahru', lat: 1.28 }]);
    await expect(
      call(ADMIN, `select public.update_cafe ($1, '{"status":"approved"}')`, [c])
    ).rejects.toThrow(/Cannot edit status/);
    await expect(
      call(ADMIN, `select public.update_cafe ($1, '{"name":"x"}')`, [crypto.randomUUID()])
    ).rejects.toThrow(/No such café/);

    const teaId = await tea(unique('Linked tea'));
    await call(ADMIN, `select public.update_drink ($1, $2::jsonb)`, [
      d,
      JSON.stringify({ name: 'New Drink', price: 7.5, tea_product_id: teaId }),
    ]);
    expect(
      await rows(
        'select name, price::float as price, tea_product_id from public.drinks where id = $1',
        [d]
      )
    ).toEqual([{ name: 'New Drink', price: 7.5, tea_product_id: teaId }]);
    await expect(
      call(ADMIN, `select public.update_drink ($1, '{"cafe_id":"${c}"}')`, [d])
    ).rejects.toThrow(/Cannot edit cafe_id/);

    const logged = await rows<{ actor_id: string }>(
      `select actor_id from public.audit_log
       where table_name = 'drinks' and action = 'UPDATE' and new_row ->> 'id' = $1`,
      [d]
    );
    expect(logged.at(-1)?.actor_id).toBe(ADMIN);
  });
});
