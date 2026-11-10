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
  it('leaves out the links the desktop navbar already has', () => {
    render(<SiteFooter />);
    const nav = screen.getByRole('navigation', { name: 'More from Matchoji' });
    for (const name of ['Explore', 'Learn', 'Journal']) {
      expect(within(nav).queryByRole('link', { name })).toBeNull();
    }
    expect(within(nav).getByRole('link', { name: 'Tea supply' })).toHaveAttribute(
      'href',
      '/regions/supply'
    );
    expect(within(nav).getByRole('link', { name: 'Top lists' })).toHaveAttribute('href', '/top');
    expect(within(nav).getByRole('link', { name: 'Where to buy in person' })).toHaveAttribute(
      'href',
      '/shops'
    );
    expect(within(nav).queryByRole('link', { name: 'Sell on Matchoji' })).toBeNull();
  });

  it('links to the sell page only while the marketplace is on', () => {
    marketplace.enabled = true;
    try {
      render(<SiteFooter />);
      expect(screen.getByRole('link', { name: 'Sell on Matchoji' })).toHaveAttribute(
        'href',
        '/sell'
      );
    } finally {
      marketplace.enabled = false;
    }
  });

  // The phone tab bar has Home, Explore, Learn and Journal but not Regions.
  it('shows Regions on phones only', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Regions' }).closest('li')).toHaveClass('md:hidden');
  });

  it('renders extra links from the prop', () => {
    render(<SiteFooter links={[{ label: 'Terms', href: '/terms' }]} />);
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('carries the fine print and the photo takedown link', () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(`© ${new Date().getFullYear()} Matchoji · A hobby project`)
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Ask us to take it down.' });
    expect(link).toHaveAttribute('href', expect.stringContaining('github.com/cljiahao/matchoji'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
