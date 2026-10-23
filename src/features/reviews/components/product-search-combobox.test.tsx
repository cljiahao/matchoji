// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));

import { ProductSearchCombobox } from './product-search-combobox';

const HITS = [
  { id: 'a', name: 'Uji Ceremonial', brand: 'Marukyu', category: 'matcha' },
  { id: 'b', name: 'Uji Hojicha', brand: null, category: 'hojicha' },
];
// Search reads review status too and returns only approved teas (or the searcher's own).
const ROWS = HITS.map((hit) => ({ ...hit, status: 'approved', added_by: null }));

function Harness(props: { onSelect: () => void; onAddNew: () => void }) {
  const [query, setQuery] = useState('');
  return <ProductSearchCombobox query={query} onQueryChange={setQuery} {...props} />;
}

function setup(result: { data: unknown; error: unknown }) {
  supabase.current = createFakeBrowserClient({ results: { products: result } }).client;
  const onSelect = vi.fn();
  const onAddNew = vi.fn();
  renderWithQuery(<Harness onSelect={onSelect} onAddNew={onAddNew} />);
  return { onSelect, onAddNew, input: screen.getByRole('combobox', { name: 'Search products' }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProductSearchCombobox', () => {
  it('lists matches and supports arrow-key selection', async () => {
    const { onSelect, input } = setup({ data: ROWS, error: null });

    await userEvent.type(input, 'uji');
    await screen.findByRole('option', { name: /Uji Ceremonial/ });
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: /Uji Hojicha/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Uji Ceremonial/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(HITS[1]);
  });

  it('wraps upward from no selection and clears it with Escape', async () => {
    const { input } = setup({ data: ROWS, error: null });

    await userEvent.type(input, 'uji');
    await screen.findByRole('option', { name: /Uji Ceremonial/ });
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-1$/));
    await userEvent.keyboard('{Escape}');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('waits for typing to pause before searching', async () => {
    const fake = createFakeBrowserClient({ results: { products: { data: ROWS, error: null } } });
    supabase.current = fake.client;
    renderWithQuery(<Harness onSelect={vi.fn()} onAddNew={vi.fn()} />);

    await userEvent.type(screen.getByRole('combobox', { name: 'Search products' }), 'uji');
    await screen.findByRole('option', { name: /Uji Ceremonial/ });

    expect(fake.calls.filter((c) => c.method === 'or')).toEqual([
      { table: 'products', method: 'or', args: ['name.ilike.%uji%,brand.ilike.%uji%'] },
    ]);
  });

  // While the debounce is pending there are no results yet; that must read as
  // "searching", not flash "No match" and the add-new affordance.
  it('shows searching, not "no match", while waiting to search', async () => {
    const { input } = setup({ data: ROWS, error: null });

    await userEvent.type(input, 'uji');
    expect(screen.getByText('Searching…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add as new product' })).not.toBeInTheDocument();
  });

  it('selects a match on click', async () => {
    const { onSelect, input } = setup({ data: ROWS, error: null });

    await userEvent.type(input, 'uji');
    await userEvent.click(await screen.findByRole('option', { name: /Uji Ceremonial/ }));
    expect(onSelect).toHaveBeenCalledWith(HITS[0]);
  });

  it('offers to add a new product when nothing matches', async () => {
    const { onAddNew, input } = setup({ data: [], error: null });

    await userEvent.type(input, 'Kagoshima Gold');
    await userEvent.click(await screen.findByRole('button', { name: 'Add as new product' }));
    expect(screen.getByText(/No match for/)).toHaveTextContent('Kagoshima Gold');
    expect(onAddNew).toHaveBeenCalled();
  });

  it('still offers "add new" when search fails', async () => {
    const { input } = setup({ data: null, error: new Error('offline') });

    await userEvent.type(input, 'uji');
    await waitFor(
      () => expect(screen.getByText('Search is unavailable right now.')).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByRole('button', { name: 'Add as new product' })).toBeInTheDocument();
  });

  it('does not search for a single character', async () => {
    const { input } = setup({ data: ROWS, error: null });

    await userEvent.type(input, 'u');
    expect(screen.queryByRole('button', { name: 'Add as new product' })).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
