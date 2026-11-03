import { describe, expect, it } from 'vitest';

import type { LabelReading } from '../schemas';
import { pickMatch } from './score-match';

const reading = (over: Partial<LabelReading> = {}): LabelReading => ({
  maker: 'Marukyu Koyamaen',
  name: 'Aoarashi',
  category: 'matcha',
  grade: null,
  origin: null,
  harvest: null,
  netWeightGrams: null,
  confidence: 'high',
  ...over,
});

const tea = (id: string, name: string, brand: string | null, category: 'matcha' | 'hojicha') => ({
  id,
  name,
  brand,
  category,
});

describe('pickMatch', () => {
  it('picks the tea whose brand and name agree, ignoring case, accents and order', () => {
    const picked = pickMatch(reading({ maker: 'MARUKYU-KOYAMAEN', name: 'Aoarashi' }), [
      tea('a', 'Okumidori', 'Marukyu Koyamaen', 'matcha'),
      tea('b', 'Aoarashi', 'Marukyu Koyamaen', 'matcha'),
    ]);
    expect(picked?.id).toBe('b');
  });

  it('declines a weak match so the add-a-tea form opens instead', () => {
    expect(pickMatch(reading(), [tea('a', 'Okumidori', 'Marukyu Koyamaen', 'matcha')])).toBeNull();
  });

  it('never matches across categories', () => {
    expect(pickMatch(reading(), [tea('a', 'Aoarashi', 'Marukyu Koyamaen', 'hojicha')])).toBeNull();
  });

  it('returns null for an empty catalogue result', () => {
    expect(pickMatch(reading(), [])).toBeNull();
  });
});
