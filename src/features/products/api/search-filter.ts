// PostgREST's `or` filter is a comma-separated string, so user text must not carry its
// separators/grouping (`,` `(` `)`), quoting (`"`) or ilike wildcards (`%` `*` `_`) into the
// expression.
const FILTER_SYNTAX = /[,()"%*_\\]/g;

export function buildSearchFilter(query: string): string | null {
  const term = query.replace(FILTER_SYNTAX, ' ').replace(/\s+/g, ' ').trim();
  if (!term) return null;
  return `name.ilike.%${term}%,brand.ilike.%${term}%`;
}
