// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeReview } from '../../../../test/support/render';
import { summarizeReviews } from '../lib/summarize-reviews';
import { PrepSummary } from './prep-summary';
import { ProductInsights } from './product-insights';
import { RatingDistribution } from './rating-distribution';
import { TasteProfileBars } from './taste-profile-bars';

describe('TasteProfileBars', () => {
  it('exposes values as meters and skips unset attributes', () => {
    render(<TasteProfileBars values={{ umami: 4.5, body: 2 }} category="matcha" />);

    const umami = screen.getByRole('meter', { name: 'Umami' });
    expect(umami).toHaveAttribute('aria-valuenow', '4.5');
    expect(umami).toHaveAttribute('aria-valuemin', '1');
    expect(umami).toHaveAttribute('aria-valuemax', '5');
    expect(screen.getByRole('meter', { name: 'Body' })).toBeInTheDocument();
    expect(umami).toHaveAttribute('aria-valuetext', '4.5 of 5');
    expect(screen.queryByRole('meter', { name: 'Sweetness' })).not.toBeInTheDocument();
  });
});

describe('RatingDistribution', () => {
  it('lists every star level with its count, five first', () => {
    render(
      <RatingDistribution distribution={{ 1: 0, 2: 1, 3: 0, 4: 3, 5: 6 }} category="hojicha" />
    );

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent('5');
    expect(rows[0]).toHaveTextContent('6');
    expect(within(rows[4]).getByText('0')).toBeInTheDocument();
  });
});

describe('PrepSummary', () => {
  it('formats and skips unset parts', () => {
    const { rerender } = render(
      <PrepSummary prep={{ method: 'usucha', doseG: 2, waterMl: 70, waterTempC: 80 }} />
    );
    expect(screen.getByText('Usucha · 2g · 70ml · 80°C')).toBeInTheDocument();

    rerender(
      <PrepSummary prep={{ method: 'latte', doseG: null, waterMl: 200, waterTempC: null }} />
    );
    expect(screen.getByText('Latte · 200ml')).toBeInTheDocument();
  });

  it('renders nothing without a method', () => {
    const { container } = render(
      <PrepSummary prep={{ method: null, doseG: 2, waterMl: null, waterTempC: null }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ProductInsights', () => {
  it('renders nothing for a product without reviews', () => {
    const { container } = render(
      <ProductInsights summary={summarizeReviews([])} category="matcha" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('hides empty sections', () => {
    render(
      <ProductInsights
        summary={summarizeReviews([makeReview({ stars: 4, flavorNotes: ['umami'] })])}
        category="matcha"
      />
    );

    expect(screen.getByRole('heading', { name: 'Ratings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Most noticed' })).toBeInTheDocument();
    expect(screen.getByText('Umami')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Taste profile' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How people make it' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Photos' })).not.toBeInTheDocument();
  });

  it('ignores notes outside the product category', () => {
    render(
      <ProductInsights
        summary={summarizeReviews([makeReview({ flavorNotes: ['umami', 'buy-now'] })])}
        category="matcha"
      />
    );
    expect(screen.getByText('Umami')).toBeInTheDocument();
    expect(screen.queryByText('Buy now')).not.toBeInTheDocument();
  });

  it('shows profile, prep and photos when reviews carry them', () => {
    const prep = { method: 'usucha' as const, doseG: 2, waterMl: 70, waterTempC: 80 };
    render(
      <ProductInsights
        summary={summarizeReviews([
          makeReview({ profile: { umami: 5 }, prep, photoUrl: 'https://cdn.test/a.jpg' }),
          makeReview({ profile: { umami: 3 }, prep }),
        ])}
        category="matcha"
      />
    );

    expect(screen.getByRole('heading', { name: 'Taste profile' })).toBeInTheDocument();
    expect(screen.getByText('From 2 tastings')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Umami' })).toHaveAttribute('aria-valuenow', '4');
    expect(screen.getByText('Usucha · 2g · 70ml · 80°C')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Review photo 1' })).toHaveAttribute(
      'src',
      'https://cdn.test/a.jpg'
    );
  });
});
