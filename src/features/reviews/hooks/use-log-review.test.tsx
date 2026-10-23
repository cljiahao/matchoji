// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

import { useLogReview } from './use-log-review.mutation';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

describe('useLogReview', () => {
  it('removes the uploaded photo when the review cannot be saved', async () => {
    const error = new Error('rls');
    const fake = createFakeBrowserClient({ results: { reviews: { data: null, error } } });
    supabase.current = fake.client;
    const { result } = renderHook(() => useLogReview(), { wrapper });

    await expect(
      result.current.mutateAsync({
        productId: 'p1',
        userId: 'user-1',
        stars: 4,
        photo: new File(['x'], 'cup.png', { type: 'image/png' }),
      })
    ).rejects.toBe(error);

    const uploaded = fake.upload.mock.calls[0][0] as string;
    expect(fake.remove).toHaveBeenCalledWith([uploaded]);
  });

  it('keeps the photo when the review saves', async () => {
    const fake = createFakeBrowserClient({ results: { reviews: { data: null, error: null } } });
    supabase.current = fake.client;
    const { result } = renderHook(() => useLogReview(), { wrapper });

    await result.current.mutateAsync({
      productId: 'p1',
      userId: 'user-1',
      stars: 4,
      photo: new File(['x'], 'cup.png', { type: 'image/png' }),
    });

    expect(fake.remove).not.toHaveBeenCalled();
  });
});
