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

const catalogue = [{ id: 't1', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' as const }];

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
    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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

    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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

  it('removes the photo, and its credit, when asked', async () => {
    const fake = createFakeBrowserClient({
      results: { 'rpc:set_tea_links': { data: null, error: null } },
    });
    supabase.current = fake.client;
    renderWithQuery(<TeaLinksForm catalogue={catalogue} />);

    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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

    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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

    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
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

    await userEvent.selectOptions(screen.getByLabelText('Tea'), 't1');
    await userEvent.click(screen.getByRole('button', { name: 'Save tea' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not update the tea. Try again.')
    );
    expect(fake.upload).not.toHaveBeenCalled();
  });
});
