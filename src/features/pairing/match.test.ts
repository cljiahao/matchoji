import { describe, expect, it } from 'vitest';

import { pairingsFor } from './match';
import { PAIRING_RULES } from './rules';

describe('pairingsFor', () => {
  it('gives hojicha its sourced sweets whatever the grade', () => {
    const ids = pairingsFor({ category: 'hojicha', grade: null }).map((r) => r.id);
    expect(ids).toEqual(['hojicha-daifuku', 'hojicha-castella', 'hojicha-zenzai']);
    expect(pairingsFor({ category: 'hojicha', grade: 'Gokujo' })).toHaveLength(3);
  });

  it('gives drinking matcha, graded or not, its sweets', () => {
    expect(pairingsFor({ category: 'matcha', grade: 'Ceremonial' }).map((r) => r.id)).toContain(
      'matcha-higashi'
    );
    expect(pairingsFor({ category: 'matcha', grade: null })).toHaveLength(3);
  });

  it('has nothing for culinary or latte matcha', () => {
    expect(pairingsFor({ category: 'matcha', grade: 'Culinary' })).toEqual([]);
    expect(pairingsFor({ category: 'matcha', grade: 'latte grade' })).toEqual([]);
  });

  it('never returns more than four', () => {
    expect(pairingsFor({ category: 'matcha', grade: null }).length).toBeLessThanOrEqual(4);
  });
});

describe('PAIRING_RULES', () => {
  it('each cites an https source and has unique ids', () => {
    for (const rule of PAIRING_RULES) expect(rule.source.url).toMatch(/^https:\/\//);
    expect(new Set(PAIRING_RULES.map((r) => r.id)).size).toBe(PAIRING_RULES.length);
  });
});
