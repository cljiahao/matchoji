// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
    expect(within(nav).getByRole('link', { name: 'Sell on Matchoji' })).toHaveAttribute(
      'href',
      '/sell'
    );
  });

  // The phone tab bar has Home, Explore, Learn and Journal but not Regions.
  it('shows Regions on phones only', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Regions' }).closest('li')).toHaveClass('sm:hidden');
  });

  it('renders extra links from the prop', () => {
    render(<SiteFooter links={[{ label: 'Terms', href: '/terms' }]} />);
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('carries the fine print and the photo takedown link', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/© \d{4} Matchoji · A hobby project/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Ask us to take it down.' });
    expect(link).toHaveAttribute('href', expect.stringContaining('github.com/cljiahao/matchoji'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
