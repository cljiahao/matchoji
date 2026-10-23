// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({ usePathname: () => '/products/p1' }));

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { SignInPromptProvider } from '@/features/auth';

import { StockPanel } from './stock-panel';

const SHOP = 'https://global.ippodo-tea.co.jp/products/matcha5010331';
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function setup(
  options: Parameters<typeof createFakeBrowserClient>[0],
  initialReport: Parameters<typeof StockPanel>[0]['initialReport'] = null
) {
  const fake = createFakeBrowserClient(options);
  supabase.current = fake.client;
  renderWithQuery(
    <SignInPromptProvider>
      <StockPanel productId="p1" brand="Ippodo" shopUrl={SHOP} initialReport={initialReport} />
    </SignInPromptProvider>
  );
  return fake;
}

const panel = () =>
  screen.getByRole('heading', { name: 'Stock at the official shop' }).parentElement as HTMLElement;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StockPanel', () => {
  it('shows the latest report with its age and links to the shop in a new tab', () => {
    setup({ session: makeSession() }, { status: 'sold_out', reportedAt: hoursAgo(3) });

    expect(panel()).toHaveTextContent('Sold out');
    expect(panel()).toHaveTextContent('reported 3 hours ago');
    const link = within(panel()).getByRole('link', { name: /Check Ippodo’s shop/ });
    expect(link).toHaveAttribute('href', SHOP);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('ignores a report older than two weeks', () => {
    setup({ session: makeSession() }, { status: 'sold_out', reportedAt: hoursAgo(24 * 15) });
    expect(panel()).toHaveTextContent('No recent reports');
    expect(panel()).not.toHaveTextContent('Sold out ·');
  });

  it('records a signed-in report and shows it straight away', async () => {
    const { calls } = setup({
      session: makeSession(),
      results: {
        stock_reports: { data: { status: 'in_stock', created_at: hoursAgo(0) }, error: null },
      },
    });

    const button = within(panel()).getByRole('button', { name: 'In stock' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);

    await waitFor(() => expect(panel()).toHaveTextContent('reported just now'));
    expect(calls).toContainEqual({
      table: 'stock_reports',
      method: 'insert',
      args: [{ product_id: 'p1', status: 'in_stock' }],
    });
    expect(toast.success).toHaveBeenCalledWith('Thanks, your report is in.');
  });

  it('passes on the database’s message when reporting again too soon', async () => {
    const error = Object.assign(new Error('You reported this tea a moment ago. Try again later.'), {
      code: 'P0001',
    });
    setup({ session: makeSession(), results: { stock_reports: { data: null, error } } });

    const button = within(panel()).getByRole('button', { name: 'Sold out' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'You reported this tea a moment ago. Try again later.'
      )
    );
  });

  it('asks a signed-out visitor to sign in instead of reporting', async () => {
    const fake = setup({});

    const button = within(panel()).getByRole('button', { name: 'Sold out' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);

    expect(
      await screen.findByText('Sign in to report whether a tea is in stock.')
    ).toBeInTheDocument();
    expect(fake.calls.some((c) => c.table === 'stock_reports')).toBe(false);
  });
});
