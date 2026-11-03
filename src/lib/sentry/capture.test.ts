import { afterEach, describe, expect, it, vi } from 'vitest';

const captureException = vi.fn();
vi.mock('@sentry/nextjs', () => ({ captureException }));

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  captureException.mockClear();
});

describe('captureClientError', () => {
  it('does nothing without a public DSN', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
    const { captureClientError } = await import('./capture');
    captureClientError(new Error('x'));
    await Promise.resolve();
    expect(captureException).not.toHaveBeenCalled();
  });

  it('reports the error with a public DSN', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://key@o1.ingest.sentry.io/2');
    const { captureClientError } = await import('./capture');
    const error = new Error('boom');
    captureClientError(error);
    await vi.waitFor(() => expect(captureException).toHaveBeenCalledWith(error));
  });
});
