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

function setup(error: unknown = null) {
  const fake = createFakeBrowserClient({ results: { 'rpc:set_tea_price': { data: null, error } } });
  supabase.current = fake.client;
  renderWithQuery(<TeaPriceForm catalogue={catalogue} />);
  return fake;
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

    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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
    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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
    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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
});
