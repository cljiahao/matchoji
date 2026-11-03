import { describe, expect, it, vi } from 'vitest';

import { initSentry } from './init';
import { scrubEvent } from './scrub';

describe('initSentry', () => {
  it('skips init entirely without a DSN', () => {
    const init = vi.fn();
    expect(initSentry(undefined, init)).toBe(false);
    expect(initSentry('', init)).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('inits privately with a DSN: low trace sampling, scrubbing on', () => {
    const init = vi.fn();
    expect(initSentry('https://key@o1.ingest.sentry.io/2', init)).toBe(true);
    expect(init).toHaveBeenCalledOnce();
    const options = init.mock.calls[0][0];
    expect(options).toMatchObject({
      dsn: 'https://key@o1.ingest.sentry.io/2',
      tracesSampleRate: 0.1,
      beforeSend: scrubEvent,
    });
    expect(options).not.toHaveProperty('sendDefaultPii', true);
    expect(options.replaysSessionSampleRate).toBeUndefined();
  });
});
