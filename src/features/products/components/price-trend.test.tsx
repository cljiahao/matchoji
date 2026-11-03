// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { toPricePoint } from '../lib/price-history';
import { PriceTrend } from './price-trend';

const point = (recordedAt: string, price: number) =>
  toPricePoint({ recorded_at: recordedAt, price, pack_grams: 40 });

describe('PriceTrend', () => {
  it('draws the sparkline with a text summary from two points', () => {
    render(
      <PriceTrend
        history={[point('2026-03-05T00:00:00Z', 32), point('2026-09-01T00:00:00Z', 35.84)]}
      />
    );

    expect(screen.getByText('Up 12% since Mar 2026')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Price per gram: Up 12% since Mar 2026' })
    ).toBeInTheDocument();
  });

  it('is hidden with fewer than two points', () => {
    const none = render(<PriceTrend history={[]} />);
    expect(none.container).toBeEmptyDOMElement();
    const one = render(<PriceTrend history={[point('2026-03-05T00:00:00Z', 32)]} />);
    expect(one.container).toBeEmptyDOMElement();
  });
});
