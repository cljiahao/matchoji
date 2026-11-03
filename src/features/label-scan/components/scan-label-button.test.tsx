// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '../../../../test/support/render';

const session = vi.hoisted(() => ({ current: { user: { id: 'u1' } } as unknown }));
vi.mock('@/features/auth', () => ({ useSession: () => ({ session: session.current }) }));
vi.mock('../lib/downscale-image', () => ({ downscaleImage: async (file: File) => file }));

const toast = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { ScanLabelButton } from './scan-label-button';

const RESULT = {
  reading: {
    maker: 'Ippodo',
    name: 'Ummon',
    category: 'matcha',
    grade: null,
    origin: null,
    harvest: null,
    netWeightGrams: null,
    confidence: 'high',
  },
  match: null,
};

function mockFetch(enabled: boolean, scan: () => Promise<Response>) {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
    init?.method === 'POST' ? scan() : Response.json({ enabled })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const photo = () => new File(['x'], 'tin.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  vi.clearAllMocks();
  session.current = { user: { id: 'u1' } };
});

describe('ScanLabelButton', () => {
  it('stays hidden while the server has no API key', async () => {
    const fetchMock = mockFetch(false, async () => Response.json(RESULT));
    renderWithQuery(<ScanLabelButton onScanned={vi.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /scan label/i })).not.toBeInTheDocument();
  });

  it('stays hidden, and asks nothing, when signed out', () => {
    session.current = null;
    const fetchMock = mockFetch(true, async () => Response.json(RESULT));
    renderWithQuery(<ScanLabelButton onScanned={vi.fn()} />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /scan label/i })).not.toBeInTheDocument();
  });

  it('shows a loading state while reading, then hands the result over', async () => {
    let finish: (response: Response) => void = () => {};
    mockFetch(true, () => new Promise<Response>((resolve) => (finish = resolve)));
    const onScanned = vi.fn();
    renderWithQuery(<ScanLabelButton onScanned={onScanned} />);

    await screen.findByRole('button', { name: 'Scan label' });
    await userEvent.upload(screen.getByTestId('label-scan-input'), photo());

    const busy = await screen.findByRole('button', { name: 'Reading label…' });
    expect(busy).toBeDisabled();

    finish(Response.json(RESULT));
    await waitFor(() => expect(onScanned).toHaveBeenCalledWith(RESULT));
    expect(screen.getByRole('button', { name: 'Scan label' })).toBeEnabled();
  });

  it.each([
    [422, /couldn't read that label/i],
    [429, /scanned a lot/i],
  ])('explains a %i without prefilling anything', async (status, message) => {
    mockFetch(true, async () => Response.json({ error: 'x' }, { status }));
    const onScanned = vi.fn();
    renderWithQuery(<ScanLabelButton onScanned={onScanned} />);
    await screen.findByRole('button', { name: 'Scan label' });
    await userEvent.upload(screen.getByTestId('label-scan-input'), photo());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(message)));
    expect(onScanned).not.toHaveBeenCalled();
  });

  it('says so when the network is down', async () => {
    mockFetch(true, async () => {
      throw new TypeError('Failed to fetch');
    });
    renderWithQuery(<ScanLabelButton onScanned={vi.fn()} />);
    await screen.findByRole('button', { name: 'Scan label' });
    await userEvent.upload(screen.getByTestId('label-scan-input'), photo());
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/offline/i))
    );
  });
});
