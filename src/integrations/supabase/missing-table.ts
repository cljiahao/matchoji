// Postgres "undefined table" and PostgREST's schema-cache miss: migrations are applied by hand,
// so readers of a newer table return nothing rather than an error until it exists.
const MISSING_TABLE = new Set(['42P01', 'PGRST205']);

export const isMissingTable = (error: { code?: string } | null): boolean =>
  error?.code !== undefined && MISSING_TABLE.has(error.code);
