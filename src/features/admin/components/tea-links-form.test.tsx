// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

import { TeaLinksForm } from './tea-links-form';

const catalogue = [
  {
    id: 't1',
    name: 'Sayaka',
    brand: 'Ippodo',
    category: 'matcha' as const,
    imageUrl: null,
    imageCredit: null,
    shopUrl: null,
  },
  {
    id: 't2',
    name: 'Uji Gold',
    brand: 'Marukyu',
    category: 'matcha' as const,
    imageUrl: 'https://cdn.test/gold.webp',
    imageCredit: 'Marukyu Koyamaen',
    shopUrl: 'https://shop.example/gold',
  },
];

// The catalogue picker is a Radix select, so a pick is a click on the trigger then an option.
async function pickTea(label: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TeaLinksForm', () => {
  it('uploads the photo under the tea, then saves it with the credit and shop link', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:set_tea_links': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    const save = screen.getByRole('button', { name: 'Save tea' });
    expect(save).toBeDisabled();
    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.upload(
      screen.getByLabelText('Photo (optional)'),
      new File(['x'], 'Tin Shot.WEBP', { type: 'image/webp' })
    );
    await userEvent.type(screen.getByLabelText('Photo credit (optional)'), ' Marukyu Koyamaen ');
    await userEvent.type(
      screen.getByLabelText('Shop link (optional)'),
      'https://shop.example/sayaka'
    );
    await userEvent.click(save);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Tea updated.'));
    const path = fake.upload.mock.calls[0][0];
    expect(path).toMatch(/^t1\/[0-9a-f-]{36}\.webp$/);
    expect(fake.calls).toContainEqual({
      table: 'rpc:set_tea_links',
      method: 'rpc',
      args: [
        {
          tea: 't1',
          image: `https://cdn.test/${path}`,
          shop: 'https://shop.example/sayaka',
          credit: 'Marukyu Koyamaen',
        },
      ],
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it('keeps the current photo when no file is chosen', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:set_tea_links': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.type(screen.getByLabelText('Photo credit (optional)'), 'Ippodo');
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(fake.upload).not.toHaveBeenCalled();
    expect(fake.calls).toContainEqual({
      table: 'rpc:set_tea_links',
      method: 'rpc',
      args: [{ tea: 't1', image: null, shop: '', credit: 'Ippodo' }],
    });
  });

  it('shows the tea’s saved credit and shop link, and clears them after saving', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:set_tea_links': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Uji Gold · Marukyu');
    expect(screen.getByLabelText('Photo credit (optional)')).toHaveValue('Marukyu Koyamaen');
    expect(screen.getByLabelText('Shop link (optional)')).toHaveValue('https://shop.example/gold');

    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.getByRole('combobox', { name: 'Tea' })).toHaveTextContent('Pick a tea');
    expect(screen.getByLabelText('Photo credit (optional)')).toHaveValue('');
    expect(screen.getByLabelText('Shop link (optional)')).toHaveValue('');
  });

  it('editing only the shop link keeps the credit', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:set_tea_links': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Uji Gold · Marukyu');
    const shop = screen.getByLabelText('Shop link (optional)');
    await userEvent.clear(shop);
    await userEvent.type(shop, 'https://shop.example/new');
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(fake.calls).toContainEqual({
      table: 'rpc:set_tea_links',
      method: 'rpc',
      args: [
        { tea: 't2', image: null, shop: 'https://shop.example/new', credit: 'Marukyu Koyamaen' },
      ],
    });
  });

  it('editing only the credit keeps the shop link', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:set_tea_links': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Uji Gold · Marukyu');
    const credit = screen.getByLabelText('Photo credit (optional)');
    await userEvent.clear(credit);
    await userEvent.type(credit, 'Ippodo');
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(fake.calls).toContainEqual({
      table: 'rpc:set_tea_links',
      method: 'rpc',
      args: [{ tea: 't2', image: null, shop: 'https://shop.example/gold', credit: 'Ippodo' }],
    });
  });

  it('removes the photo, and its credit, when asked', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:set_tea_links': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.click(screen.getByLabelText('Remove photo'));
    expect(screen.getByLabelText('Photo (optional)')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(fake.upload).not.toHaveBeenCalled();
    expect(fake.calls).toContainEqual({
      table: 'rpc:set_tea_links',
      method: 'rpc',
      args: [{ tea: 't1', image: '', shop: '', credit: '' }],
    });
  });

  it('refuses a credit over 120 characters before saving anything', async () => {
    const fake = createFakeBrowserClient({});
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Sayaka · Ippodo');
    fireEvent.change(screen.getByLabelText('Photo credit (optional)'), {
      target: { value: 'x'.repeat(121) },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    expect(toast.error).toHaveBeenCalledWith('Keep the photo credit to 120 characters.');
    expect(fake.calls).toEqual([]);
  });

  it('refuses an http shop link before saving anything', async () => {
    const fake = createFakeBrowserClient({});
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.type(screen.getByLabelText('Shop link (optional)'), 'http://shop.example');
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    expect(toast.error).toHaveBeenCalledWith('Use an https:// shop link.');
    expect(fake.calls).toEqual([]);
  });

  it('reports a failed save', async () => {
    const fake = createFakeBrowserClient({
      results: {
        'rpc:set_tea_links': { data: null, error: new Error('Only admins can do that.') },
      },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Sayaka · Ippodo');
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not update the tea. Try again.')
    );
    expect(fake.upload).not.toHaveBeenCalled();
  });

  it('shows the picked tea’s current photo and credit, or says it has none', async () => {
    supabase.current = createFakeBrowserClient().client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    expect(screen.getByText('Pick a tea to edit it.')).toBeInTheDocument();
    await pickTea('Tea', 'Uji Gold · Marukyu');
    expect(screen.getByRole('img', { name: 'Current photo of Uji Gold' })).toHaveAttribute(
      'src',
      'https://cdn.test/gold.webp'
    );
    expect(screen.getByText('Photo: Marukyu Koyamaen')).toBeInTheDocument();

    await pickTea('Tea', 'Sayaka · Ippodo');
    expect(screen.getByText('No photo yet; the drawn tin shows.')).toBeInTheDocument();
  });

  it('Reset puts the tea’s saved credit and link back', async () => {
    supabase.current = createFakeBrowserClient().client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await pickTea('Tea', 'Uji Gold · Marukyu');
    const credit = screen.getByLabelText('Photo credit (optional)');
    await userEvent.clear(credit);
    expect(screen.getByText('0/120')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(credit).toHaveValue('Marukyu Koyamaen');
  });
});
