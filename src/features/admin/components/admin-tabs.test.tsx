// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { AdminTabs } from './admin-tabs';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

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
    // Hidden by the panel's inactive-state class, which jsdom does not apply.
    expect(screen.getByText('reports body').closest('[role=tabpanel]')).toHaveAttribute(
      'data-state',
      'inactive'
    );
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

  it('opens on the tab named in the hash', () => {
    window.history.replaceState(null, '', '/#photo');
    setup();

    expect(screen.getByRole('tab', { name: 'Tea photo' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('photo body').closest('[role=tabpanel]')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  it('writes the chosen tab to the hash', async () => {
    setup();

    await userEvent.click(screen.getByRole('tab', { name: 'Tea price' }));
    expect(window.location.hash).toBe('#price');
  });

  it('keeps what was typed in a panel when its tab is left and come back to', async () => {
    render(
      <AdminTabs
        queueCount={0}
        reportCount={0}
        queue={<p>queue body</p>}
        reports={<p>reports body</p>}
        photo={<input aria-label="Credit" />}
        price={<p>price body</p>}
      />
    );

    await userEvent.click(screen.getByRole('tab', { name: 'Tea photo' }));
    await userEvent.type(screen.getByLabelText('Credit'), 'Ippodo');
    await userEvent.click(screen.getByRole('tab', { name: 'Tea price' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Tea photo' }));

    expect(screen.getByLabelText('Credit')).toHaveValue('Ippodo');
  });
});
