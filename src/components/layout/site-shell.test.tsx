// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

import { SiteShell } from './site-shell';

beforeEach(() => {
  supabase.current = createFakeBrowserClient().client;
});

describe('SiteShell', () => {
  it('puts a skip link first, pointing at the main landmark', () => {
    renderWithQuery(
      <SiteShell>
        <p>Page body</p>
      </SiteShell>
    );

    const skip = screen.getByRole('link', { name: 'Skip to content' });
    const main = screen.getByRole('main');
    expect(skip).toHaveAttribute('href', `#${main.id}`);
    expect(main.id).not.toBe('');
    expect(skip).toHaveClass('sr-only', 'focus:not-sr-only');

    const [first] = screen.getAllByRole('link');
    expect(first).toBe(skip);
    expect(main).toHaveTextContent('Page body');
  });

  it('wraps the page in the navbar and footer', () => {
    renderWithQuery(<SiteShell>x</SiteShell>);
    expect(screen.getByRole('link', { name: 'Matchoji' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
