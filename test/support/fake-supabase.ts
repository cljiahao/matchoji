import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

// A PostgREST-shaped stand-in: every filter method records its call and returns the
// same builder; awaiting it (or .single()/.maybeSingle()) resolves to the result queued
// for that table. Tests assert on the recorded calls and on what the service returns.
export interface QueryResult {
  data: unknown;
  error: unknown;
}

// A pending result lets a test observe state while a request is still in flight.
type QueuedResult = QueryResult | Promise<QueryResult>;

export interface RecordedCall {
  table: string;
  method: string;
  args: unknown[];
}

export function createFakeSupabase(results: Record<string, QueuedResult | QueuedResult[]>) {
  const calls: RecordedCall[] = [];
  const queues = new Map(
    Object.entries(results).map(([table, r]) => [table, Array.isArray(r) ? [...r] : [r]])
  );

  function next(table: string): QueuedResult {
    const queue = queues.get(table);
    if (!queue || queue.length === 0) throw new Error(`No fake result queued for "${table}"`);
    return queue.length > 1 ? queue.shift()! : queue[0];
  }

  function builder(table: string): unknown {
    let result: QueuedResult | undefined;
    const resolve = () => (result ??= next(table));
    const proxy: unknown = new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === 'then') {
            return (
              onFulfilled: (r: QueryResult) => unknown,
              onRejected?: (e: unknown) => unknown
            ) => Promise.resolve(resolve()).then(onFulfilled, onRejected);
          }
          return (...args: unknown[]) => {
            calls.push({ table, method: prop, args });
            return prop === 'single' || prop === 'maybeSingle' ? Promise.resolve(resolve()) : proxy;
          };
        },
      }
    );
    return proxy;
  }

  const client = {
    from(table: string) {
      calls.push({ table, method: 'from', args: [table] });
      return builder(table);
    },
  };

  return { client: client as unknown as SupabaseClient<Database>, calls };
}
