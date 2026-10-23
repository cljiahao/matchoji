import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

let db: PGlite;
let tea: string;

const user = async () => {
  const id = crypto.randomUUID();
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{}')`, [
    id,
    `${id}@example.com`,
  ]);
  return id;
};

beforeAll(async () => {
  db = await createMigratedDb();
  tea = (
    await db.query<{ id: string }>(
      `insert into public.products (name, category, status) values ('Sayaka', 'matcha', 'approved') returning id`
    )
  ).rows[0].id;
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('tea_taste_profiles', () => {
  it('averages sliders and counts notes over each person’s latest tasting', async () => {
    const a = await user();
    const b = await user();
    const review = (u: string, umami: number, notes: string[], day: string) =>
      db.query(
        `insert into public.reviews (user_id, product_id, stars, umami, flavor_notes, tasted_on)
         values ($1, $2, 4, $3, $4, $5)`,
        [u, tea, umami, notes, day]
      );
    await review(a, 1, ['bitter'], '2026-10-01');
    await review(a, 5, ['umami', 'creamy'], '2026-10-02');
    await review(b, 4, ['umami'], '2026-10-01');

    const [profile] = (
      await db.query<{ umami: string; sweetness: string | null; notes: Record<string, number> }>(
        'select umami::text, sweetness::text, notes from public.tea_taste_profiles where product_id = $1',
        [tea]
      )
    ).rows;
    expect(profile).toEqual({ umami: '4.50', sweetness: null, notes: { umami: 2, creamy: 1 } });
  });
});
