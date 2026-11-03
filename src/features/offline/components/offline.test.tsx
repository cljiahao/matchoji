// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SERVICE_WORKER_URL } from '../constants';
import { OfflineScreen } from './offline-screen';
import { RegisterServiceWorker } from './register-service-worker';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('OfflineScreen', () => {
  it('says the visitor is offline and offers a retry', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(<OfflineScreen />);
    expect(screen.getByRole('heading', { name: 'You’re offline' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reload).toHaveBeenCalled();
  });
});

describe('RegisterServiceWorker', () => {
  function stubWorker() {
    const register = vi.fn().mockResolvedValue({});
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: { register } });
    return register;
  }

  it('registers the build-versioned worker in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const register = stubWorker();
    render(<RegisterServiceWorker />);
    expect(register).toHaveBeenCalledWith(SERVICE_WORKER_URL, { scope: '/' });
  });

  it('does nothing outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const register = stubWorker();
    render(<RegisterServiceWorker />);
    expect(register).not.toHaveBeenCalled();
  });

  it('survives a failed registration and a browser without workers', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const register = vi.fn().mockRejectedValue(new Error('blocked'));
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: { register } });
    render(<RegisterServiceWorker />);
    await Promise.resolve();
    vi.stubGlobal('navigator', {});
    expect(() => render(<RegisterServiceWorker />)).not.toThrow();
  });
});
