// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TeaSelect } from './tea-select';

const teas = [
  { id: 't1', name: 'Sayaka', brand: 'Ippodo' },
  { id: 't2', name: 'House Bancha', brand: null },
];

describe('TeaSelect', () => {
  it('shows the placeholder while no tea is picked', () => {
    render(
      <TeaSelect
        teas={teas}
        value=""
        onChange={vi.fn()}
        placeholder="Pick a tea"
        aria-label="Tea"
      />
    );
    expect(screen.getByRole('combobox', { name: 'Tea' })).toHaveTextContent('Pick a tea');
  });

  it('labels options with the brand when there is one and reports the pick', async () => {
    const onChange = vi.fn();
    render(
      <TeaSelect
        teas={teas}
        value=""
        onChange={onChange}
        placeholder="Pick a tea"
        aria-label="Tea"
      />
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Tea' }));
    expect(await screen.findByRole('option', { name: 'Sayaka · Ippodo' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'House Bancha' }));
    expect(onChange).toHaveBeenCalledWith('t2');
  });

  it('shows the picked tea in the trigger', () => {
    render(
      <TeaSelect
        teas={teas}
        value="t1"
        onChange={vi.fn()}
        placeholder="Pick a tea"
        aria-label="Tea"
      />
    );
    expect(screen.getByRole('combobox', { name: 'Tea' })).toHaveTextContent('Sayaka · Ippodo');
  });
});
