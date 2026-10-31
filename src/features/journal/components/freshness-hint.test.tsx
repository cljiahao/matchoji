// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FreshnessHint } from './freshness-hint';

describe('FreshnessHint', () => {
  it('attributes the figure to a known maker and links its source', () => {
    render(<FreshnessHint brand="Ippodo" openedOn="2026-10-19" today="2026-10-31" />);
    expect(screen.getByText(/Opened 12 days ago/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ippodo suggests' })).toHaveAttribute(
      'href',
      expect.stringContaining('ippodo')
    );
    expect(screen.getByText(/using within a month of opening/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Keeping matcha fresh' })).toHaveAttribute(
      'href',
      '/learn/guides/storing-matcha'
    );
  });

  it('words an unknown maker as general advice', () => {
    render(<FreshnessHint brand="Marukyu Koyamaen" openedOn="2026-10-30" today="2026-10-31" />);
    expect(screen.getByText(/Opened 1 day ago/)).toBeInTheDocument();
    expect(screen.getByText(/matcha is best finished within about a month/)).toBeInTheDocument();
    expect(screen.queryByText(/suggests/)).not.toBeInTheDocument();
  });

  it('shows nothing without an opened date', () => {
    const { container } = render(
      <FreshnessHint brand="Ippodo" openedOn={null} today="2026-10-31" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
