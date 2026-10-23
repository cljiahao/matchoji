// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RatingDistribution } from './rating-distribution';

describe('RatingDistribution', () => {
  it('reads each row as one phrase, hiding the visual numbers and bar', () => {
    render(
      <RatingDistribution distribution={{ 5: 3, 4: 1, 3: 0, 2: 0, 1: 1 }} category="matcha" />
    );
    const list = screen.getByRole('list', { name: 'Rating distribution' });
    expect(screen.getByText('5 stars: 3 ratings')).toHaveClass('sr-only');
    expect(screen.getByText('4 stars: 1 rating')).toBeInTheDocument();
    expect(screen.getByText('1 star: 1 rating')).toBeInTheDocument();
    expect(list.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(15);
  });
});
