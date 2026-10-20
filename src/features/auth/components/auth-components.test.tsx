// @vitest-environment jsdom
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/products/p1' }));

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { useSession } from '../hooks/use-session';
import { AuthStatus } from './auth-status';
import { SignInButton } from './sign-in-button';

function useFake(options: Parameters<typeof createFakeBrowserClient>[0] = {}) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useSession', () => {
  it('loads the current session and follows auth changes', async () => {
    const fake = useFake();
    const { result, unmount } = renderHook(() => useSession());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();

    const session = makeSession();
    act(() => fake.emitAuthChange(session));
    expect(result.current.session).toBe(session);

    unmount();
    const subscription = fake.auth.onAuthStateChange.mock.results[0].value.data.subscription;
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('stays signed out without touching Supabase when it is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const fake = useFake();
    const { result } = renderHook(() => useSession());

    expect(result.current).toEqual({ session: null, isLoading: false });
    expect(fake.auth.getSession).not.toHaveBeenCalled();
  });
});

describe('SignInButton', () => {
  it('starts Google OAuth returning to the current page, without submitting a form', async () => {
    const fake = useFake();
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    render(
      <form onSubmit={onSubmit as never}>
        <SignInButton />
      </form>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(onSubmit).not.toHaveBeenCalled();
    const { provider, options } = fake.auth.signInWithOAuth.mock.calls[0][0];
    expect(provider).toBe('google');
    expect(new URL(options.redirectTo).searchParams.get('next')).toBe('/products/p1');
  });

  it('toasts when Google sign-in cannot start', async () => {
    const fake = useFake();
    fake.auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: new Error('offline') });
    render(<SignInButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('toasts when the client cannot be created at all', async () => {
    supabase.current = undefined;
    render(<SignInButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

describe('AuthStatus', () => {
  it('shows the sign-in button once a signed-out session resolves', async () => {
    useFake();
    render(<AuthStatus />);
    expect(await screen.findByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
  });

  it('shows the account menu with sign-out for a signed-in user', async () => {
    const fake = useFake({
      session: makeSession({ user_metadata: { avatar_url: 'https://cdn.test/a.png' } }),
    });
    render(<AuthStatus />);

    await userEvent.click(await screen.findByRole('button', { name: 'Account menu' }));
    expect(await screen.findByText('aiko@example.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Discover' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('menuitem', { name: 'Journal' })).toHaveAttribute('href', '/journal');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => expect(fake.auth.signOut).toHaveBeenCalled());
    expect(router.refresh).toHaveBeenCalled();
  });
});
