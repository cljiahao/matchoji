// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeEntry } from '../../../../test/support/journal';
import { makeReview } from '../../../../test/support/render';
import type { DrinkJournalEntry } from '../types';
vi.mock('next/navigation', () => ({
  usePathname: () => '/journal',
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { JournalTimeline } from './journal-timeline';

const drinkEntry: DrinkJournalEntry = {
  ...makeReview({
    tastedOn: '2026-09-05',
    productId: null,
    drinkId: 'd1',
    stars: 4,
    disclosure: 'paid',
    instagramUrl: 'https://www.instagram.com/p/Cabc123/',
  }),
  drink: {
    id: 'd1',
    slug: 'hojicha-latte',
    name: 'Hojicha Latte',
    base: 'hojicha',
    cafe: { id: 'c1', slug: 'kurasu', name: 'Kurasu' },
  },
};

describe('JournalTimeline', () => {
  it('shows a drink tasting with its café, disclosure and post link beside a tea', () => {
    render(
      <JournalTimeline
        entries={[
          drinkEntry,
          makeEntry({ tastedOn: '2026-09-01', product: { id: 'p1', name: 'Sayaka' } }),
        ]}
      />
    );
    expect(screen.getByRole('link', { name: 'Hojicha Latte' })).toHaveAttribute(
      'href',
      '/cafes/kurasu/hojicha-latte'
    );
    expect(screen.getByText('at Kurasu')).toBeInTheDocument();
    expect(screen.getByText('Paid partnership')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See the post on Instagram/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sayaka' })).toHaveAttribute('href', '/products/p1');
  });
});
