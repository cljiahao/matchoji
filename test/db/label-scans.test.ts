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

const scan = (who: string | null) =>
  as(who, () => db.query('insert into public.label_scans (id) values (gen_random_uuid())'));

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

describe('label_scans', () => {
  it('records a scan for whoever sent it, privately', async () => {
    await scan(AIKO);
    const own = await as(AIKO, () => db.query('select user_id from public.label_scans'));
    expect(own.rows).toEqual([{ user_id: AIKO }]);
    expect((await as(BEN, () => db.query('select * from public.label_scans'))).rows).toEqual([]);
  });

  it('refuses visitors, other people’s ids and client-sent times', async () => {
    await expect(scan(null)).rejects.toThrow(/permission denied/);
    await expect(
      as(BEN, () =>
        db.query('insert into public.label_scans (id, user_id) values (gen_random_uuid(), $1)', [
          AIKO,
        ])
      )
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(BEN, () =>
        db.query(
          `insert into public.label_scans (id, created_at) values (gen_random_uuid(), '2000-01-01')`
        )
      )
    ).rejects.toThrow(/permission denied/);
  });

  it('caps a person at 20 scans a day without touching anyone else', async () => {
    for (let i = 0; i < 19; i += 1) await scan(AIKO);
    await expect(scan(AIKO)).rejects.toThrow(/lot for one day/);
    await expect(scan(BEN)).resolves.toBeDefined();
  });
});
