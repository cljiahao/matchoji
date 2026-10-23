import { describe, expect, it, vi } from 'vitest';

import { IN_BATCH_SIZE, selectIn } from './select-in';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `id-${i}`);
const echo = (batch: string[]) =>
  Promise.resolve({ data: batch.map((id) => ({ id })), error: null });

describe('selectIn', () => {
  it('makes no request for no ids', async () => {
    const query = vi.fn(echo);
    expect(await selectIn([], query)).toEqual({ data: [], error: null });
    expect(query).not.toHaveBeenCalled();
  });

  it('splits ids into batches, dedupes them and merges the rows in order', async () => {
    const query = vi.fn(echo);
    const { data, error } = await selectIn([...ids(250), 'id-0'], query);

    expect(error).toBeNull();
    expect(query.mock.calls.map(([batch]) => batch.length)).toEqual([
      IN_BATCH_SIZE,
      IN_BATCH_SIZE,
      50,
    ]);
    expect(data.map((r) => r.id)).toEqual(ids(250));
  });

  it('keeps every batch URL short enough for a uuid list', async () => {
    const uuid = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';
    const uuids = Array.from(
      { length: 1000 },
      (_, i) => uuid.slice(0, -4) + String(i).padStart(4, '0')
    );
    const lengths: number[] = [];
    await selectIn(uuids, (batch) => {
      lengths.push(encodeURIComponent(`in.(${batch.join(',')})`).length);
      return echo(batch);
    });
    expect(Math.max(...lengths)).toBeLessThan(4500);
  });

  it('returns the first error and no rows when a batch fails', async () => {
    const error = new Error('boom');
    const result = await selectIn(ids(150), (batch) =>
      Promise.resolve(
        batch[0] === 'id-100' ? { data: null, error } : { data: [{ id: batch[0] }], error: null }
      )
    );
    expect(result).toEqual({ data: [], error });
  });
});
