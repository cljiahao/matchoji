// @vitest-environment jsdom
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { dateLabel, Decision, errorMessage, useAction } from './moderation-controls';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('errorMessage', () => {
  it('uses the message of an Error or a plain Supabase error object', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage({ message: 'approve the café first' })).toBe('approve the café first');
  });

  it('falls back for anything without a usable message', () => {
    const fallback = 'That did not work. Try again.';
    expect(errorMessage(null)).toBe(fallback);
    expect(errorMessage('nope')).toBe(fallback);
    expect(errorMessage({ message: '' })).toBe(fallback);
    expect(errorMessage({ message: 42 })).toBe(fallback);
  });
});

describe('dateLabel', () => {
  it('writes day, short month and year', () => {
    expect(dateLabel('2026-11-10T08:00:00Z')).toBe('10 Nov 2026');
  });
});

describe('useAction', () => {
  it('toasts success and refreshes the page after the action', async () => {
    const { result } = renderHook(() => useAction());
    await act(() => result.current.run(async () => {}, 'Approved'));
    expect(toast.success).toHaveBeenCalledWith('Approved');
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.busy).toBe(false);
  });

  it('toasts the error, skips the refresh and clears busy when the action throws', async () => {
    const { result } = renderHook(() => useAction());
    await act(() =>
      result.current.run(() => Promise.reject({ message: 'approve the café first' }), 'Approved')
    );
    expect(toast.error).toHaveBeenCalledWith('approve the café first');
    expect(toast.success).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(false);
  });
});

describe('Decision', () => {
  it('approves in one tap with no note', async () => {
    const onDecide = vi.fn();
    render(<Decision label="Kurasu" onDecide={onDecide} busy={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve Kurasu' }));
    expect(onDecide).toHaveBeenCalledWith('approved');
  });

  it('disables approve while busy', () => {
    render(<Decision label="Kurasu" onDecide={vi.fn()} busy />);
    expect(screen.getByRole('button', { name: 'Approve Kurasu' })).toBeDisabled();
  });

  it('needs a reason before rejecting, then sends it', async () => {
    const onDecide = vi.fn();
    render(<Decision label="Kurasu" onDecide={onDecide} busy={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reject…' }));
    const reject = screen.getByRole('button', { name: 'Reject Kurasu' });
    expect(reject).toBeDisabled();
    expect(screen.getByText('A reason is needed.')).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Reason for rejecting Kurasu' }),
      'Dup'
    );
    expect(reject).toBeEnabled();
    await userEvent.click(reject);
    expect(onDecide).toHaveBeenCalledWith('rejected', 'Dup');
  });

  it('cancel returns to the approve and reject buttons', async () => {
    render(<Decision label="Kurasu" onDecide={vi.fn()} busy={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reject…' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Approve Kurasu' })).toBeInTheDocument();
  });
});
