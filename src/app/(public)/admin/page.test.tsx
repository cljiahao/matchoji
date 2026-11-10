import { beforeEach, describe, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
);
vi.mock('next/navigation', () => ({ notFound }));
vi.mock('next/server', () => ({ connection: async () => undefined }));
const session = vi.hoisted(() => ({ user: null as { id: string } | null, admin: false }));
vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: session.user } }) } }),
}));
const admin = vi.hoisted(() => ({ isAdmin: vi.fn(), listCafeQueue: vi.fn() }));
vi.mock('@/features/admin', () => ({ ...admin }));
vi.mock('@/features/shops', () => ({ listShops: vi.fn() }));

import AdminPage, { generateMetadata } from './page';

beforeEach(() => {
  vi.clearAllMocks();
  session.user = null;
});

describe('admin page', () => {
  it('404s for a signed-out visitor, title included', async () => {
    await expect(AdminPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect((await generateMetadata()).title).toBe('Not found');
    expect(admin.isAdmin).not.toHaveBeenCalled();
  });

  it('404s for a signed-in non-admin without loading any queue', async () => {
    session.user = { id: 'u1' };
    admin.isAdmin.mockResolvedValue(false);
    await expect(AdminPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect((await generateMetadata()).title).toBe('Not found');
    expect(admin.listCafeQueue).not.toHaveBeenCalled();
  });
});
