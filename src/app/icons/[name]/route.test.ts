import { describe, expect, it } from 'vitest';

import { GET, generateStaticParams } from './route';

const call = (name: string) =>
  GET(new Request('http://x.test'), { params: Promise.resolve({ name }) });

describe('icon route', () => {
  it('builds every icon the manifest and layout name', () => {
    expect(generateStaticParams().map((p) => p.name)).toEqual(
      expect.arrayContaining([
        'icon-32.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'apple-icon.png',
      ])
    );
  });

  it('serves a PNG for a known icon', async () => {
    const res = await call('icon-192.png');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
  });

  it('answers 404 for an unknown name', async () => {
    expect((await call('nope.png')).status).toBe(404);
  });
});
