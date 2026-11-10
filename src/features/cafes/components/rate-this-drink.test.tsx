// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/',
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { SignInPromptProvider } from '@/features/auth';

import { RateThisDrink } from './rate-this-drink';

const DRINK = { id: 'd1', name: 'Hojicha latte', base: 'hojicha' as const };

function setup(session: ReturnType<typeof makeSession> | null) {
  const fake = createFakeBrowserClient({
    session,
    results: { public_profiles: { data: { is_trusted_taster: false }, error: null } },
  });
  supabase.current = fake.client;
  renderWithQuery(
    <SignInPromptProvider>
      <RateThisDrink drink={DRINK} />
    </SignInPromptProvider>
  );
}

beforeAll(async () => {
  await import('./drink-log-flow');
}, 60_000);

describe('RateThisDrink', () => {
  it('opens the rating form for a signed-in visitor', async () => {
    setup(makeSession());

    await userEvent.click(screen.getByRole('button', { name: 'Rate this drink' }));

    expect(await screen.findByRole('heading', { name: 'Rate Hojicha latte' })).toBeInTheDocument();
  });

  it('asks a signed-out visitor to sign in first', async () => {
    setup(null);

    await userEvent.click(screen.getByRole('button', { name: 'Rate this drink' }));

    const prompt = await screen.findByRole('dialog', { name: 'Join Matchoji' });
    expect(within(prompt).getByText('Sign in to rate café drinks.')).toBeInTheDocument();
  });
});
