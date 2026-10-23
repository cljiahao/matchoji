import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb, readSupabaseFile } from '../support/supabase-db';

const STATS = readSupabaseFile('seed/20261023_tea_production_stats.sql');

let db: PGlite;

const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);

beforeAll(async () => {
  db = await createMigratedDb();
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('tea production stats', () => {
  it('seeds the official figures and audits each insert', async () => {
    await db.exec(STATS);

    expect(await count('select count(*)::int as n from public.tea_production_stats')).toBe(147);
    const kyoto = await db.query<{ year: number; metric: string; value: string; source: string }>(
      `select year, metric, value::text, source from public.tea_production_stats
       where prefecture = 'Kyoto' and year = 2025 order by metric, source`
    );
    expect(kyoto.rows).toEqual([
      { year: 2025, metric: 'aracha_t', value: '2280', source: 'maff' },
      { year: 2025, metric: 'aracha_t', value: '2121', source: 'zencharen' },
      { year: 2025, metric: 'cultivated_ha', value: '1510', source: 'maff' },
      { year: 2025, metric: 'tencha_t', value: '989', source: 'zencharen' },
    ]);
    expect(
      await count(
        `select count(*)::int as n from public.audit_log where table_name = 'tea_production_stats'`
      )
    ).toBe(147);
  });

  it('updates only revised values when run again', async () => {
    await db.exec(
      `update public.tea_production_stats set value = 1 where prefecture = 'Japan'
       and year = 2026 and metric = 'cultivated_ha'`
    );
    await db.exec(STATS);

    expect(await count('select count(*)::int as n from public.tea_production_stats')).toBe(147);
    expect(
      await count(
        `select value::int as n from public.tea_production_stats where prefecture = 'Japan'
         and year = 2026 and metric = 'cultivated_ha'`
      )
    ).toBe(31900);
    // 147 inserts, the hand edit, and the one revision back: unchanged rows are not rewritten.
    expect(
      await count(
        `select count(*)::int as n from public.audit_log where table_name = 'tea_production_stats'`
      )
    ).toBe(149);
  });

  it('rejects unknown metrics and sources', async () => {
    await expect(
      db.exec(`insert into public.tea_production_stats values
        ('Kyoto', 2025, 'matcha_t', 1, 'maff', 'x')`)
    ).rejects.toThrow(/check constraint/);
    await expect(
      db.exec(`insert into public.tea_production_stats values
        ('Kyoto', 2025, 'aracha_t', 1, 'blog', 'x')`)
    ).rejects.toThrow(/check constraint/);
  });

  it('is readable by visitors but not writable', async () => {
    await db.exec('set role anon');
    try {
      expect(await count('select count(*)::int as n from public.tea_production_stats')).toBe(147);
      await expect(
        db.exec(
          `insert into public.tea_production_stats values ('Kyoto', 2030, 'aracha_t', 1, 'maff', 'x')`
        )
      ).rejects.toThrow(/row-level security/);
      // RLS filters an update with no policy down to zero rows rather than raising.
      await db.exec(`update public.tea_production_stats set value = 0`);
      expect(
        await count('select count(*)::int as n from public.tea_production_stats where value = 0')
      ).toBe(0);
    } finally {
      await db.exec('reset role');
    }
  });
});
