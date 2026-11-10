// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InstagramPostLink } from './instagram-post-link';

describe('InstagramPostLink', () => {
  it('links a valid post out in a new tab without opener access', () => {
    render(<InstagramPostLink url="https://www.instagram.com/p/Cabc123/" />);
    const link = screen.getByRole('link', { name: /See the post on Instagram/ });
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/p/Cabc123/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each([
    'javascript:alert(1)',
    'http://www.instagram.com/p/x/',
    'https://evil.com/p/x/',
    'https://www.instagram.com.evil.com/p/x/',
    'not a url',
  ])('renders nothing for %s', (url) => {
    const { container } = render(<InstagramPostLink url={url} />);
    expect(container).toBeEmptyDOMElement();
  });
});
