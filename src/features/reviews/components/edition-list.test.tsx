// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeReview } from '../../../../test/support/render';
import { editionLabel } from '../lib';
import { reviewSchema } from '../schemas/review.schema';
import { EditionList } from './edition-list';
import { ReviewItem } from './review-item';

describe('editions', () => {
  it('label a harvest with or without its flush', () => {
    expect(editionLabel(2025, 'first')).toBe('2025 first flush');
    expect(editionLabel(2024, null)).toBe('2024 harvest');
    expect(editionLabel(2024, 'unspecified')).toBe('2024 harvest');
  });

  it('list each harvest with its score, count and top badge', () => {
    render(
      <EditionList
        editions={[
          { harvestYear: 2025, flush: 'first', reviewCount: 3, avgStars: 4.67, topHarvest: true },
          {
            harvestYear: 2024,
            flush: 'unspecified',
            reviewCount: 1,
            avgStars: 3,
            topHarvest: false,
          },
        ]}
      />
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('2025 first flushTop rated harvest4.7 out of 53 ratings');
    expect(rows[1]).toHaveTextContent('2024 harvest3.0 out of 51 rating');
  });

  it('render nothing without editions', () => {
    const { container } = render(<EditionList editions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('show on a review that names its harvest', () => {
    render(
      <ReviewItem
        review={makeReview({ edition: { harvestYear: 2025, flush: 'second' } })}
        category="matcha"
      />
    );
    expect(screen.getByText('2025 second flush')).toBeInTheDocument();
  });

  it('accept a plausible harvest year and a known flush only', () => {
    const base = { stars: 4 };
    expect(reviewSchema.safeParse({ ...base, harvestYear: '2025', flush: 'first' }).success).toBe(
      true
    );
    expect(reviewSchema.safeParse({ ...base, harvestYear: '1890' }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, flush: 'spring' }).success).toBe(false);
    expect(reviewSchema.parse({ ...base, harvestYear: '', flush: '' })).toMatchObject({
      harvestYear: undefined,
      flush: undefined,
    });
  });
});
