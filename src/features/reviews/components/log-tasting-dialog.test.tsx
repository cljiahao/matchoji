// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/',
}));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SignInPromptProvider } from '@/features/auth';

import { LogTastingDialog } from './log-tasting-dialog';

const REGION_ID = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';

function setup(
  results: NonNullable<Parameters<typeof createFakeBrowserClient>[0]>['results'],
  session: ReturnType<typeof makeSession> | null = makeSession()
) {
  const fake = createFakeBrowserClient({
    session,
    results: {
      regions: { data: [{ id: REGION_ID, name: 'Uji, Kyoto' }], error: null },
      ...results,
    },
  });
  supabase.current = fake.client;
  renderWithQuery(
    <SignInPromptProvider>
      <LogTastingDialog />
    </SignInPromptProvider>
  );
  return fake;
}

async function openAndSearch(text: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));
  // One paste = one search request, so queued fake results line up with requests.
  await userEvent.click(screen.getByRole('combobox', { name: 'Search products' }));
  await userEvent.paste(text);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LogTastingDialog', () => {
  it('goes from search to rating an existing product', async () => {
    setup({
      products: {
        data: [{ id: 'a', name: 'Uji Ceremonial', brand: null, category: 'matcha' }],
        error: null,
      },
    });

    await openAndSearch('uji');
    await userEvent.click(await screen.findByRole('option', { name: /Uji Ceremonial/ }));

    expect(screen.getByRole('heading', { name: 'Rate Uji Ceremonial' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Rating out of 5 stars' })).toBeInTheDocument();
  });

  it('adds a new product with category and region, then rates it', async () => {
    const created = { id: 'new', name: 'Kagoshima Gold', brand: null, category: 'hojicha' };
    const { calls } = setup({
      products: [
        { data: [], error: null },
        { data: created, error: null },
      ],
    });

    await openAndSearch('Kagoshima Gold');
    await userEvent.click(await screen.findByRole('button', { name: 'Add as new product' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Kagoshima Gold');

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Category' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Hojicha' }));
    await userEvent.click(
      await within(dialog).findByRole('combobox', { name: 'Region (optional)' })
    );
    await userEvent.click(await screen.findByRole('option', { name: 'Uji, Kyoto' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Rate Kagoshima Gold' })).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      name: 'Kagoshima Gold',
      category: 'hojicha',
      region_id: REGION_ID,
    });
  });

  it('shows inline errors and keeps the user on the add step when creation fails', async () => {
    setup({
      products: [
        { data: [], error: null },
        { data: null, error: new Error('rls') },
      ],
    });

    await openAndSearch('Kagoshima Gold');
    await userEvent.click(await screen.findByRole('button', { name: 'Add as new product' }));
    const name = screen.getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();

    await userEvent.type(name, 'Kagoshima Gold');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not add that product. Check the details and try again.'
      )
    );
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('resets to the search step when reopened', async () => {
    setup({ products: { data: [], error: null } });

    await openAndSearch('Kagoshima Gold');
    await userEvent.click(await screen.findByRole('button', { name: 'Add as new product' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));

    expect(screen.getByRole('combobox', { name: 'Search products' })).toHaveValue('');
  });

  // Logging needs an account (products and reviews are insert-only for signed-in users),
  // so a signed-out visitor is asked to sign in before the form opens.
  it('asks signed-out visitors to sign in instead of opening the form', async () => {
    const { auth } = setup({}, null);

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));

    const prompt = await screen.findByRole('dialog', { name: 'Join Matchoji' });
    expect(
      within(prompt).getByText('Sign in to log and rate the teas you try.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Search products' })).not.toBeInTheDocument();

    await userEvent.click(within(prompt).getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalled());
    const next = new URL(auth.signInWithOAuth.mock.calls[0][0].options.redirectTo).searchParams;
    expect(next.get('next')).toBe('/');
  });

  // A tap before the session resolves must not send a signed-in user to sign in.
  it('does nothing while the session is still loading', async () => {
    const fake = createFakeBrowserClient({ session: makeSession() });
    fake.auth.getSession.mockImplementationOnce(() => new Promise(() => {}));
    supabase.current = fake.client;
    renderWithQuery(
      <SignInPromptProvider>
        <LogTastingDialog />
      </SignInPromptProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
