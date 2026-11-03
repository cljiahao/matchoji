import type { ErrorEvent } from '@sentry/nextjs';
import { describe, expect, it } from 'vitest';

import { scrubEvent } from './scrub';

const jwt = 'eyJhbGciOi.eyJzdWIiOiIxMjM0.c2lnbmF0dXJl';

describe('scrubEvent', () => {
  it('drops the user, cookies, auth headers, body and query string', () => {
    const event = {
      type: undefined,
      user: { email: 'a@b.co', id: '1' },
      request: {
        url: 'https://matchoji.vercel.app/explore',
        cookies: { 'sb-abc-auth-token': jwt },
        data: { email: 'a@b.co' },
        query_string: 'token=1',
        headers: { Cookie: 'sb=1', Authorization: `Bearer ${jwt}`, 'user-agent': 'x' },
      },
    } as ErrorEvent;
    const out = scrubEvent(event);
    expect(out.user).toBeUndefined();
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.data).toBeUndefined();
    expect(out.request?.query_string).toBeUndefined();
    expect(out.request?.headers).toEqual({ 'user-agent': 'x' });
    expect(out.request?.url).toBe('https://matchoji.vercel.app/explore');
  });

  it('redacts emails and Supabase JWTs in messages and breadcrumbs', () => {
    const out = scrubEvent({
      type: undefined,
      message: 'failed for jo@example.com',
      exception: { values: [{ value: `bad token ${jwt}` }] },
      breadcrumbs: [{ message: 'auth ok', data: { access_token: jwt, note: 'x@y.org' } }],
    } as ErrorEvent);
    const text = JSON.stringify(out);
    expect(text).not.toContain('jo@example.com');
    expect(text).not.toContain('x@y.org');
    expect(text).not.toContain(jwt);
    expect(out.breadcrumbs?.[0].message).toBe('auth ok');
  });
});
