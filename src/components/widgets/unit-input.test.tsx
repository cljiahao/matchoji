// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { UnitInput } from './unit-input';

describe('UnitInput', () => {
  it('shows the unit after the number and keeps it out of the accessible name', () => {
    render(<UnitInput aria-label="Pack size (g)" unit="g" />);

    expect(screen.getByText('g')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('textbox', { name: 'Pack size (g)' })).toHaveClass('pr-9');
  });

  it('puts a currency before the number', () => {
    render(<UnitInput aria-label="Price" unit="S$" unitPosition="start" />);

    expect(screen.getByRole('textbox', { name: 'Price' })).toHaveClass('pl-9');
  });

  it('forwards the ref and typing to the input', async () => {
    const ref = createRef<HTMLInputElement>();
    render(<UnitInput ref={ref} aria-label="Dose" unit="g" />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Dose' }), '2');
    expect(ref.current).toHaveValue('2');
  });
});
