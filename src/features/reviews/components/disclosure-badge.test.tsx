// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DisclosureBadge } from './disclosure-badge';

describe('DisclosureBadge', () => {
  it.each([
    ['invited', 'Invited'],
    ['gifted', 'Gifted'],
    ['paid', 'Paid partnership'],
  ] as const)('labels %s', (disclosure, label) => {
    render(<DisclosureBadge disclosure={disclosure} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders nothing for none', () => {
    const { container } = render(<DisclosureBadge disclosure="none" />);
    expect(container).toBeEmptyDOMElement();
  });
});
