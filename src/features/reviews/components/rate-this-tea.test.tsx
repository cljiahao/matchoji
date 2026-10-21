// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { makeReview, renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/products/p1' }));

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SignInPromptProvider } from '@/features/auth';

import { summarizeReviews } from '../lib/summarize-reviews';
import { CommunityReviews } from './community-reviews';
import { RateThisTea } from './rate-this-tea';

const PRODUCT = { id: 'p1', name: 'Uji Ceremonial', brand: null, category: 'matcha' as const };

// Lets the fake getSession() resolve, so a tap isn't swallowed as "session still loading".
const sessionResolved = () => act(async () => {});

function setup(options: Parameters<typeof createFakeBrowserClient>[0] = {}) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  renderWithQuery(
    <SignInPromptProvider>
      <RateThisTea product={PRODUCT} />
    </SignInPromptProvider>
  );
  return fake;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RateThisTea', () => {
  it('offers five labelled star buttons', () => {
    setup();
    const group = screen.getByRole('group', { name: 'Rate Uji Ceremonial' });
    expect(within(group).getAllByRole('button')).toHaveLength(5);
    expect(within(group).getByRole('button', { name: 'Rate 1 star' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Rate 5 stars' })).toBeInTheDocument();
  });

  it('lights stars up to the one hovered and clears on leave', () => {
    setup();
    const group = screen.getByRole('group', { name: 'Rate Uji Ceremonial' });
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Rate 3 stars' }));
    expect(group.querySelectorAll('svg.fill-matcha')).toHaveLength(3);
    fireEvent.mouseLeave(group);
    expect(group.querySelectorAll('svg.fill-matcha')).toHaveLength(0);

    fireEvent.focus(screen.getByRole('button', { name: 'Rate 2 stars' }));
    expect(group.querySelectorAll('svg.fill-matcha')).toHaveLength(2);
    fireEvent.blur(screen.getByRole('button', { name: 'Rate 2 stars' }));
    expect(group.querySelectorAll('svg.fill-matcha')).toHaveLength(0);
  });

  it('signed out asks for sign-in back to the rating section', async () => {
    const { auth } = setup();

    await sessionResolved();
    await userEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));

    const prompt = await screen.findByRole('dialog', { name: 'Join Matchoji' });
    expect(within(prompt).getByText('Sign in to rate Uji Ceremonial.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Rate Uji Ceremonial' })).not.toBeInTheDocument();

    await userEvent.click(within(prompt).getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalled());
    const next = new URL(auth.signInWithOAuth.mock.calls[0][0].options.redirectTo).searchParams;
    expect(next.get('next')).toBe('/products/p1#rate');
  });

  it('ignores a tap while the session is still loading', async () => {
    const fake = createFakeBrowserClient({ session: makeSession() });
    fake.auth.getSession.mockImplementationOnce(() => new Promise(() => {}));
    supabase.current = fake.client;
    renderWithQuery(
      <SignInPromptProvider>
        <RateThisTea product={PRODUCT} />
      </SignInPromptProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('signed in opens the rating form with the tapped star set, and closes once logged', async () => {
    const { calls } = setup({
      session: makeSession(),
      results: { reviews: { data: null, error: null } },
    });

    await sessionResolved();
    await userEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rate Uji Ceremonial' });
    expect(within(dialog).getByRole('radio', { name: '4 stars' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({ stars: 4 });
  });

  it('closes the form dialog on Escape', async () => {
    setup({ session: makeSession() });

    await sessionResolved();
    await userEvent.click(screen.getByRole('button', { name: 'Rate 2 stars' }));
    expect(await screen.findByRole('dialog', { name: 'Rate Uji Ceremonial' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('CommunityReviews', () => {
  function renderReviews(reviews: ReturnType<typeof makeReview>[], avgStars: number | null) {
    supabase.current = createFakeBrowserClient().client;
    return renderWithQuery(
      <CommunityReviews
        product={PRODUCT}
        avgStars={avgStars}
        reviews={reviews}
        summary={summarizeReviews(reviews)}
      />
    );
  }

  it('lists reviews beside the score, its spread and the rate action', () => {
    const { container } = renderReviews(
      [
        makeReview({ id: 'r1', stars: 5, reviewerName: 'aiko' }),
        makeReview({ id: 'r2', stars: 4, reviewerName: 'ben' }),
      ],
      4.5
    );

    expect(container.querySelector('section#rate')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Community reviews' })).toBeInTheDocument();
    expect(screen.getByText('aiko')).toBeInTheDocument();
    expect(screen.getByText('ben')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('2 ratings')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Rating distribution' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add your rating' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Rate Uji Ceremonial' })).toBeInTheDocument();
  });

  it('uses the singular for one rating', () => {
    renderReviews([makeReview({ stars: 3 })], 3);
    expect(screen.getByText('1 rating')).toBeInTheDocument();
  });

  it('shows only the invitation and the rate action without reviews', () => {
    renderReviews([], null);
    expect(screen.getByText('No reviews yet. Be the first to rate it.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Rating distribution' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Rate Uji Ceremonial' })).toBeInTheDocument();
  });
});
