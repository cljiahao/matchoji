import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPhoto } from './fetch-photo';

function reply(body: BodyInit, init: ResponseInit & { type?: string } = {}) {
  const { type = 'image/png', ...rest } = init;
  return new Response(body, { ...rest, headers: { 'content-type': type } });
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchPhoto', () => {
  it('returns null without a url and does not fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchPhoto(null)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a data URI for a PNG', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(reply('abc', { type: 'image/png; charset=x' }))
    );
    expect(await fetchPhoto('https://x.test/a.png')).toBe(
      `data:image/png;base64,${Buffer.from('abc').toString('base64')}`
    );
  });

  it('accepts a JPEG', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply('abc', { type: 'image/jpeg' })));
    expect(await fetchPhoto('https://x.test/a.jpg')).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('returns null for a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply('nope', { status: 404 })));
    expect(await fetchPhoto('https://x.test/a.png')).toBeNull();
  });

  it('returns null for a type satori cannot decode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply('abc', { type: 'image/webp' })));
    expect(await fetchPhoto('https://x.test/a.webp')).toBeNull();
  });

  it('returns null for a response with no content type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('abc')));
    expect(await fetchPhoto('https://x.test/a')).toBeNull();
  });

  it('returns null for a photo over the size cap', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(new Uint8Array(4_000_001))));
    expect(await fetchPhoto('https://x.test/big.png')).toBeNull();
  });

  it('returns null when the request fails or times out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError')));
    expect(await fetchPhoto('https://x.test/a.png')).toBeNull();
  });
});
