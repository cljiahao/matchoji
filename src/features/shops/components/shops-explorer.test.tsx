// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/widgets/tea-map', () => ({
  TeaMap: ({ label, pins }: { label: string; pins: unknown[] }) => (
    <div role="region" aria-label={label} data-pins={pins.length} />
  ),
}));

import type { Shop } from '../types';
import { ShopsExplorer } from './shops-explorer';

const shop = (over: Partial<Shop>): Shop => ({
  id: 'x',
  brand: 'Ippodo',
  name: 'Kyoto Main Store',
  kind: 'maker_store',
  address: '52 Tokiwagi-cho',
  city: 'Kyoto',
  country: 'Japan',
  lat: 35,
  lng: 135,
  sourceUrl: 'https://example.com/src',
  checkedAt: '2026-11-03',
  ...over,
});

const shops = [
  shop({ id: '1' }),
  shop({
    id: '2',
    brand: 'Aiya',
    name: 'Aiya Singapore',
    kind: 'stockist',
    country: 'Singapore',
    city: 'Singapore',
  }),
];

describe('ShopsExplorer', () => {
  it('lists every shop with address, directions and source, beside a labelled map', () => {
    render(<ShopsExplorer shops={shops} />);
    expect(screen.getByRole('region', { name: 'Map of shops' })).toHaveAttribute('data-pins', '2');
    const item = screen.getByText('Kyoto Main Store').closest('li') as HTMLElement;
    expect(within(item).getByText('52 Tokiwagi-cho')).toBeInTheDocument();
    expect(within(item).getByRole('link', { name: 'Directions' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://www.openstreetmap.org/search')
    );
    expect(within(item).getByRole('link', { name: 'Source' })).toHaveAttribute(
      'href',
      'https://example.com/src'
    );
  });

  it('filters by maker, kind and country', async () => {
    render(<ShopsExplorer shops={shops} />);
    await userEvent.selectOptions(screen.getByLabelText('Country'), 'Singapore');
    expect(screen.queryByText('Kyoto Main Store')).toBeNull();
    expect(screen.getByText('Aiya Singapore')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Map of shops' })).toHaveAttribute('data-pins', '1');

    await userEvent.selectOptions(screen.getByLabelText('Kind'), 'cafe');
    expect(screen.getByText('No shops match those filters.')).toBeInTheDocument();
  });

  it('starts on the maker from the link, whatever its case', () => {
    render(<ShopsExplorer shops={shops} initialBrand="aiya" />);
    expect(screen.getByLabelText('Maker')).toHaveValue('Aiya');
    expect(screen.queryByText('Kyoto Main Store')).toBeNull();
  });

  it('ignores a maker no shop has', () => {
    render(<ShopsExplorer shops={shops} initialBrand="Nobody" />);
    expect(screen.getByLabelText('Maker')).toHaveValue('');
    expect(screen.getByText('Kyoto Main Store')).toBeInTheDocument();
  });
});
