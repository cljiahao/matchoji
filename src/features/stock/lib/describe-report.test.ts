import { describe, expect, it } from 'vitest';

import { isStale, reportedAgo } from './describe-report';

const now = new Date('2026-10-24T12:00:00Z');
const at = (iso: string) => ({ status: 'in_stock' as const, reportedAt: iso });

describe('reportedAgo', () => {
  it('reads in the largest whole unit', () => {
    expect(reportedAgo('2026-10-24T11:59:30Z', now)).toBe('just now');
    expect(reportedAgo('2026-10-24T11:59:00Z', now)).toBe('1 minute ago');
    expect(reportedAgo('2026-10-24T09:10:00Z', now)).toBe('2 hours ago');
    expect(reportedAgo('2026-10-23T11:00:00Z', now)).toBe('1 day ago');
    expect(reportedAgo('2026-10-14T12:00:00Z', now)).toBe('10 days ago');
  });

  it('treats a time ahead of the clock as just now', () => {
    expect(reportedAgo('2026-10-24T12:05:00Z', now)).toBe('just now');
  });
});

describe('isStale', () => {
  it('is stale after 14 days', () => {
    expect(isStale(at('2026-10-10T12:00:00Z'), now)).toBe(false);
    expect(isStale(at('2026-10-10T11:59:00Z'), now)).toBe(true);
  });
});
