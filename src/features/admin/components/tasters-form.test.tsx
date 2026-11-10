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

import { TastersForm } from './tasters-form';

const ID = '11111111-1111-4111-8111-111111111111';
const found = { id: ID, display_name: 'Aiko', is_public: false, is_trusted_taster: false };

function setup(results: Parameters<typeof createFakeSupabase>[0], tasters = [] as never[]) {
  const fake = createFakeSupabase(results);
  supabase.current = fake.client;
  renderWithQuery(<TastersForm tasters={tasters} />);
  return fake;
}

beforeEach(() => vi.clearAllMocks());

describe('TastersForm', () => {
  it('tasters form grants badge', async () => {
    const { calls } = setup({
      public_profiles: { data: [found], error: null },
      'rpc:set_trusted_taster': { data: null, error: null },
    });

    await userEvent.type(screen.getByLabelText('Search people by display name'), 'aik');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText(/private profile/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Grant badge/ }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(calls.find((c) => c.table === 'rpc:set_trusted_taster')?.args).toEqual([
      { person: ID, value: true },
    ]);
    expect(toast.success).toHaveBeenCalled();
  });

  it('revokes from the current tasters list and shows a refusal', async () => {
    const taster = { id: ID, displayName: 'Aiko', isPublic: true, isTrustedTaster: true };
    const { calls } = setup(
      { 'rpc:set_trusted_taster': { data: null, error: { message: 'Admins only.' } } },
      [taster] as never[]
    );

    await userEvent.click(screen.getByRole('button', { name: /Revoke badge/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Admins only.'));
    expect(calls[0].args).toEqual([{ person: ID, value: false }]);
  });

  it('says so when nobody matches, and when there are no tasters', async () => {
    setup({ public_profiles: { data: [], error: null } });
    expect(screen.getByText('No one has the badge yet.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search people by display name'), 'zzz');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('No one by that name.')).toBeInTheDocument();
  });
});
