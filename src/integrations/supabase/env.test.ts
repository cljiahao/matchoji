import { afterEach, describe, expect, it, vi } from 'vitest';

import { supabaseEnv } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('supabaseEnv', () => {
  it('returns the URL and publishable key', () => {
    expect(supabaseEnv()).toEqual({ url: 'http://supabase.test', key: 'sb_publishable_test' });
  });

  it('throws a clear error when either is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    expect(() => supabaseEnv()).toThrow(/Supabase is not configured/);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(() => supabaseEnv()).toThrow(/Supabase is not configured/);
  });
});
