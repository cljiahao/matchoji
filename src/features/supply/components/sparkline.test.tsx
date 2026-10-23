// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Sparkline } from './sparkline';

describe('Sparkline', () => {
  it('describes the first and last point and titles every year', () => {
    const { container } = render(
      <Sparkline
        label="Tea fields"
        unit="ha"
        points={[
          { year: 2016, value: 1580 },
          { year: 2020, value: 1560 },
          { year: 2026, value: 1510 },
        ]}
      />
    );

    expect(
      screen.getByRole('img', { name: 'Tea fields: 1,580 ha in 2016, 1,510 ha in 2026' })
    ).toBeInTheDocument();
    expect([...container.querySelectorAll('title')].map((t) => t.textContent)).toEqual([
      '2016: 1,580 ha',
      '2020: 1,560 ha',
      '2026: 1,510 ha',
    ]);
  });

  it('draws nothing for a single point', () => {
    const { container } = render(
      <Sparkline label="Tea fields" unit="ha" points={[{ year: 2026, value: 383 }]} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
