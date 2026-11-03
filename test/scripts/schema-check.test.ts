import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  diffMigrations,
  diffShapes,
  extractShape,
  schemaCheck,
  versionOf,
  type CheckDeps,
  type SchemaShape,
} from '../../scripts/schema-check';

const URL_ENV = { SUPABASE_DB_URL: 'postgres://schema_checker:pw@db.test:5432/postgres' };

const shape = (columns: SchemaShape['relations'][string] = {}): SchemaShape => ({
  relations: { 'table teas': { id: { nullable: false, kind: 'string' }, ...columns } },
  enums: {},
});

function makeDeps(
  overrides: Partial<CheckDeps> = {}
): CheckDeps & { log: ReturnType<typeof vi.fn> } {
  return {
    migrationFiles: () => ['20260101000000_a.sql', '20260102000000_b.sql', 'README.md'],
    appliedVersions: async () => ['20260101000000', '20260102000000'],
    generatedShape: async () => shape(),
    committedShape: () => shape(),
    log: vi.fn(),
    ...overrides,
  } as CheckDeps & { log: ReturnType<typeof vi.fn> };
}

describe('versionOf', () => {
  it('reads the numeric prefix of a migration file', () => {
    expect(versionOf('20261101000000_tea_image_credit.sql')).toBe('20261101000000');
  });
  it('ignores files that are not migrations', () => {
    expect(versionOf('README.md')).toBeNull();
    expect(versionOf('notes.sql')).toBeNull();
  });
});

describe('diffMigrations', () => {
  it('is empty when files and applied rows match', () => {
    expect(diffMigrations(['1', '2'], ['2', '1'])).toEqual({ unapplied: [], missingFiles: [] });
  });
  it('lists unapplied files and applied versions without a file, sorted', () => {
    expect(diffMigrations(['3', '1', '2'], ['2', '9', '8'])).toEqual({
      unapplied: ['1', '3'],
      missingFiles: ['8', '9'],
    });
  });
});

describe('schemaCheck', () => {
  it('skips with exit 0 and never touches the database when SUPABASE_DB_URL is unset', async () => {
    const deps = makeDeps({ appliedVersions: vi.fn(), generatedShape: vi.fn() });
    expect(await schemaCheck({}, deps)).toBe(0);
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('skipped'));
    expect(deps.appliedVersions).not.toHaveBeenCalled();
    expect(deps.generatedShape).not.toHaveBeenCalled();
  });

  it('treats a blank URL as unset', async () => {
    expect(await schemaCheck({ SUPABASE_DB_URL: '  ' }, makeDeps())).toBe(0);
  });

  it('passes when migrations and types match', async () => {
    const deps = makeDeps();
    expect(await schemaCheck(URL_ENV, deps)).toBe(0);
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('ok'));
  });

  it('fails and names both directions of migration drift', async () => {
    const deps = makeDeps({ appliedVersions: async () => ['20260101000000', '20259999000000'] });
    expect(await schemaCheck(URL_ENV, deps)).toBe(1);
    const out = deps.log.mock.calls.flat().join('\n');
    expect(out).toContain('not applied to the database');
    expect(out).toContain('20260102000000');
    expect(out).toContain('no file in');
    expect(out).toContain('20259999000000');
  });

  it('fails when the types differ from the database', async () => {
    const deps = makeDeps({
      generatedShape: async () => shape({ extra: { nullable: true, kind: 'number' } }),
    });
    expect(await schemaCheck(URL_ENV, deps)).toBe(1);
    expect(deps.log.mock.calls.flat().join('\n')).toContain(
      'table teas.extra: in the database but missing'
    );
  });

  it('reports migration drift and type drift together', async () => {
    const deps = makeDeps({
      appliedVersions: async () => [],
      generatedShape: async () => ({ relations: {}, enums: {} }),
    });
    expect(await schemaCheck(URL_ENV, deps)).toBe(1);
    const out = deps.log.mock.calls.flat().join('\n');
    expect(out).toContain('not applied');
    expect(out).toContain('out of date');
  });
});

describe('diffShapes', () => {
  it('is empty for identical shapes', () => {
    expect(diffShapes(shape(), shape())).toEqual([]);
  });

  it('reports missing and extra tables', () => {
    const extra: SchemaShape = {
      relations: { ...shape().relations, 'table orders': {} },
      enums: {},
    };
    expect(diffShapes(shape(), extra)).toEqual([
      'table orders: in the database but missing from database.types.ts',
    ]);
    expect(diffShapes(extra, shape())).toEqual([
      'table orders: in database.types.ts but not in the database',
    ]);
  });

  it('reports nullability and type changes', () => {
    const live = shape({ id: { nullable: true, kind: 'number' } });
    expect(diffShapes(shape(), live)).toEqual([
      'table teas.id: nullability differs (types: not null, database: null)',
      'table teas.id: type differs (types: string, database: number)',
    ]);
  });

  it('reports enum value changes', () => {
    const a: SchemaShape = { relations: {}, enums: { grade: ['a', 'b'] } };
    const b: SchemaShape = { relations: {}, enums: { grade: ['a', 'c'] } };
    expect(diffShapes(a, b)).toEqual(['enum grade: types have [a, b], database has [a, c]']);
    expect(diffShapes(a, { relations: {}, enums: {} })).toEqual([
      'enum grade: types have [a, b], database has [absent]',
    ]);
  });
});

describe('extractShape', () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'schema-check-test-'));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const write = (name: string, source: string) => {
    const file = join(dir, name);
    writeFileSync(file, source);
    return file;
  };

  // The shape `supabase gen types typescript` emits: a type alias, a recursive Json, and
  // enums referenced through Database["public"]["Enums"].
  const generated = `
    export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
    export type Database = {
      public: {
        Tables: {
          teas: {
            Row: {
              id: string;
              grade: Database["public"]["Enums"]["grade"];
              notes: string | null;
              tags: string[];
              meta: Json | null;
            };
            Insert: { id?: string };
            Update: { id?: string };
            Relationships: [];
          };
        };
        Views: {
          latest: { Row: { id: string | null }; Relationships: [] };
        };
        Functions: { [_ in never]: never };
        Enums: { grade: "a" | "b" };
        CompositeTypes: { [_ in never]: never };
      };
    };
  `;

  it('reads columns, nullability, kinds and enums from generated output', () => {
    expect(extractShape(write('generated.ts', generated))).toEqual({
      relations: {
        'table teas': {
          id: { nullable: false, kind: 'string' },
          grade: { nullable: false, kind: 'string' },
          notes: { nullable: true, kind: 'string' },
          tags: { nullable: false, kind: 'string[]' },
          meta: { nullable: true, kind: 'json' },
        },
        'view latest': { id: { nullable: false, kind: 'string' } },
      },
      enums: { grade: ['a', 'b'] },
    });
  });

  it('matches a hand-written file that names a CHECK-constrained union', () => {
    const handWritten = `
      export type Grade = 'a' | 'b';
      export interface Database {
        public: {
          Tables: {
            teas: {
              Row: { id: string; grade: Grade; notes: string | null; tags: string[]; meta: Record<string, unknown> | null };
              Insert: { id?: string };
              Update: { id?: string };
              Relationships: [];
            };
          };
          Views: { latest: { Row: { id: string }; Relationships: [] } };
          Functions: Record<string, never>;
        };
      }
    `;
    const problems = diffShapes(
      extractShape(write('hand.ts', handWritten)),
      extractShape(write('generated-2.ts', generated))
    );
    expect(problems).toEqual(['enum grade: types have [absent], database has [a, b]']);
  });

  it('throws when the file has no Database export', () => {
    expect(() => extractShape(write('empty.ts', 'export const x = 1;'))).toThrow(/Database/);
  });
});
