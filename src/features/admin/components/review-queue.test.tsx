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
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { ReviewQueueList } from './review-queue';

const tea = {
  id: 't1',
  name: 'Hoshi',
  brand: 'Farm',
  category: 'matcha' as const,
  grade: null,
  createdAt: '2026-10-24T00:00:00Z',
  addedByName: 'Aiko',
};
const catalogue = [{ id: 'keep', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' as const }];

function setup(results: Parameters<typeof createFakeSupabase>[0]) {
  const fake = createFakeSupabase(results);
  supabase.current = fake.client;
  renderWithQuery(<ReviewQueueList teas={[tea]} shops={[]} catalogue={catalogue} />);
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReviewQueueList', () => {
  it('approves a tea in one tap', async () => {
    const { calls } = setup({ 'rpc:review_tea': { data: null, error: null } });
    expect(screen.getByText(/by Aiko/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Approve Hoshi' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(calls[0]).toMatchObject({
      method: 'rpc',
      args: [{ tea: 't1', decision: 'approved', note: undefined }],
    });
  });

  it('asks for a reason before rejecting', async () => {
    const { calls } = setup({ 'rpc:review_tea': { data: null, error: null } });

    await userEvent.click(screen.getByRole('button', { name: 'Reject…' }));
    const reject = screen.getByRole('button', { name: 'Reject Hoshi' });
    expect(reject).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Reason for rejecting Hoshi'), 'Not a tea');
    await userEvent.click(reject);

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(calls[0].args).toEqual([{ tea: 't1', decision: 'rejected', note: 'Not a tea' }]);
  });

  it('merges a duplicate into the picked tea and reports a refusal', async () => {
    const error = new Error('Merge into an approved tea.');
    const { calls } = setup({ 'rpc:merge_tea': { data: null, error } });

    const merge = screen.getByRole('button', { name: 'Merge' });
    expect(merge).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Tea that Hoshi duplicates'), 'keep');
    await userEvent.click(merge);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Merge into an approved tea.'));
    expect(calls[0].args).toEqual([{ duplicate: 't1', keep: 'keep' }]);
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('reviews a shop application, and cancels a half-written rejection', async () => {
    const fake = createFakeSupabase({ 'rpc:review_vendor': { data: null, error: null } });
    supabase.current = fake.client;
    renderWithQuery(
      <ReviewQueueList
        teas={[]}
        shops={[
          {
            id: 'v1',
            name: 'Leaf',
            country: 'JP',
            shipsTo: ['SG', 'MY'],
            website: 'https://leaf.example',
            profileInfo: 'Family farm in Uji.',
            createdAt: '2026-10-24T00:00:00Z',
          },
        ]}
        catalogue={catalogue}
      />
    );

    expect(screen.getByRole('heading', { name: 'Teas awaiting review (0)' })).toBeInTheDocument();
    expect(screen.getByText(/Ships from JP to SG, MY/)).toBeInTheDocument();
    expect(screen.getByText('Family farm in Uji.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reject…' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Approve Leaf' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Leaf can now list teas.'));
    expect(fake.calls[0].args).toEqual([{ vendor: 'v1', decision: 'approved', note: undefined }]);
  });
});
