// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ValueBadge } from './value-badge';

const base = { score: 0.6, ratingPercentile: 0.9, pricePercentile: 0.3 };

describe('ValueBadge', () => {
  it('shows "Great value" for a tea that qualifies', () => {
    render(<ValueBadge value={{ ...base, great: true }} />);
    expect(screen.getByText('Great value')).toBeInTheDocument();
  });

  it('renders nothing when it does not qualify or has no score', () => {
    const { container, rerender } = render(<ValueBadge value={{ ...base, great: false }} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ValueBadge value={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
