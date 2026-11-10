import { describe, expect, it } from 'vitest';

import { isMissingTable } from './missing-table';

describe('isMissingTable', () => {
  it('recognises Postgres and PostgREST missing-relation codes', () => {
    expect(isMissingTable({ code: '42P01' })).toBe(true);
    expect(isMissingTable({ code: 'PGRST205' })).toBe(true);
  });
  it('rejects other errors', () => {
    expect(isMissingTable({ code: '42501' })).toBe(false);
    expect(isMissingTable(null)).toBe(false);
  });
});
