// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildTopLists } from '../lib/top-lists';
import { tea } from '../test-utils';
import { SimilarTeas } from './similar-teas';
import { TeaHighlights } from './tea-highlights';
import { TopListCard, TopListRows } from './top-list-rows';

describe('TeaHighlights', () => {
  it('lists each line, and renders nothing without any', () => {
    const { container, rerender } = render(
      <TeaHighlights lines={['Highest rated from Uji', 'Top 10% of hojicha on Matchoji']} />
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Highest rated from Uji')).toBeInTheDocument();
    rerender(<TeaHighlights lines={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SimilarTeas', () => {
  it('shows a shelf of teas, and renders nothing when there are none', () => {
    const { container, rerender } = render(
      <SimilarTeas teas={[tea({ name: 'Sayaka' }), tea({ name: 'Unkaku' })]} category="matcha" />
    );
    expect(screen.getByRole('heading', { name: 'Similar teas' })).toBeInTheDocument();
    expect(screen.getByText('Sayaka')).toBeInTheDocument();
    rerender(<SimilarTeas teas={[]} category="matcha" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('top list components', () => {
  const teas = Array.from({ length: 5 }, (_, i) =>
    tea({ name: `Tea ${i}`, category: 'matcha', avgStars: 4.5 - i * 0.1, reviewCount: 6 })
  );
  const [list] = buildTopLists(teas);

  it('numbers the rows in rank order', () => {
    render(<TopListRows list={list} catalogue={teas} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent('1');
    expect(items[0]).toHaveTextContent('Tea 0');
  });

  it('links a card to its list page and names the leader', () => {
    render(<TopListCard list={list} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/top/matcha');
    expect(screen.getByText('Tea 0')).toBeInTheDocument();
  });
});
