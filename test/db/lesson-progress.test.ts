import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

const AIKO = '11111111-1111-4111-8111-111111111111';
const BEN = '22222222-2222-4222-8222-222222222222';

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

const mark = (who: string | null, course: string, lesson: string) =>
  as(who, () =>
    db.query('insert into public.lesson_progress (course_slug, lesson_slug) values ($1, $2)', [
      course,
      lesson,
    ])
  );

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
     ($1, 'aiko@example.com', '{}'), ($2, 'ben@example.com', '{}')`,
    [AIKO, BEN]
  );
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('lesson_progress', () => {
  it('records a lesson as done for whoever marks it, privately', async () => {
    await mark(AIKO, 'matcha-101', 'first-usucha');
    expect(
      await as(AIKO, () =>
        rows('select user_id, course_slug, lesson_slug from public.lesson_progress')
      )
    ).toEqual([{ user_id: AIKO, course_slug: 'matcha-101', lesson_slug: 'first-usucha' }]);
    expect(await as(BEN, () => rows('select * from public.lesson_progress'))).toEqual([]);
    expect(await as(null, () => rows('select * from public.lesson_progress'))).toEqual([]);
  });

  it('will not record a lesson for someone else, or for a visitor', async () => {
    await expect(
      as(BEN, () =>
        db.query(
          'insert into public.lesson_progress (user_id, course_slug, lesson_slug) values ($1, $2, $3)',
          [AIKO, 'matcha-101', 'tools']
        )
      )
    ).rejects.toThrow(/permission denied/);
    await expect(mark(null, 'matcha-101', 'tools')).rejects.toThrow(/permission denied/);
  });

  it('ignores a client-sent time and refuses odd slugs and repeats', async () => {
    await expect(
      as(AIKO, () =>
        db.query(
          `insert into public.lesson_progress (course_slug, lesson_slug, created_at)
           values ('matcha-101', 'tools', '2000-01-01')`
        )
      )
    ).rejects.toThrow(/permission denied/);
    await expect(mark(AIKO, 'Matcha 101', 'tools')).rejects.toThrow(/check/);
    await expect(mark(AIKO, 'matcha-101', 'first-usucha')).rejects.toThrow(/duplicate key/);
  });

  it('lets a learner unmark only their own lessons', async () => {
    await mark(BEN, 'matcha-101', 'first-usucha');
    await as(AIKO, () => db.query('delete from public.lesson_progress'));
    expect(await rows('select user_id from public.lesson_progress order by user_id')).toEqual([
      { user_id: BEN },
    ]);
  });

  it('is audited and goes with the account', async () => {
    const [audited] = await rows<{ n: number }>(
      `select count(*)::int as n from public.audit_log where table_name = 'lesson_progress'`
    );
    expect(audited.n).toBeGreaterThanOrEqual(3);
    await as(BEN, () => db.exec('select public.delete_my_account ()'));
    expect(await rows('select * from public.lesson_progress')).toEqual([]);
  });
});
