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

function setup(results: NonNullable<Parameters<typeof createFakeBrowserClient>[0]>['results']) {
  const fake = createFakeBrowserClient({
    session: makeSession(),
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
});
