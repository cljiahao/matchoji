import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const server = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  insertError: null as { code: string } | null,
  products: [] as { id: string; name: string; brand: string | null; category: string }[],
  parse: vi.fn(),
}));

vi.mock('@/integrations/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: server.user } }) },
    from: () => ({ insert: async () => ({ error: server.insertError }) }),
    rpc: async () => ({ data: server.products, error: null }),
  }),
}));

vi.mock('@anthropic-ai/sdk', () => {
  class BadRequestError extends Error {}
  class Anthropic {
    messages = { parse: server.parse };
  }
  return { default: Object.assign(Anthropic, { BadRequestError }) };
});

import { GET, POST } from '@/app/api/label-scan/route';

const READING = {
  maker: 'Marukyu Koyamaen',
  name: 'Aoarashi',
  category: 'matcha',
  grade: null,
  origin: 'Uji, Kyoto',
  harvest: null,
  netWeightGrams: 40,
  confidence: 'high',
};

function upload(file: File | string | null = new File(['x'], 'l.jpg', { type: 'image/jpeg' })) {
  const body = new FormData();
  if (file !== null) body.set('image', file);
  return new NextRequest('http://localhost/api/label-scan', { method: 'POST', body });
}

beforeEach(() => {
  server.user = { id: 'u1' };
  server.insertError = null;
  server.products = [];
  server.parse.mockReset();
  server.parse.mockResolvedValue({ stop_reason: 'end_turn', parsed_output: READING });
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/label-scan', () => {
  it('returns 401 when signed out, before anything else', async () => {
    server.user = null;
    expect((await POST(upload())).status).toBe(401);
    expect(server.parse).not.toHaveBeenCalled();
  });

  it('returns 503 when ANTHROPIC_API_KEY is not set', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    expect((await POST(upload())).status).toBe(503);
  });

  it.each([
    ['a missing file', null],
    ['text instead of a file', 'hello'],
    ['a GIF', new File(['x'], 'l.gif', { type: 'image/gif' })],
    [
      'an oversize photo',
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'l.jpg', { type: 'image/jpeg' }),
    ],
  ])('returns 400 for %s', async (_label, file) => {
    expect((await POST(upload(file))).status).toBe(400);
    expect(server.parse).not.toHaveBeenCalled();
  });

  it('returns 429 once the daily allowance is spent', async () => {
    server.insertError = { code: 'P0001' };
    expect((await POST(upload())).status).toBe(429);
    expect(server.parse).not.toHaveBeenCalled();
  });

  it('returns 422 when nothing legible was read', async () => {
    server.parse.mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: { ...READING, maker: null, name: null, confidence: 'low' },
    });
    expect((await POST(upload())).status).toBe(422);
  });

  it('returns the reading with a confident catalogue match', async () => {
    server.products = [
      { id: 'p1', name: 'Aoarashi', brand: 'Marukyu Koyamaen', category: 'matcha' },
    ];
    const response = await POST(upload());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      reading: READING,
      match: { id: 'p1', name: 'Aoarashi', brand: 'Marukyu Koyamaen', category: 'matcha' },
    });
    expect(server.parse).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-5-5' })
    );
  });

  it('returns the reading with no match when the catalogue lacks the tea', async () => {
    server.products = [{ id: 'p2', name: 'Other Tea', brand: 'Someone', category: 'matcha' }];
    const body = await (await POST(upload())).json();
    expect(body.match).toBeNull();
    expect(body.reading.name).toBe('Aoarashi');
  });
});

describe('GET /api/label-scan', () => {
  const get = () => new NextRequest('http://localhost/api/label-scan');

  it('is 401 signed out and reports whether the key is set otherwise', async () => {
    server.user = null;
    expect((await GET(get())).status).toBe(401);
    server.user = { id: 'u1' };
    expect(await (await GET(get())).json()).toEqual({ enabled: true });
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    expect(await (await GET(get())).json()).toEqual({ enabled: false });
  });
});
