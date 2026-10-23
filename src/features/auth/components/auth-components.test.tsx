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
import { SignInPromptProvider, useSignInPrompt } from '../hooks/use-sign-in-prompt';
import { AuthStatus } from './auth-status';
import { SignInButton } from './sign-in-button';
import { SignInDialog } from './sign-in-dialog';

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
});

describe('SignInButton', () => {
  it('opens the join dialog without submitting a form, then starts Google OAuth back to this page', async () => {
    const fake = useFake();
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    render(
      <SignInPromptProvider>
        <form onSubmit={onSubmit as never}>
          <SignInButton />
        </form>
      </SignInPromptProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole('dialog', { name: 'Join Matchoji' })).toBeInTheDocument();
    expect(fake.auth.signInWithOAuth).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    const { provider, options } = fake.auth.signInWithOAuth.mock.calls[0][0];
    expect(provider).toBe('google');
    expect(new URL(options.redirectTo).searchParams.get('next')).toBe('/products/p1');
  });

  it('uses the given label', () => {
    useFake();
    render(<SignInButton label="Sign in to start your journal" />);
    expect(
      screen.getByRole('button', { name: 'Sign in to start your journal' })
    ).toBeInTheDocument();
  });

  it('goes straight to Google for the current path outside the prompt provider', async () => {
    const fake = useFake();
    render(<SignInButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(fake.auth.signInWithOAuth).toHaveBeenCalled());
    const { options } = fake.auth.signInWithOAuth.mock.calls[0][0];
    expect(new URL(options.redirectTo).searchParams.get('next')).toBe(window.location.pathname);
  });
});

describe('SignInDialog', () => {
  it('sends Google the next path and shows the reason', async () => {
    const fake = useFake();
    render(
      <SignInDialog open onOpenChange={() => {}} nextPath="/journal" reason="Sign in to rate." />
    );

    expect(screen.getByText('Sign in to rate.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    const { options } = fake.auth.signInWithOAuth.mock.calls[0][0];
    expect(new URL(options.redirectTo).searchParams.get('next')).toBe('/journal');
  });

  it('falls back to a generic reason', () => {
    useFake();
    render(<SignInDialog open onOpenChange={() => {}} nextPath="/" />);
    expect(
      screen.getByText('Sign in to rate teas, keep a journal and save teas to try.')
    ).toBeInTheDocument();
  });

  it('disables the button while redirecting', async () => {
    const fake = useFake();
    fake.auth.signInWithOAuth.mockReturnValueOnce(new Promise(() => {}));
    render(<SignInDialog open onOpenChange={() => {}} nextPath="/" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  });

  it('toasts and re-enables when Google sign-in cannot start', async () => {
    const fake = useFake();
    fake.auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: new Error('offline') });
    render(<SignInDialog open onOpenChange={() => {}} nextPath="/" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not reach Google sign-in. Check your connection and try again.'
      )
    );
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
  });

  it('toasts when the client cannot be created at all', async () => {
    supabase.current = undefined;
    render(<SignInDialog open onOpenChange={() => {}} nextPath="/" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

describe('SignInPromptProvider', () => {
  function Trigger({ options }: { options?: Parameters<ReturnType<typeof useSignInPrompt>>[0] }) {
    const prompt = useSignInPrompt();
    return (
      <button type="button" onClick={() => prompt(options)}>
        Write
      </button>
    );
  }

  it('opens the dialog with the reason and the given next path', async () => {
    const fake = useFake();
    render(
      <SignInPromptProvider>
        <Trigger options={{ nextPath: '/products/p9#rate', reason: 'Sign in to rate Uji.' }} />
      </SignInPromptProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Write' }));

    expect(await screen.findByText('Sign in to rate Uji.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    const { options } = fake.auth.signInWithOAuth.mock.calls[0][0];
    expect(new URL(options.redirectTo).searchParams.get('next')).toBe('/products/p9#rate');
  });

  it('closes on Escape', async () => {
    useFake();
    render(
      <SignInPromptProvider>
        <Trigger />
      </SignInPromptProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Write' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('falls back to Google with the given next path outside the provider', async () => {
    const fake = useFake();
    render(<Trigger options={{ nextPath: '/journal' }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Write' }));
    await waitFor(() => expect(fake.auth.signInWithOAuth).toHaveBeenCalled());
    const { options } = fake.auth.signInWithOAuth.mock.calls[0][0];
    expect(new URL(options.redirectTo).searchParams.get('next')).toBe('/journal');
  });
});

describe('AuthStatus', () => {
  it('shows the sign-in button once a signed-out session resolves', async () => {
    useFake();
    render(<AuthStatus />);
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the account menu with account, sell and sign-out links for a signed-in user', async () => {
    const fake = useFake({
      session: makeSession({ user_metadata: { avatar_url: 'https://cdn.test/a.png' } }),
    });
    render(<AuthStatus />);

    await userEvent.click(await screen.findByRole('button', { name: 'Account menu' }));
    expect(await screen.findByText('aiko@example.com')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Your account' })).toHaveAttribute(
      'href',
      '/account'
    );
    expect(screen.getByRole('menuitem', { name: 'Sell on Matchoji' })).toHaveAttribute(
      'href',
      '/sell'
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => expect(fake.auth.signOut).toHaveBeenCalled());
    expect(router.refresh).toHaveBeenCalled();
  });
});
