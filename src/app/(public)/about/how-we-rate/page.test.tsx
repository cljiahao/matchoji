// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HowWeRatePage from './page';

describe('how-we-rate page', () => {
  it('renders the disclosure labels and the two-score rule', () => {
    render(<HowWeRatePage />);
    expect(screen.getByText('Invited')).toBeInTheDocument();
    expect(screen.getByText('Gifted')).toBeInTheDocument();
    expect(screen.getByText('Paid partnership')).toBeInTheDocument();
    expect(
      screen.getByText(/all count toward the taster score, and every one is labelled/)
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'One rating per person' })).toBeInTheDocument();
    expect(screen.getByText(/never mix them/)).toBeInTheDocument();
  });
});
