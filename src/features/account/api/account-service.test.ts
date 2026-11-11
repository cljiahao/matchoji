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

const OK = { data: [], error: null };
// Every table the export reads, empty; a test overrides the one it cares about.
function exportResults(overrides: Record<string, { data: unknown; error: unknown }> = {}) {
  return {
    profiles: { data: null, error: null },
    reviews: OK,
    wishlist: OK,
    stock_reports: OK,
    vendors: { data: null, error: null },
    review_likes: OK,
    review_comments: OK,
    follows: OK,
    blocks: OK,
    lesson_progress: OK,
    content_reports: OK,
    notifications: OK,
    label_scans: OK,
    products: OK,
    my_cafes: OK,
    my_drinks: OK,
    ...overrides,
  };
}

describe('exportMyData', () => {
  it('gathers the profile, tastings, want-to-try, stock reports and shop', async () => {
    const { client } = createFakeSupabase(
      exportResults({
        profiles: { data: { email: 'a@example.com' }, error: null },
        reviews: { data: [{ id: 'r1' }], error: null },
      })
    );
    expect(await exportMyData(client, 'u1')).toMatchObject({
      profile: { email: 'a@example.com' },
      tastings: [{ id: 'r1' }],
      wantToTry: [],
      shop: null,
    });
  });

  it('includes everything the person owns: likes, comments, follows and the rest', async () => {
    const { client, calls } = createFakeSupabase(
      exportResults({
        review_likes: { data: [{ review_id: 'r9' }], error: null },
        review_comments: { data: [{ id: 'k1', body: 'Lovely' }], error: null },
        follows: { data: [{ followee_id: 'u2' }], error: null },
        blocks: { data: [{ blocked_id: 'u3' }], error: null },
        lesson_progress: { data: [{ lesson_slug: 'l1' }], error: null },
        content_reports: { data: [{ id: 'cr1' }], error: null },
        notifications: { data: [{ id: 1 }], error: null },
        label_scans: { data: [{ id: 's1' }], error: null },
      })
    );
    expect(await exportMyData(client, 'u1')).toMatchObject({
      likes: [{ review_id: 'r9' }],
      comments: [{ id: 'k1' }],
      following: [{ followee_id: 'u2' }],
      blocked: [{ blocked_id: 'u3' }],
      lessonProgress: [{ lesson_slug: 'l1' }],
      reportsFiled: [{ id: 'cr1' }],
      notifications: [{ id: 1 }],
      labelScans: [{ id: 's1' }],
    });
    const eqOn = (table: string) => calls.find((c) => c.table === table && c.method === 'eq')?.args;
    expect(eqOn('review_likes')).toEqual(['user_id', 'u1']);
    expect(eqOn('follows')).toEqual(['follower_id', 'u1']);
    expect(eqOn('blocks')).toEqual(['blocker_id', 'u1']);
    expect(eqOn('content_reports')).toEqual(['reporter_id', 'u1']);
  });

  it('includes the teas the person submitted', async () => {
    const { client, calls } = createFakeSupabase(
      exportResults({ products: { data: [{ id: 'p1', name: 'Uji Hojicha' }], error: null } })
    );
    expect(await exportMyData(client, 'u1')).toMatchObject({ teasAdded: [{ id: 'p1' }] });
    expect(calls.find((c) => c.table === 'products' && c.method === 'eq')?.args).toEqual([
      'added_by',
      'u1',
    ]);
  });

  it('throws when one of the new tables cannot be read', async () => {
    const error = new Error('likes down');
    const { client } = createFakeSupabase(exportResults({ review_likes: { data: null, error } }));
    await expect(exportMyData(client, 'u1')).rejects.toBe(error);
  });

  it('export includes cafés and drinks added by me, read from the my_* views', async () => {
    const { client, calls } = createFakeSupabase(
      exportResults({
        my_cafes: { data: [{ id: 'c1', name: 'Kurasu' }], error: null },
        my_drinks: { data: [{ id: 'd1', name: 'Hojicha Latte' }], error: null },
      })
    );
    expect(await exportMyData(client, 'u1')).toMatchObject({
      cafesAdded: [{ id: 'c1' }],
      drinksAdded: [{ id: 'd1' }],
    });
    expect(calls.some((c) => c.table === 'cafes' || c.table === 'drinks')).toBe(false);
  });

  it('exports empty café lists before the café migration is applied', async () => {
    const missing = { data: null, error: { code: 'PGRST205', message: 'missing' } };
    const { client } = createFakeSupabase(exportResults({ my_cafes: missing, my_drinks: missing }));
    expect(await exportMyData(client, 'u1')).toMatchObject({ cafesAdded: [], drinksAdded: [] });
  });

  it('throws other café read errors', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase(exportResults({ my_cafes: { data: null, error } }));
    await expect(exportMyData(client, 'u1')).rejects.toBe(error);
  });
});

// The browser fake adds auth and storage to the query fake; typed as the real client here.
const asClient = (client: unknown) => client as Parameters<typeof deleteMyAccount>[0];

describe('deleteMyAccount', () => {
  it('deletes the account first, then removes the photos, then signs out', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: null } },
    });
    fake.list.mockResolvedValueOnce({ data: [{ name: 'a.jpg' }, { name: 'b.png' }], error: null });
    // Whether the delete had already been sent when the files were removed.
    let rpcSentFirst = false;
    fake.remove.mockImplementationOnce(async () => {
      rpcSentFirst = fake.calls.some((c) => c.method === 'rpc');
      return { data: [], error: null };
    });

    const result = await deleteMyAccount(asClient(fake.client), 'u1');

    expect(rpcSentFirst).toBe(true);
    expect(fake.list).toHaveBeenCalledWith('u1', { limit: 1000 });
    expect(fake.remove).toHaveBeenCalledWith(['u1/a.jpg', 'u1/b.png']);
    expect(fake.auth.signOut).toHaveBeenCalled();
    expect(result).toEqual({ photosRemoved: true });
  });

  it('keeps the photos and throws when the delete fails', async () => {
    const error = new Error('rpc down');
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error } },
    });
    fake.list.mockResolvedValueOnce({ data: [{ name: 'a.jpg' }], error: null });

    await expect(deleteMyAccount(asClient(fake.client), 'u1')).rejects.toBe(error);
    expect(fake.remove).not.toHaveBeenCalled();
    expect(fake.auth.signOut).not.toHaveBeenCalled();
  });

  it('still succeeds, and says so, when the photos cannot be removed afterwards', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: null } },
    });
    fake.list.mockResolvedValueOnce({ data: [{ name: 'a.jpg' }], error: null });
    fake.remove.mockResolvedValueOnce({ data: [], error: new Error('storage down') } as never);

    expect(await deleteMyAccount(asClient(fake.client), 'u1')).toEqual({ photosRemoved: false });
    expect(fake.auth.signOut).toHaveBeenCalled();
  });

  it('still deletes the account when the photos cannot be listed', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:delete_my_account': { data: null, error: null } },
    });
    fake.list.mockResolvedValueOnce({ data: [], error: new Error('storage down') });

    expect(await deleteMyAccount(asClient(fake.client), 'u1')).toEqual({ photosRemoved: false });
    expect(fake.remove).not.toHaveBeenCalled();
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
