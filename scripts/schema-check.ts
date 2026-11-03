// Compares the repository's schema with the live Supabase database, using only a read-only,
// project-scoped Postgres connection string (SUPABASE_DB_URL) — never a Supabase access token.
//   1. Migration drift: supabase/migrations/*.sql versus supabase_migrations.schema_migrations.
//   2. Types freshness: database.types.ts versus `supabase gen types` output for the same database.
// With no SUPABASE_DB_URL the check is skipped and exits 0, so forks and local runs stay green.
import { execFile } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import pg from 'pg';
import ts from 'typescript';

const run = promisify(execFile);

const MIGRATIONS_DIR = 'supabase/migrations';
const TYPES_FILE = 'src/integrations/supabase/database.types.ts';
// Same pin as the db:* scripts in package.json.
const SUPABASE_CLI = 'supabase@2.121.0';

export interface MigrationDrift {
  unapplied: string[];
  missingFiles: string[];
}

export interface ColumnShape {
  nullable: boolean;
  kind: string;
}

export interface SchemaShape {
  relations: Record<string, Record<string, ColumnShape>>;
  enums: Record<string, string[]>;
}

export interface CheckDeps {
  migrationFiles: () => string[];
  appliedVersions: (dbUrl: string) => Promise<string[]>;
  generatedShape: (dbUrl: string) => Promise<SchemaShape>;
  committedShape: () => SchemaShape;
  log: (line: string) => void;
}

export function versionOf(filename: string): string | null {
  return /^(\d+)_.+\.sql$/.exec(filename)?.[1] ?? null;
}

export function diffMigrations(fileVersions: string[], appliedVersions: string[]): MigrationDrift {
  const files = new Set(fileVersions);
  const applied = new Set(appliedVersions);
  return {
    unapplied: [...files].filter((v) => !applied.has(v)).sort(),
    missingFiles: [...applied].filter((v) => !files.has(v)).sort(),
  };
}

function unionMembers(type: ts.Type): ts.Type[] {
  return type.isUnion() ? type.types : [type];
}

// Column types are compared by kind, not spelling: the database reports CHECK-constrained text
// as `string` where the hand-written file keeps a named union (ProductCategory), and that
// difference is intentional.
function kindOf(checker: ts.TypeChecker, type: ts.Type, depth = 0): string {
  // Recursive aliases (the generated `Json`) contain arrays of themselves.
  if (depth > 1) return 'json';
  const kinds = new Set<string>();
  for (const member of unionMembers(type)) {
    if (member.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) continue;
    if (member.flags & ts.TypeFlags.StringLike) kinds.add('string');
    else if (member.flags & ts.TypeFlags.NumberLike) kinds.add('number');
    else if (member.flags & ts.TypeFlags.BooleanLike) kinds.add('boolean');
    else if (checker.isArrayType(member)) {
      const [element] = checker.getTypeArguments(member as ts.TypeReference);
      kinds.add(`${element ? kindOf(checker, element, depth + 1) : 'unknown'}[]`);
    } else if (member.flags & ts.TypeFlags.Object) kinds.add('json');
    else kinds.add(checker.typeToString(member));
  }
  // A union that includes an object (the generated `Json`) is just json.
  if (kinds.has('json')) return 'json';
  return [...kinds].sort().join(' | ');
}

function isNullable(type: ts.Type): boolean {
  return unionMembers(type).some((member) => member.flags & ts.TypeFlags.Null);
}

const COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2022,
  types: [],
};

// Every program pulls in ~60 lib.*.d.ts files; parsing them dominates extractShape (hundreds of
// ms warm, seconds on a loaded CI runner), so the parsed lib files are shared across programs.
const libFiles = new Map<string, ts.SourceFile | undefined>();
function createHost(): ts.CompilerHost {
  const host = ts.createCompilerHost(COMPILER_OPTIONS);
  const getSourceFile = host.getSourceFile.bind(host);
  const libDir = dirname(ts.getDefaultLibFilePath(COMPILER_OPTIONS));
  host.getSourceFile = (fileName, languageVersionOrOptions, ...rest) => {
    if (!fileName.startsWith(libDir))
      return getSourceFile(fileName, languageVersionOrOptions, ...rest);
    if (!libFiles.has(fileName)) {
      libFiles.set(fileName, getSourceFile(fileName, languageVersionOrOptions, ...rest));
    }
    return libFiles.get(fileName);
  };
  return host;
}

export function extractShape(filePath: string): SchemaShape {
  const program = ts.createProgram([filePath], COMPILER_OPTIONS, createHost());
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(filePath);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  const database =
    moduleSymbol && checker.getExportsOfModule(moduleSymbol).find((s) => s.name === 'Database');
  if (!source || !database) throw new Error(`${filePath} does not export a "Database" type`);

  const typeOf = (symbol: ts.Symbol) => checker.getTypeOfSymbolAtLocation(symbol, source);
  const member = (type: ts.Type | undefined, name: string) => {
    const symbol = type?.getProperty(name);
    return symbol ? typeOf(symbol) : undefined;
  };

  const publicSchema = member(checker.getDeclaredTypeOfSymbol(database), 'public');
  const shape: SchemaShape = { relations: {}, enums: {} };

  for (const [group, prefix] of [
    ['Tables', 'table'],
    ['Views', 'view'],
  ] as const) {
    for (const relation of member(publicSchema, group)?.getProperties() ?? []) {
      const columns: Record<string, ColumnShape> = {};
      for (const column of member(typeOf(relation), 'Row')?.getProperties() ?? []) {
        const type = typeOf(column);
        // Postgres can't prove a view column non-null, so `gen types` marks every one nullable;
        // comparing nullability there would only report noise.
        columns[column.name] = {
          nullable: prefix === 'view' ? false : isNullable(type),
          kind: kindOf(checker, type),
        };
      }
      shape.relations[`${prefix} ${relation.name}`] = columns;
    }
  }

  for (const entry of member(publicSchema, 'Enums')?.getProperties() ?? []) {
    shape.enums[entry.name] = unionMembers(typeOf(entry))
      .map((value) => (value.isStringLiteral() ? value.value : checker.typeToString(value)))
      .sort();
  }
  return shape;
}

const nullLabel = (nullable: boolean) => (nullable ? 'null' : 'not null');

function diffColumns(
  name: string,
  have: ColumnShape | undefined,
  want: ColumnShape | undefined
): string[] {
  if (!want) return [`${name}: in database.types.ts but not in the database`];
  if (!have) return [`${name}: in the database but missing from database.types.ts`];
  const problems: string[] = [];
  if (have.nullable !== want.nullable) {
    const [a, b] = [nullLabel(have.nullable), nullLabel(want.nullable)];
    problems.push(`${name}: nullability differs (types: ${a}, database: ${b})`);
  }
  if (have.kind !== want.kind) {
    problems.push(`${name}: type differs (types: ${have.kind}, database: ${want.kind})`);
  }
  return problems;
}

const union = (a: object, b: object) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();

function diffRelations(
  committed: SchemaShape['relations'],
  live: SchemaShape['relations']
): string[] {
  return union(committed, live).flatMap((name) => {
    const have = committed[name];
    const want = live[name];
    if (!want) return [`${name}: in database.types.ts but not in the database`];
    if (!have) return [`${name}: in the database but missing from database.types.ts`];
    return union(have, want).flatMap((column) =>
      diffColumns(`${name}.${column}`, have[column], want[column])
    );
  });
}

function diffEnums(committed: SchemaShape['enums'], live: SchemaShape['enums']): string[] {
  return union(committed, live).flatMap((name) => {
    const have = committed[name]?.join(', ') ?? 'absent';
    const want = live[name]?.join(', ') ?? 'absent';
    return have === want ? [] : [`enum ${name}: types have [${have}], database has [${want}]`];
  });
}

export function diffShapes(committed: SchemaShape, live: SchemaShape): string[] {
  return [
    ...diffRelations(committed.relations, live.relations),
    ...diffEnums(committed.enums, live.enums),
  ];
}

const bulleted = (items: string[]) => items.map((item) => `  - ${item}`).join('\n');

export async function schemaCheck(
  env: Record<string, string | undefined>,
  deps: CheckDeps
): Promise<number> {
  const dbUrl = env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) {
    deps.log('schema-check: skipped — SUPABASE_DB_URL is not set (see docs/schema-checks.md).');
    return 0;
  }

  const failures: string[] = [];

  const fileVersions = deps.migrationFiles().flatMap((f) => versionOf(f) ?? []);
  const drift = diffMigrations(fileVersions, await deps.appliedVersions(dbUrl));
  if (drift.unapplied.length) {
    failures.push(`Migrations in ${MIGRATIONS_DIR}/ not applied to the database:
${bulleted(drift.unapplied)}`);
  }
  if (drift.missingFiles.length) {
    failures.push(`Migrations applied to the database with no file in ${MIGRATIONS_DIR}/:
${bulleted(drift.missingFiles)}`);
  }

  const typeProblems = diffShapes(deps.committedShape(), await deps.generatedShape(dbUrl));
  if (typeProblems.length) {
    failures.push(`${TYPES_FILE} is out of date with the database:
${bulleted(typeProblems)}`);
  }

  if (failures.length) {
    deps.log(`schema-check: FAILED\n\n${failures.join('\n\n')}`);
    return 1;
  }
  deps.log(
    `schema-check: ok — ${fileVersions.length} migrations applied, types match the database.`
  );
  return 0;
}

async function fetchAppliedVersions(dbUrl: string): Promise<string[]> {
  // The pooler's certificate chain isn't in Node's trust store; an explicit sslmode in the URL wins.
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const result = await client.query<{ version: string }>(
      'select version from supabase_migrations.schema_migrations'
    );
    return result.rows.map((row) => row.version);
  } finally {
    await client.end();
  }
}

async function generateShape(dbUrl: string): Promise<SchemaShape> {
  const { stdout } = await run(
    'pnpm',
    ['dlx', SUPABASE_CLI, 'gen', 'types', 'typescript', '--db-url', dbUrl, '--schema', 'public'],
    { maxBuffer: 16 * 1024 * 1024 }
  );
  const dir = mkdtempSync(join(tmpdir(), 'schema-check-'));
  try {
    const file = join(dir, 'database.generated.ts');
    writeFileSync(file, stdout);
    return extractShape(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  schemaCheck(process.env, {
    migrationFiles: () => readdirSync(MIGRATIONS_DIR),
    appliedVersions: fetchAppliedVersions,
    generatedShape: generateShape,
    committedShape: () => extractShape(TYPES_FILE),
    log: (line) => console.log(line),
  }).then(
    (code) => process.exit(code),
    (error: unknown) => {
      // execFile and pg errors can echo the connection string, password included.
      const message = error instanceof Error ? error.message : String(error);
      const url = process.env.SUPABASE_DB_URL?.trim();
      console.error(
        `schema-check: error — ${url ? message.replaceAll(url, '<SUPABASE_DB_URL>') : message}`
      );
      process.exit(2);
    }
  );
}
