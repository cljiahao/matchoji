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
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), message: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import {
  DeleteAccountSection,
  DisplayNameForm,
  ExportDataButton,
  ProfileDetailsForm,
} from './account-sections';

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
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    await userEvent.type(input, '!');
    expect(screen.getByRole('status')).not.toHaveTextContent('Saved');
  });

  it('says why Save is off while the name is blank, and counts the characters', async () => {
    renderWithQuery(<DisplayNameForm userId="u1" current="Aiko" />);

    expect(screen.getByText('4/40')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Name shown on your reviews'));
    expect(screen.getByText('A name is needed to save.')).toBeInTheDocument();
    expect(screen.getByText('0/40')).toBeInTheDocument();
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
    expect(screen.getByText('The button unlocks once you type it.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Type “delete” to confirm'), 'Delete');
    await userEvent.click(remove);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(fake.calls).toContainEqual({ table: 'rpc:delete_my_account', method: 'rpc', args: [] });
  });

  it('mentions drink reviews and cafés in the warning', () => {
    renderWithQuery(<DeleteAccountSection userId="u1" />);
    expect(screen.getByText(/teas and drinks stay/)).toBeInTheDocument();
    expect(screen.getByText(/cafés and drinks you added/)).toBeInTheDocument();
  });

  it('only claims success after the delete went through', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: new Error('down') } },
    });
    supabase.current = fake.client;
    renderWithQuery(<DeleteAccountSection userId="u1" />);

    await userEvent.type(screen.getByLabelText('Type “delete” to confirm'), 'delete');
    await userEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
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

describe('delete account photo cleanup', () => {
  it('still reports success but flags photos that could not be removed', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: null } },
    });
    fake.list.mockResolvedValueOnce({ data: [{ name: 'a.jpg' }], error: null });
    fake.remove.mockResolvedValueOnce({ data: [], error: new Error('storage down') } as never);
    supabase.current = fake.client;
    renderWithQuery(<DeleteAccountSection userId="u1" />);

    await userEvent.type(screen.getByLabelText('Type “delete” to confirm'), 'delete');
    await userEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Your account is deleted.'));
    expect(toast.message).toHaveBeenCalledWith(
      expect.stringMatching(/photos could not be removed/)
    );
  });
});

describe('ExportDataButton', () => {
  it('revokes the download URL after the click, not before', async () => {
    const empty = { data: [], error: null };
    const fake = createFakeBrowserClient({
      results: {
        profiles: { data: null, error: null },
        vendors: { data: null, error: null },
        reviews: empty,
        wishlist: empty,
        stock_reports: empty,
        review_likes: empty,
        review_comments: empty,
        follows: empty,
        blocks: empty,
        lesson_progress: empty,
        content_reports: empty,
        notifications: empty,
        label_scans: empty,
        products: empty,
        my_cafes: empty,
        my_drinks: empty,
      },
    });
    supabase.current = fake.client;
    const events: string[] = [];
    URL.createObjectURL = vi.fn(() => 'blob:export');
    URL.revokeObjectURL = vi.fn(() => events.push('revoke'));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => void events.push('click'));
    renderWithQuery(<ExportDataButton userId="u1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Download my data' }));

    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export'));
    expect(events).toEqual(['click', 'revoke']);
    click.mockRestore();
  });
});

describe('account tap targets', () => {
  it('keeps every control at least 44px tall', () => {
    renderWithQuery(
      <>
        <DisplayNameForm userId="u1" current="Aiko" />
        <ExportDataButton userId="u1" />
        <DeleteAccountSection userId="u1" />
      </>
    );
    for (const control of [
      screen.getByLabelText('Name shown on your reviews'),
      screen.getByRole('button', { name: 'Save' }),
      screen.getByRole('button', { name: 'Download my data' }),
      screen.getByLabelText(/Type .delete. to confirm/),
      screen.getByRole('button', { name: 'Delete my account' }),
    ]) {
      expect(control.className).toMatch(/(^|\s)(min-)?h-11(\s|$)/);
    }
  });
});

describe('ProfileDetailsForm', () => {
  it('saves the handle and bio, and refuses a handle with an @ before any request', async () => {
    const fake = createFakeBrowserClient({ results: { profiles: { data: null, error: null } } });
    supabase.current = fake.client;
    renderWithQuery(<ProfileDetailsForm userId="u1" instagramHandle={null} bio={null} />);

    const handle = screen.getByLabelText('Instagram handle');
    await userEvent.type(handle, '@foodcnl');
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(screen.getByRole('alert')).toHaveTextContent('without the @');
    expect(fake.calls.find((c) => c.method === 'update')).toBeUndefined();

    await userEvent.clear(handle);
    await userEvent.type(handle, 'foodcnl');
    await userEvent.type(screen.getByLabelText('Bio'), 'Hojicha first');
    expect(screen.getByText('13/280')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Details saved.'));
    expect(fake.calls.find((c) => c.method === 'update')?.args[0]).toEqual({
      instagram_handle: 'foodcnl',
      bio: 'Hojicha first',
    });
  });

  it('says so when the save fails', async () => {
    const fake = createFakeBrowserClient({
      results: { profiles: { data: null, error: new Error('down') } },
    });
    supabase.current = fake.client;
    renderWithQuery(<ProfileDetailsForm userId="u1" instagramHandle="foodcnl" bio="Hi" />);
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
