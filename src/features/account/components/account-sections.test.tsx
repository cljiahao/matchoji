// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { DeleteAccountSection, DisplayNameForm } from './account-sections';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DisplayNameForm', () => {
  it('saves a changed name, and only a changed, non-blank one', async () => {
    const fake = createFakeBrowserClient({ results: { profiles: { data: null, error: null } } });
    supabase.current = fake.client;
    renderWithQuery(<DisplayNameForm userId="u1" current="Aiko" />);

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    const input = screen.getByLabelText('Name shown on your reviews');
    await userEvent.clear(input);
    expect(save).toBeDisabled();
    await userEvent.type(input, 'Aiko T');
    await userEvent.click(save);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Name saved.'));
    expect(fake.calls.find((c) => c.method === 'update')?.args[0]).toEqual({
      display_name: 'Aiko T',
    });
  });
});

describe('DeleteAccountSection', () => {
  it('asks for the confirm word, then deletes and goes home', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<DeleteAccountSection userId="u1" />);

    const remove = screen.getByRole('button', { name: 'Delete my account' });
    expect(remove).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Type “delete” to confirm'), 'Delete');
    await userEvent.click(remove);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(fake.calls).toContainEqual({ table: 'rpc:delete_my_account', method: 'rpc', args: [] });
  });

  it('says nothing was removed when it fails', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: new Error('down') } },
    });
    supabase.current = fake.client;
    renderWithQuery(<DeleteAccountSection userId="u1" />);

    await userEvent.type(screen.getByLabelText('Type “delete” to confirm'), 'delete');
    await userEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not delete your account. Nothing was removed; try again.'
      )
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});
