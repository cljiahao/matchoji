import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { createProduct } from './products-mutations';

describe('createProduct', () => {
  it('inserts snake_case columns with nulls for missing optionals', async () => {
    const created = { id: 'p1', name: 'Kyoto Hojicha', brand: null, category: 'hojicha' };
    const { client, calls } = createFakeSupabase({ products: { data: created, error: null } });

    const result = await createProduct(client, { name: 'Kyoto Hojicha', category: 'hojicha' });

    expect(result).toEqual(created);
    expect(calls).toContainEqual({
      table: 'products',
      method: 'insert',
      args: [
        { name: 'Kyoto Hojicha', brand: null, category: 'hojicha', grade: null, region_id: null },
      ],
    });
  });

  it('throws the Supabase error', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({ products: { data: null, error } });
    await expect(createProduct(client, { name: 'x', category: 'matcha' })).rejects.toBe(error);
  });
});
