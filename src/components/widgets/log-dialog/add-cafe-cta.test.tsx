// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/cafes',
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/features/label-scan/lib/downscale-image', () => ({
  downscaleImage: async (file: File) => file,
}));

import { SignInPromptProvider } from '@/features/auth';

import { AddCafeCta } from './add-cafe-cta';

function setup(session: ReturnType<typeof makeSession> | null) {
  supabase.current = createFakeBrowserClient({
    session,
    results: { cafes: { data: [], error: null } },
  }).client;
  renderWithQuery(
    <SignInPromptProvider>
      <AddCafeCta />
    </SignInPromptProvider>
  );
}

beforeAll(async () => {
  await import('@/features/cafes/components/drink-log-flow');
}, 60_000);

beforeEach(() => vi.clearAllMocks());

describe('AddCafeCta', () => {
  it('opens the add-café form for a signed-in reader', async () => {
    setup(makeSession());
    await userEvent.click(await screen.findByRole('button', { name: 'Add a café' }));
    expect(await screen.findByRole('heading', { name: 'Log a café drink' })).toBeInTheDocument();
    expect(await screen.findByText(/Add the café\./)).toBeInTheDocument();
  });

  it('asks a signed-out reader to sign in instead', async () => {
    setup(null);
    expect(
      await screen.findByRole('button', { name: 'Sign in to add a café' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a café' })).not.toBeInTheDocument();
  });
});
