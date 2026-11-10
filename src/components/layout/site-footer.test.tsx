// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const marketplace = vi.hoisted(() => ({ enabled: false }));
vi.mock('@/lib/constants/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants/env')>()),
  get MARKETPLACE_ENABLED() {
    return marketplace.enabled;
  },
}));

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('links Regions, Tea supply, Learn, Tea shops and How we rate', () => {
    render(<SiteFooter />);
    const nav = screen.getByRole('navigation', { name: 'More from Matchoji' });
    expect(within(nav).getByRole('link', { name: 'Tea supply' })).toHaveAttribute(
      'href',
      '/regions/supply'
    );
    expect(within(nav).getByRole('link', { name: 'Tea shops' })).toHaveAttribute('href', '/shops');
    expect(within(nav).getByRole('link', { name: 'How we rate' })).toHaveAttribute(
      'href',
      '/about/how-we-rate'
    );
    expect(within(nav).getByRole('link', { name: 'Regions' })).toHaveAttribute('href', '/regions');
    expect(within(nav).getByRole('link', { name: 'Learn' })).toHaveAttribute('href', '/learn');
    for (const name of ['Explore', 'Journal', 'Top lists']) {
      expect(within(nav).queryByRole('link', { name })).toBeNull();
    }
  });

  it('has no Sell link and no hobby copy, even with the marketplace on', () => {
    marketplace.enabled = true;
    try {
      render(<SiteFooter />);
      expect(screen.queryByRole('link', { name: /Sell/ })).toBeNull();
      expect(screen.queryByText(/hobby/i)).toBeNull();
    } finally {
      marketplace.enabled = false;
    }
  });

  // The desktop navbar's At home menu has Regions and Learn; phones have no such menu.
  it('shows Regions and Learn on phones only', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Regions' }).closest('li')).toHaveClass('md:hidden');
    expect(screen.getByRole('link', { name: 'Learn' }).closest('li')).toHaveClass('md:hidden');
  });

  it('renders extra links from the prop', () => {
    render(<SiteFooter links={[{ label: 'Terms', href: '/terms' }]} />);
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('carries the fine print and the photo takedown link', () => {
    render(<SiteFooter />);
    expect(screen.getByText(`© ${new Date().getFullYear()} Matchoji`)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Ask us to take it down.' });
    expect(link).toHaveAttribute('href', expect.stringContaining('github.com/cljiahao/matchoji'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
