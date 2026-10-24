import { describe, expect, it, vi } from 'vitest';

import {
  appliedVersions,
  localVersions,
  missingVersions,
} from '../../scripts/check-migration-drift.mjs';

describe('localVersions', () => {
  it('takes the timestamp of each migration file, sorted, and ignores anything else', () => {
    expect(
      localVersions([
        '20261028100000_health_check.sql',
        'README.md',
        '20260914071129_phase1_schema.sql',
        '2026_bad.sql',
      ])
    ).toEqual(['20260914071129', '20261028100000']);
  });
});

describe('missingVersions', () => {
  it('lists local migrations the project has not recorded', () => {
    expect(missingVersions(['1', '2', '3'], ['1', '3', '9'])).toEqual(['2']);
    expect(missingVersions(['1'], ['1'])).toEqual([]);
  });
});

describe('appliedVersions', () => {
  it('reads schema_migrations read-only through the Management API', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ version: '20261028100000' }]), { status: 200 })
      );

    const versions = await appliedVersions({ projectRef: 'ref', token: 't', fetchImpl });

    expect(versions).toEqual(['20261028100000']);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.supabase.com/v1/projects/ref/database/query');
    expect(init.headers.Authorization).toBe('Bearer t');
    expect(JSON.parse(init.body)).toMatchObject({ read_only: true });
  });

  it('throws with the status when the API refuses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('bad token', { status: 401 }));
    await expect(appliedVersions({ projectRef: 'ref', token: 't', fetchImpl })).rejects.toThrow(
      'Supabase Management API answered 401: bad token'
    );
  });
});
