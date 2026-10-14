// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeProduct } from '../../../../test/support/render';
import { CategoryBadge } from './category-badge';
import { CategoryTabs } from './category-tabs';
import { EmptyState } from './empty-state';
import { ProductGrid } from './product-grid';
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
    render(<CategoryTabs active="hojicha" />);

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Matcha' })).toHaveAttribute(
      'href',
      '/?category=matcha'
    );
    const active = screen.getByRole('link', { name: 'Hojicha' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).toHaveClass('bg-hojicha');
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
  });

  it('uses the neutral primary colour for the active "All" tab', () => {
    render(<CategoryTabs active={undefined} />);
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
    expect(card).toHaveClass('border-l-matcha');
    expect(card).toHaveTextContent('Ceremonial · Uji, Kyoto');
    expect(screen.getByRole('link', { name: /Kyoto Bancha/ })).toHaveClass('border-l-hojicha');
  });

  it('omits the grade/region line when neither is set', () => {
    render(<ProductGrid products={[makeProduct({ grade: null, regionName: null })]} />);
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});
