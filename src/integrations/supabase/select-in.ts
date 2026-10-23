// PostgREST sends an .in() list in the URL, and an encoded uuid is about 37 characters. 100 per
// request stays far below the ~8KB URL limit common to the proxies in front of Supabase.
export const IN_BATCH_SIZE = 100;

interface Result<Row, E> {
  data: Row[] | null;
  error: E | null;
}

// Runs `query` once per batch of distinct ids, in parallel, and merges the rows. The result has
// PostgREST's shape, so call sites keep their `if (error) throw error`; the first error wins.
export async function selectIn<Row, E>(
  ids: readonly string[],
  query: (batch: string[]) => PromiseLike<Result<Row, E>>,
  batchSize = IN_BATCH_SIZE
): Promise<{ data: Row[]; error: E | null }> {
  const unique = [...new Set(ids)];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += batchSize) batches.push(unique.slice(i, i + batchSize));

  const results = await Promise.all(batches.map((batch) => query(batch)));
  const failed = results.find((r) => r.error);
  if (failed) return { data: [], error: failed.error };
  return { data: results.flatMap((r) => r.data ?? []), error: null };
}
