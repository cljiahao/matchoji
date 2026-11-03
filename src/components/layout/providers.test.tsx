// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import './providers';

describe('Providers module', () => {
  it('turns off Zod JIT so the browser never probes for eval under the CSP', () => {
    expect(z.config().jitless).toBe(true);
  });
});
