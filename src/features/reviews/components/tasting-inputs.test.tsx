// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FlavorNotePicker } from './flavor-note-picker';
import { TasteProfileInput } from './taste-profile-input';

function Picker({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial);
  return <FlavorNotePicker category="matcha" value={value} onChange={setValue} />;
}

describe('FlavorNotePicker', () => {
  it('toggles notes from the category list', async () => {
    render(<Picker />);
    const umami = screen.getByRole('button', { name: 'Umami' });

    await userEvent.click(umami);
    expect(umami).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(umami);
    expect(umami).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Roasty' })).not.toBeInTheDocument();
  });

  it('caps at six', async () => {
    render(<Picker initial={['umami', 'grassy', 'creamy', 'sweet', 'vegetal', 'marine']} />);

    expect(screen.getByText('6 of 6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Floral' })).toBeDisabled();
    // Already-picked notes stay removable at the cap.
    await userEvent.click(screen.getByRole('button', { name: 'Umami' }));
    expect(screen.getByRole('button', { name: 'Floral' })).toBeEnabled();
  });
});

describe('TasteProfileInput', () => {
  it('reports the chosen step and toggles off on second click', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TasteProfileInput attribute="umami" value={undefined} onChange={onChange} />
    );

    expect(screen.getByRole('radiogroup', { name: 'Umami' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Umami 4 of 5' }));
    expect(onChange).toHaveBeenLastCalledWith(4);

    rerender(<TasteProfileInput attribute="umami" value={4} onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Umami 4 of 5' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Umami 4 of 5' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});

describe('radiogroup keyboard support', () => {
  it('has one tab stop and moves the choice with arrow keys', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TasteProfileInput attribute="body" value={undefined} onChange={onChange} />
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);

    rerender(<TasteProfileInput attribute="body" value={2} onChange={onChange} />);
    const second = screen.getByRole('radio', { name: 'Body 2 of 5' });
    expect(second).toHaveAttribute('tabindex', '0');
    second.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    // Focus followed the arrow to step 3, so Left goes back to 2.
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(2);
  });
});
