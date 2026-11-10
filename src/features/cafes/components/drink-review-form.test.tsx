// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/',
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { DrinkReviewForm } from './drink-review-form';

const DRINK = { id: 'd1', name: 'Hojicha latte', base: 'hojicha' as const };

function setup(isTaster: boolean, session: ReturnType<typeof makeSession> | null = makeSession()) {
  const fake = createFakeBrowserClient({
    session,
    results: { reviews: { data: null, error: null } },
  });
  supabase.current = fake.client;
  renderWithQuery(<DrinkReviewForm drink={DRINK} isTaster={isTaster} />);
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DrinkReviewForm', () => {
  it('asks a trusted taster for the post link and disclosure, with none preselected', async () => {
    const { calls } = setup(true);

    expect(screen.getAllByRole('radio', { name: /drink|Invited|Paid|No —/ })).toHaveLength(4);
    for (const radio of screen.getAllByRole('radio', { name: /Gifted|Invited|Paid|No —/ })) {
      expect(radio).not.toBeChecked();
    }

    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    expect(await screen.findByText('Add the link to your Instagram post')).toBeInTheDocument();
    expect(screen.getByText('Say whether this was gifted, paid or invited')).toBeInTheDocument();
    expect(calls.some((c) => c.table === 'reviews' && c.method === 'insert')).toBe(false);

    await userEvent.type(
      screen.getByLabelText('Post or reel link'),
      'https://www.instagram.com/p/abc123/'
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Gifted drink' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Rating saved.'));
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      drink_id: 'd1',
      instagram_url: 'https://www.instagram.com/p/abc123/',
      disclosure: 'gifted',
    });
  });

  it('shows community members no Instagram or disclosure fields', async () => {
    const { calls } = setup(false);

    expect(screen.queryByLabelText('Post or reel link')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Gifted drink' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      instagram_url: null,
      disclosure: 'none',
    });
  });

  it('offers roast for hojicha only', () => {
    setup(false);
    expect(screen.getByRole('radio', { name: 'Roast 3 of 5' })).toBeInTheDocument();
  });

  it('keeps the answers and says so when saving fails', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: { reviews: { data: null, error: new Error('boom') } },
    });
    supabase.current = fake.client;
    renderWithQuery(<DrinkReviewForm drink={DRINK} isTaster={false} />);

    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not save that rating. Your answers are still here — try again.'
      )
    );
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked();
  });
});
