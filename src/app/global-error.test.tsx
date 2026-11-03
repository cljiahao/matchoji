// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { captureClientError } from '@/lib/sentry/capture';

import GlobalError from './global-error';

vi.mock('@/lib/errors/error-log-handler', () => ({ logError: vi.fn() }));
vi.mock('@/lib/sentry/capture', () => ({ captureClientError: vi.fn() }));

describe('global error boundary', () => {
  it('reports the error, shows its reference and retries', () => {
    const error = Object.assign(new Error('x'), { digest: 'abc' });
    const reset = vi.fn();
    render(<GlobalError error={error} reset={reset} />, {
      container: document.documentElement,
    });
    expect(captureClientError).toHaveBeenCalledWith(error);
    expect(screen.getByText('Reference: abc')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
