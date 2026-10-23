// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeProduct } from '../../../../test/support/render';
import { CategoryBadge } from './category-badge';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { CategoryCircles } from './category-circles';
import { ExploreFilters } from './explore-filters';
import { ExploreSort } from './explore-sort';
import { FilterDisclosure } from './filter-disclosure';
import { ProductFacts } from './product-facts';
import { ProductGrid } from './product-grid';
import { ProductImageWell } from './product-image-well';
import { ProductRow } from './product-row';
import { ProductShelf } from './product-shelf';
import { RatingInline } from './rating-inline';
import { ScoreNumeral } from './score-numeral';
import { SearchPill } from './search-pill';
import { StarRatingDisplay } from './star-rating-display';
import { TeaTin } from './tea-tin';

const REGION = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';

beforeEach(() => {
  vi.clearAllMocks();
});

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
  it('renders one decimal, read as "out of 5", and a hidden muted dash for null', () => {
    const { container, rerender } = render(<ScoreNumeral value={4} size="lg" />);
    const score = container.firstElementChild as HTMLElement;
    expect(score).toHaveTextContent('4.0 out of 5');
    expect(score).toHaveClass('tabular-nums', 'font-extrabold', 'text-6xl');
    expect(screen.getByText('out of 5')).toHaveClass('sr-only');
    rerender(<ScoreNumeral value={4} size="md" />);
    expect(container.firstElementChild).toHaveClass('text-3xl');
    rerender(<ScoreNumeral value={null} size="sm" />);
    expect(container.firstElementChild).toHaveClass('text-xl', 'text-muted-foreground');
    expect(screen.getByText('–')).toHaveAttribute('aria-hidden', 'true');
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

  it('draws a tin in the category colours without a photo', () => {
    const { container } = render(
      <ProductImageWell imageUrl={null} category="hojicha" name="Bancha" />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-tile');
    expect(container.querySelector('svg[data-tin="hojicha"]')).not.toBeNull();
  });
});

describe('ProductGrid', () => {
  it('renders a shelf card per product linking to its detail page', () => {
    render(
      <ProductGrid
        products={[
          makeProduct(),
          makeProduct({ id: 'p2', name: 'Kyoto Bancha', category: 'hojicha', brand: null }),
        ]}
      />
    );

    const card = screen.getByRole('link', { name: /Uji Ceremonial/ });
    expect(card).toHaveAttribute('href', '/products/p1');
    expect(card).toHaveTextContent('Marukyu Koyamaen');
    expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent('Uji Ceremonial');
    expect(card).toHaveTextContent('(12 ratings)');
    expect(card).toHaveAccessibleName(/4\.5 out of 5, 12 ratings/);
    expect(screen.getByRole('link', { name: /Kyoto Bancha/ })).not.toHaveTextContent(
      'Marukyu Koyamaen'
    );
  });

  // A drawn tin already shows the tea by colour; only a photo needs the label.
  it('labels the category only on a photographed card', () => {
    render(
      <ProductGrid
        products={[
          makeProduct(),
          makeProduct({ id: 'p2', name: 'Kyoto Bancha', imageUrl: 'https://cdn.test/b.jpg' }),
        ]}
      />
    );
    expect(screen.getByRole('link', { name: /Uji Ceremonial/ })).not.toHaveTextContent('Matcha');
    expect(screen.getByRole('link', { name: /Kyoto Bancha/ })).toHaveTextContent('Matcha');
  });

  // Interactive controls can't nest inside the card link.
  it('renders a per-card action outside the card link', () => {
    render(
      <ProductGrid
        products={[makeProduct()]}
        renderAction={(p) => <button type="button">Save {p.name}</button>}
      />
    );
    const action = screen.getByRole('button', { name: 'Save Uji Ceremonial' });
    expect(action.closest('a')).toBeNull();
  });
});

describe('RatingInline', () => {
  it('shows one star, the score and the count, with a spoken summary', () => {
    const { container } = render(
      <RatingInline avgStars={4.25} reviewCount={1} category="hojicha" />
    );
    expect(screen.getByText('4.3 out of 5, 1 rating')).toHaveClass('sr-only');
    expect(screen.getByText('(1 rating)')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveClass('fill-hojicha');
  });

  it('says when a product is not yet rated', () => {
    render(<RatingInline avgStars={null} reviewCount={0} category="matcha" />);
    expect(screen.getByText('Not yet rated')).toBeInTheDocument();
  });
});

describe('TeaTin', () => {
  it('draws a decorative tin per category', () => {
    const { container } = render(
      <>
        <TeaTin category="matcha" />
        <TeaTin category="hojicha" className="w-12" />
      </>
    );
    const tins = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(tins).toHaveLength(2);
    expect(tins[0]).toHaveAttribute('data-tin', 'matcha');
    expect(tins[0].querySelector('rect')).toHaveAttribute('fill', '#5c7a4f');
    expect(tins[1]).toHaveAttribute('data-tin', 'hojicha');
    expect(tins[1]).toHaveClass('w-12');
    expect(tins[1].querySelectorAll('circle')).toHaveLength(3);
  });
});

describe('ProductShelf', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(
      <ProductShelf title="Newly added" seeAllHref="/explore?sort=newest" products={[]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('titles the shelf, links to see all, and lists a card per product with its action', () => {
    render(
      <ProductShelf
        title="Top-rated matcha"
        seeAllHref="/explore?category=matcha"
        products={[makeProduct(), makeProduct({ id: 'p2', name: 'Kyoto Bancha' })]}
        renderAction={(p) => <button type="button">Save {p.name}</button>}
      />
    );

    const shelf = screen.getByRole('region', { name: 'Top-rated matcha' });
    expect(within(shelf).getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/explore?category=matcha'
    );
    expect(within(shelf).getAllByRole('listitem')).toHaveLength(2);
    expect(within(shelf).getByRole('button', { name: 'Save Kyoto Bancha' })).toBeInTheDocument();
  });
});

describe('ProductRow', () => {
  it('shows brand, linked name, category, meta, notes and score', () => {
    render(<ProductRow product={makeProduct({ topNotes: ['umami', 'sweet-grass'] })} />);

    expect(screen.getByRole('link', { name: 'Uji Ceremonial' })).toHaveAttribute(
      'href',
      '/products/p1'
    );
    expect(screen.getByText('Marukyu Koyamaen')).toBeInTheDocument();
    expect(screen.getByText('Matcha')).toBeInTheDocument();
    expect(screen.getByText('Ceremonial · Uji, Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Umami')).toBeInTheDocument();
    expect(screen.getByText('Sweet grass')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('12 ratings')).toBeInTheDocument();
    expect(screen.getByText('4.5 out of 5, 12 ratings')).toHaveClass('sr-only');
  });

  it('handles an unrated tea with no brand, meta or notes', () => {
    render(
      <ProductRow
        product={makeProduct({
          brand: null,
          grade: null,
          regionName: null,
          supply: null,
          shopUrl: null,
          status: 'approved',
          addedBy: null,
          reviewNote: null,
          mergedInto: null,
          avgStars: null,
          reviewCount: 0,
        })}
      />
    );
    expect(screen.getByText('Not yet rated')).toBeInTheDocument();
    expect(screen.getByText('–')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('uses the singular for one rating and keeps the action outside the link', () => {
    render(
      <ProductRow
        product={makeProduct({ reviewCount: 1 })}
        action={<button type="button">Save</button>}
      />
    );
    expect(screen.getByText('1 rating')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' }).closest('a')).toBeNull();
  });
});

describe('CategoryCircles', () => {
  it('links each tea to Explore filtered to it', () => {
    render(<CategoryCircles />);
    expect(screen.getByRole('link', { name: /Matcha/ })).toHaveAttribute(
      'href',
      '/explore?category=matcha'
    );
    expect(screen.getByRole('link', { name: /Hojicha.*Roasted green tea/ })).toHaveAttribute(
      'href',
      '/explore?category=hojicha'
    );
  });
});

describe('ExploreFilters', () => {
  it('links each option to its filter, keeping the others, and marks the active ones', () => {
    render(
      <ExploreFilters
        filters={{ q: 'uji', category: 'hojicha', sort: 'newest' }}
        regions={[{ id: REGION, name: 'Uji, Kyoto' }]}
        grades={[]}
      />
    );

    const tea = screen.getByRole('navigation', { name: 'Tea' });
    expect(within(tea).getByRole('link', { name: 'All teas' })).toHaveAttribute(
      'href',
      '/explore?q=uji&sort=newest'
    );
    expect(within(tea).getByRole('link', { name: 'Matcha' })).toHaveAttribute(
      'href',
      '/explore?q=uji&category=matcha&sort=newest'
    );
    expect(within(tea).getByRole('link', { name: 'Hojicha' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(within(tea).getByRole('link', { name: 'All teas' })).not.toHaveAttribute('aria-current');

    const region = screen.getByRole('navigation', { name: 'Region' });
    expect(within(region).getByRole('link', { name: 'All regions' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(within(region).getByRole('link', { name: 'Uji, Kyoto' })).toHaveAttribute(
      'href',
      `/explore?q=uji&category=hojicha&region=${REGION}&sort=newest`
    );
  });

  it('marks the chosen region and hides the region rail when there are none', () => {
    const { unmount } = render(
      <ExploreFilters
        filters={{ regionId: REGION, sort: 'top' }}
        regions={[{ id: REGION, name: 'Uji, Kyoto' }]}
        grades={[]}
      />
    );
    expect(screen.getByRole('link', { name: 'Uji, Kyoto' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('link', { name: 'All regions' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'All teas' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Browse regions' })).toHaveAttribute(
      'href',
      '/regions'
    );
    unmount();

    render(<ExploreFilters filters={{ sort: 'top' }} regions={[]} grades={[]} />);
    expect(screen.queryByRole('navigation', { name: 'Region' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Grade' })).not.toBeInTheDocument();
  });

  it('filters by minimum rating, keeping the other filters', () => {
    render(
      <ExploreFilters
        filters={{ category: 'matcha', minRating: 4, sort: 'top' }}
        regions={[]}
        grades={[]}
      />
    );

    const rating = screen.getByRole('navigation', { name: 'Rating' });
    expect(within(rating).getByRole('link', { name: '4 and up' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(within(rating).getByRole('link', { name: '4.5 and up' })).toHaveAttribute(
      'href',
      '/explore?category=matcha&rating=4.5'
    );
    expect(within(rating).getByRole('link', { name: 'Any rating' })).toHaveAttribute(
      'href',
      '/explore?category=matcha'
    );
  });

  it('lists grades, marks the chosen one case-insensitively and keeps a linked grade no tea has', () => {
    const { unmount } = render(
      <ExploreFilters
        filters={{ grade: 'ceremonial', sort: 'top' }}
        regions={[]}
        grades={['Ceremonial', 'Culinary']}
      />
    );
    const grade = screen.getByRole('navigation', { name: 'Grade' });
    expect(within(grade).getByRole('link', { name: 'Ceremonial' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(within(grade).getByRole('link', { name: 'Culinary' })).toHaveAttribute(
      'href',
      '/explore?grade=Culinary'
    );
    expect(within(grade).getByRole('link', { name: 'All grades' })).toHaveAttribute(
      'href',
      '/explore'
    );
    unmount();

    render(<ExploreFilters filters={{ grade: 'Gyokuro', sort: 'top' }} regions={[]} grades={[]} />);
    expect(screen.getByRole('link', { name: 'Gyokuro' })).toHaveAttribute('aria-current', 'true');
  });
});

describe('FilterDisclosure', () => {
  it('starts folded on small screens, shows the active count and toggles open', async () => {
    render(
      <FilterDisclosure activeCount={2}>
        <p>rail</p>
      </FilterDisclosure>
    );

    const button = screen.getByRole('button', { name: /Filters/ });
    expect(button).toHaveTextContent('2');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(panel).toHaveClass('hidden', 'lg:block');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveClass('hidden');
  });

  it('shows no count without active filters', () => {
    render(
      <FilterDisclosure activeCount={0}>
        <p>rail</p>
      </FilterDisclosure>
    );
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveTextContent(/^Filters$/);
  });
});

describe('ExploreSort', () => {
  it('shows the current sort and navigates on change, keeping the filters', async () => {
    render(<ExploreSort filters={{ category: 'matcha', sort: 'top' }} />);

    const trigger = screen.getByRole('combobox', { name: 'Sort' });
    expect(trigger).toHaveTextContent('Top rated');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Newest' }));

    expect(router.push).toHaveBeenCalledWith('/explore?category=matcha&sort=newest');
  });
});

describe('SearchPill', () => {
  it('is a GET search form to Explore', () => {
    render(<SearchPill />);
    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/explore');
    expect(screen.getByRole('searchbox', { name: 'Search teas' })).toHaveValue('');
    expect(form.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
  });

  it('keeps the other filters as hidden fields', () => {
    render(
      <SearchPill filters={{ q: 'uji', category: 'hojicha', regionId: REGION, sort: 'newest' }} />
    );
    const form = screen.getByRole('search');
    expect(screen.getByRole('searchbox', { name: 'Search teas' })).toHaveValue('uji');
    const hidden = Object.fromEntries(
      Array.from(form.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map((i) => [
        i.name,
        i.value,
      ])
    );
    expect(hidden).toEqual({ category: 'hojicha', region: REGION, sort: 'newest' });
  });

  it('leaves the default sort out', () => {
    render(<SearchPill size="lg" filters={{ sort: 'top' }} />);
    expect(screen.getByRole('search').querySelector('input[name="sort"]')).toBeNull();
  });
});

describe('ProductFacts', () => {
  it('lists brand, tea, grade and region', () => {
    render(<ProductFacts product={makeProduct({ category: 'hojicha' })} />);

    expect(screen.getByRole('heading', { name: 'Facts about the tea' })).toBeInTheDocument();
    expect(screen.getByText('Brand').nextSibling).toHaveTextContent('Marukyu Koyamaen');
    expect(screen.getByRole('link', { name: 'Hojicha' })).toHaveAttribute(
      'href',
      '/explore?category=hojicha'
    );
    expect(screen.getByText('Grade').nextSibling).toHaveTextContent('Ceremonial');
    expect(screen.getByText('Region').nextSibling).toHaveTextContent('Uji, Kyoto');
  });

  it('leaves out facts the tea does not have', () => {
    render(<ProductFacts product={makeProduct({ brand: null, grade: null, regionName: null })} />);
    expect(screen.queryByText('Brand')).not.toBeInTheDocument();
    expect(screen.queryByText('Grade')).not.toBeInTheDocument();
    expect(screen.queryByText('Region')).not.toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
  });
});
