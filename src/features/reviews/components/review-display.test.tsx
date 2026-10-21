// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { makeReview as baseReview } from '../../../../test/support/render';
import type { Review } from '../types';
import { ReviewItem } from './review-item';
import { ReviewList } from './review-list';

function makeReview(i: number, overrides: Partial<Review> = {}): Review {
  return baseReview({
    id: `r${i}`,
    reviewerName: `taster${i}`,
    notes: `note ${i}`,
    ...overrides,
  });
}

describe('ReviewItem', () => {
  it('shows the star pill in category colour, notes, photo and the reviewer with the day', () => {
    const { container } = render(
      <ReviewItem
        review={makeReview(1, {
          stars: 3,
          photoUrl: 'https://cdn.test/cup.jpg',
          tastedOn: '2026-09-05',
        })}
        category="hojicha"
      />
    );

    expect(screen.getByText('3.0').closest('p')).toHaveTextContent('3.0 out of 5 stars');
    expect(screen.getByText('3.0').closest('p')).toHaveClass('bg-hojicha/15');
    expect(screen.getByText('out of 5 stars')).toHaveClass('sr-only');
    expect(container.querySelectorAll('svg.fill-hojicha')).toHaveLength(1);
    expect(screen.getByText('note 1')).toBeInTheDocument();
    const footer = container.querySelector('footer');
    expect(footer).toHaveTextContent('taster1');
    expect(footer?.querySelector('time')).toHaveAttribute('datetime', '2026-09-05');
    expect(footer).toHaveTextContent('Sep 5, 2026');
    expect(screen.getByRole('img', { name: 'Review' })).toHaveAttribute(
      'src',
      'https://cdn.test/cup.jpg'
    );
  });

  it('collapses long notes behind "Read more" and expands them', async () => {
    const long = `${'Roasty and sweet. '.repeat(20)}THE END`;
    render(<ReviewItem review={makeReview(1, { notes: long })} category="matcha" />);

    expect(screen.queryByText(/THE END/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Read more' }));
    expect(screen.getByText(/THE END/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('shows note chips and the prep line, without taste bars', () => {
    render(
      <ReviewItem
        review={makeReview(1, {
          flavorNotes: ['roasty', 'toasted-rice'],
          profile: { body: 3 },
          prep: { method: 'steeped', doseG: 5, waterMl: 300, waterTempC: 95 },
        })}
        category="hojicha"
      />
    );

    expect(screen.getByText('Roasty')).toBeInTheDocument();
    expect(screen.getByText('Toasted rice')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.getByText('Steeped · 5g · 300ml · 95°C')).toBeInTheDocument();
  });

  it('ignores notes outside the product category', () => {
    render(
      <ReviewItem review={makeReview(1, { flavorNotes: ['umami', 'roasty'] })} category="hojicha" />
    );
    expect(screen.getByText('Roasty')).toBeInTheDocument();
    expect(screen.queryByText('Umami')).not.toBeInTheDocument();
  });

  it('renders no toggle for short notes and nothing for empty notes', () => {
    render(<ReviewItem review={makeReview(1, { notes: null })} category="matcha" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ReviewList', () => {
  it('invites the first review when empty', () => {
    render(<ReviewList reviews={[]} category="matcha" />);
    expect(screen.getByText('No reviews yet. Be the first to rate it.')).toBeInTheDocument();
  });

  it('shows 10 reviews at a time with a load-more button', async () => {
    const reviews = Array.from({ length: 23 }, (_, i) => makeReview(i + 1));
    render(<ReviewList reviews={reviews} category="matcha" />);

    expect(screen.getAllByText(/^taster\d+$/)).toHaveLength(10);
    await userEvent.click(screen.getByRole('button', { name: 'Show more reviews (13)' }));
    expect(screen.getAllByText(/^taster\d+$/)).toHaveLength(20);
    await userEvent.click(screen.getByRole('button', { name: 'Show more reviews (3)' }));
    expect(screen.getAllByText(/^taster\d+$/)).toHaveLength(23);
    expect(screen.queryByRole('button', { name: /Show more reviews/ })).not.toBeInTheDocument();
  });
});
