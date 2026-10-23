// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/journal' }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { TastingActions } from './tasting-actions';

const entry = {
  id: 'r1',
  productId: 'p1',
  reviewerName: '',
  authorId: 'user-1',
  stars: 4,
  notes: 'Nutty',
  photoUrl: null,
  createdAt: '2026-10-01T00:00:00Z',
  flavorNotes: ['nutty'],
  profile: { body: 3 },
  prep: { method: null, doseG: null, waterMl: null, waterTempC: null },
  tastedOn: '2026-10-01',
  edition: { harvestYear: null, flush: null },
  product: { id: 'p1', name: 'Kyoto Bancha', brand: null, category: 'hojicha' as const },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TastingActions', () => {
  it('edits a tasting in a prefilled form', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TastingActions entry={entry} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit your tasting of Kyoto Bancha' })
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Tasting notes (optional)')).toHaveValue('Nutty');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Tasting updated.'));
    expect(fake.calls.find((c) => c.method === 'update')?.args[0]).toMatchObject({
      stars: 4,
      notes: 'Nutty',
      body: 3,
      tasted_on: '2026-10-01',
    });
  });

  it('deletes a tasting only after confirming', async () => {
    const fake = createFakeBrowserClient({ results: { reviews: { data: null, error: null } } });
    supabase.current = fake.client;
    renderWithQuery(<TastingActions entry={entry} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete your tasting of Kyoto Bancha' })
    );
    expect(fake.calls.some((c) => c.method === 'delete')).toBe(false);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete tasting' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fake.calls).toContainEqual({ table: 'reviews', method: 'eq', args: ['id', 'r1'] });
  });
});
