// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeProduct } from '../../../../test/support/render';
import { CategoryBadge } from './category-badge';
import { CategoryTabs } from './category-tabs';
import { EmptyState } from './empty-state';
import { ProductGrid } from './product-grid';
import { ProductImageWell } from './product-image-well';
import { ScoreNumeral } from './score-numeral';
import { StarRatingDisplay } from './star-rating-display';

describe('CategoryBadge', () => {
  it('labels and colours each category', () => {
    render(
      <>
        <CategoryBadge category="matcha" />
        <CategoryBadge category="hojicha" />
      </>
    );
    expect(screen.getByText('Matcha')).toHaveClass('bg-matcha');
    expect(screen.getByText('Hojicha')).toHaveClass('bg-hojicha');
  });
});

describe('CategoryTabs', () => {
  it('links each tab to its filter and marks the active one in its category colour', () => {
    render(<CategoryTabs filters={{ category: 'hojicha', q: 'uji', sort: 'top' }} />);

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/?q=uji');
    expect(screen.getByRole('link', { name: 'Matcha' })).toHaveAttribute(
      'href',
      '/?q=uji&category=matcha'
    );
    const active = screen.getByRole('link', { name: 'Hojicha' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).toHaveClass('bg-hojicha');
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
  });

  it('uses the neutral primary colour for the active "All" tab', () => {
    render(<CategoryTabs filters={{ sort: 'top' }} />);
    expect(screen.getByRole('link', { name: 'All' })).toHaveClass('bg-primary');
  });
});

describe('EmptyState', () => {
  it('names the filtered category', () => {
    render(<EmptyState category="hojicha">cta</EmptyState>);
    expect(screen.getByText(/No hojicha logged yet/)).toBeInTheDocument();
  });

  it('invites a first tasting when unfiltered', () => {
    render(<EmptyState>cta</EmptyState>);
    expect(screen.getByText(/No tastings logged yet/)).toBeInTheDocument();
    expect(screen.getByText('cta')).toBeInTheDocument();
  });
});

describe('StarRatingDisplay', () => {
  it('shows the average, count, and category-coloured filled stars', () => {
    const { container } = render(
      <StarRatingDisplay avgStars={3.6} reviewCount={1} category="hojicha" />
    );
    expect(screen.getByText('3.6 (1 review)')).toBeInTheDocument();
    expect(container.querySelectorAll('svg.fill-hojicha')).toHaveLength(4);
  });

  it('says when a product is not yet rated', () => {
    render(<StarRatingDisplay avgStars={null} reviewCount={0} category="matcha" />);
    expect(screen.getByText('Not yet rated')).toBeInTheDocument();
  });
});

describe('ScoreNumeral', () => {
  it('renders one decimal and a dash for null', () => {
    const { rerender } = render(<ScoreNumeral value={4} size="lg" />);
    expect(screen.getByText('4.0')).toHaveClass('tabular-nums');
    rerender(<ScoreNumeral value={null} size="sm" />);
    expect(screen.getByText('–')).toBeInTheDocument();
  });
});

describe('ProductImageWell', () => {
  it('shows the photo when present', () => {
    render(<ProductImageWell imageUrl="https://cdn.test/tin.jpg" category="matcha" name="Uji" />);
    expect(screen.getByRole('img', { name: 'Uji' })).toHaveAttribute(
      'src',
      'https://cdn.test/tin.jpg'
    );
  });

  it('can be decorative when the name is already on screen', () => {
    render(
      <ProductImageWell
        imageUrl="https://cdn.test/tin.jpg"
        category="matcha"
        name="Uji"
        decorative
      />
    );
    expect(screen.queryByRole('img', { name: 'Uji' })).not.toBeInTheDocument();
  });

  it('tints by category without a photo', () => {
    const { container } = render(
      <ProductImageWell imageUrl={null} category="hojicha" name="Bancha" />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-hojicha/15');
    expect(container.querySelector('svg')).toHaveClass('text-hojicha');
  });
});

describe('ProductGrid', () => {
  it('renders a card per product linking to its detail page', () => {
    render(
      <ProductGrid
        products={[
          makeProduct(),
          makeProduct({ id: 'p2', name: 'Kyoto Bancha', category: 'hojicha' }),
        ]}
      />
    );

    const card = screen.getByRole('link', { name: /Uji Ceremonial/ });
    expect(card).toHaveAttribute('href', '/products/p1');
    expect(card.className).not.toMatch(/border-l-4/);
    expect(card).toHaveTextContent('4.5');
    expect(card).toHaveTextContent('(12)');
    expect(card).toHaveAccessibleName(/4\.5 out of 5, 12 reviews/);
    expect(card).toHaveTextContent('Ceremonial · Uji, Kyoto');
    expect(
      screen.getByRole('link', { name: /Kyoto Bancha/ }).querySelector('.bg-hojicha\\/15')
    ).not.toBeNull();
  });

  it('omits the grade/region line when neither is set', () => {
    render(<ProductGrid products={[makeProduct({ grade: null, regionName: null })]} />);
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});
