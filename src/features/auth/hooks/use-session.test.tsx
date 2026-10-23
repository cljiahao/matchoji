// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

import { SessionProvider, useSession } from './use-session';

function Who({ label }: { label: string }) {
  const { session, isLoading } = useSession();
  return <p>{isLoading ? `${label}: loading` : `${label}: ${session?.user.email ?? 'nobody'}`}</p>;
}

describe('useSession', () => {
  it('shares one session read and one subscription under a SessionProvider', async () => {
    const fake = createFakeBrowserClient({ session: makeSession() });
    supabase.current = fake.client;
    render(
      <SessionProvider>
        <Who label="a" />
        <Who label="b" />
        <Who label="c" />
      </SessionProvider>
    );

    expect(await screen.findByText('c: aiko@example.com')).toBeInTheDocument();
    expect(fake.auth.getSession).toHaveBeenCalledTimes(1);
    expect(fake.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('keeps its own session outside a provider', async () => {
    const fake = createFakeBrowserClient({});
    supabase.current = fake.client;
    render(<Who label="solo" />);
    await waitFor(() => expect(screen.getByText('solo: nobody')).toBeInTheDocument());
    expect(fake.auth.getSession).toHaveBeenCalledTimes(1);
  });
});
