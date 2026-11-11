// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PendingNotice } from './pending-notice';

describe('PendingNotice', () => {
  it('says the café is awaiting review', () => {
    render(<PendingNotice kind="café" />);
    expect(screen.getByRole('status').textContent).toMatch(/Awaiting review/);
    expect(screen.getByRole('status').textContent).toMatch(/this café/);
  });

  it('names a drink', () => {
    render(<PendingNotice kind="drink" />);
    expect(screen.getByRole('status').textContent).toMatch(/this drink/);
  });
});
