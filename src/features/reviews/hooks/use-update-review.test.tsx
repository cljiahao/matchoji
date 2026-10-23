// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

import { useUpdateReview } from './use-update-review.mutation';

const OLD = 'https://cdn.test/storage/v1/object/public/review-photos/user-1/old.jpg';
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const input = (photo: File | null) => ({
  reviewId: 'r1',
  userId: 'user-1',
  currentPhotoUrl: OLD,
  photo,
  stars: 5,
});

describe('useUpdateReview', () => {
  it('keeps the current photo when no new one is chosen', async () => {
    const fake = createFakeBrowserClient({ results: { reviews: { data: null, error: null } } });
    supabase.current = fake.client;
    const { result } = renderHook(() => useUpdateReview(), { wrapper });

    await result.current.mutateAsync(input(null));

    expect(fake.calls.find((c) => c.method === 'update')?.args[0]).toMatchObject({
      photo_url: OLD,
    });
    expect(fake.upload).not.toHaveBeenCalled();
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it('replaces the photo and removes the old file', async () => {
    const fake = createFakeBrowserClient({ results: { reviews: { data: null, error: null } } });
    supabase.current = fake.client;
    const { result } = renderHook(() => useUpdateReview(), { wrapper });

    await result.current.mutateAsync(input(new File(['x'], 'new.png', { type: 'image/png' })));

    const uploaded = fake.upload.mock.calls[0][0];
    expect(fake.calls.find((c) => c.method === 'update')?.args[0]).toMatchObject({
      photo_url: `https://cdn.test/${uploaded}`,
    });
    expect(fake.remove).toHaveBeenCalledWith(['user-1/old.jpg']);
  });

  it('removes the new upload, not the old photo, when saving fails', async () => {
    const error = new Error('rls');
    const fake = createFakeBrowserClient({ results: { reviews: { data: null, error } } });
    supabase.current = fake.client;
    const { result } = renderHook(() => useUpdateReview(), { wrapper });

    await expect(
      result.current.mutateAsync(input(new File(['x'], 'new.png', { type: 'image/png' })))
    ).rejects.toBe(error);

    expect(fake.remove).toHaveBeenCalledWith([fake.upload.mock.calls[0][0]]);
    expect(fake.remove).not.toHaveBeenCalledWith(['user-1/old.jpg']);
  });
});
