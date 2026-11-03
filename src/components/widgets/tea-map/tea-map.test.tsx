// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { TeaMap } from './tea-map';

describe('TeaMap', () => {
  it('is a labelled region', () => {
    render(<TeaMap label="Map of shops" pins={[]} />);
    expect(screen.getByRole('region', { name: 'Map of shops' })).toBeInTheDocument();
  });

  it('draws each pin with its name, and credits OpenStreetMap', async () => {
    render(
      <TeaMap
        label="Map"
        pins={[
          {
            id: 'a',
            lat: 34.88,
            lng: 135.8,
            name: 'Uji, Kyoto',
            text: '5',
            tone: 'matcha',
            description: '5 matcha',
          },
          {
            id: 'b',
            lat: 35.0,
            lng: 135.7,
            name: 'Kyoto Main Store',
            link: { label: 'Directions', href: 'https://x.test' },
          },
        ]}
      />
    );
    const pin = await waitFor(() => {
      const el = document.querySelector('.leaflet-marker-icon[aria-label^="Uji, Kyoto"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(pin).toHaveAttribute('aria-label', 'Uji, Kyoto. 5 matcha');
    expect(pin).toHaveAttribute('title', 'Uji, Kyoto');
    expect(pin.querySelector('.tea-pin')).toHaveTextContent('5');
    expect(document.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2);
    const tile = document.querySelector('.tea-map-tiles img');
    if (tile) expect(tile.getAttribute('src')).toContain('https://tile.openstreetmap.org/');
    expect(screen.getByText('OpenStreetMap')).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright'
    );
  });
});
