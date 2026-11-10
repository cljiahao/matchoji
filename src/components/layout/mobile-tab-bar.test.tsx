// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
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
  it('has five café-first tabs in order: Home, Cafés, Log, Top, Tasters', () => {
    renderWithQuery(<MobileTabBar />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(nav).toHaveClass('md:hidden');
    const labels = within(nav)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(labels).toEqual(['Home', 'Cafés', 'Log', 'Top', 'Tasters']);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Cafés' })).toHaveAttribute('href', '/cafes');
    expect(screen.getByRole('link', { name: 'Top' })).toHaveAttribute('href', '/top');
    expect(screen.getByRole('link', { name: 'Tasters' })).toHaveAttribute('href', '/tasters');
    expect(screen.queryByRole('link', { name: 'Journal' })).not.toBeInTheDocument();
  });

  it('marks the tab for the current section', () => {
    pathname.current = '/cafes/kurasu-bugis/hojicha-latte';
    const { unmount } = renderWithQuery(<MobileTabBar />);
    expect(screen.getByRole('link', { name: 'Cafés' })).toHaveAttribute('aria-current', 'page');
    unmount();

    pathname.current = '/top/teas/matcha';
    const top = renderWithQuery(<MobileTabBar />);
    expect(screen.getByRole('link', { name: 'Top' })).toHaveAttribute('aria-current', 'page');
    top.unmount();

    pathname.current = '/tasters';
    renderWithQuery(<MobileTabBar />);
    expect(screen.getByRole('link', { name: 'Tasters' })).toHaveAttribute('aria-current', 'page');
  });

  it('logs a drink from the middle tab, asking a signed-out visitor to sign in', async () => {
    renderWithQuery(<MobileTabBar />);
    await userEvent.click(await screen.findByRole('button', { name: 'Log' }));
    expect(screen.queryByRole('dialog', { name: 'Log a tasting' })).not.toBeInTheDocument();
  });
});
