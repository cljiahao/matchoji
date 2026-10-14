import { afterEach, describe, expect, it, vi } from 'vitest';

import { isSupabaseConfigured, shouldUseMockData } from './is-configured';

afterEach(() => {
  vi.unstubAllEnvs();
});

function unconfigure() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
}

describe('isSupabaseConfigured', () => {
  it('is true only when both URL and publishable key are set', () => {
    expect(isSupabaseConfigured()).toBe(true);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    expect(isSupabaseConfigured()).toBe(false);
  });
});

describe('shouldUseMockData', () => {
  it('uses real data when Supabase is configured', () => {
    expect(shouldUseMockData()).toBe(false);
  });

  it('falls back to mock data in development', () => {
    unconfigure();
    vi.stubEnv('NODE_ENV', 'development');
    expect(shouldUseMockData()).toBe(true);
  });

  // Mock data names real brands with invented ratings; production must never show it.
  it('throws in production instead of serving mock data', () => {
    unconfigure();
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => shouldUseMockData()).toThrow(/Supabase is not configured/);
  });
});
