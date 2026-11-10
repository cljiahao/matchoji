// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InstagramHandleLink, TrustedTasterBadge } from './trusted-taster-badge';

describe('TrustedTasterBadge', () => {
  it('says "Trusted taster" in text', () => {
    render(<TrustedTasterBadge />);
    expect(screen.getByText('Trusted taster')).toBeInTheDocument();
  });
});

describe('InstagramHandleLink', () => {
  it('links a valid handle to its Instagram page in a new tab', () => {
    render(<InstagramHandleLink handle="foodcnl" />);
    const link = screen.getByRole('link', { name: '@foodcnl' });
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/foodcnl/');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders nothing for a stored value that fails the handle pattern', () => {
    const { container } = render(<InstagramHandleLink handle="evil/../path?x=1" />);
    expect(container).toBeEmptyDOMElement();
  });
});
