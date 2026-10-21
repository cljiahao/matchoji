// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => pathname.current,
}));

import { Navbar } from './navbar';

beforeEach(() => {
  supabase.current = createFakeBrowserClient().client;
  pathname.current = '/';
});

describe('Navbar', () => {
  it('shows the wordmark, Explore and Journal links and the log button', () => {
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Matchoji' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('href', '/journal');
    expect(screen.getByRole('button', { name: 'Log a tasting' })).toBeInTheDocument();
  });

  // Home already leads with its own big search.
  it('hides the search pill on home and Explore and shows it elsewhere', () => {
    const { unmount } = renderWithQuery(<Navbar />);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    unmount();

    pathname.current = '/explore';
    const explore = renderWithQuery(<Navbar />);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    explore.unmount();

    pathname.current = '/journal';
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('search')).toHaveAttribute('action', '/explore');
  });

  it('links to the journal and marks the current route', () => {
    pathname.current = '/journal';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Explore' })).not.toHaveAttribute('aria-current');
  });

  it('marks Explore on the explore page', () => {
    pathname.current = '/explore';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Journal' })).not.toHaveAttribute('aria-current');
  });

  // Signed-out phone users have no account menu, so the links can't hide behind it.
  it('hands section links to the tab bar on narrow screens', () => {
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('link', { name: 'Journal' }).closest('ul')).toHaveClass(
      'hidden',
      'sm:flex'
    );
  });

  it('offers a search shortcut to Explore', () => {
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('link', { name: 'Search teas' })).toHaveAttribute('href', '/explore');
  });

  it('shows sign-in as a secondary button next to the primary log button', async () => {
    renderWithQuery(<Navbar />);
    const signIn = await screen.findByRole('button', { name: 'Sign in' });
    expect(signIn.className).toMatch(/border/);
  });

  it('treats product pages as part of Explore', () => {
    pathname.current = '/products/p1';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
  });
});
