// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BackLink } from './back-link';

describe('BackLink', () => {
  it('links to the destination, named by where it goes', () => {
    render(<BackLink href="/learn" label="Learn" />);
    const link = screen.getByRole('link', { name: 'Back to Learn' });
    expect(link).toHaveAttribute('href', '/learn');
    expect(link).toHaveTextContent('Learn');
    expect(link).toHaveClass('min-h-10');
  });

  it('hides the chevron from assistive tech', () => {
    const { container } = render(<BackLink href="/learn" label="Learn" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
