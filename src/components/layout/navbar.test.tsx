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

  // The journal page ships in a later PR; linking to it before then would be a 404.
  it('does not link to the journal before it exists', () => {
    renderWithQuery(<Navbar />);
    expect(screen.queryByRole('link', { name: 'Journal' })).not.toBeInTheDocument();
  });

  it('marks only the current route', () => {
    pathname.current = '/about';
    renderWithQuery(<Navbar />);
    expect(screen.getByRole('link', { name: 'Discover' })).not.toHaveAttribute('aria-current');
  });

  it('treats product pages as part of Discover', () => {
    pathname.current = '/products/p1';
    renderWithQuery(<Navbar />);

    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
  });
});
