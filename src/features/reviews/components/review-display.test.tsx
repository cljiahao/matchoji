// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { Review } from '../types';
import { ReviewItem } from './review-item';
import { ReviewList } from './review-list';

function makeReview(i: number, overrides: Partial<Review> = {}): Review {
  return {
    id: `r${i}`,
    productId: 'p1',
    reviewerName: `taster${i}`,
    stars: 4,
    notes: `note ${i}`,
    photoUrl: null,
    createdAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('ReviewItem', () => {
  it('shows reviewer, stars in category colour, notes and photo', () => {
    const { container } = render(
      <ReviewItem
        review={makeReview(1, { stars: 3, photoUrl: 'https://cdn.test/cup.jpg' })}
        category="hojicha"
      />
    );

    expect(screen.getByText('taster1')).toBeInTheDocument();
    expect(screen.getByLabelText('3 out of 5 stars')).toBeInTheDocument();
    expect(container.querySelectorAll('svg.fill-hojicha')).toHaveLength(3);
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

  it('renders no toggle for short notes and nothing for empty notes', () => {
    render(<ReviewItem review={makeReview(1, { notes: null })} category="matcha" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ReviewList', () => {
  it('invites the first review when empty', () => {
    render(<ReviewList reviews={[]} category="matcha" />);
    expect(screen.getByText(/No reviews yet/)).toBeInTheDocument();
  });

  it('shows 10 reviews at a time with a load-more button', async () => {
    const reviews = Array.from({ length: 23 }, (_, i) => makeReview(i + 1));
    render(<ReviewList reviews={reviews} category="matcha" />);

    expect(screen.getAllByText(/^taster\d+$/)).toHaveLength(10);
    await userEvent.click(screen.getByRole('button', { name: 'Load more (13 left)' }));
    expect(screen.getAllByText(/^taster\d+$/)).toHaveLength(20);
    await userEvent.click(screen.getByRole('button', { name: 'Load more (3 left)' }));
    expect(screen.getAllByText(/^taster\d+$/)).toHaveLength(23);
    expect(screen.queryByRole('button', { name: /Load more/ })).not.toBeInTheDocument();
  });
});
