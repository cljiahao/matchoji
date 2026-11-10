import { describe, expect, it } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';
import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  deleteMyAccount,
  exportMyData,
  getMyProfile,
  updateDisplayName,
  updateProfileDetails,
} from './account-service';

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
      my_cafes: { data: [], error: null },
      my_drinks: { data: [], error: null },
    });
    expect(await exportMyData(client, 'u1')).toMatchObject({
      profile: { email: 'a@example.com' },
      tastings: [{ id: 'r1' }],
      wantToTry: [],
      shop: null,
    });
  });

  it('export includes cafés and drinks added by me, read from the my_* views', async () => {
    const { client, calls } = createFakeSupabase({
      profiles: { data: null, error: null },
      reviews: { data: [], error: null },
      wishlist: { data: [], error: null },
      stock_reports: { data: [], error: null },
      vendors: { data: null, error: null },
      my_cafes: { data: [{ id: 'c1', name: 'Kurasu' }], error: null },
      my_drinks: { data: [{ id: 'd1', name: 'Hojicha Latte' }], error: null },
    });
    expect(await exportMyData(client, 'u1')).toMatchObject({
      cafesAdded: [{ id: 'c1' }],
      drinksAdded: [{ id: 'd1' }],
    });
    expect(calls.some((c) => c.table === 'cafes' || c.table === 'drinks')).toBe(false);
  });

  it('exports empty café lists before the café migration is applied', async () => {
    const missing = { data: null, error: { code: 'PGRST205', message: 'missing' } };
    const { client } = createFakeSupabase({
      profiles: { data: null, error: null },
      reviews: { data: [], error: null },
      wishlist: { data: [], error: null },
      stock_reports: { data: [], error: null },
      vendors: { data: null, error: null },
      my_cafes: missing,
      my_drinks: missing,
    });
    expect(await exportMyData(client, 'u1')).toMatchObject({ cafesAdded: [], drinksAdded: [] });
  });

  it('throws other café read errors', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({
      profiles: { data: null, error: null },
      reviews: { data: [], error: null },
      wishlist: { data: [], error: null },
      stock_reports: { data: [], error: null },
      vendors: { data: null, error: null },
      my_cafes: { data: null, error },
      my_drinks: { data: [], error: null },
    });
    await expect(exportMyData(client, 'u1')).rejects.toBe(error);
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

describe('updateProfileDetails', () => {
  const save = (input: { instagramHandle: string | null; bio: string | null }) => {
    const fake = createFakeSupabase({ profiles: { data: null, error: null } });
    return { ...fake, done: updateProfileDetails(fake.client, 'u1', input) };
  };

  it('rejects a handle with an @ or spaces, and writes nothing', async () => {
    for (const handle of ['@foodcnl', 'food cnl', 'a'.repeat(31)]) {
      const { calls, done } = save({ instagramHandle: handle, bio: null });
      await expect(done).rejects.toThrow();
      expect(calls).toEqual([]);
    }
  });

  it('rejects a bio over 280 characters and accepts exactly 280', async () => {
    const tooLong = save({ instagramHandle: null, bio: 'x'.repeat(281) });
    await expect(tooLong.done).rejects.toThrow();
    expect(tooLong.calls).toEqual([]);

    const exact = save({ instagramHandle: null, bio: 'x'.repeat(280) });
    await expect(exact.done).resolves.toBeUndefined();
  });

  it('stores a trimmed handle and turns blanks into null', async () => {
    const filled = save({ instagramHandle: ' foodcnl ', bio: ' Hojicha first. ' });
    await filled.done;
    expect(filled.calls.find((c) => c.method === 'update')?.args[0]).toEqual({
      instagram_handle: 'foodcnl',
      bio: 'Hojicha first.',
    });

    const blank = save({ instagramHandle: '  ', bio: '' });
    await blank.done;
    expect(blank.calls.find((c) => c.method === 'update')?.args[0]).toEqual({
      instagram_handle: null,
      bio: null,
    });
  });

  it('throws when the save is refused', async () => {
    const error = new Error('denied');
    const { client } = createFakeSupabase({ profiles: { data: null, error } });
    await expect(
      updateProfileDetails(client, 'u1', { instagramHandle: 'ok', bio: null })
    ).rejects.toBe(error);
  });
});
