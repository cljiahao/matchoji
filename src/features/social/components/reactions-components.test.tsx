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
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SignInPromptProvider } from '@/features/auth';

import { NotificationBell } from './notification-bell';
import { ReviewReactions } from './review-reactions';

const initial = {
  likes: 1,
  liked: false,
  comments: [
    { id: 'c1', reviewId: 'r1', body: 'Agreed', authorId: 'u3', authorName: 'Cho', createdAt: 'x' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReviewReactions', () => {
  it('likes, comments, and reports for a signed-in reader', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: {
        review_likes: { data: null, error: null },
        review_comments: {
          data: { id: 'c2', review_id: 'r1', user_id: 'user-1', body: 'Me too', created_at: 'y' },
          error: null,
        },
        content_reports: { data: null, error: null },
      },
    });
    supabase.current = fake.client;
    renderWithQuery(<ReviewReactions reviewId="r1" reviewAuthorId="u2" initial={initial} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Like (1)' }));
    expect(screen.getByRole('button', { name: 'Like (2)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await userEvent.click(screen.getByRole('button', { name: '1 comment' }));
    expect(screen.getByRole('link', { name: 'Cho' })).toHaveAttribute('href', '/u/u3');
    await userEvent.type(screen.getByLabelText('Your comment'), 'Me too');
    await userEvent.click(screen.getByRole('button', { name: 'Post comment' }));
    expect(await screen.findByText('Me too')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Report' })[0]);
    await userEvent.type(screen.getByLabelText('What is wrong with this review?'), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Thanks. We will look at it and let you know.')
    );
  });

  it('rolls a failed like back', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: { review_likes: { data: null, error: new Error('rls') } },
    });
    supabase.current = fake.client;
    renderWithQuery(<ReviewReactions reviewId="r1" reviewAuthorId="u2" initial={initial} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Like (1)' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not update your like.'));
    expect(screen.getByRole('button', { name: 'Like (1)' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('asks a visitor to sign in before liking', async () => {
    supabase.current = createFakeBrowserClient({}).client;
    renderWithQuery(
      <SignInPromptProvider>
        <ReviewReactions reviewId="r1" reviewAuthorId="u2" initial={initial} />
      </SignInPromptProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Like (1)' }));
    expect(await screen.findByText('Sign in to like tastings.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report' })).not.toBeInTheDocument();
  });
});

describe('NotificationBell', () => {
  it('shows the unread count and marks them read when opened', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: {
        notifications: [
          {
            data: [
              {
                id: 1,
                kind: 'follow',
                actor_id: 'u2',
                review_id: null,
                product_id: null,
                body: null,
                read_at: null,
                created_at: 'x',
              },
            ],
            error: null,
          },
          { data: null, error: null },
          // The refetch after marking them read.
          {
            data: [
              {
                id: 1,
                kind: 'follow',
                actor_id: 'u2',
                review_id: null,
                product_id: null,
                body: null,
                read_at: 'now',
                created_at: 'x',
              },
            ],
            error: null,
          },
        ],
        public_profiles: { data: [{ id: 'u2', display_name: 'Ben' }], error: null },
      },
    });
    supabase.current = fake.client;
    renderWithQuery(<NotificationBell />);

    await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 1 unread' }));
    expect(
      await screen.findByRole('menuitem', { name: 'Ben started following you.' })
    ).toHaveAttribute('href', '/u/u2');
    await waitFor(() =>
      expect(fake.calls).toContainEqual({
        table: 'notifications',
        method: 'is',
        args: ['read_at', null],
      })
    );
  });

  it('renders nothing for a visitor', async () => {
    supabase.current = createFakeBrowserClient({}).client;
    const { container } = renderWithQuery(<NotificationBell />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
