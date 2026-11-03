// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GoesWellWith } from './goes-well-with';

describe('GoesWellWith', () => {
  it('lists each sweet with a source link', () => {
    render(<GoesWellWith category="hojicha" grade={null} />);
    expect(screen.getByRole('heading', { name: 'Goes well with' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const link = screen.getByRole('link', { name: /Ippodo, castella/ });
    expect(link).toHaveAttribute('href', expect.stringMatching(/^https:\/\/.+castella$/));
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders nothing when no rule matches', () => {
    const { container } = render(<GoesWellWith category="matcha" grade="Culinary" />);
    expect(container).toBeEmptyDOMElement();
  });
});
