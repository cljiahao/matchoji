// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeBrowserClient } from '../../../../test/support/fake-browser-client';
import { renderWithQuery } from '../../../../test/support/render';

const supabase = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@/integrations/supabase/client', () => ({ createClient: () => supabase.current }));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { TeaPriceForm, teaPriceSchema } from './tea-price-form';

const catalogue = [{ id: 't1', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' as const }];

function setup(error: unknown = null, history: unknown[] = []) {
  const fake = createFakeBrowserClient({
    results: {
      'rpc:set_tea_price': { data: null, error },
      tea_price_history: { data: history, error: null },
    },
  });
  supabase.current = fake.client;
  renderWithQuery(<TeaPriceForm catalogue={catalogue} />);
  return fake;
}

// The catalogue picker is a Radix select, so a pick is a click on the trigger then an option.
async function pickTea(label: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('teaPriceSchema', () => {
  it('takes both values or neither', () => {
    expect(teaPriceSchema.parse({ price: '32.5', grams: '40' })).toEqual({
      price: 32.5,
      grams: 40,
    });
    expect(teaPriceSchema.parse({ price: '', grams: '' })).toBeNull();
    for (const bad of [
      { price: '32', grams: '' },
      { price: '0', grams: '40' },
      { price: 'abc', grams: '40' },
      { price: '10', grams: '6000' },
    ]) {
      expect(teaPriceSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe('TeaPriceForm', () => {
  it('saves a tea’s pack price and size', async () => {
    const fake = setup();
    const save = screen.getByRole('button', { name: 'Save price' });
    expect(save).toBeDisabled();

    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.type(screen.getByLabelText('Price (S$)'), '32');
    await userEvent.type(screen.getByLabelText('Pack size (g)'), '40');
    await userEvent.click(save);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Price saved.'));
    expect(fake.calls).toContainEqual({
      table: 'rpc:set_tea_price',
      method: 'rpc',
      args: [{ tea: 't1', price: 32, grams: 40 }],
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it('clears the price when both fields are empty', async () => {
    const fake = setup();
    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.click(screen.getByRole('button', { name: 'Save price' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Price cleared.'));
    expect(fake.calls).toContainEqual({
      table: 'rpc:set_tea_price',
      method: 'rpc',
      args: [{ tea: 't1', price: null, grams: null }],
    });
  });

  it('refuses half a price without saving, and reports a failed save', async () => {
    const fake = setup(new Error('denied'));
    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.type(screen.getByLabelText('Price (S$)'), '32');
    await userEvent.click(screen.getByRole('button', { name: 'Save price' }));
    expect(toast.error).toHaveBeenCalledWith(
      'Give both a price and a pack size above zero, or leave both empty.'
    );
    expect(fake.calls.some((c) => c.table === 'rpc:set_tea_price')).toBe(false);

    await userEvent.type(screen.getByLabelText('Pack size (g)'), '40');
    await userEvent.click(screen.getByRole('button', { name: 'Save price' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not save the price. Try again.')
    );
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('says why Save is off until a tea is picked, and shows the units beside the numbers', () => {
    setup();

    expect(screen.getByText('Pick a tea to set its price.')).toBeInTheDocument();
    expect(screen.getByText('S$')).toBeInTheDocument();
    expect(screen.getByText('g')).toBeInTheDocument();
  });
});

describe('TeaPriceForm history', () => {
  it('lists the last five recorded prices of the picked tea, newest first', async () => {
    const history = [1, 2, 3, 4, 5, 6].map((m) => ({
      recorded_at: `2026-0${m}-10T00:00:00Z`,
      price: 30 + m,
      pack_grams: '40.0',
    }));
    setup(null, history);
    expect(screen.queryByText('Recent prices')).not.toBeInTheDocument();

    await pickTea('Tea', 'Sayaka · Ippodo');

    const items = await screen.findAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      'Jun 2026: S$36.00 for 40 g · S$0.90/g',
      'May 2026: S$35.00 for 40 g · S$0.88/g',
      'Apr 2026: S$34.00 for 40 g · S$0.85/g',
      'Mar 2026: S$33.00 for 40 g · S$0.82/g',
      'Feb 2026: S$32.00 for 40 g · S$0.80/g',
    ]);
  });
});

describe('TeaPriceForm tap targets', () => {
  it('keeps every control at least 44px tall', () => {
    setup();
    for (const control of [
      screen.getByRole('combobox', { name: 'Tea' }),
      screen.getByLabelText('Price (S$)'),
      screen.getByLabelText('Pack size (g)'),
      screen.getByRole('button', { name: 'Save price' }),
    ]) {
      expect(control.className).toMatch(/(^|\s)(min-)?h-11(\s|$)/);
    }
  });
});
