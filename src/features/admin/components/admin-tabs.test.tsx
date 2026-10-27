// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AdminTabs } from './admin-tabs';

function setup(counts = { queueCount: 3, reportCount: 0 }) {
  render(
    <AdminTabs
      {...counts}
      queue={<p>queue body</p>}
      reports={<p>reports body</p>}
      photo={<p>photo body</p>}
      price={<p>price body</p>}
    />
  );
}

describe('AdminTabs', () => {
  it('opens on the review queue, and shows a count only when there is work', () => {
    setup();

    expect(screen.getByRole('tab', { name: 'Review queue, 3 waiting' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByText('queue body')).toBeInTheDocument();
    expect(screen.queryByText('reports body')).not.toBeInTheDocument();
  });

  it('switches to the form tabs', async () => {
    setup();

    await userEvent.click(screen.getByRole('tab', { name: 'Tea photo' }));
    expect(screen.getByText('photo body')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Tea price' }));
    expect(screen.getByText('price body')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Reports' }));
    expect(screen.getByText('reports body')).toBeInTheDocument();
  });
});
