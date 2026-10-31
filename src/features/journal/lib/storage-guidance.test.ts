import { describe, expect, it } from 'vitest';

import { MAKER_GUIDANCE, freshnessHint } from './storage-guidance';

describe('freshnessHint', () => {
  it('attributes the figure to a maker that published one', () => {
    const hint = freshnessHint('Ippodo', '2026-10-19', '2026-10-31');
    expect(hint?.daysOpen).toBe(12);
    expect(hint?.maker).toMatchObject({ name: 'Ippodo', phrase: 'within a month of opening' });
    expect(hint?.guideHref).toBe('/learn/guides/storing-matcha');
  });

  it('falls back to general advice for an unknown maker or no brand', () => {
    expect(freshnessHint('Unknown Tea Co', '2026-10-19', '2026-10-31')?.maker).toBeNull();
    expect(freshnessHint(null, '2026-10-19', '2026-10-31')?.maker).toBeNull();
  });

  it('shows nothing without an opened date', () => {
    expect(freshnessHint('Ippodo', null, '2026-10-31')).toBeNull();
  });

  it('keeps a source URL on every maker entry', () => {
    for (const entry of Object.values(MAKER_GUIDANCE)) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
