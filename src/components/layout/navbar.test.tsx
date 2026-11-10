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
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => pathname.current,
}));

import { Navbar } from './navbar';

beforeEach(() => {
  supabase.current = createFakeBrowserClient().client;
  pathname.current = '/';
});

describe('Navbar', () => {
  it('has Cafés, Top, Tasters and an At home menu', async () => {
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Matchoji' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Cafés' })).toHaveAttribute('href', '/cafes');
    expect(screen.getByRole('link', { name: 'Top' })).toHaveAttribute('href', '/top');
    expect(screen.getByRole('link', { name: 'Tasters' })).toHaveAttribute('href', '/tasters');
    expect(screen.queryByRole('link', { name: 'Explore' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'At home' }));
    expect(await screen.findByRole('menuitem', { name: 'Teas' })).toHaveAttribute(
      'href',
      '/explore'
    );
    expect(screen.getByRole('menuitem', { name: 'Learn' })).toHaveAttribute('href', '/learn');
    expect(screen.getByRole('menuitem', { name: 'Regions' })).toHaveAttribute('href', '/regions');
  });

  it('labels the log button "Log a drink"', () => {
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('button', { name: 'Log a drink' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log a tasting' })).not.toBeInTheDocument();
  });

  // Explore leads with its own search, so the bar's would be a second one.
  it('hides the search pill on Explore and shows it elsewhere', () => {
    pathname.current = '/explore';
    const explore = renderWithQuery(<Navbar />);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    explore.unmount();

    pathname.current = '/cafes';
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('search')).toHaveAttribute('action', '/explore');
  });

  it('marks the current section', () => {
    pathname.current = '/top/singapore-hojicha-latte';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Top' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Cafés' })).not.toHaveAttribute('aria-current');
  });

  // Signed-out phone users have no account menu, so the links can't hide behind it.
  it('hands section links to the tab bar on narrow screens', () => {
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('link', { name: 'Cafés' }).closest('ul')).toHaveClass(
      'hidden',
      'md:flex'
    );
  });

  it('labels the phone shortcut by where it goes: the teas page', () => {
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('link', { name: 'Explore teas' })).toHaveAttribute('href', '/explore');
    expect(screen.queryByRole('link', { name: 'Search teas' })).not.toBeInTheDocument();
  });

  it('shows sign-in as a secondary button next to the primary log button', async () => {
    renderWithQuery(<Navbar />);
    const signIn = await screen.findByRole('button', { name: 'Sign in' });
    expect(signIn.className).toMatch(/border/);
  });

  it('marks At home on tea pages', () => {
    pathname.current = '/products/p1';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('button', { name: 'At home' })).toHaveClass('text-foreground');
  });

  it('keeps the wordmark from shrinking into the first link, and the log button 44px tall', () => {
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('link', { name: 'Matchoji' })).toHaveClass('shrink-0', 'min-h-11');
    expect(screen.getByRole('button', { name: 'Log a drink' })).toHaveClass('min-h-11');
  });
});
