// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import OfflinePage, { metadata } from './page';

describe('offline page', () => {
  it('renders the offline screen and stays out of search', () => {
    render(<OfflinePage />);
    expect(screen.getByRole('heading', { name: 'You’re offline' })).toBeInTheDocument();
    expect(metadata.robots).toEqual({ index: false });
  });
});
