// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StarRatingInput } from './star-rating-input';

describe('StarRatingInput', () => {
  it('is a radiogroup that reports the clicked star', async () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={2} onChange={onChange} category="matcha" />);

    expect(screen.getByRole('radiogroup', { name: 'Rating out of 5 stars' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('previews the hovered rating in the category colour', async () => {
    const { container } = render(<StarRatingInput value={1} category="hojicha" />);

    await userEvent.hover(screen.getByRole('radio', { name: '3 stars' }));
    expect(container.querySelectorAll('svg.fill-hojicha')).toHaveLength(3);
    await userEvent.unhover(screen.getByRole('radio', { name: '3 stars' }));
    expect(container.querySelectorAll('svg.fill-hojicha')).toHaveLength(1);
  });
});
