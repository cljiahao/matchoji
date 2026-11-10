// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/',
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/features/label-scan/lib/downscale-image', () => ({
  downscaleImage: async (file: File) => file,
}));

import { SignInPromptProvider } from '@/features/auth';
import type { DrinkListing } from '@/features/cafes';

import { LogDialog } from './log-dialog';

const DRINK: DrinkListing = {
  id: 'd1',
  cafeId: 'c1',
  slug: 'hojicha-latte',
  name: 'Hojicha latte',
  base: 'hojicha',
  style: 'latte',
  serving: 'hot',
  price: null,
  currency: 'SGD',
  photoUrl: null,
  photoCredit: null,
  teaProductId: null,
  status: 'approved',
  scores: {
    tasterAvg: null,
    tasterCount: 0,
    tasterDisclosedCount: 0,
    communityAvg: null,
    communityCount: 0,
  },
  cafe: { slug: 'kissa', name: 'Kissa', area: null, citySlug: 'singapore' },
};

function setup(
  props: Parameters<typeof LogDialog>[0] = {},
  session: ReturnType<typeof makeSession> | null = makeSession()
) {
  const fake = createFakeBrowserClient({
    session,
    results: {
      cafes: { data: [], error: null },
      regions: { data: [], error: null },
      public_profiles: { data: { is_trusted_taster: false }, error: null },
    },
  });
  supabase.current = fake.client;
  renderWithQuery(
    <SignInPromptProvider>
      <LogDialog {...props} />
    </SignInPromptProvider>
  );
  return fake;
}

// Both flows are loaded on first use; compiling them up front keeps that out of the waits.
beforeAll(async () => {
  await Promise.all([
    import('@/features/cafes/components/drink-log-flow'),
    import('@/features/reviews/components/log-tasting-flow'),
  ]);
}, 60_000);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LogDialog', () => {
  it('chooser routes to drink flow', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /A tea I brewed/ })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /A café drink/ }));

    expect(await screen.findByRole('combobox', { name: 'Search cafés' })).toBeInTheDocument();
  });

  it('routes the tea choice to the tea flow', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));
    await userEvent.click(await screen.findByRole('button', { name: /A tea I brewed/ }));

    expect(await screen.findByRole('combobox', { name: 'Search products' })).toBeInTheDocument();
  });

  it('initial drink skips chooser', async () => {
    setup({ initial: { kind: 'drink', drink: DRINK } });

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));

    expect(await screen.findByRole('heading', { name: 'Rate Hojicha latte' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /A café drink/ })).not.toBeInTheDocument();
  });

  it('initial tea skips chooser', async () => {
    setup({ initial: { kind: 'tea' } });

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));

    expect(await screen.findByRole('combobox', { name: 'Search products' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /A café drink/ })).not.toBeInTheDocument();
  });

  it('returns to the chooser when reopened', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));
    await userEvent.click(await screen.findByRole('button', { name: /A café drink/ }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));

    expect(await screen.findByRole('button', { name: /A tea I brewed/ })).toBeInTheDocument();
  });

  it('asks signed-out visitors to sign in instead of opening', async () => {
    setup({}, null);

    await userEvent.click(screen.getByRole('button', { name: 'Log a tasting' }));

    const prompt = await screen.findByRole('dialog', { name: 'Join Matchoji' });
    expect(within(prompt).getByText('Sign in to log and rate what you try.')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /A café drink/ })).not.toBeInTheDocument()
    );
  });
});
