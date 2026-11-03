import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { tea } from '../test-utils';
import { listSimilarTeas } from './similar-service';

describe('listSimilarTeas', () => {
  const target = tea({ id: 't', category: 'matcha', grade: 'Ceremonial', regionId: 'uji' });
  const sameGrade = tea({ id: 'g', category: 'matcha', grade: 'ceremonial ' });
  const sameRegion = tea({ id: 'r', category: 'matcha', regionId: 'uji' });
  const other = tea({ id: 'o', category: 'hojicha' });
  const catalogue = [target, sameGrade, sameRegion, other];

  it('ranks same-category teas by grade, then region, using taste data', async () => {
    const { client } = createFakeSupabase({
      products: {
        data: [target, sameGrade, sameRegion].map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          grade: t.grade,
          region_id: t.regionId,
        })),
        error: null,
      },
      tea_taste_profiles: { data: [], error: null },
    });
    const similar = await listSimilarTeas(client, target, catalogue);
    expect(similar.map((t) => t.id)).toEqual(['g', 'r']);
  });

  it('falls back to the catalogue alone when the taste read fails', async () => {
    const { client } = createFakeSupabase({
      products: { data: null, error: new Error('down') },
      tea_taste_profiles: { data: null, error: new Error('down') },
    });
    const similar = await listSimilarTeas(client, target, catalogue);
    expect(similar.map((t) => t.id)).toEqual(['g', 'r']);
  });

  it('is empty when no other tea shares the category', async () => {
    const { client } = createFakeSupabase({});
    expect(await listSimilarTeas(client, other, [other, target])).toEqual([]);
  });
});
