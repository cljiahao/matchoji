import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SUPABASE = path.resolve(import.meta.dirname, '../../supabase');

// Same Supabase stub as audit-log.test.ts: auth schema, auth.uid() and the API roles, with
// Supabase's default grant of everything on new public tables and views.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid () returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid () to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
const PHOTO = (user: string) =>
  `https://x.supabase.co/storage/v1/object/public/review-photos/${user}/a.jpg`;

let db: PGlite;
let approved: string;

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

const addTea = async (name: string, status = 'approved', addedBy: string | null = null) =>
  (
    await rows<{ id: string }>(
      `insert into public.products (name, brand, category, status, added_by)
       values ($1, 'Farm', 'matcha', $2, $3) returning id`,
      [name, status, addedBy]
    )
  )[0].id;

const review = (
  product: string,
  stars: number,
  tastedOn: string,
  extra: Record<string, unknown> = {}
) =>
  db.query(
    `insert into public.reviews (user_id, product_id, stars, tasted_on, photo_url, notes)
     values (auth.uid (), $1, $2, $3, $4, $5)`,
    [product, stars, tastedOn, extra.photo ?? null, extra.notes ?? null]
  );

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const dir = path.join(SUPABASE, 'migrations');
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.includes('storage'))
    .sort())
    await db.exec(readFileSync(path.join(dir, file), 'utf8'));
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
     ($1, 'alice.smith@example.com', '{"full_name": "Alice Smith"}'),
     ($2, 'bob.private@example.com', '{}')`,
    [ALICE, BOB]
  );
  approved = await addTea('Sayaka');
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('profiles', () => {
  it('cannot be written through public_profiles by anyone (S1)', async () => {
    for (const who of [null, BOB]) {
      await expect(
        as(who, () => db.exec(`update public.public_profiles set display_name = 'x'`))
      ).rejects.toThrow(/permission denied/);
      await expect(as(who, () => db.exec(`delete from public.public_profiles`))).rejects.toThrow(
        /permission denied/
      );
    }
    expect(await rows('select count(*)::int as n from public.profiles')).toEqual([{ n: 2 }]);
  });

  it('lets a user change only their display name, within 40 characters (S2)', async () => {
    await as(BOB, () => db.exec(`update public.profiles set display_name = 'Bob'`));
    await expect(
      as(BOB, () => db.exec(`update public.profiles set role = 'vendor'`))
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(BOB, () => db.exec(`update public.profiles set email = 'x@example.com'`))
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(BOB, () => db.exec(`update public.profiles set display_name = '${'x'.repeat(41)}'`))
    ).rejects.toThrow(/check constraint/);
    await as(BOB, () =>
      db.exec(`update public.profiles set display_name = 'Mallory' where id = '${ALICE}'`)
    );
    expect(await rows('select display_name, role from public.profiles order by email')).toEqual([
      { display_name: 'Alice Smith', role: 'consumer' },
      { display_name: 'Bob', role: 'consumer' },
    ]);
  });

  it('never defaults a name to part of the email (S5)', async () => {
    const carol = '33333333-3333-4333-8333-333333333333';
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'carol.secret@example.com', '{}')`,
      [carol]
    );
    const [{ display_name }] = await rows<{ display_name: string }>(
      'select display_name from public.profiles where id = $1',
      [carol]
    );
    expect(display_name).toMatch(/^Tea drinker [0-9a-f]{4}$/);
    expect(display_name).not.toContain('carol');
  });
});

describe('scores (I1)', () => {
  it('count only each person’s latest tasting', async () => {
    await as(ALICE, async () => {
      await review(approved, 5, '2026-10-01');
      await review(approved, 5, '2026-10-02');
      await review(approved, 2, '2026-10-03');
    });
    await as(BOB, () => review(approved, 4, '2026-10-01'));

    expect(
      await rows('select review_count::int, avg_stars::text from public.product_ratings')
    ).toEqual([{ review_count: 2, avg_stars: '3.00' }]);
    expect(await rows(`select stars from public.latest_reviews order by stars`)).toEqual([
      { stars: 2 },
      { stars: 4 },
    ]);
    expect(await rows('select count(*)::int as n from public.reviews')).toEqual([{ n: 4 }]);
  });
});

describe('writes on teas outside the catalogue (S3)', () => {
  it('let a taster rate and save their own pending tea, but nobody else’s', async () => {
    const mine = await addTea('Alice Pending', 'pending', ALICE);
    await as(ALICE, () => review(mine, 4, '2026-10-05'));
    await as(ALICE, () =>
      db.query(`insert into public.wishlist (user_id, product_id) values (auth.uid (), $1)`, [mine])
    );

    await expect(as(BOB, () => review(mine, 5, '2026-10-05'))).rejects.toThrow(
      /row-level security/
    );
    await expect(
      as(BOB, () =>
        db.query(`insert into public.wishlist (user_id, product_id) values (auth.uid (), $1)`, [
          mine,
        ])
      )
    ).rejects.toThrow(/row-level security/);
    await expect(
      as(ALICE, () =>
        db.query(`insert into public.stock_reports (product_id, status) values ($1, 'in_stock')`, [
          mine,
        ])
      )
    ).rejects.toThrow(/row-level security/);
  });

  it('refuse any write on a rejected tea', async () => {
    const gone = await addTea('Rejected One', 'rejected', ALICE);
    await expect(as(ALICE, () => review(gone, 3, '2026-10-05'))).rejects.toThrow(
      /row-level security/
    );
  });
});

describe('suggested teas (S4, I2, I4)', () => {
  it('cannot carry a photo or shop link from the taster', async () => {
    for (const column of ['image_url', 'shop_url'])
      await expect(
        as(BOB, () =>
          db.exec(`insert into public.products (name, category, ${column})
                   values ('Sneaky ${column}', 'matcha', 'https://evil.example/x')`)
        )
      ).rejects.toThrow(/row-level security/);
  });

  it('refuses a duplicate of an existing tea, ignoring case and spaces', async () => {
    await expect(
      as(BOB, () =>
        db.exec(
          `insert into public.products (name, brand, category) values (' sayaka', 'FARM ', 'matcha')`
        )
      )
    ).rejects.toThrow(/products_name_brand_key/);
  });

  it('refuses names, brands and grades longer than the form allows', async () => {
    await expect(
      as(BOB, () =>
        db.exec(
          `insert into public.products (name, category) values ('${'n'.repeat(121)}', 'matcha')`
        )
      )
    ).rejects.toThrow(/check constraint/);
    await expect(
      as(BOB, () =>
        db.exec(
          `insert into public.products (name, category, grade) values ('Ok', 'matcha', '${'g'.repeat(61)}')`
        )
      )
    ).rejects.toThrow(/check constraint/);
  });
});

describe('reviews', () => {
  it('accept only the author’s own uploaded photo (S4)', async () => {
    await as(BOB, () => review(approved, 4, '2026-10-06', { photo: PHOTO(BOB) }));
    await expect(
      as(BOB, () => review(approved, 4, '2026-10-06', { photo: PHOTO(ALICE) }))
    ).rejects.toThrow(/reviews_photo_is_own_upload/);
    await expect(
      as(BOB, () => review(approved, 4, '2026-10-06', { photo: 'https://tracker.example/p.gif' }))
    ).rejects.toThrow(/reviews_photo_is_own_upload/);
  });

  it('refuse long notes and dates more than a day ahead (I2)', async () => {
    await expect(
      as(BOB, () => review(approved, 4, '2026-10-06', { notes: 'x'.repeat(2001) }))
    ).rejects.toThrow(/reviews_notes_length/);
    await expect(
      as(BOB, () =>
        db.query(
          `insert into public.reviews (user_id, product_id, stars, tasted_on)
           values (auth.uid (), $1, 4, current_date + 2)`,
          [approved]
        )
      )
    ).rejects.toThrow(/reviews_tasted_on_not_future/);
  });
});

describe('rejected teas (I7)', () => {
  it('stay visible to people who tasted or saved them, and nobody else', async () => {
    const tea = await addTea('Later Rejected');
    await as(BOB, () => review(tea, 3, '2026-10-06'));
    await db.query(`update public.products set status = 'rejected' where id = $1`, [tea]);

    const seen = (who: string | null) =>
      as(who, () => rows('select name from public.products where id = $1', [tea]));
    expect(await seen(BOB)).toEqual([{ name: 'Later Rejected' }]);
    expect(await seen(ALICE)).toEqual([]);
    expect(await seen(null)).toEqual([]);
  });
});

describe('indexes (I9)', () => {
  it('cover per-tea reads of reviews and listings', async () => {
    const names = (
      await rows<{ indexname: string }>(
        `select indexname from pg_indexes where schemaname = 'public'
         and indexname in ('reviews_product_id_idx', 'listings_product_id_idx') order by 1`
      )
    ).map((r) => r.indexname);
    expect(names).toEqual(['listings_product_id_idx', 'reviews_product_id_idx']);
  });
});
