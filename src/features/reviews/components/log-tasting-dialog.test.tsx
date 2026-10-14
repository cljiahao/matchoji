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
  renderWithQuery(<LogTastingDialog />);
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
  sessionStorage.clear();
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

  // Products are insertable only by authenticated users (RLS), so a signed-out Continue
  // must go through sign-in instead of failing the insert.
  it('sends signed-out visitors through Google sign-in with the new product parked', async () => {
    const { auth, calls } = setup({ products: { data: [], error: null } }, null);

    await openAndSearch('Kagoshima Gold');
    await userEvent.click(await screen.findByRole('button', { name: 'Add as new product' }));
    expect(screen.getByText(/sign in with Google first/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Grade (optional)'), 'First flush');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google to continue' }));

    await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalled());
    expect(calls.some((c) => c.method === 'insert')).toBe(false);
    expect(JSON.parse(sessionStorage.getItem('matchoji:product-draft')!)).toMatchObject({
      name: 'Kagoshima Gold',
      grade: 'First flush',
    });
    const next = new URL(auth.signInWithOAuth.mock.calls[0][0].options.redirectTo).searchParams;
    expect(next.get('next')).toBe('/');
  });

  it('stays on the add step and toasts when Google sign-in cannot start', async () => {
    const { auth } = setup({ products: { data: [], error: null } }, null);
    auth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: new Error('offline') });

    await openAndSearch('Kagoshima Gold');
    await userEvent.click(await screen.findByRole('button', { name: 'Add as new product' }));
    const submit = screen.getByRole('button', { name: 'Sign in with Google to continue' });
    await userEvent.click(submit);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not reach Google sign-in. Check your connection and try again.'
      )
    );
    expect(submit).toBeEnabled();
  });

  it('reopens on the add step with the parked product after sign-in', async () => {
    sessionStorage.setItem(
      'matchoji:product-draft',
      JSON.stringify({ name: 'Kagoshima Gold', category: 'hojicha', grade: 'First flush' })
    );
    setup({});

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Kagoshima Gold');
    expect(screen.getByLabelText('Grade (optional)')).toHaveValue('First flush');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Hojicha');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(sessionStorage.getItem('matchoji:product-draft')).toBeNull();
    expect(toast.info).toHaveBeenCalled();
  });

  it('only the dialog marked to restore drafts reopens', async () => {
    sessionStorage.setItem(
      'matchoji:product-draft',
      JSON.stringify({ name: 'Kagoshima Gold', category: 'hojicha' })
    );
    supabase.current = createFakeBrowserClient({ session: makeSession() }).client;
    renderWithQuery(<LogTastingDialog restoresDraft={false} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Log a tasting' })).toBeInTheDocument()
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('matchoji:product-draft')).not.toBeNull();
  });
});
