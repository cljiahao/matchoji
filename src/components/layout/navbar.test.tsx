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
  it('shows Discover and Journal links and the log button', () => {
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Log a tasting' })).toBeInTheDocument();
  });

  it('links to the journal and marks the current route', () => {
    pathname.current = '/journal';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('href', '/journal');
    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Discover' })).not.toHaveAttribute('aria-current');
  });

  it('treats product pages as part of Discover', () => {
    pathname.current = '/products/p1';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
  });
});
