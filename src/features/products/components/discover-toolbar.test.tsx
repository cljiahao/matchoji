// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { DiscoverToolbar } from './discover-toolbar';

const REGION = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';
const regions = [{ id: REGION, name: 'Uji, Kyoto' }];

beforeEach(() => {
  router.push.mockClear();
});

describe('DiscoverToolbar', () => {
  it('searches with a GET form that keeps the other filters', () => {
    render(
      <DiscoverToolbar
        filters={{ q: 'uji', category: 'matcha', sort: 'newest' }}
        regions={regions}
      />
    );

    const search = screen.getByRole('searchbox', { name: 'Search teas' });
    expect(search).toHaveValue('uji');
    const form = search.closest('form')!;
    expect(form).toHaveAttribute('action', '/');
    expect(form.querySelector('input[name=category]')).toHaveValue('matcha');
    expect(form.querySelector('input[name=sort]')).toHaveValue('newest');
  });

  it('navigates when the region or sort changes', async () => {
    render(<DiscoverToolbar filters={{ q: 'uji', sort: 'top' }} regions={regions} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Region' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Uji, Kyoto' }));
    expect(router.push).toHaveBeenLastCalledWith(`/?q=uji&region=${REGION}`);

    await userEvent.click(screen.getByRole('combobox', { name: 'Sort' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Most reviewed' }));
    expect(router.push).toHaveBeenLastCalledWith('/?q=uji&sort=reviewed');
  });

  it('clears the region with "All regions" and hides the picker without regions', async () => {
    const { rerender } = render(
      <DiscoverToolbar filters={{ regionId: REGION, sort: 'top' }} regions={regions} />
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Region' }));
    await userEvent.click(await screen.findByRole('option', { name: 'All regions' }));
    expect(router.push).toHaveBeenLastCalledWith('/');

    rerender(<DiscoverToolbar filters={{ sort: 'top' }} regions={[]} />);
    expect(screen.queryByRole('combobox', { name: 'Region' })).not.toBeInTheDocument();
  });
});
