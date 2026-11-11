// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '../../../../test/support/render';
import { SearchCombobox } from './search-combobox';

function setup(overrides: Partial<Parameters<typeof SearchCombobox>[0]> = {}) {
  const onAddNew = vi.fn();
  renderWithQuery(
    <SearchCombobox
      label="Find a café"
      placeholder="Café name"
      listLabel="Cafés"
      query="kopi"
      onQueryChange={vi.fn()}
      options={[]}
      isSearching={false}
      isError={false}
      searchable
      onSelect={vi.fn()}
      addLabel="Add a café"
      onAddNew={onAddNew}
      {...overrides}
    />
  );
  return { onAddNew };
}

describe('SearchCombobox add-new prompt', () => {
  it('offers to add a café below the results even when some match', async () => {
    const { onAddNew } = setup({ options: [{ id: 'c1', label: 'Kopi Hou' }] });
    expect(screen.getByRole('option', { name: /Kopi Hou/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add a café' }));
    expect(onAddNew).toHaveBeenCalled();
  });

  it('offers it on zero results too', () => {
    setup();
    expect(screen.getByText(/No match for/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a café' })).toBeInTheDocument();
  });

  it('hides it on a query error and shows the error state instead', () => {
    setup({ isError: true });
    expect(screen.getByRole('alert')).toHaveTextContent('Search is unavailable right now.');
    expect(screen.queryByRole('button', { name: 'Add a café' })).not.toBeInTheDocument();
  });

  it('waits while searching or while the query is too short', () => {
    setup({ isSearching: true });
    expect(screen.queryByRole('button', { name: 'Add a café' })).not.toBeInTheDocument();
  });

  it('waits while the query is too short', () => {
    setup({ searchable: false, query: 'k' });
    expect(screen.queryByRole('button', { name: 'Add a café' })).not.toBeInTheDocument();
  });
});
