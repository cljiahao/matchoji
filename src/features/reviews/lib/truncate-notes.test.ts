import { describe, expect, it } from 'vitest';

import { truncateNotes } from './truncate-notes';

describe('truncateNotes', () => {
  it('leaves short notes untouched', () => {
    expect(truncateNotes('Nutty, smooth.', 20)).toEqual({
      text: 'Nutty, smooth.',
      truncated: false,
    });
  });

  it('cuts on a word boundary and adds an ellipsis', () => {
    expect(truncateNotes('roasty caramel finish with cocoa', 20)).toEqual({
      text: 'roasty caramel…',
      truncated: true,
    });
  });

  it('hard-cuts a single word longer than the limit', () => {
    expect(truncateNotes('a'.repeat(30), 10)).toEqual({
      text: `${'a'.repeat(10)}…`,
      truncated: true,
    });
  });

  it('drops trailing punctuation before the ellipsis', () => {
    expect(truncateNotes('Sweet, grassy, bright and long', 15).text).toBe('Sweet, grassy…');
  });
});
