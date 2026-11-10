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

import { CafeQueue } from './cafe-queue';

const ID = '11111111-1111-4111-8111-111111111111';
const KEEP = '22222222-2222-4222-8222-222222222222';
const cafe = {
  id: ID,
  name: 'Kopi Hou',
  citySlug: 'singapore',
  area: 'Tiong Bahru',
  address: null,
  lat: null,
  lng: null,
  instagramHandle: null,
  websiteUrl: null,
  status: 'pending' as const,
  createdAt: '2026-11-10T00:00:00Z',
  addedByName: 'Aiko',
};
const approved = [{ ...cafe, id: KEEP, name: 'Kopi Hou Original', status: 'approved' as const }];

function setup(results: Parameters<typeof createFakeSupabase>[0]) {
  const fake = createFakeSupabase(results);
  supabase.current = fake.client;
  renderWithQuery(<CafeQueue cafes={[cafe]} approved={approved} />);
  return fake;
}

beforeEach(() => vi.clearAllMocks());

describe('CafeQueue', () => {
  it('cafe queue approve button calls reviewCafe', async () => {
    const { calls } = setup({ 'rpc:review_cafe': { data: null, error: null } });
    expect(screen.getByText(/by Aiko/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Approve Kopi Hou' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(calls[0].args).toEqual([{ cafe: ID, decision: 'approved', note: undefined }]);
  });

  it('rejects with a note', async () => {
    const { calls } = setup({ 'rpc:review_cafe': { data: null, error: null } });
    await userEvent.click(screen.getByRole('button', { name: 'Reject…' }));
    await userEvent.type(screen.getByLabelText('Reason for rejecting Kopi Hou'), 'Closed down');
    await userEvent.click(screen.getByRole('button', { name: 'Reject Kopi Hou' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(calls[0].args).toEqual([{ cafe: ID, decision: 'rejected', note: 'Closed down' }]);
  });

  it('merges into an approved café and shows the database refusal', async () => {
    const error = { message: 'Cannot merge cafés in different cities.' };
    const { calls } = setup({ 'rpc:merge_cafe': { data: null, error } });
    const merge = screen.getByRole('button', { name: 'Merge' });
    expect(merge).toBeDisabled();

    await userEvent.click(screen.getByRole('combobox', { name: 'Café that Kopi Hou duplicates' }));
    await userEvent.click(await screen.findByRole('option', { name: /Kopi Hou Original/ }));
    await userEvent.click(merge);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Cannot merge cafés in different cities.')
    );
    expect(calls[0].args).toEqual([{ duplicate: ID, keep: KEEP }]);
  });

  it('says so when nothing is waiting', () => {
    supabase.current = createFakeSupabase({}).client;
    renderWithQuery(<CafeQueue cafes={[]} approved={[]} />);
    expect(screen.getByText('Nothing to review.')).toBeInTheDocument();
  });
});
