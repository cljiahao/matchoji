import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb } from '../support/supabase-db';

let db: PGlite;

beforeAll(async () => {
  db = await createMigratedDb();
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('health()', () => {
  it('answers for a visitor without reading anything', async () => {
    await db.exec('set role anon');
    try {
      expect((await db.query('select public.health () as ok')).rows).toEqual([{ ok: true }]);
    } finally {
      await db.exec('reset role');
    }
  });
});
