// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeReview } from '../../../../test/support/render';
import { summarizeReviews } from '../lib/summarize-reviews';
import { FlavorFamilies } from './flavor-families';
import { PrepSummary } from './prep-summary';
import { ProductInsights } from './product-insights';
import { RatingDistribution } from './rating-distribution';
import { TasteProfileBars } from './taste-profile-bars';
import { TasteStructure } from './taste-structure';

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

describe('TasteStructure', () => {
  it('shows each set attribute between its poles, body first, as a meter', () => {
    render(<TasteStructure values={{ umami: 4.5, body: 2 }} category="matcha" />);

    const meters = screen.getAllByRole('meter');
    expect(meters.map((m) => m.getAttribute('aria-label'))).toEqual(['Body', 'Umami']);
    const umami = screen.getByRole('meter', { name: 'Umami' });
    expect(umami).toHaveAttribute('aria-valuenow', '4.5');
    expect(umami).toHaveAttribute('aria-valuemin', '1');
    expect(umami).toHaveAttribute('aria-valuemax', '5');
    expect(umami).toHaveAttribute('aria-valuetext', '4.5 of 5, from mild to savoury');
    expect(screen.getByRole('meter', { name: 'Body' })).toHaveAttribute(
      'aria-valuetext',
      '2 of 5, from light to full'
    );
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Savoury')).toBeInTheDocument();
    expect(screen.queryByRole('meter', { name: 'Sweetness' })).not.toBeInTheDocument();
  });

  it('places the marker in the category colour along the track', () => {
    render(<TasteStructure values={{ bitterness: 5 }} category="hojicha" />);
    const marker = screen.getByRole('meter', { name: 'Bitterness' }).firstElementChild;
    expect(marker).toHaveClass('bg-hojicha');
    expect(marker).toHaveStyle({ left: '78%' });
  });
});

describe('FlavorFamilies', () => {
  it('renders nothing without notes from the category', () => {
    const { container } = render(
      <FlavorFamilies noteCounts={[{ note: 'roasty', count: 3 }]} category="matcha" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('groups notes into families, most mentioned first, notes sorted within', () => {
    render(
      <FlavorFamilies
        noteCounts={[
          { note: 'umami', count: 2 },
          { note: 'vegetal', count: 1 },
          { note: 'grassy', count: 3 },
          { note: 'floral', count: 1 },
        ]}
        category="matcha"
      />
    );

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent('Grassy, Vegetal');
    expect(cards[0]).toHaveTextContent('4 mentions of green notes');
    expect(cards[1]).toHaveTextContent('Umami');
    expect(cards[1]).toHaveTextContent('2 mentions of savoury notes');
    expect(cards[2]).toHaveTextContent('1 mention of floral notes');
  });

  it('uses the hojicha families for hojicha', () => {
    render(
      <FlavorFamilies
        noteCounts={[
          { note: 'toasted-rice', count: 1 },
          { note: 'umami', count: 5 },
        ]}
        category="hojicha"
      />
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('Toasted rice');
    expect(screen.getByRole('listitem')).toHaveTextContent('1 mention of roasted notes');
  });
});

describe('ProductInsights', () => {
  it('renders nothing for a product without reviews', () => {
    const { container } = render(
      <ProductInsights summary={summarizeReviews([])} category="matcha" productName="Uji" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('hides empty sections', () => {
    render(
      <ProductInsights
        summary={summarizeReviews([makeReview({ stars: 4, flavorNotes: ['umami'] })])}
        category="matcha"
        productName="Uji"
      />
    );

    expect(screen.getByRole('heading', { name: 'What does it taste like?' })).toBeInTheDocument();
    expect(screen.getByText('1 mention of savoury notes')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.queryByText(/taste profile of/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How people make it' })).not.toBeInTheDocument();
  });

  it('ignores notes outside the product category', () => {
    render(
      <ProductInsights
        summary={summarizeReviews([makeReview({ flavorNotes: ['umami', 'buy-now'] })])}
        category="matcha"
        productName="Uji"
      />
    );
    expect(screen.getByText('Umami')).toBeInTheDocument();
    expect(screen.queryByText(/Buy now/)).not.toBeInTheDocument();
  });

  it('shows the structure, its basis and prep when reviews carry them', () => {
    const prep = { method: 'usucha' as const, doseG: 2, waterMl: 70, waterTempC: 80 };
    render(
      <ProductInsights
        summary={summarizeReviews([
          makeReview({ profile: { umami: 5 }, prep }),
          makeReview({ profile: { umami: 3 }, prep }),
        ])}
        category="matcha"
        productName="Uji Ceremonial"
      />
    );

    expect(screen.getByRole('meter', { name: 'Umami' })).toHaveAttribute('aria-valuenow', '4');
    expect(
      screen.getByText('The taste profile of Uji Ceremonial is based on 2 tastings.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How people make it' })).toBeInTheDocument();
    expect(screen.getByText('Usucha · 2g · 70ml · 80°C')).toBeInTheDocument();
  });

  it('uses the singular for one tasting', () => {
    render(
      <ProductInsights
        summary={summarizeReviews([makeReview({ profile: { body: 4 } })])}
        category="hojicha"
        productName="Bancha"
      />
    );
    expect(
      screen.getByText('The taste profile of Bancha is based on 1 tasting.')
    ).toBeInTheDocument();
  });
});
