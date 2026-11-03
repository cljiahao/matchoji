// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/server', () => ({ createClient: async () => supabase.current }));
vi.mock('next/server', () => ({ connection: async () => {} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import RegionsPage from './page';

describe('RegionsPage', () => {
  it('renders the labelled map above the accessible list of regions', async () => {
    supabase.current = createFakeSupabase({
      regions: {
        data: [
          {
            id: 'r1',
            name: 'Uji, Kyoto',
            prefecture: 'Kyoto',
            scarcity_note: null,
            matcha_supply: 'scarce',
            hojicha_supply: null,
          },
        ],
        error: null,
      },
      products: { data: [{ region_id: 'r1', category: 'matcha' }], error: null },
    }).client;

    render(await RegionsPage({ searchParams: Promise.resolve({}) }));

    const map = screen.getByRole('region', { name: 'Map of tea-growing regions' });
    expect(map).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(within(list).getByRole('link', { name: /Uji, Kyoto/ })).toHaveAttribute(
      'href',
      '/explore?region=r1'
    );
    expect(map.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows no map when no region has coordinates', async () => {
    supabase.current = createFakeSupabase({
      regions: { data: [], error: null },
      products: { data: [], error: null },
    }).client;
    render(await RegionsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByText('No regions listed yet.')).toBeInTheDocument();
  });
});
