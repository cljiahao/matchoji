import { describe, expect, it } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';
import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { deleteMyAccount, exportMyData, getMyProfile, updateDisplayName } from './account-service';

describe('getMyProfile and updateDisplayName', () => {
  it('reads the profile and saves a trimmed name', async () => {
    const { client, calls } = createFakeSupabase({
      profiles: [
        { data: { email: 'a@example.com', display_name: 'Aiko' }, error: null },
        { data: null, error: null },
      ],
    });
    expect(await getMyProfile(client, 'u1')).toEqual({
      email: 'a@example.com',
      displayName: 'Aiko',
    });
    await updateDisplayName(client, 'u1', '  Aiko T ');
    expect(calls.find((c) => c.method === 'update')?.args[0]).toEqual({ display_name: 'Aiko T' });
  });

  it('throws when the save is refused', async () => {
    const error = new Error('check');
    const { client } = createFakeSupabase({ profiles: { data: null, error } });
    await expect(updateDisplayName(client, 'u1', 'x')).rejects.toBe(error);
  });
});

describe('exportMyData', () => {
  it('gathers the profile, tastings, want-to-try, stock reports and shop', async () => {
    const { client } = createFakeSupabase({
      profiles: { data: { email: 'a@example.com' }, error: null },
      reviews: { data: [{ id: 'r1' }], error: null },
      wishlist: { data: [], error: null },
      stock_reports: { data: [], error: null },
      vendors: { data: null, error: null },
    });
    expect(await exportMyData(client, 'u1')).toMatchObject({
      profile: { email: 'a@example.com' },
      tastings: [{ id: 'r1' }],
      wantToTry: [],
      shop: null,
    });
  });
});

// The browser fake adds auth and storage to the query fake; typed as the real client here.
const asClient = (client: unknown) => client as Parameters<typeof deleteMyAccount>[0];

describe('deleteMyAccount', () => {
  it('removes the photos, deletes the account, then signs out', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: null } },
    });
    fake.list.mockResolvedValueOnce({ data: [{ name: 'a.jpg' }, { name: 'b.png' }], error: null });

    await deleteMyAccount(asClient(fake.client), 'u1');

    expect(fake.list).toHaveBeenCalledWith('u1', { limit: 1000 });
    expect(fake.remove).toHaveBeenCalledWith(['u1/a.jpg', 'u1/b.png']);
    expect(fake.calls).toContainEqual({ table: 'rpc:delete_my_account', method: 'rpc', args: [] });
    expect(fake.auth.signOut).toHaveBeenCalled();
  });

  it('stops before deleting anything when the photos cannot be listed', async () => {
    const fake = createFakeBrowserClient({});
    const error = new Error('storage down');
    fake.list.mockResolvedValueOnce({ data: [], error });

    await expect(deleteMyAccount(asClient(fake.client), 'u1')).rejects.toBe(error);
    expect(fake.calls.some((c) => c.method === 'rpc')).toBe(false);
    expect(fake.auth.signOut).not.toHaveBeenCalled();
  });
});
