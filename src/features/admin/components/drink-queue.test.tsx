// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), message: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { DrinkQueue } from './drink-queue';

const ID = '11111111-1111-4111-8111-111111111111';
const KEEP = '22222222-2222-4222-8222-222222222222';
const drink = {
  id: ID,
  cafeId: 'c1',
  cafeName: 'Kopi Hou',
  name: 'Hojicha latte',
  base: 'hojicha' as const,
  style: 'iced_latte' as const,
  serving: 'iced' as const,
  price: null,
  photoUrl: null,
  photoCredit: null,
  teaProductId: null,
  status: 'pending' as const,
  createdAt: '2026-11-10T00:00:00Z',
  addedByName: null,
};
const approved = [{ ...drink, id: KEEP, name: 'Hojicha latte (hot)', status: 'approved' as const }];

function setup(results: Parameters<typeof createFakeSupabase>[0]) {
  const fake = createFakeSupabase(results);
  supabase.current = fake.client;
  renderWithQuery(<DrinkQueue drinks={[drink]} approved={approved} />);
  return fake;
}

beforeEach(() => vi.clearAllMocks());

describe('DrinkQueue', () => {
  it('shows the café and style, and approves through review_drink', async () => {
    const { calls } = setup({ 'rpc:review_drink': { data: null, error: null } });
    expect(screen.getByText(/at Kopi Hou/)).toBeInTheDocument();
    expect(screen.getByText('hojicha · iced latte · iced')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Approve Hojicha latte' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(calls[0].args).toEqual([{ drink: ID, decision: 'approved', note: undefined }]);
  });

  it('shows the refusal for a drink at an unapproved café', async () => {
    setup({
      'rpc:review_drink': { data: null, error: { message: 'Approve the café first.' } },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Approve Hojicha latte' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Approve the café first.'));
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('merges into an approved duplicate', async () => {
    const { calls } = setup({ 'rpc:merge_drink': { data: null, error: null } });
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Drink that Hojicha latte duplicates' })
    );
    await userEvent.click(await screen.findByRole('option', { name: /hot/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Merge' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(calls[0].args).toEqual([{ duplicate: ID, keep: KEEP }]);
  });
});
