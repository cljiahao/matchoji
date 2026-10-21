// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => pathname.current,
}));

import { MobileTabBar } from './mobile-tab-bar';

beforeEach(() => {
  supabase.current = createFakeBrowserClient().client;
  pathname.current = '/';
});

describe('MobileTabBar', () => {
  it('links Home, Explore and Journal and marks the current one', () => {
    renderWithQuery(<MobileTabBar />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(nav).toHaveClass('sm:hidden');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Journal' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Explore marked on product pages and Journal on the journal', () => {
    pathname.current = '/products/p1';
    const { unmount } = renderWithQuery(<MobileTabBar />);
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
    unmount();

    pathname.current = '/journal';
    renderWithQuery(<MobileTabBar />);
    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('aria-current', 'page');
  });

  it('logs a tasting from the middle tab, asking a signed-out visitor to sign in', async () => {
    renderWithQuery(<MobileTabBar />);
    await userEvent.click(await screen.findByRole('button', { name: 'Log' }));
    expect(screen.queryByRole('dialog', { name: 'Log a tasting' })).not.toBeInTheDocument();
  });
});
