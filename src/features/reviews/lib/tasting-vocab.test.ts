import { describe, expect, it } from 'vitest';

import { FLAVOR_NOTES, PREP_METHODS, PREP_METHOD_LABELS, noteLabel } from './tasting-vocab';

describe('tasting vocabulary', () => {
  it('has ten notes per category', () => {
    expect(FLAVOR_NOTES.matcha).toHaveLength(10);
    expect(FLAVOR_NOTES.hojicha).toHaveLength(10);
    expect(FLAVOR_NOTES.hojicha).toContain('toasted-rice');
  });

  it('labels every prep method', () => {
    expect(PREP_METHODS.map((m) => PREP_METHOD_LABELS[m])).toEqual([
      'Usucha',
      'Koicha',
      'Latte',
      'Iced',
      'Cold brew',
      'Steeped',
      'Other',
    ]);
  });

  it('formats note slugs as labels', () => {
    expect(noteLabel('toasted-rice')).toBe('Toasted rice');
    expect(noteLabel('umami')).toBe('Umami');
  });
});
