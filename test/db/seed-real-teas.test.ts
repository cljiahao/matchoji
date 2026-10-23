import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMigratedDb, readSupabaseFile } from '../support/supabase-db';

const SEED = readSupabaseFile('seed/20261023_real_teas.sql');
const GRADES = readSupabaseFile('seed/20261023_tea_grades.sql');

let db: PGlite;

const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);

beforeAll(async () => {
  db = await createMigratedDb();
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('real teas seed', () => {
  it('adds each tea once, links stated regions and logs the inserts', async () => {
    await db.exec(SEED);

    expect(await count('select count(*)::int as n from public.products')).toBe(18);
    expect(
      await count(`select count(*)::int as n from public.products where category = 'hojicha'`)
    ).toBe(7);
    const aiya = await db.query<{ grade: string; region: string }>(
      `select p.grade, r.name as region from public.products p
       join public.regions r on r.id = p.region_id where p.brand = 'Aiya'`
    );
    expect(aiya.rows).toEqual([{ grade: 'Ceremonial', region: 'Nishio, Aichi' }]);
    expect(
      await count('select count(*)::int as n from public.products where region_id is not null')
    ).toBe(1);
    expect(
      await count(`select count(*)::int as n from public.audit_log where table_name = 'products'`)
    ).toBe(18);
  });

  it('adds nothing when run again, even if an existing name differs in case', async () => {
    await db.exec(`update public.products set name = 'WAKO' where name = 'Wako'`);
    await db.exec(SEED);
    expect(await count('select count(*)::int as n from public.products')).toBe(18);
  });

  it('grades the matcha from the makers’ classifications, keeping any grade already set', async () => {
    await db.exec(`update public.products set grade = 'Hand-set' where name = 'Isuzu'`);
    await db.exec(GRADES);
    await db.exec(GRADES);

    const graded = await db.query<{ grade: string; n: number }>(
      `select grade, count(*)::int as n from public.products where grade is not null
       group by grade order by grade`
    );
    expect(graded.rows).toEqual([
      { grade: 'Ceremonial', n: 1 },
      { grade: 'Hand-set', n: 1 },
      { grade: 'Karigane', n: 1 },
      { grade: 'Koicha', n: 4 },
      { grade: 'Usucha', n: 4 },
    ]);
    expect(
      await count(
        `select count(*)::int as n from public.products where name = 'Yugen' and grade is null`
      )
    ).toBe(1);
  });
});
