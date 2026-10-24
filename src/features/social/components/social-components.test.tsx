// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/u/u2' }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SignInPromptProvider } from '@/features/auth';

import { BlockButton } from './block-button';
import { FollowButton } from './follow-button';
import { BlockedList, PrivacyToggle } from './privacy-and-blocks';
import { TastingFeed } from './tasting-feed';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FollowButton', () => {
  it('follows straight away and rolls back if the database refuses', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: {
        follows: [
          { data: null, error: null },
          { data: null, error: new Error('rls') },
        ],
      },
    });
    supabase.current = fake.client;
    renderWithQuery(<FollowButton profileId="u2" name="Ben" following={false} />);

    const button = await screen.findByRole('button', { name: 'Follow' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Following' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Following' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not unfollow Ben.'));
    expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument();
  });

  it('asks a visitor to sign in', async () => {
    supabase.current = createFakeBrowserClient({}).client;
    renderWithQuery(
      <SignInPromptProvider>
        <FollowButton profileId="u2" name="Ben" following={false} />
      </SignInPromptProvider>
    );
    const button = await screen.findByRole('button', { name: 'Follow' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(await screen.findByText('Sign in to follow Ben.')).toBeInTheDocument();
  });
});

describe('BlockButton', () => {
  it('blocks for a signed-in viewer and is hidden from visitors', async () => {
    const fake = createFakeBrowserClient({
      session: makeSession(),
      results: { blocks: { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<BlockButton profileId="u2" name="Ben" blocked={false} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Block Ben' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ben blocked.'));

    supabase.current = createFakeBrowserClient({}).client;
    const { container } = renderWithQuery(
      <BlockButton profileId="u2" name="Ben" blocked={false} />
    );
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe('PrivacyToggle and BlockedList', () => {
  it('switches the profile private and unblocks people', async () => {
    const fake = createFakeBrowserClient({
      results: { profiles: { data: null, error: null }, blocks: { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(
      <>
        <PrivacyToggle userId="me" isPublic />
        <BlockedList userId="me" blocked={[{ id: 'u9', name: 'Spammy' }]} />
      </>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Make my profile private' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Your profile is now private.'));
    await userEvent.click(screen.getByRole('button', { name: 'Unblock' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Spammy unblocked.'));
  });

  it('says when nobody is blocked', () => {
    render(<BlockedList userId="me" blocked={[]} />);
    expect(screen.getByText(/haven.t blocked anyone/)).toBeInTheDocument();
  });
});

describe('TastingFeed', () => {
  it('links the author and the tea, and leaves the author out on a profile', () => {
    const tasting = {
      id: 'r1',
      productId: 'p1',
      reviewerName: 'Ben',
      authorId: 'u2',
      stars: 5,
      notes: null,
      photoUrl: null,
      createdAt: '2026-10-05T00:00:00Z',
      flavorNotes: [],
      profile: {},
      prep: { method: null, doseG: null, waterMl: null, waterTempC: null },
      tastedOn: '2026-10-05',
      product: { id: 'p1', name: 'Sayaka', brand: null, category: 'matcha' as const },
    };
    const { rerender } = render(<TastingFeed tastings={[tasting]} />);
    expect(screen.getByRole('link', { name: 'Ben' })).toHaveAttribute('href', '/u/u2');
    expect(screen.getByRole('link', { name: 'Sayaka' })).toHaveAttribute('href', '/products/p1');
    rerender(<TastingFeed tastings={[tasting]} showAuthor={false} />);
    expect(screen.queryByRole('link', { name: 'Ben' })).not.toBeInTheDocument();
    expect(screen.getByText('Rated')).toBeInTheDocument();
  });
});
