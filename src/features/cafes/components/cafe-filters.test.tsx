// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CafeFilters } from './cafe-filters';

describe('CafeFilters', () => {
  it('is a GET form to /cafes that carries the city', () => {
    const { container } = render(
      <CafeFilters city="johor-bahru" areas={[]} area={undefined} tasterOnly={false} />
    );
    const form = screen.getByRole('form', { name: 'Filter cafés' });
    expect(form).toHaveAttribute('action', '/cafes');
    expect(form).toHaveAttribute('method', 'get');
    expect(container.querySelector('input[name="city"]')).toHaveValue('johor-bahru');
  });

  it('lists the areas after "All areas" and preselects the chosen one', () => {
    render(
      <CafeFilters city="singapore" areas={['Bugis', 'Tiong Bahru']} area="Bugis" tasterOnly />
    );
    const select = screen.getByRole('combobox', { name: 'Area' });
    expect(Array.from(select.querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      'All areas',
      'Bugis',
      'Tiong Bahru',
    ]);
    expect(select).toHaveValue('Bugis');
  });

  it('defaults to all areas with taster-only off', () => {
    render(<CafeFilters city="singapore" areas={['Bugis']} area={undefined} tasterOnly={false} />);
    expect(screen.getByRole('combobox', { name: 'Area' })).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: 'Taster-reviewed only' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute('type', 'submit');
  });

  // The fields are uncontrolled (defaultChecked), so a fresh render, not a rerender, applies it.
  it('checks taster-only when the URL asked for it', () => {
    render(<CafeFilters city="singapore" areas={['Bugis']} area={undefined} tasterOnly />);
    expect(screen.getByRole('checkbox', { name: 'Taster-reviewed only' })).toBeChecked();
  });
});
