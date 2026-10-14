import type { Session } from '@supabase/supabase-js';
import { vi } from 'vitest';

import { createFakeSupabase, type QueryResult } from './fake-supabase';

// Stand-in for `@/integrations/supabase/client`'s createClient(): DB calls go through the
// recording fake, auth and storage are spies tests can steer.
export function createFakeBrowserClient(
  options: {
    session?: Session | null;
    results?: Record<string, QueryResult | QueryResult[]>;
  } = {}
) {
  const db = createFakeSupabase(options.results ?? {});
  let authListener: ((event: string, session: Session | null) => void) | undefined;

  const auth = {
    getSession: vi.fn(async () => ({ data: { session: options.session ?? null } })),
    onAuthStateChange: vi.fn((cb: (event: string, session: Session | null) => void) => {
      authListener = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithOAuth: vi.fn(
      async (_credentials: { provider: string; options: { redirectTo: string } }) => ({
        data: {},
        error: null as Error | null,
      })
    ),
    signOut: vi.fn(async () => ({ error: null })),
  };

  const upload = vi.fn(async () => ({ error: null }));
  const storage = {
    from: vi.fn(() => ({
      upload,
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
    })),
  };

  const client = { ...(db.client as object), from: db.client.from, auth, storage };

  return {
    client,
    calls: db.calls,
    auth,
    upload,
    emitAuthChange: (session: Session | null) => authListener?.('SIGNED_IN', session),
  };
}

export function makeSession(overrides: Partial<Session['user']> = {}): Session {
  return {
    access_token: 't',
    refresh_token: 'r',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      email: 'aiko@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-09-01T00:00:00Z',
      ...overrides,
    },
  } as Session;
}
