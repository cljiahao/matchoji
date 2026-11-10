import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { GET } from './route';

const call = (slug: string) =>
  GET(new NextRequest(`http://localhost:3000/c/${slug}`), { params: Promise.resolve({ slug }) });

describe('/c/[slug]', () => {
  it('308s to /cafes/[slug]', async () => {
    const res = await call('kurasu-bugis');
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get('location') ?? '').pathname).toBe('/cafes/kurasu-bugis');
  });

  it('404s a slug that could never be a café', async () => {
    const res = await call('../admin');
    expect(res.status).toBe(404);
  });
});
