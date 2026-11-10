// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient, makeSession } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/',
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SignInPromptProvider } from '@/features/auth';

import DrinkLogFlow from './drink-log-flow';

const CAFE_ID = '11111111-1111-4111-8111-111111111111';
const CAFE_ROW = {
  id: CAFE_ID,
  slug: 'kissa',
  name: 'Kissa',
  city_slug: 'singapore',
  area: null,
  address: null,
  lat: null,
  lng: null,
  instagram_handle: null,
  website_url: null,
  status: 'pending',
};
const DRINK_ROW = {
  id: 'd1',
  cafe_id: CAFE_ID,
  slug: 'hojicha-latte',
  name: 'Hojicha latte',
  base: 'hojicha',
  style: 'latte',
  serving: 'hot',
  price: null,
  currency: 'SGD',
  photo_url: null,
  photo_credit: null,
  tea_product_id: null,
  status: 'pending',
};

function setup(
  results: NonNullable<Parameters<typeof createFakeBrowserClient>[0]>['results'],
  props: Partial<Parameters<typeof DrinkLogFlow>[0]> = {}
) {
  const onDone = vi.fn();
  const fake = createFakeBrowserClient({
    session: makeSession(),
    results: { public_profiles: { data: { is_trusted_taster: false }, error: null }, ...results },
  });
  supabase.current = fake.client;
  renderWithQuery(
    <SignInPromptProvider>
      <Dialog open>
        <DialogContent>
          <DrinkLogFlow onDone={onDone} {...props} />
        </DialogContent>
      </Dialog>
    </SignInPromptProvider>
  );
  return { ...fake, onDone };
}

async function pick(dialog: HTMLElement, label: string, option: string) {
  await userEvent.click(within(dialog).getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DrinkLogFlow', () => {
  it('lets user add a new café then a drink then rate', async () => {
    const { calls, onDone } = setup({
      cafes: [
        { data: [], error: null },
        { data: CAFE_ROW, error: null },
      ],
      drinks: [
        { data: [], error: null },
        { data: DRINK_ROW, error: null },
      ],
      reviews: { data: null, error: null },
    });

    await userEvent.click(await screen.findByRole('combobox', { name: 'Search cafés' }));
    await userEvent.paste('Kissa');
    await userEvent.click(await screen.findByRole('button', { name: 'Add this café' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Café name')).toHaveValue('Kissa');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add café' }));
    await waitFor(() =>
      expect(
        calls.find((c) => c.table === 'cafes' && c.method === 'insert')?.args[0]
      ).toMatchObject({
        name: 'Kissa',
        city_slug: 'singapore',
      })
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Add a drink' }));
    await userEvent.type(within(dialog).getByLabelText('Drink name'), 'Hojicha latte');
    await pick(dialog, 'Tea', 'Hojicha');
    await pick(dialog, 'Style', 'Latte');
    await pick(dialog, 'Served', 'Hot');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add drink' }));
    await waitFor(() =>
      expect(
        calls.find((c) => c.table === 'drinks' && c.method === 'insert')?.args[0]
      ).toMatchObject({
        cafe_id: CAFE_ID,
        name: 'Hojicha latte',
        base: 'hojicha',
      })
    );

    expect(await screen.findByRole('heading', { name: 'Rate Hojicha latte' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('radio', { name: '5 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rating' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const insert = calls.find((c) => c.table === 'reviews' && c.method === 'insert');
    expect(insert?.args[0]).toMatchObject({ drink_id: 'd1', stars: 5 });
    expect(insert?.args[0]).not.toHaveProperty('product_id');
  });

  it('picks an existing café and drink, marking pending ones', async () => {
    setup({
      cafes: { data: [CAFE_ROW], error: null },
      drinks: { data: [DRINK_ROW], error: null },
    });

    await userEvent.click(await screen.findByRole('combobox', { name: 'Search cafés' }));
    await userEvent.paste('Ki');
    await userEvent.click(await screen.findByRole('option', { name: /Kissa.*awaiting review/ }));
    await userEvent.click(await screen.findByRole('option', { name: /Hojicha latte/ }));

    expect(await screen.findByRole('heading', { name: 'Rate Hojicha latte' })).toBeInTheDocument();
  });

  it('starts at rating when given a drink', async () => {
    setup({}, { initialDrink: { id: 'd1', name: 'Hojicha latte', base: 'hojicha' } });

    expect(await screen.findByRole('heading', { name: 'Rate Hojicha latte' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Search cafés' })).not.toBeInTheDocument();
  });

  it('moves focus to the new step heading', async () => {
    setup({ cafes: { data: [], error: null } });

    await userEvent.click(await screen.findByRole('combobox', { name: 'Search cafés' }));
    await userEvent.paste('Kissa');
    await userEvent.click(await screen.findByRole('button', { name: 'Add this café' }));

    expect(await screen.findByRole('heading', { name: 'Log a café drink' })).toHaveFocus();
  });

  it('offers a retry instead of the community form when the taster lookup fails', async () => {
    setup(
      {
        public_profiles: [
          { data: null, error: { code: 'x' } },
          { data: null, error: { code: 'x' } },
        ],
      },
      { initialDrink: { id: 'd1', name: 'Hojicha latte', base: 'hojicha' } }
    );

    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: '5 stars' })).not.toBeInTheDocument();
  });

  it('tells the person when they have too many items waiting for review', async () => {
    setup({
      cafes: [
        { data: [], error: null },
        {
          data: null,
          error: { code: 'P0001', message: 'You have too many cafés waiting for review.' },
        },
      ],
    });

    await userEvent.click(await screen.findByRole('combobox', { name: 'Search cafés' }));
    await userEvent.paste('Kissa');
    await userEvent.click(await screen.findByRole('button', { name: 'Add this café' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add café' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "You have too many cafés waiting for review. Try again once they're approved."
      )
    );
  });
});
