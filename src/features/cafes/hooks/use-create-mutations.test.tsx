// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mutations = vi.hoisted(() => ({
  createCafe: vi.fn(async () => ({})),
  createDrink: vi.fn(async () => ({})),
}));
vi.mock('../api/cafes-mutations', () => mutations);
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => ({}) }));

import { useCreateCafe } from './use-create-cafe.mutation';
import { useCreateDrink } from './use-create-drink.mutation';

function setup<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { ...renderHook(hook, { wrapper }), invalidate };
}

describe('create mutations refresh the cached searches', () => {
  it('a new café drops the cafe-search cache', async () => {
    const { result, invalidate } = setup(useCreateCafe);
    result.current.mutate({ name: 'Kopi', citySlug: 'singapore' });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cafe-search'] }));
  });

  it('a new drink drops the cafe-search and drink-search caches', async () => {
    const { result, invalidate } = setup(useCreateDrink);
    result.current.mutate({
      cafeId: 'c1',
      name: 'Latte',
      base: 'hojicha',
      style: 'latte',
      serving: 'hot',
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cafe-search'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['drink-search'] });
  });
});
