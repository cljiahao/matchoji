import { afterEach, describe, expect, it, vi } from 'vitest';

const init = vi.fn();
const captureRequestError = vi.fn();
vi.mock('@sentry/nextjs', () => ({ init, captureRequestError }));

const DSN = 'https://key@o1.ingest.sentry.io/2';
const request = { path: '/api/x', method: 'GET', headers: {} };
const context = {
  routerKind: 'App Router',
  routePath: '/api/x',
  routeType: 'route',
  renderSource: undefined,
  revalidateReason: undefined,
} as never;

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  init.mockClear();
  captureRequestError.mockClear();
});

describe('instrumentation', () => {
  it('does nothing without a DSN', async () => {
    vi.stubEnv('SENTRY_DSN', '');
    const { register, onRequestError } = await import('./instrumentation');
    await register();
    await onRequestError(new Error('x'), request, context);
    expect(init).not.toHaveBeenCalled();
    expect(captureRequestError).not.toHaveBeenCalled();
  });

  it('inits and reports request errors with a DSN', async () => {
    vi.stubEnv('SENTRY_DSN', DSN);
    const { register, onRequestError } = await import('./instrumentation');
    await register();
    const error = new Error('boom');
    await onRequestError(error, request, context);
    expect(init).toHaveBeenCalledWith(expect.objectContaining({ dsn: DSN }));
    expect(captureRequestError).toHaveBeenCalledWith(error, request, context);
  });
});

describe('instrumentation-client', () => {
  it('does not init in the browser without a public DSN', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
    await import('./instrumentation-client');
    await Promise.resolve();
    expect(init).not.toHaveBeenCalled();
  });

  it('inits in the browser with a public DSN', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', DSN);
    await import('./instrumentation-client');
    await vi.waitFor(() =>
      expect(init).toHaveBeenCalledWith(expect.objectContaining({ dsn: DSN }))
    );
  });
});
