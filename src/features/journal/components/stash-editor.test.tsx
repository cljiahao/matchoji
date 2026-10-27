// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { StashEditor } from './stash-editor';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StashEditor', () => {
  it('records how many you have and when you opened it', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: { wishlist: { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(
      <StashEditor productId="p1" name="Sayaka" stash={{ ownedQuantity: 0, openedOn: null }} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'I have this' }));
    const qty = screen.getByLabelText('How many');
    await userEvent.clear(qty);
    await userEvent.type(qty, '2');
    await userEvent.type(screen.getByLabelText('Opened on'), '2026-10-20');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls.find((c) => c.method === 'update')?.args[0]).toEqual({
      owned_quantity: 2,
      opened_on: '2026-10-20',
    });
  });

  it('shows what is stashed and refuses a silly quantity', async () => {
    supabase.current = createFakeBrowserClient({ session: makeSession() }).client;
    renderWithQuery(
      <StashEditor productId="p1" name="Sayaka" stash={{ ownedQuantity: 3, openedOn: null }} />
    );
    expect(screen.getByText('3 in your stash')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit stash' }));
    const qty = screen.getByLabelText('How many');
    await userEvent.clear(qty);
    await userEvent.type(qty, '1.5');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(toast.error).toHaveBeenCalledWith('Use a whole number from 0 to 99.');
  });

  it('closes the form on Cancel without saving', async () => {
    const fake = createFakeBrowserClient({ session: makeSession() });
    supabase.current = fake.client;
    renderWithQuery(
      <StashEditor productId="p1" name="Sayaka" stash={{ ownedQuantity: 0, openedOn: null }} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'I have this' }));
    await userEvent.type(screen.getByLabelText('How many'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('How many')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I have this' })).toBeInTheDocument();
    expect(fake.calls.find((c) => c.method === 'update')).toBeUndefined();

    await userEvent.click(screen.getByRole('button', { name: 'I have this' }));
    expect(screen.getByLabelText('How many')).toHaveValue('0');
  });
});
