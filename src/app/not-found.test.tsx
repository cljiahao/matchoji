// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../test/support/fake-browser-client';
import { renderWithQuery } from '../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/this-does-not-exist',
}));

import NotFound, { metadata } from './not-found';

beforeEach(() => {
  supabase.current = createFakeBrowserClient().client;
});

describe('root not-found page', () => {
  it('sets its own document title through the site template', () => {
    expect(metadata.title).toBe('Page not found');
  });

  it('keeps the site shell and links back into the site at touch size', () => {
    renderWithQuery(<NotFound />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();

    const main = screen.getByRole('main');
    for (const [name, href] of [
      ['Explore teas', '/explore'],
      ['Home', '/'],
    ]) {
      const link = Array.from(main.querySelectorAll('a')).find((a) => a.textContent === name);
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveClass('min-h-11');
    }
  });
});
